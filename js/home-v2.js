document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.getElementById('site-header');
const menuButton = document.getElementById('menu-toggle');
const mobileNavigation = document.getElementById('mobile-navigation');

function closeMenu({ restoreFocus = false } = {}) {
    if (!menuButton || !mobileNavigation) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    mobileNavigation.hidden = true;
    document.body.classList.remove('menu-open');
    if (restoreFocus) menuButton.focus();
}

function openMenu() {
    if (!menuButton || !mobileNavigation) return;
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Close navigation');
    mobileNavigation.hidden = false;
    document.body.classList.add('menu-open');
    mobileNavigation.querySelector('a')?.focus();
}

menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
});

mobileNavigation?.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
        closeMenu({ restoreFocus: true });
    }
});

document.addEventListener('pointerdown', event => {
    if (menuButton?.getAttribute('aria-expanded') !== 'true') return;
    if (!mobileNavigation?.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});

const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 18);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const revealElements = [...document.querySelectorAll('.reveal:not([data-forge-managed])')];
for (const element of revealElements) {
    const delay = Number(element.dataset.delay || 0);
    element.style.setProperty('--delay', `${delay}ms`);
}

if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

    revealElements.forEach(element => revealObserver.observe(element));
} else {
    revealElements.forEach(element => element.classList.add('is-visible'));
}

const year = document.getElementById('current-year');
if (year) year.textContent = String(new Date().getFullYear());

const tiltItems = [...document.querySelectorAll('[data-tilt]')];
const resetTilt = element => {
    element.style.setProperty('--rx', '0deg');
    element.style.setProperty('--ry', '0deg');
};

if (!reducedMotion.matches && window.matchMedia('(pointer: fine)').matches) {
    for (const element of tiltItems) {
        element.addEventListener('pointermove', event => {
            const rect = element.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            element.style.setProperty('--rx', `${(-y * 2.4).toFixed(2)}deg`);
            element.style.setProperty('--ry', `${(x * 3.2).toFixed(2)}deg`);
        });
        element.addEventListener('pointerleave', () => resetTilt(element));
    }
}

const sectionLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
const sections = sectionLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver(entries => {
        const visible = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        sectionLinks.forEach(link => {
            const active = link.getAttribute('href') === `#${visible.target.id}`;
            link.classList.toggle('is-active', active);
            active ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current');
        });
    }, { threshold: [0.25, 0.55], rootMargin: '-20% 0px -60%' });

    sections.forEach(section => sectionObserver.observe(section));
}
