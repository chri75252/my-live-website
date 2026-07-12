const sequence = document.getElementById('forge-sequence');
const intro = document.getElementById('forge-intro');
const skip = document.getElementById('forge-intro-skip');

if (sequence && intro && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let target = 0;
  let current = 0;
  let raf = 0;

  const clamp01 = value => Math.min(1, Math.max(0, value));
  const smoothstep = (a, b, value) => {
    const x = clamp01((value - a) / Math.max(0.0001, b - a));
    return x * x * (3 - 2 * x);
  };

  function readProgress() {
    const rect = sequence.getBoundingClientRect();
    const distance = Math.max(1, sequence.offsetHeight - innerHeight);
    target = clamp01(-rect.top / distance);
  }

  function render(progress) {
    const handoff = smoothstep(0.72, 1, progress);
    intro.style.opacity = String(1 - handoff);
    intro.style.pointerEvents = handoff > 0.98 ? 'none' : 'auto';
    sequence.classList.toggle('is-complete', handoff > 0.995);

    // A separate intro scene may read progress here.
    window.tbmForgeIntroScene?.setProgress(progress);
  }

  function frame() {
    current += (target - current) * 0.11;
    render(current);
    raf = requestAnimationFrame(frame);
  }

  skip?.addEventListener('click', () => {
    target = 1;
    current = 1;
    render(1);
    const nextSection = sequence.nextElementSibling;
    nextSection?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });

  addEventListener('scroll', readProgress, { passive: true });
  addEventListener('resize', readProgress, { passive: true });
  readProgress();
  raf = requestAnimationFrame(frame);

  addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
}
