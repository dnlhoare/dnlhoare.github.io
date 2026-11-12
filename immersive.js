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
    const image = item.image ? '<img class="screen-capture" src="' + esc(encodeURI(item.image)) + '" alt="" loading="lazy" />' : '';
    return '<article class="immersive-card reveal-pending" style="--card-accent:' + accent + '"><div class="immersive-visual art-' + esc(item.art) + '" aria-hidden="true"><div class="desktop-set"><div class="list-monitor"><div class="list-screen"><div class="list-screen-head"><span>DJH<span>DEV</span></span><i>' + esc(item.category) + ' / ' + String(index + 1).padStart(2,'0') + '</i></div><div class="list-screen-body">' + image + '<div class="screen-lines"><b>' + esc(item.title) + '</b><i></i><i></i><i></i><em>OPEN DEMO&nbsp; ↗</em></div></div><div class="screen-route"><i></i><i></i><b>3D / INTERACTIVE</b></div></div><div class="list-monitor-chin">DJHDEV&nbsp; STUDIO DISPLAY</div></div><div class="list-monitor-stand"></div></div><div class="glass-chip glass-chip-a"><span>PROJECT&nbsp; ' + String(index + 1).padStart(2,'0') + '</span><b>' + esc(item.category) + '</b></div><div class="glass-chip glass-chip-b"><span>SCROLL TO REVEAL</span><i>✳</i></div><span class="visual-label">' + esc(item.meta) + '</span></div><div class="immersive-card-copy"><div class="card-eyebrow"><i></i>' + esc(item.category) + ' · ' + esc(item.badge || 'DEMO') + '</div><h3>' + esc(item.title) + '</h3><p>' + esc(item.description) + '</p><div class="immersive-card-actions"><a class="immersive-open" href="' + esc(item.href) + '">Open demo <span aria-hidden="true">↗</span></a><span class="immersive-category">' + esc(item.subtitle) + '</span></div></div></article>';
  };
  const featured = catalog.find(item => item.featured) || catalog[0];
  if (featured) {
    document.getElementById('featureTitle').textContent = featured.title;
    document.getElementById('featureDescription').textContent = featured.description;
    const screen = document.getElementById('featureScreen');
    screen.classList.add('art-' + featured.art);
    const featureImage = document.getElementById('featureImage');
    if (featured.image) featureImage.style.backgroundImage = 'url("' + encodeURI(featured.image).replace(/["\\]/g, '') + '")';
    else featureImage.classList.add('screen-art-' + featured.art);
  }
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
  const intro = document.querySelector('.immersion-intro');
  if (intro && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let pointerFrame = 0;
    intro.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        const bounds = intro.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - .5;
        const y = (event.clientY - bounds.top) / bounds.height - .5;
        intro.style.setProperty('--pointer-x', (x * 2.6).toFixed(2) + 'deg');
        intro.style.setProperty('--pointer-y', (y * -2.2).toFixed(2) + 'deg');
      });
    });
    intro.addEventListener('pointerleave', () => {
      intro.style.setProperty('--pointer-x', '0deg');
      intro.style.setProperty('--pointer-y', '0deg');
    });
  }
  document.getElementById('year').textContent = new Date().getFullYear();
  render();
})();
