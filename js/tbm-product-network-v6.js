const productSection = document.getElementById('product-focus');

if (productSection) initialiseProductNetwork(productSection);

function initialiseProductNetwork(section) {
  const filters = [...section.querySelectorAll('[data-sector-filter]')];
  const cards = [...section.querySelectorAll('[data-sector-card]')];
  const detail = section.querySelector('[data-sector-detail]');
  const activeRoute = section.querySelector('[data-active-route]');
  const status = section.querySelector('[data-network-status]');
  let currentFilter = 'all';

  function select(card, announce = true) {
    cards.forEach(item => {
      const selected = item === card;
      item.classList.toggle('is-selected', selected);
      item.setAttribute('aria-pressed', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    section.dataset.activeSector = card.dataset.sectorCard;
    activeRoute?.setAttribute('d', card.dataset.route || 'M 50 50 L 500 220');
    if (detail) {
      detail.innerHTML = `<strong>${card.dataset.title}</strong><span>${card.dataset.demand}</span><span>${card.dataset.review}</span><span>${card.dataset.fit}</span>`;
    }
    if (announce && status) status.textContent = `${card.dataset.title} selected. Active connection updated.`;
  }

  function applyFilter(value) {
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
  }

  cards.forEach((card, index) => {
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
