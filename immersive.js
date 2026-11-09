(() => {
  const catalog = (window.DJHDEV_CATALOG || []).filter(item => item.enabled);
  const list = document.getElementById('immersiveList');
  const search = document.getElementById('immersiveSearch');
  const empty = document.getElementById('immersiveEmpty');
  const filters = [...document.querySelectorAll('.immersive-filters button')];
  const colors = {racing:'#b5d35f',tetris:'#a58aff',phones:'#6cd6df',pace:'#81cba0',skidpan:'#d8c891',shaders:'#d27bdf'};
  let activeFilter = 'all';
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const card = (item, index) => {
    const accent = colors[item.art] || '#83d3ca';
    const image = item.image ? '<img class="visual-image" src="' + esc(encodeURI(item.image)) + '" alt="" loading="lazy" />' : '';
    return '<article class="immersive-card reveal-pending" style="--card-accent:' + accent + '"><div class="immersive-visual" aria-hidden="true">' + image + '<div class="visual-ring"></div><div class="visual-orb"></div><span class="visual-number">' + String(index + 1).padStart(2,'0') + '</span><span class="visual-label">' + esc(item.meta) + '</span></div><div class="immersive-card-copy"><div class="card-eyebrow"><i></i>' + esc(item.category) + ' · ' + esc(item.badge || 'DEMO') + '</div><h3>' + esc(item.title) + '</h3><p>' + esc(item.description) + '</p><div class="immersive-card-actions"><a class="immersive-open" href="' + esc(item.href) + '">Open demo <span aria-hidden="true">↗</span></a><span class="immersive-category">' + esc(item.subtitle) + '</span></div></div></article>';
  };
  let revealObserver;
  function render() {
    const query = search.value.trim().toLowerCase();
    const filtered = catalog.filter(item => (activeFilter === 'all' || item.category === activeFilter) && (item.title + ' ' + item.subtitle + ' ' + item.description + ' ' + item.category).toLowerCase().includes(query));
    list.innerHTML = filtered.map(card).join('');
    empty.hidden = filtered.length > 0;
    if (revealObserver) revealObserver.disconnect();
    const cards = [...list.querySelectorAll('.immersive-card')];
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cards.forEach(element => element.classList.add('is-visible'));
      return;
    }
    revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    }), {threshold:.14, rootMargin:'0px 0px -7% 0px'});
    cards.forEach((element, index) => {
      element.style.transitionDelay = Math.min(index % 2, 1) * 100 + 'ms';
      revealObserver.observe(element);
    });
  }
  filters.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filters.forEach(filter => filter.classList.toggle('active', filter === button));
    render();
  }));
  search.addEventListener('input', render);
  document.getElementById('year').textContent = new Date().getFullYear();
  render();
})();
