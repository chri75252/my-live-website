/* V7-R06/R08B: asymmetric category constellation with longer visible routes. */
const productSectionV7 = document.getElementById('product-focus');

if (productSectionV7) initialiseProductNetworkV7(productSectionV7);

function initialiseProductNetworkV7(section) {
  const filters = [...section.querySelectorAll('[data-sector-filter]')];
  const cards = [...section.querySelectorAll('[data-sector-card]')];
  const detail = section.querySelector('[data-sector-detail]');
  const activeRoute = section.querySelector('[data-active-route]');
  const status = section.querySelector('[data-network-status]');
  const svg = section.querySelector('.sector-network__svg');
  let currentFilter = 'all';

  const anchors = [
    { x: 115, y: 205 },
    { x: 335, y: 155 },
    { x: 560, y: 195 },
    { x: 785, y: 145 },
    { x: 1060, y: 205 },
  ];
  const hub = { x: 600, y: 545 };

  function syncGeometry() {
    if (!svg) return;
    svg.setAttribute('viewBox', '0 0 1200 620');
    const paths = [...svg.querySelectorAll('path')];
    const base = `M ${anchors[0].x} ${anchors[0].y} L ${anchors[1].x} ${anchors[1].y} L ${anchors[2].x} ${anchors[2].y} L ${anchors[3].x} ${anchors[3].y} L ${anchors[4].x} ${anchors[4].y}`;
    const spokes = anchors.map(anchor => `M ${anchor.x} ${anchor.y} L ${hub.x} ${hub.y}`).join(' ');
    if (paths[0]) paths[0].setAttribute('d', base);
    if (paths[1]) paths[1].setAttribute('d', spokes);
    if (paths[2]) paths[2].setAttribute('d', `M ${anchors[2].x} ${anchors[2].y} L ${hub.x} ${hub.y}`);
    cards.forEach((card, index) => {
      card.dataset.route = `M ${anchors[index].x} ${anchors[index].y} L ${hub.x} ${hub.y}`;
    });
    [...svg.querySelectorAll('circle')].forEach((circle, index) => {
      const point = index < anchors.length ? anchors[index] : hub;
      circle.setAttribute('cx', String(point.x));
      circle.setAttribute('cy', String(point.y));
    });
  }

  function select(card, announce = true) {
    if (!card) return;
    const selectedIndex = cards.indexOf(card);
    cards.forEach((item, itemIndex) => {
      const selected = item === card;
      const distance = Math.abs(itemIndex - selectedIndex);
      item.classList.toggle('is-selected', selected);
      item.classList.toggle('is-near', !selected && distance === 1);
      item.dataset.distance = String(distance);
      item.setAttribute('aria-pressed', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    section.dataset.activeSector = card.dataset.sectorCard;
    activeRoute?.setAttribute('d', card.dataset.route || `M ${hub.x} ${hub.y - 350} L ${hub.x} ${hub.y}`);
    if (detail) {
      detail.innerHTML = `<strong>${card.dataset.title}</strong><span>${card.dataset.demand}</span><span>${card.dataset.review}</span><span>${card.dataset.fit}</span>`;
    }
    if (announce && status) status.textContent = `${card.dataset.title} selected. Active connection updated.`;
  }

  function applyFilter(value) {
    const commit = () => {
      currentFilter = value;
      filters.forEach(filter => {
        const active = filter.dataset.sectorFilter === value;
        filter.classList.toggle('is-active', active);
        filter.setAttribute('aria-pressed', String(active));
      });
      let firstVisible = null;
      cards.forEach(card => {
        const visible = value === 'all' || card.dataset.tags.split(' ').includes(value);
        card.hidden = !visible;
        if (visible && !firstVisible) firstVisible = card;
      });
      const selected = cards.find(card => card.classList.contains('is-selected') && !card.hidden);
      select(selected || firstVisible, false);
      if (status) status.textContent = value === 'all' ? 'All sectors shown.' : `${value} sectors shown.`;
    };
    const canTransition = document.startViewTransition
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (canTransition) document.startViewTransition(commit);
    else commit();
  }

  syncGeometry();
  cards.forEach((card, index) => {
    card.style.viewTransitionName = `sector-${card.dataset.sectorCard}`;
    card.addEventListener('click', () => select(card));
    card.addEventListener('pointermove', event => {
      if (!window.matchMedia('(pointer:fine)').matches) return;
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--pointer-x', `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
      card.style.setProperty('--pointer-y', `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
    });
    card.addEventListener('keydown', event => {
      const visible = cards.filter(item => !item.hidden);
      const position = visible.indexOf(card);
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        const next = visible[(position + 1) % visible.length];
        next.focus();
        select(next);
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        const next = visible[(position - 1 + visible.length) % visible.length];
        next.focus();
        select(next);
      }
      if (event.key === 'Home') { event.preventDefault(); visible[0].focus(); select(visible[0]); }
      if (event.key === 'End') { event.preventDefault(); visible.at(-1).focus(); select(visible.at(-1)); }
    });
    card.tabIndex = index === 2 ? 0 : -1;
  });
  filters.forEach(filter => filter.addEventListener('click', () => applyFilter(filter.dataset.sectorFilter)));
  applyFilter(currentFilter);
}
