(() => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const tabs = [...document.querySelectorAll('.vault-tab')];
  const message = document.getElementById('messageInput');
  const keyword = document.getElementById('keywordInput');
  const keywordRow = document.getElementById('keywordRow');
  const action = document.getElementById('primaryAction');
  const output = document.getElementById('resultOutput');
  const resultWrap = document.getElementById('resultWrap');
  const status = document.getElementById('statusMessage');
  const modeHeading = document.getElementById('modeHeading');
  const modeIntro = document.getElementById('modeIntro');
  const panel = document.getElementById('toolPanel');
  let mode = 'encrypt';

  function setStatus(text, success = false) {
    status.textContent = text;
    status.classList.toggle('success', success);
  }
  function setMode(nextMode) {
    mode = nextMode;
    tabs.forEach(tab => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    panel.setAttribute('aria-labelledby', mode === 'hash' ? 'hashTab' : mode === 'decrypt' ? 'decryptTab' : 'encryptTab');
    modeHeading.textContent = mode === 'hash' ? 'Create a SHA-256 hash' : mode === 'decrypt' ? 'Decrypt a message' : 'Encrypt a message';
    modeIntro.textContent = mode === 'hash' ? 'Create a fixed-length fingerprint of the message. Hashing is one-way; there is no decryption.' : mode === 'decrypt' ? 'Paste a Message Vault encrypted result and enter the same keyword that was used to encrypt it.' : 'Choose a shared keyword, then send the encrypted result to the person who knows it.';
    keywordRow.hidden = mode === 'hash';
    message.placeholder = mode === 'decrypt' ? 'Paste the encrypted result (MV1:...)' : mode === 'hash' ? 'Write or paste text to hash' : 'Write or paste your message';
    action.textContent = mode === 'hash' ? 'Create SHA-256 hash' : mode === 'decrypt' ? 'Decrypt message' : 'Encrypt message';
    resultWrap.hidden = true;
    setStatus('');
  }
  function bytesToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  }
  function base64ToBytes(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  }
  async function deriveKey(passphrase, salt) {
    const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:310000, hash:'SHA-256'}, material, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
  }
  async function encrypt(plain, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, encoder.encode(plain)));
    return `MV1:${bytesToBase64(salt)}:${bytesToBase64(iv)}:${bytesToBase64(ciphertext)}`;
  }
  async function decrypt(payload, passphrase) {
    const parts = payload.trim().split(':');
    if (parts.length !== 4 || parts[0] !== 'MV1') throw new Error('That does not look like a Message Vault result (MV1:…).');
    const salt = base64ToBytes(parts[1]);
    const iv = base64ToBytes(parts[2]);
    const ciphertext = base64ToBytes(parts[3]);
    if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16) throw new Error('The encrypted result is incomplete or invalid.');
    const key = await deriveKey(passphrase, salt);
    const plaintext = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, ciphertext);
    return decoder.decode(plaintext);
  }
  tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
  action.addEventListener('click', async () => {
    setStatus('');
    if (!window.crypto?.subtle || !window.isSecureContext) {
      setStatus('Web Crypto needs a secure connection (HTTPS) or localhost. Open this page from its HTTPS address and try again.');
      return;
    }
    if (!message.value) { setStatus('Enter a message first.'); message.focus(); return; }
    if (mode !== 'hash' && !keyword.value) { setStatus('Enter the shared keyword first.'); keyword.focus(); return; }
    action.disabled = true;
    action.textContent = 'Working…';
    try {
      let result;
      if (mode === 'hash') {
        const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(message.value)));
        result = [...digest].map(byte => byte.toString(16).padStart(2, '0')).join('');
      } else if (mode === 'decrypt') {
        result = await decrypt(message.value, keyword.value);
      } else {
        result = await encrypt(message.value, keyword.value);
      }
      output.value = result;
      resultWrap.hidden = false;
      setStatus(mode === 'hash' ? 'SHA-256 fingerprint created. This cannot be decrypted.' : mode === 'decrypt' ? 'Message decrypted. A wrong keyword or altered ciphertext will fail authentication.' : 'Encrypted. Share the result and keyword separately.', true);
    } catch (error) {
      setStatus(error.name === 'OperationError' ? 'Decryption failed. Check the keyword and make sure the encrypted result was not changed.' : error.message || 'Could not process this message.');
    } finally {
      action.disabled = false;
      action.textContent = mode === 'hash' ? 'Create SHA-256 hash' : mode === 'decrypt' ? 'Decrypt message' : 'Encrypt message';
    }
  });
  document.getElementById('clearButton').addEventListener('click', () => {
    message.value = '';
    keyword.value = '';
    output.value = '';
    resultWrap.hidden = true;
    setStatus('');
    message.focus();
  });
  document.getElementById('copyButton').addEventListener('click', async event => {
    try {
      await navigator.clipboard.writeText(output.value);
      event.currentTarget.textContent = 'Copied';
      setTimeout(() => { event.currentTarget.textContent = 'Copy'; }, 1400);
    } catch (_) {
      output.focus(); output.select(); setStatus('Clipboard access is unavailable here. Select and copy the result manually.');
    }
  });
  document.getElementById('year').textContent = new Date().getFullYear();
})();
