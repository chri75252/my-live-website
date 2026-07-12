import { createForgeIntroScene } from './forge-intro-scene.js';

const intro=document.getElementById('forge-intro');
const canvas=document.getElementById('forge-intro-canvas');
const hero=document.querySelector('.hero-scroll-sequence');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');

if (intro && canvas && hero){
  initialise();
}

function initialise(){
  const scene=createForgeIntroScene(canvas);
  let frameId=0;
  let currentProgress=-1;
  let range={ start:0,end:1 };

  const clamp=value=>Math.min(1,Math.max(0,value));
  const smooth=(from,to,value)=>{
    const x=clamp((value-from)/(to-from));
    return x*x*(3-2*x);
  };
  const lerp=(from,to,amount)=>from+(to-from)*amount;

  function measure(){
    const heroTop=hero.getBoundingClientRect().top+window.scrollY;
    const desktop=window.innerWidth>=900;
    const travel=desktop
      ? Math.max(window.innerHeight*1.08,820)
      : Math.max(window.innerHeight*.92,640);
    range={
      start:Math.max(0,heroTop-window.innerHeight*.035),
      end:Math.max(1,heroTop+travel)
    };
    scene?.resize();
  }

  function render(){
    frameId=0;
    if (reducedMotion.matches){
      intro.classList.add('is-complete');
      intro.setAttribute('aria-hidden','true');
      scene?.setProgress(1);
      return;
    }

    const progress=clamp((window.scrollY-range.start)/(range.end-range.start));
    if (Math.abs(progress-currentProgress)<.0005) return;
    currentProgress=progress;

    const passage=smooth(.42,.9,progress);
    const release=smooth(.82,1,progress);
    const apertureX=lerp(0,window.innerWidth*.92,passage);
    const apertureY=lerp(0,window.innerHeight*.88,passage);

    intro.style.setProperty('--forge-progress',progress.toFixed(4));
    intro.style.setProperty('--forge-release',release.toFixed(4));
    intro.style.setProperty('--forge-aperture-x',`${apertureX.toFixed(1)}px`);
    intro.style.setProperty('--forge-aperture-y',`${apertureY.toFixed(1)}px`);
    intro.dataset.phase=progress<.12
      ? 'opening'
      : progress<.48
        ? 'formation'
        : progress<.86
          ? 'passage'
          : 'release';

    scene?.setProgress(progress);
    const complete=progress>=.999;
    intro.classList.toggle('is-complete',complete);
    intro.setAttribute('aria-hidden',String(complete));
  }

  function requestRender(){
    if (!frameId) frameId=requestAnimationFrame(render);
  }

  function handleResize(){
    measure();
    currentProgress=-1;
    requestRender();
  }

  measure();
  render();
  window.addEventListener('scroll',requestRender,{ passive:true });
  window.addEventListener('resize',handleResize,{ passive:true });
  window.addEventListener('orientationchange',handleResize,{ passive:true });
  reducedMotion.addEventListener?.('change',handleResize);

  window.addEventListener('pagehide',()=>{
    if (frameId) cancelAnimationFrame(frameId);
    scene?.dispose();
  },{ once:true });
}
