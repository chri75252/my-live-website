// Shared behaviour for legacy pages. The homepage uses js/home.js.
(() => {
  const currentScript = document.currentScript;
  const prefix = currentScript?.src.includes('/blog/') ? '../' : '';
  if (!document.querySelector('link[data-premium-ui]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = `${prefix}css/premium.css`;
    style.dataset.premiumUi = 'true';
    document.head.appendChild(style);
  }

  const header = document.querySelector('header');
  const menuButton = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuButton && mobileMenu) {
    menuButton.setAttribute('aria-controls', 'mobile-menu');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    menuButton.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('active');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    document.addEventListener('click', event => {
      if (!mobileMenu.contains(event.target) && !menuButton.contains(event.target)) {
        mobileMenu.classList.remove('active');
        menuButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const setHeaderState = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  setHeaderState();
  addEventListener('scroll', setHeaderState, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const selector = link.getAttribute('href');
      if (!selector || selector === '#') return;
      const target = document.querySelector(selector);
      if (!target) return;
      event.preventDefault();
      const offset = header?.offsetHeight || 0;
      const top = target.getBoundingClientRect().top + scrollY - offset - 12;
      scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      mobileMenu?.classList.remove('active');
    });
  });

  const revealItems = document.querySelectorAll('.animate-on-scroll');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('animate-fade-in'));
  }

  const cookie = document.querySelector('.cookie-consent');
  const accept = document.getElementById('accept-cookies');
  const decline = document.getElementById('decline-cookies');
  const consent = localStorage.getItem('cookieConsent');
  if (cookie && !consent) setTimeout(() => cookie.classList.add('show'), 700);
  accept?.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    cookie?.classList.remove('show');
  });
  decline?.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'declined');
    cookie?.classList.remove('show');
  });

  const form = document.getElementById('contact-form');
  if (form) {
    const endpoint = form.getAttribute('action') || '';
    const placeholderEndpoint = endpoint.includes('your-form-id');
    if (placeholderEndpoint) {
      form.addEventListener('submit', event => {
        event.preventDefault();
        let notice = form.querySelector('.form-endpoint-warning');
        if (!notice) {
          notice = document.createElement('div');
          notice.className = 'form-endpoint-warning';
          notice.setAttribute('role', 'alert');
          notice.style.cssText = 'margin-top:16px;padding:14px;border:1px solid rgba(240,162,58,.35);border-radius:12px;background:rgba(240,162,58,.08);color:#ffd08a';
          form.appendChild(notice);
        }
        notice.textContent = 'Online submission is being configured. Please contact the business using the published email address instead.';
      });
    }
  }

  const searchForm = document.getElementById('blog-search-form');
  searchForm?.addEventListener('submit', event => {
    event.preventDefault();
    const query = searchForm.querySelector('input')?.value.trim().toLowerCase();
    document.querySelectorAll('.blog-card').forEach(card => {
      card.hidden = Boolean(query) && !card.textContent.toLowerCase().includes(query);
    });
  });
})();