(() => {
  const catalog = (window.DJHDEV_CATALOG || []).filter(item => item.enabled);
  const grid = document.getElementById('catalogGrid');
  const search = document.getElementById('search');
  const empty = document.getElementById('emptyState');
  const filters = [...document.querySelectorAll('.filter')];
  let activeFilter = 'all';
  const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const featured = catalog.find(item => item.featured) || catalog[0];

  function renderHero(item) {
    if (!item) return;
    const art = document.getElementById('heroArt');
    const title = document.getElementById('heroTitle');
    title.textContent = item.title;
    document.getElementById('heroDescription').textContent = item.description;
    document.getElementById('heroCategory').textContent = item.subtitle.toUpperCase();
    document.getElementById('heroMeta').textContent = item.category + ' · ' + item.meta;
    const link = document.getElementById('heroLink');
    link.href = item.href;
    link.setAttribute('aria-label', 'Open ' + item.title);
    art.className = 'hero-art art-' + item.art;
    if (item.image) {
      art.style.backgroundImage = 'linear-gradient(90deg,rgba(8,8,8,.08),rgba(8,8,8,.02)),url("' + encodeURI(item.image) + '")';
      art.classList.add('has-image');
    }
    if (item.art === 'tetris' && !item.image) art.innerHTML = '<div class="tetris-board" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="art-label">STACK · CLEAR · REPEAT</div>';
    if (item.art === 'phones') art.innerHTML = '<div class="phone-hero" aria-hidden="true"><i></i><i></i><b>DJH<br>FOLD</b></div><div class="phone-orbit"></div><div class="art-label">A CLOSER LOOK AT WHAT FOLDS</div>';
    if (item.art === 'racing') art.innerHTML = '<div class="track-glow"></div><div class="hero-lines"></div><div class="hero-number">01</div><div class="hero-track"><span>01</span><i>🐕</i><b></b><em>FINISH</em></div><div class="hero-track second"><span>02</span><i>🐕</i><b></b><em>FINISH</em></div><div class="hero-track third"><span>03</span><i>🐕</i><b></b><em>FINISH</em></div><div class="art-label">HARBOR PARK · 400M</div>';
  }

  function card(item) {
    const image = item.image ? ' style="background-image:linear-gradient(0deg,rgba(0,0,0,.56),transparent 70%),url(&quot;' + escapeHTML(encodeURI(item.image)) + '&quot;)"' : '';
    const glyph = item.image ? '' : item.art === 'racing' ? '<div class="poster-race"><span>01</span><b>🐕</b><i>02&nbsp; ━━━━━━━━</i><i>03&nbsp; ━━━━━</i><small>HARBOR PARK · 400M</small></div>' : item.art === 'tetris' ? '<div class="poster-blocks"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="poster-tetris">TETRIS</span>' : '<div class="poster-phones"><i></i><i></i><b>FOLD<br>LAB</b></div><span class="poster-chip">3D COMPARISON</span>';
    return '<a class="demo-card" href="' + escapeHTML(item.href) + '" target="_blank" rel="noopener noreferrer" aria-label="Open ' + escapeHTML(item.title) + ' demo"><div class="poster poster-' + escapeHTML(item.art) + '"' + image + '>' + glyph + '<span class="card-badge">' + escapeHTML(item.badge || 'OPEN') + '</span><span class="poster-number">' + String(catalog.indexOf(item)+1).padStart(2,'0') + '</span></div><div class="card-copy"><div><h3>' + escapeHTML(item.title) + '</h3><p>' + escapeHTML(item.subtitle) + '</p></div><span class="card-arrow" aria-hidden="true">↗</span></div></a>';
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    const items = catalog.filter(item => (activeFilter === 'all' || item.category === activeFilter) && (item.title + ' ' + item.subtitle + ' ' + item.description + ' ' + item.category).toLowerCase().includes(query));
    grid.innerHTML = items.map(card).join('');
    empty.hidden = items.length > 0;
  }

  filters.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filters.forEach(filter => filter.classList.toggle('active', filter === button));
    render();
  }));
  search.addEventListener('input', render);
  document.getElementById('year').textContent = new Date().getFullYear();
  renderHero(featured);
  render();
})();
