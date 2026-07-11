document.documentElement.classList.add('js');

const menuButton = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const header = document.querySelector('header');

function setMenu(open) {
  if (!menuButton || !mobileMenu) return;
  mobileMenu.classList.toggle('active', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}

if (menuButton && mobileMenu) {
  menuButton.setAttribute('aria-controls', 'mobile-menu');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  menuButton.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('active')));
  mobileMenu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { setMenu(false); menuButton.focus(); } });
  document.addEventListener('pointerdown', event => {
    if (!mobileMenu.classList.contains('active')) return;
    if (!mobileMenu.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
  });
}

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 18);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const animated = [...document.querySelectorAll('.animate-on-scroll')];
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('animate-fade-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px' });
  animated.forEach(element => observer.observe(element));
} else {
  animated.forEach(element => element.classList.add('animate-fade-in'));
}

for (const item of document.querySelectorAll('.faq-item')) {
  const question = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');
  if (!question || !answer) continue;
  question.setAttribute('role', 'button');
  question.setAttribute('tabindex', '0');
  question.setAttribute('aria-expanded', 'false');
  answer.hidden = true;
  const toggle = () => {
    const expanded = question.getAttribute('aria-expanded') === 'true';
    question.setAttribute('aria-expanded', String(!expanded));
    answer.hidden = expanded;
  };
  question.addEventListener('click', toggle);
  question.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
  });
}

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', event => {
    const action = contactForm.getAttribute('action') || '';
    if (action.includes('your-form-id')) {
      event.preventDefault();
      let status = contactForm.querySelector('.form-status');
      if (!status) {
        status = document.createElement('p');
        status.className = 'form-status';
        status.setAttribute('role', 'status');
        contactForm.appendChild(status);
      }
      status.textContent = 'Online submission is not configured. Use the published supplier email instead.';
    }
  });
}

const currentPath = location.pathname.split('/').pop() || 'index.html';
for (const link of document.querySelectorAll('.nav-link,.mobile-nav-link')) {
  const href = (link.getAttribute('href') || '').split('#')[0];
  if (href === currentPath) link.classList.add('active');
}
