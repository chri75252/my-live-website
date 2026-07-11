import * as THREE from 'https://esm.sh/three@0.180.0';
import { EffectComposer } from 'https://esm.sh/three@0.180.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.180.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.180.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'https://esm.sh/three@0.180.0/examples/jsm/postprocessing/OutputPass.js';

const hero = document.querySelector('.hero-scroll-sequence');
const grid = hero?.querySelector('.hero-grid');
const stage = document.getElementById('hero-stage');
const canvas = document.getElementById('hero-canvas');
const toggle = document.getElementById('motion-toggle');
const cue = document.querySelector('.scroll-cue');
const cards = [...document.querySelectorAll('.hero-stage .float-card')];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

if (!hero || !grid || !stage || !canvas) {
  document.documentElement.classList.add('webgl-fallback');
} else {
  try { init(); } catch (error) {
    console.error('3D hero failed.', error);
    document.documentElement.classList.add('webgl-fallback');
  }
}

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: devicePixelRatio <= 1.5, powerPreference: 'high-performance' });
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  const root = new THREE.Group();
  scene.add(root);

  const gold = new THREE.MeshPhysicalMaterial({ color: 0xe5ae47, emissive: 0x4b2200, emissiveIntensity: .38, metalness: 1, roughness: .2, clearcoat: 1 });
  const bright = gold.clone();
  bright.color.setHex(0xffcd70);
  bright.emissive.setHex(0x7a3200);
  bright.emissiveIntensity = .62;
  const dark = new THREE.MeshPhysicalMaterial({ color: 0x080908, metalness: .9, roughness: .38, clearcoat: 1 });
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x8e641f, wireframe: true, transparent: true, opacity: .2 });

  const core = new THREE.Mesh(new THREE.SphereGeometry(1.22, 64, 64), dark);
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.42, 3), wireMat);
  root.add(core, wire);

  const ringSpecs = [
    [1.46,.025,1.1,.06,.22,.34], [1.64,.022,.06,1.14,.58,-.27],
    [1.82,.019,.72,.5,1.16,.23], [2,.017,1.34,.8,.1,-.18],
    [2.14,.015,.42,1.3,.78,.16]
  ];
  const rings = ringSpecs.map(([r,t,x,y,z,s],i) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(r,t,18,220), i < 2 ? bright : gold);
    mesh.rotation.set(x,y,z);
    mesh.userData = { base: new THREE.Euler(x,y,z), speed:s, phase:i*1.31 };
    root.add(mesh);
    return mesh;
  });

  const nodes = new THREE.Group();
  const nodeGeo = new THREE.SphereGeometry(.055,16,16);
  for (let i=0;i<18;i++) {
    const n = new THREE.Mesh(nodeGeo, i%3===0 ? bright : gold);
    const a=i/18*Math.PI*2, r=1.44+(i%4)*.16;
    n.position.set(Math.cos(a)*r, Math.sin(a*1.7)*.63, Math.sin(a)*r);
    n.userData.base=i%5===0?1.45:1;
    n.userData.i=i;
    nodes.add(n);
  }
  root.add(nodes);

  const particles = new THREE.Points(makeParticles(innerWidth<700?160:280), new THREE.PointsMaterial({ color:0xeab553,size:.017,transparent:true,opacity:.34,depthWrite:false }));
  root.add(particles);

  const base = new THREE.Group();
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(1.42,.1,16,160), new THREE.MeshBasicMaterial({color:0x55300a,transparent:true,opacity:.82}));
  baseRing.rotation.x=Math.PI/2; baseRing.position.y=-2.06;
  base.add(baseRing); root.add(base);

  const comets = [
    makeComet({rx:1.96,ry:.9,rz:1.58,speed:.94,tx:1.05,ty:.3,phase:0}),
    makeComet({rx:1.76,ry:1.04,rz:1.78,speed:1.2,tx:.34,ty:1.04,phase:2.1}),
    makeComet({rx:2.08,ry:.7,rz:1.4,speed:.86,tx:1.25,ty:.86,phase:4.2})
  ];
  comets.forEach(c=>root.add(c.group));

  scene.add(new THREE.HemisphereLight(0xf9ddb0,0x2d1607,1.05));
  const key=new THREE.PointLight(0xffd99a,4.8,20,2); key.position.set(1.8,1.4,2.4); scene.add(key);
  const rim=new THREE.PointLight(0xffad38,48,26,2); rim.position.set(-2.4,1.7,-1.3); scene.add(rim);
  const low=new THREE.PointLight(0xea7d16,38,16,2); low.position.set(0,-3,2); scene.add(low);

  const pointer=new THREE.Vector2(), pointerNow=new THREE.Vector2();
  let target=0, progress=0, phase=0, last=performance.now(), visible=true, active=!document.hidden, boost=0, baseZ=7.7;
  let enabled=true, composer=null, bloom=false;
  try { enabled=localStorage.getItem('tbm-3d-motion-v2')!=='off'; } catch {}

  function makeParticles(count){
    const a=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const r=1.9+Math.random()*1.25, t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1);
      a[i*3]=r*Math.sin(p)*Math.cos(t); a[i*3+1]=r*Math.cos(p)*.62; a[i*3+2]=r*Math.sin(p)*Math.sin(t);
    }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(a,3)); return g;
  }

  function makeComet(c){
    const group=new THREE.Group();
    const head=new THREE.Mesh(new THREE.SphereGeometry(.085,16,16),new THREE.MeshBasicMaterial({color:0xffd477,toneMapped:false}));
    const count=12, arr=new Float32Array(count*3), history=Array.from({length:count},()=>new THREE.Vector3());
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(arr,3));
    const trail=new THREE.Points(geo,new THREE.PointsMaterial({color:0xffb84c,size:.05,transparent:true,opacity:.62,depthWrite:false,blending:THREE.AdditiveBlending}));
    group.add(head,trail); return {...c,group,head,trail,geo,history};
  }

  function cometPos(c,a){
    return new THREE.Vector3(Math.cos(a)*c.rx,Math.sin(a*1.26+c.phase*.5)*c.ry,Math.sin(a)*c.rz).applyEuler(new THREE.Euler(c.tx,c.ty,0));
  }

  function fit(){
    const box=new THREE.Box3().setFromObject(root).expandByScalar(.2), sphere=new THREE.Sphere(); box.getBoundingSphere(sphere);
    const fy=THREE.MathUtils.degToRad(camera.fov), fx=2*Math.atan(Math.tan(fy/2)*camera.aspect);
    baseZ=THREE.MathUtils.clamp((sphere.radius*1.13)/Math.sin(Math.min(fx,fy)/2),6.9,8.25);
    camera.position.set(0,.08,baseZ); camera.lookAt(0,0,0); camera.updateProjectionMatrix();
  }

  function setupBloom(w,h){
    const should=w>=900&&!reduce.matches;
    if(!should){ composer?.dispose?.(); composer=null; bloom=false; return; }
    if(!composer){
      try{
        composer=new EffectComposer(renderer); composer.setPixelRatio(Math.min(devicePixelRatio||1,1.25));
        composer.addPass(new RenderPass(scene,camera));
        const pass=new UnrealBloomPass(new THREE.Vector2(w,h),.45,.25,.8); pass.threshold=.8; pass.strength=.45; pass.radius=.25;
        composer.addPass(pass); composer.addPass(new OutputPass()); bloom=true;
      }catch{ composer=null; bloom=false; }
    }
    composer?.setSize(w,h);
  }

  function cardsAt(p){
    cards.forEach((card,i)=>{ const v=smooth(.18+i*.08,.42+i*.08,p); card.style.opacity=v; card.style.transform=`translate3d(0,${(1-v)*18}px,0) scale(${.965+v*.035})`; });
    if(cue) cue.style.opacity=1-smooth(.08,.28,target);
  }

  function smooth(a,b,v){ const x=THREE.MathUtils.clamp((v-a)/(b-a),0,1); return x*x*(3-2*x); }

  function renderScene(){
    const p=.74+progress*.26, motion=enabled?(reduce.matches?.45:1):0, assemble=smooth(.05,.8,p), network=smooth(.22,.82,p);
    root.scale.setScalar(.98+assemble*.04+Math.sin(phase*.92)*.016*motion);
    root.rotation.set(-.15+assemble*.08-pointerNow.y*.5*motion,-.34+assemble*.18+pointerNow.x*.72*motion+phase*.14*motion,.04+Math.sin(phase*.31)*.014*motion);
    root.position.y=-.02+Math.sin(phase*.52)*.02*motion;
    core.scale.setScalar(1+Math.sin(phase*1.35)*.02*motion); core.rotation.y=-phase*.14*motion;
    wire.rotation.set(phase*.1*motion,-phase*.16*motion,0); wireMat.opacity=.12+network*.12;
    rings.forEach((r,i)=>{ const b=r.userData.base, q=r.userData.phase; r.rotation.x=b.x+Math.sin(phase*(.62+i*.05)+q)*.07*motion; r.rotation.y=b.y+phase*r.userData.speed*(1+boost*.15)*motion; r.rotation.z=b.z+Math.cos(phase*(.5+i*.035)+q)*.052*motion; });
    nodes.rotation.set(Math.sin(phase*.35)*.06*motion,-phase*.26*motion,0);
    nodes.children.forEach(n=>{ const w=(Math.sin(phase*1.8+n.userData.i*.52)+1)/2; n.scale.setScalar(n.userData.base*(1+w*.22*motion)); });
    particles.rotation.set(Math.sin(phase*.2)*.05*motion,phase*.05*motion,0);
    comets.forEach(c=>{ const pos=cometPos(c,phase*c.speed*(1+boost*.25)+c.phase); c.head.position.copy(pos); c.history.pop(); c.history.unshift(pos.clone()); const a=c.geo.attributes.position.array; c.history.forEach((v,i)=>{a[i*3]=v.x;a[i*3+1]=v.y;a[i*3+2]=v.z;}); c.geo.attributes.position.needsUpdate=true; });
    camera.position.z=baseZ-.16*assemble; camera.lookAt(0,0,0);
    const pulse=Math.sin(phase*1.2)*3*motion; key.intensity=4.4+pulse*.12; rim.intensity=46+pulse; low.intensity=36+pulse*.7;
    cardsAt(p);
  }

  function updateButton(){ if(!toggle)return; toggle.textContent=enabled?'Pause ambient motion':'Resume ambient motion'; toggle.setAttribute('aria-pressed',String(enabled)); document.documentElement.dataset.heroMotion=enabled?'running':'paused'; }
  toggle?.addEventListener('click',()=>{ enabled=!enabled; try{localStorage.setItem('tbm-3d-motion-v2',enabled?'on':'off')}catch{} if(!enabled)pointer.set(0,0); updateButton(); });
  updateButton();

  if(matchMedia('(pointer:fine)').matches){
    stage.addEventListener('pointermove',e=>{ if(!enabled)return; const r=stage.getBoundingClientRect(); pointer.set(((e.clientX-r.left)/r.width-.5)*.28,((e.clientY-r.top)/r.height-.5)*.18); },{passive:true});
    stage.addEventListener('pointerleave',()=>pointer.set(0,0));
  }

  function installScroll(){
    if(window.gsap&&window.ScrollTrigger){
      gsap.registerPlugin(ScrollTrigger);
      gsap.matchMedia().add('(min-width:900px)',()=>{ hero.classList.add('is-pinned'); const t=ScrollTrigger.create({trigger:hero,start:'top top',end:()=>`+=${Math.max(innerHeight,760)}`,pin:grid,pinSpacing:true,scrub:.45,onUpdate:s=>{target=s.progress;boost=THREE.MathUtils.clamp(Math.abs(s.getVelocity())/2800,0,1)}}); return()=>{t.kill();hero.classList.remove('is-pinned')}; });
      gsap.matchMedia().add('(max-width:899px)',()=>{ const t=ScrollTrigger.create({trigger:hero,start:'top 88%',end:'bottom 18%',scrub:.35,onUpdate:s=>{target=s.progress;boost=THREE.MathUtils.clamp(Math.abs(s.getVelocity())/3600,0,.65)}}); return()=>t.kill(); });
    }else{
      const u=()=>{ const r=hero.getBoundingClientRect(); target=THREE.MathUtils.clamp((-r.top+innerHeight*.06)/Math.max(innerHeight*.86,620),0,1); }; u(); addEventListener('scroll',u,{passive:true}); addEventListener('resize',u,{passive:true});
    }
  }
  if(document.readyState==='complete')installScroll(); else addEventListener('load',installScroll,{once:true});

  const resize=()=>{ const {width,height}=stage.getBoundingClientRect(); if(!width||!height)return; renderer.setSize(width,height,false); camera.aspect=width/height; fit(); setupBloom(width,height); };
  new ResizeObserver(resize).observe(stage); resize();
  new IntersectionObserver(e=>visible=e[0]?.isIntersecting??true,{threshold:.01}).observe(stage);
  document.addEventListener('visibilitychange',()=>{active=!document.hidden;last=performance.now()});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();document.documentElement.classList.remove('webgl-ready');document.documentElement.classList.add('webgl-fallback')});

  function frame(now){
    requestAnimationFrame(frame); const dt=Math.min(Math.max((now-last)/1000,0),.05); last=now; if(!active||!visible)return;
    if(enabled)phase+=dt*(reduce.matches?.45:1); boost=Math.max(0,boost-dt*1.35); progress+=(target-progress)*(reduce.matches?.12:.09); pointerNow.lerp(pointer,reduce.matches?.1:.05);
    renderScene(); bloom&&composer?composer.render(dt):renderer.render(scene,camera);
  }
  reduce.addEventListener?.('change',resize);
  document.documentElement.classList.add('webgl-ready'); document.documentElement.classList.remove('webgl-fallback');
  renderScene(); renderer.render(scene,camera); requestAnimationFrame(frame);
}
