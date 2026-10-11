(() => {
  const catalog = (window.DJHDEV_CATALOG || []).filter(item => item.enabled);
  const grid = document.getElementById('catalogGrid');
  const search = document.getElementById('search');
  const empty = document.getElementById('emptyState');
  const filters = [...document.querySelectorAll('.filter')];
  let activeFilter = 'all';
  let visibleItems = [];
  let selectedItem = null;
  const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function renderHero(item) {
    if (!item) return;
    const art = document.getElementById('heroArt');
    document.getElementById('heroTitle').textContent = item.title;
    document.getElementById('heroDescription').textContent = item.description;
    document.getElementById('heroCategory').textContent = item.subtitle.toUpperCase();
    document.getElementById('heroMeta').textContent = item.category + ' · ' + item.meta;
    const link = document.getElementById('heroLink');
    link.href = item.href;
    link.setAttribute('aria-label', 'Open ' + item.title);
    art.className = 'hero-art art-' + item.art;
    art.style.backgroundImage = '';
    art.innerHTML = '';
    document.querySelector('.hero-meta>span:last-child').hidden = !item.featured;
    if (item.image) {
      art.style.backgroundImage = 'linear-gradient(90deg,rgba(8,8,8,.08),rgba(8,8,8,.02)),url("' + encodeURI(item.image) + '")';
      art.classList.add('has-image');
    }
    if (item.art === 'shaders') art.innerHTML = '<div class="shader-orb shader-orb-one"></div><div class="shader-orb shader-orb-two"></div><div class="shader-orb shader-orb-three"></div><div class="art-label">FRAGMENT SHADERS · WEBGL</div>';
    if (item.art === 'tetris' && !item.image) art.innerHTML = '<div class="tetris-board" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="art-label">STACK · CLEAR · REPEAT</div>';
    if (item.art === 'phones') art.innerHTML = '<div class="phone-hero" aria-hidden="true"><i></i><i></i><b>DJH<br>FOLD</b></div><div class="phone-orbit"></div><div class="art-label">A CLOSER LOOK AT WHAT FOLDS</div>';
    if (item.art === 'racing') art.innerHTML = '<div class="track-glow"></div><div class="hero-lines"></div><div class="hero-number">01</div><div class="hero-track"><span>01</span><i>🐕</i><b></b><em>FINISH</em></div><div class="hero-track second"><span>02</span><i>🐕</i><b></b><em>FINISH</em></div><div class="hero-track third"><span>03</span><i>🐕</i><b></b><em>FINISH</em></div><div class="art-label">HARBOR PARK · 400M</div>';
  }

  function card(item) {
    const image = item.image ? ' style="background-image:linear-gradient(0deg,rgba(0,0,0,.56),transparent 70%),url(&quot;' + escapeHTML(encodeURI(item.image)) + '&quot;)"' : '';
    const glyph = item.image ? '' : item.art === 'racing' ? '<div class="poster-race"><span>01</span><b>🐕</b><i>02&nbsp; ━━━━━━━━</i><i>03&nbsp; ━━━━━</i><small>HARBOR PARK · 400M</small></div>' : item.art === 'tetris' ? '<div class="poster-blocks"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="poster-tetris">TETRIS</span>' : item.art === 'shaders' ? '<div class="shader-poster"><i></i><i></i><i></i></div><span class="poster-chip">WEBGL PLAYGROUND</span>' : '<div class="phone-art"><i></i><i></i><b>FOLD<br>LAB</b></div><span class="poster-chip">3D COMPARISON</span>';
    return '<a class="demo-card" href="' + escapeHTML(item.href) + '" target="_blank" rel="noopener noreferrer" aria-label="Open ' + escapeHTML(item.title) + ' demo"><div class="poster poster-' + escapeHTML(item.art) + '"' + image + '>' + glyph + '<span class="card-badge">' + escapeHTML(item.badge || 'OPEN') + '</span><span class="poster-number">' + String(catalog.indexOf(item)+1).padStart(2,'0') + '</span></div><div class="card-copy"><div><h3>' + escapeHTML(item.title) + '</h3><p>' + escapeHTML(item.subtitle) + '</p></div><span class="card-arrow" aria-hidden="true">↗</span></div></a>';
  }

  function selectItem(item) {
    selectedItem = item;
    renderHero(item);
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    visibleItems = catalog.filter(item => (activeFilter === 'all' || item.category === activeFilter) && (item.title + ' ' + item.subtitle + ' ' + item.description + ' ' + item.category).toLowerCase().includes(query));
    if (!visibleItems.includes(selectedItem)) selectedItem = visibleItems[0] || null;
    grid.innerHTML = visibleItems.map(card).join('');
    empty.hidden = visibleItems.length > 0;
    grid.querySelectorAll('.demo-card').forEach((cardLink, index) => {
      cardLink.addEventListener('mouseenter', () => selectItem(visibleItems[index]));
      cardLink.addEventListener('focus', () => selectItem(visibleItems[index]));
    });
    if (selectedItem) renderHero(selectedItem);
  }

  grid.addEventListener('keydown', event => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key) || !visibleItems.length) return;
    const cards = [...grid.querySelectorAll('.demo-card')];
    const currentIndex = cards.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    event.preventDefault();
    const columns = window.matchMedia('(max-width: 540px)').matches ? 2 : 3;
    const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowDown' ? columns : -columns;
    cards[(currentIndex + offset + cards.length) % cards.length].focus();
  });

  filters.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filters.forEach(filter => filter.classList.toggle('active', filter === button));
    render();
  }));
  search.addEventListener('input', render);
  document.getElementById('year').textContent = new Date().getFullYear();
  render();
})();
