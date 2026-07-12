# Forge Gate reveal acceptance checklist

## Baseline protection

- [ ] `js/hero-3d.js` hash remains `8aa1390dc9fbb1a4ff06dcf2e796d17601de6f4b`.
- [ ] `css/hero-scroll.css` hash remains `82070a5ead77c7d7926beb486553b8a657f872ed`.
- [ ] Final hero appearance matches the approved pre-PR5 screenshot after the reveal.

## Behaviour

- [ ] First viewport is a distinct full-screen intro graphic.
- [ ] Scroll position deterministically controls the reveal.
- [ ] Fast wheel input does not accelerate or strobe ambient hero motion.
- [ ] Intro reveals the real homepage underneath rather than replacing it.
- [ ] At completion, normal scrolling continues to the next homepage section.
- [ ] Scrolling upward reverses the reveal smoothly.
- [ ] Skip Intro works only for the current load and does not persist unexpectedly.

## Visual

- [ ] No comet balls or trails.
- [ ] No yellow shell.
- [ ] No broad bloom or chrome environment reflections.
- [ ] Intro remains visually subordinate to the approved final hero.
- [ ] Header, copy, CTAs, cards, and hero appear as one coherent final page.

## Evidence before merge

- [ ] 1920×1080 screenshot/recording.
- [ ] 1680×900 screenshot/recording.
- [ ] 1366×768 screenshot/recording.
- [ ] Mobile screenshot/recording.
- [ ] Branch URL and exact changed-file list supplied.
- [ ] User explicitly approves merge.
