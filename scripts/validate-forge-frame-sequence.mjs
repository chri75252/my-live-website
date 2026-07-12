import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const read=relative=>readFile(path.join(root,relative),'utf8');
const fail=message=>{ throw new Error(message); };
const hash=relative=>execFileSync('git',['hash-object','--',relative],{ cwd:root,encoding:'utf8' }).trim();

const protectedHashes={
  'css/hero-scroll.css':'82070a5ead77c7d7926beb486553b8a657f872ed',
  'js/hero-3d.js':'8aa1390dc9fbb1a4ff06dcf2e796d17601de6f4b',
  'js/home-v2.js':'89b4ad5aa06cf425d71789c1917106c439ebe594',
  'css/site-v2.css':'730c2a3abf3e850a155287264d7107a37a4975a7'
};
for(const [file,expected] of Object.entries(protectedHashes)){
  const actual=hash(file);
  if(actual!==expected) fail(`Protected file ${file} changed: expected ${expected}, got ${actual}.`);
}

const manifest=JSON.parse(await read('artifacts/forge-frame-audit/frame-manifest.json'));
if(manifest.SOURCE_FRAME_COUNT!==48 || manifest.frames.length!==48) fail('Frame manifest must contain 48 records.');
if(manifest.LAST_CLEAN_FRAME!==32 || manifest.FIRST_SYNTHETIC_HOMEPAGE_FRAME!==33 || manifest.SELECTED_FRAME_COUNT!==32){
  fail('Audited cutoff must be LAST_CLEAN_FRAME=32, FIRST_SYNTHETIC_HOMEPAGE_FRAME=33, SELECTED_FRAME_COUNT=32.');
}
const selected=manifest.frames.filter(frame=>frame.selected).map(frame=>frame.index);
if(JSON.stringify(selected)!==JSON.stringify(Array.from({length:32},(_,index)=>index+1))){
  fail('Production selection is not the contiguous 001..032 prefix.');
}
for(const frame of manifest.frames.slice(32)){
  if(frame.selected) fail(`Discarded frame ${frame.index} is incorrectly selected.`);
  if(!['transition-contaminated','synthetic-homepage'].includes(frame.classification)){
    fail(`Discarded frame ${frame.index} lacks a contamination classification.`);
  }
}

const expectedAssets=Array.from({length:32},(_,index)=>`frame_${String(index+1).padStart(4,'0')}.webp`);
for(const variant of ['desktop','mobile']){
  const files=(await readdir(path.join(root,'assets','forge-reveal',variant))).sort();
  if(JSON.stringify(files)!==JSON.stringify(expectedAssets)) fail(`${variant} asset inventory is not exactly frame_0001.webp..frame_0032.webp.`);
}

const report=JSON.parse(await read('artifacts/forge-frame-audit/performance-report.json'));
if(report.desktop.asset_count!==32 || report.mobile.asset_count!==32) fail('Performance report asset counts are not 32/32.');

const sourceFiles=[
  'index.html','css/forge-intro.css','js/forge-intro.js','js/forge-frame-sequence.js',
  'scripts/capture-forge-intro.mjs','.github/workflows/forge-intro-visual.yml'
];
const combined=(await Promise.all(sourceFiles.map(read))).join('\n');
for(const term of ['getVelocity(','ScrollTrigger.getVelocity','sessionStorage.setItem','frame_0033.webp','ezgif-frame-033.jpg']){
  if(combined.includes(term)) fail(`Forbidden implementation term found: ${term}`);
}
if(combined.includes('js/forge-intro-scene.js')) fail('Procedural scene module is still referenced.');
if(combined.includes('TEVEAL/ezgif-frame-')) fail('Production code references source JPEGs instead of optimized assets.');

const baseline=execFileSync('git',['show','e234618f8dcc8283b69368b73f5b4537d228d0cb:index.html'],{cwd:root,encoding:'utf8'});
const applyExpectedIntegration=text=>text
  .replace(
    '  <link rel="stylesheet" href="css/hero-scroll.css">',
    `  <link rel="stylesheet" href="css/hero-scroll.css">\n  <link rel="stylesheet" href="css/forge-intro.css">\n  <link rel="preload" as="image" href="assets/forge-reveal/desktop/frame_0001.webp" type="image/webp" media="(min-width:701px)">\n  <link rel="preload" as="image" href="assets/forge-reveal/mobile/frame_0001.webp" type="image/webp" media="(max-width:700px)">\n  <noscript><style>\n    .forge-intro{display:none!important}\n    body.forge-intro-pending>.skip-link,\n    body.forge-intro-pending>.site-header,\n    body.forge-intro-pending>main,\n    body.forge-intro-pending>.site-footer{pointer-events:auto!important;user-select:auto!important}\n  </style></noscript>`
  )
  .replace('<body class="home-v2">','<body class="home-v2 forge-intro-pending">')
  .replace(
    '<a class="skip-link" href="#main-content">Skip to main content</a>',
    `<a class="skip-link" href="#main-content">Skip to main content</a>\n<div class="forge-intro" id="forge-intro" data-phase="opening" data-load-state="loading" data-frame-count="32" role="img" aria-label="A forged bronze gate opens to reveal The Blacksmith Market homepage">\n  <div class="forge-intro__shade" aria-hidden="true"></div>\n  <div class="forge-intro__atmosphere" aria-hidden="true"></div>\n  <canvas class="forge-intro__canvas" id="forge-intro-canvas" aria-hidden="true"></canvas>\n  <div class="forge-intro__copy">\n    <p class="forge-intro__kicker">The Blacksmith Market</p>\n    <strong class="forge-intro__title">Forge the way forward.</strong>\n  </div>\n  <span class="forge-intro__instruction">Scroll to forge</span>\n  <span class="forge-intro__status" id="forge-intro-status" role="status" aria-live="polite">Preparing the forge</span>\n  <span class="forge-intro__meter" aria-hidden="true"></span>\n</div>`
  )
  .replace(
    '<script type="module" src="js/home-v2.js"></script>',
    '<script type="module" src="js/forge-intro.js"></script>\n<script type="module" src="js/home-v2.js"></script>'
  );
const applyExpectedLiveHeroV2=text=>text
  .replace(
    '  <link rel="stylesheet" href="css/site-v2.css">',
    `  <!-- TBM reveal-match Three.js import map -->\n  <script type="importmap" id="tbm-three-importmap">\n  {\n    "imports": {\n      "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",\n      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"\n    }\n  }\n  </script>\n  <link rel="stylesheet" href="css/site-v2.css">`
  )
  .replace(
    '  <link rel="stylesheet" href="css/hero-scroll.css">',
    '  <link rel="stylesheet" href="css/hero-scroll.css">\n  <link rel="stylesheet" href="css/hero-reveal-match-v2.css">'
  )
  .replace(
    '<script type="module" src="js/hero-3d.js"></script>',
    '<script type="module" src="js/hero-3d-reveal-match-v2.js"></script>'
  );
const currentIndex=await read('index.html');
const expectedIndex=applyExpectedLiveHeroV2(applyExpectedIntegration(baseline)).replace(/\r\n/g,'\n');
if(currentIndex.replace(/\r\n/g,'\n')!==expectedIndex){
  fail('index.html is not the exact approved pre-PR5 baseline plus the permitted Forge intro and reveal-matched live-hero integrations.');
}

console.log('Frame-sequence validation passed: protected homepage and Forge assets are intact, audited frames 001..032 are deployable, and only the approved live-hero V2 additions are present.');
