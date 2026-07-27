(() => {
  const cards = document.querySelectorAll('[data-spotlight-card]');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!cards.length) return;

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

  cards.forEach((card) => {
    let animationFrame = 0;
    let pendingX = 50;
    let pendingY = 45;

    const render = () => {
      card.style.setProperty('--spotlight-x', `${pendingX}%`);
      card.style.setProperty('--spotlight-y', `${pendingY}%`);
      animationFrame = 0;
    };

    const updatePointer = (event) => {
      if (!finePointer.matches || reducedMotion.matches) return;

      const bounds = card.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      pendingX = clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100);
      pendingY = clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100);

      if (!animationFrame) animationFrame = window.requestAnimationFrame(render);
    };

    const resetPointer = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      card.style.removeProperty('--spotlight-x');
      card.style.removeProperty('--spotlight-y');
    };

    card.addEventListener('pointermove', updatePointer, { passive: true });
    card.addEventListener('pointerleave', resetPointer, { passive: true });
  });
})();
