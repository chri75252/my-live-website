const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const detail = document.getElementById('category-detail');
const nodes = [...document.querySelectorAll('.category-node')];

function chooseNode(node) {
  nodes.forEach(item => { item.classList.toggle('is-selected', item === node); item.setAttribute('aria-pressed', String(item === node)); });
  if (detail) detail.innerHTML = `<strong>${node.dataset.title}</strong>&nbsp; — ${node.dataset.detail}`;
}

nodes.forEach(node => {
  node.addEventListener('click', () => chooseNode(node));
  node.addEventListener('pointermove', event => {
    const box = node.getBoundingClientRect();
    node.style.setProperty('--pointer-x', `${((event.clientX - box.left) / box.width) * 100}%`);
    node.style.setProperty('--pointer-y', `${((event.clientY - box.top) / box.height) * 100}%`);
  });
  node.addEventListener('keydown', event => {
    const index = nodes.indexOf(node);
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); nodes[(index + 1) % nodes.length].focus(); }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); nodes[(index - 1 + nodes.length) % nodes.length].focus(); }
  });
});
if (nodes[0]) chooseNode(nodes[0]);

const observed = [...document.querySelectorAll('.journey-step, .insight-panel')];
if (!reduce.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .2 });
  observed.forEach(item => observer.observe(item));
} else observed.forEach(item => item.classList.add('is-visible'));
