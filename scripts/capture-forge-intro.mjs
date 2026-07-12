import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl=process.env.TBM_PREVIEW_URL || 'http://127.0.0.1:4173/index.html';
const outputDirectory=path.resolve('artifacts/forge-intro');
const videoTemp=path.join(outputDirectory,'video-temp');
const viewports=[
  { name:'1920x1080',width:1920,height:1080 },
  { name:'1680x900',width:1680,height:900 },
  { name:'1366x768',width:1366,height:768 },
  { name:'mobile-390x844',width:390,height:844 },
  { name:'mobile-tall-430x932',width:430,height:932 }
];
const phases=[
  { name:'opening',progress:0 },
  { name:'25-percent',progress:.25 },
  { name:'50-percent',progress:.5 },
  { name:'75-percent',progress:.75 },
  { name:'final-clean-frame',progress:.83 },
  { name:'real-homepage',progress:1 }
];
const diagnostics=[];

await mkdir(outputDirectory,{ recursive:true });
await mkdir(videoTemp,{ recursive:true });
const browser=await chromium.launch({ headless:true });

function assert(condition,message){
  if(!condition) throw new Error(message);
}

async function waitForForge(page,{ allowFailure=false }={}){
  await page.waitForSelector('#forge-intro');
  await page.waitForSelector('#hero-stage');
  await page.waitForFunction(
    allowFailure
      ? () => ['ready','failed','bypassed'].includes(document.getElementById('forge-intro')?.dataset.loadState)
      : () => document.getElementById('forge-intro')?.dataset.loadState==='ready',
    undefined,
    { timeout:20000 }
  );
}

async function setProgress(page,progress){
  await page.evaluate(value=>{
    const range=window.__tbmForgeIntro?.getRange();
    if(!range) throw new Error('Forge range is unavailable.');
    window.scrollTo(0,range.start+(range.end-range.start)*value);
  },progress);
  await page.waitForTimeout(180);
}

async function state(page){
  return page.evaluate(()=>{
    const intro=document.getElementById('forge-intro');
    const style=intro ? getComputedStyle(intro) : null;
    const main=document.getElementById('main-content');
    const header=document.getElementById('site-header');
    const scrollingElement=document.scrollingElement;
    const originalScrollLeft=scrollingElement?.scrollLeft ?? 0;
    if(scrollingElement) scrollingElement.scrollLeft=1000;
    const horizontalScroll=scrollingElement?.scrollLeft ?? window.scrollX;
    if(scrollingElement) scrollingElement.scrollLeft=originalScrollLeft;
    return {
      debug:window.__tbmForgeIntro?.getState() ?? null,
      exists:Boolean(intro),
      complete:intro?.classList.contains('is-complete') ?? false,
      pointerEvents:style?.pointerEvents,
      visibility:style?.visibility,
      opacity:style?.opacity,
      phase:intro?.dataset.phase,
      loadState:intro?.dataset.loadState,
      mainInert:Boolean(main?.inert),
      headerInert:Boolean(header?.inert),
      bodyClasses:document.body.className,
      activeElement:document.activeElement?.outerHTML?.slice(0,240) ?? null,
      scrollY:window.scrollY,
      scrollHeight:document.documentElement.scrollHeight,
      horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      horizontalScroll,
      bodyOverflowX:getComputedStyle(document.body).overflowX,
      webglReady:document.documentElement.classList.contains('webgl-ready'),
      webglFallback:document.documentElement.classList.contains('webgl-fallback')
    };
  });
}

async function auditViewport(viewport){
  const context=await browser.newContext({ viewport:{ width:viewport.width,height:viewport.height },deviceScaleFactor:1 });
  const page=await context.newPage();
  const pageErrors=[];
  const consoleErrors=[];
  const frameRequests=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  page.on('console',message=>{
    if(message.type()==='error') consoleErrors.push(message.text());
  });
  page.on('request',request=>{
    const url=request.url();
    if(url.includes('/assets/forge-reveal/')) frameRequests.push(url);
  });

  await page.goto(baseUrl,{ waitUntil:'networkidle',timeout:90000 });
  await page.evaluate(()=>document.fonts?.ready);
  await waitForForge(page);
  await setProgress(page,0);

  const openingInteraction=await page.evaluate(()=>({
    mainInert:Boolean(document.getElementById('main-content')?.inert),
    headerInert:Boolean(document.getElementById('site-header')?.inert)
  }));
  assert(openingInteraction.mainInert && openingInteraction.headerInert,`${viewport.name}: underlying DOM is not inert while covered.`);
  let blockedClick=false;
  try{
    await page.locator('.hero-actions a').first().click({ trial:true,timeout:1400 });
  }catch{
    blockedClick=true;
  }
  assert(blockedClick,`${viewport.name}: covered hero CTA remained interactable.`);
  await page.evaluate(()=>document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await page.keyboard.press('Tab');
  const coveredFocus=await page.evaluate(()=>{
    const active=document.activeElement;
    return {
      tag:active?.tagName,
      underCoveredDom:Boolean(active && (document.getElementById('main-content')?.contains(active) || document.getElementById('site-header')?.contains(active)))
    };
  });
  assert(!coveredFocus.underCoveredDom,`${viewport.name}: keyboard focus entered covered controls.`);

  const phaseStates=[];
  for(const phase of phases){
    await setProgress(page,phase.progress);
    await page.screenshot({
      path:path.join(outputDirectory,`${viewport.name}--${phase.name}.png`),
      fullPage:false
    });
    phaseStates.push({ name:phase.name,progress:phase.progress,state:await state(page) });
  }

  const finalState=phaseStates.at(-1).state;
  assert(finalState.exists && finalState.complete,`${viewport.name}: intro did not complete.`);
  assert(finalState.pointerEvents==='none' && finalState.visibility==='hidden',`${viewport.name}: intro did not release visibility/pointer state.`);
  assert(!finalState.mainInert && !finalState.headerInert,`${viewport.name}: inert was not removed after handoff.`);
  assert(finalState.debug?.sequence?.frameCount===32,`${viewport.name}: renderer frame count is not 32.`);
  assert(finalState.webglReady || finalState.webglFallback,`${viewport.name}: approved real hero did not initialise after handoff.`);
  await page.locator('.hero-actions a').first().click({ trial:true,timeout:3000 });

  await page.evaluate(()=>document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await page.keyboard.press('Tab');
  const releasedFocus=await page.evaluate(()=>({
    id:document.activeElement?.id || '',
    className:String(document.activeElement?.className || ''),
    href:document.activeElement?.getAttribute?.('href') || ''
  }));
  assert(releasedFocus.href==='#main-content' || releasedFocus.className.includes('skip-link'),`${viewport.name}: normal tab order was not restored.`);

  await setProgress(page,.5);
  const reverseMid=await state(page);
  assert(!reverseMid.complete && reverseMid.mainInert,`${viewport.name}: reverse scroll did not restore overlay suppression.`);
  await setProgress(page,0);
  const reverseOpening=await state(page);
  assert(reverseOpening.phase==='opening' && !reverseOpening.complete,`${viewport.name}: reverse scroll did not return deterministically to opening.`);

  await page.mouse.wheel(0,Math.max(1300,viewport.height*1.6));
  await page.waitForTimeout(180);
  const fastWheel=await state(page);
  assert((fastWheel.debug?.progress ?? 0)>.05,`${viewport.name}: fast wheel did not advance deterministic scroll progress.`);

  await setProgress(page,0);
  for(let index=0;index<10;index+=1) await page.mouse.wheel(0,36);
  await page.waitForTimeout(180);
  const smallIncrements=await state(page);
  assert((smallIncrements.debug?.progress ?? 0)>0,`${viewport.name}: small wheel/touchpad increments did not advance the reveal.`);

  await setProgress(page,.5);
  const originalViewport=page.viewportSize();
  await page.setViewportSize({ width:Math.max(360,originalViewport.width-73),height:originalViewport.height+41 });
  await page.waitForTimeout(220);
  const resized=await state(page);
  assert(resized.debug?.sequence?.canvasWidth>0 && resized.debug?.sequence?.canvasHeight>0,`${viewport.name}: canvas failed after resize.`);
  if(viewport.width<700){
    await page.setViewportSize({ width:originalViewport.height,height:originalViewport.width });
    await page.waitForTimeout(220);
    const oriented=await state(page);
    assert(oriented.debug?.sequence?.canvasWidth>0,`${viewport.name}: canvas failed after orientation change.`);
  }
  await page.setViewportSize(originalViewport);
  await page.waitForTimeout(180);

  await setProgress(page,.5);
  const beforeRefresh=await state(page);
  await page.reload({ waitUntil:'networkidle',timeout:90000 });
  await waitForForge(page);
  const afterRefresh=await state(page);
  assert(afterRefresh.exists && afterRefresh.debug,`${viewport.name}: refresh at an intermediate position lost the reveal controller.`);

  await setProgress(page,1);
  await page.locator('#how-we-buy').scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  const nextSectionVisible=await page.locator('#how-we-buy').isVisible();
  assert(nextSectionVisible,`${viewport.name}: normal scrolling did not continue to the next homepage section.`);

  const badRequests=frameRequests.filter(url=>{
    const match=url.match(/frame_(\d{4})\.webp/);
    return !match || Number(match[1])>32 || url.includes('/TEVEAL/');
  });
  assert(badRequests.length===0,`${viewport.name}: discarded/source frame request detected: ${badRequests.join(', ')}`);
  const finalDiagnostics=await state(page);
  assert(finalDiagnostics.horizontalScroll<=2 && finalDiagnostics.horizontalOverflow<=2,`${viewport.name}: user-accessible horizontal scrolling detected.`);
  assert(pageErrors.length===0,`${viewport.name}: page errors: ${pageErrors.join(' | ')}`);

  diagnostics.push({
    viewport:viewport.name,
    openingInteraction,
    blockedClick,
    coveredFocus,
    phaseStates,
    reverseMid,
    reverseOpening,
    fastWheel,
    smallIncrements,
    resizeState:resized,
    refresh:{ before:beforeRefresh,after:afterRefresh },
    finalDiagnostics,
    frameRequestCount:frameRequests.length,
    uniqueFrameRequests:[...new Set(frameRequests)].sort(),
    pageErrors,
    consoleErrors
  });
  await context.close();
}

async function recordMotion(name,viewport,direction){
  const context=await browser.newContext({
    viewport:{ width:viewport.width,height:viewport.height },
    deviceScaleFactor:1,
    recordVideo:{ dir:videoTemp,size:{ width:viewport.width,height:viewport.height } }
  });
  const page=await context.newPage();
  await page.goto(baseUrl,{ waitUntil:'networkidle',timeout:90000 });
  await waitForForge(page);
  const video=page.video();
  if(direction==='up') await setProgress(page,1);
  else await setProgress(page,0);
  await page.waitForTimeout(450);
  const steps=96;
  for(let step=0;step<=steps;step+=1){
    const fraction=step/steps;
    await setProgress(page,direction==='up' ? 1-fraction : fraction);
    await page.waitForTimeout(12);
  }
  await page.waitForTimeout(650);
  await page.close();
  const destination=path.join(outputDirectory,`${name}--${direction}-scroll.webm`);
  await video.saveAs(destination);
  await context.close();
}

async function auditReducedMotion(){
  const context=await browser.newContext({ viewport:{width:1366,height:768},reducedMotion:'reduce' });
  const page=await context.newPage();
  await page.goto(baseUrl,{ waitUntil:'networkidle',timeout:90000 });
  await page.waitForSelector('#forge-intro');
  await page.waitForTimeout(250);
  const result=await page.evaluate(()=>({
    display:getComputedStyle(document.getElementById('forge-intro')).display,
    mainInert:Boolean(document.getElementById('main-content')?.inert),
    bodyClasses:document.body.className
  }));
  assert(result.display==='none' && !result.mainInert,'Reduced-motion users were not released immediately.');
  diagnostics.push({ test:'reduced-motion',result });
  await context.close();
}

async function auditLoadFailure(){
  const context=await browser.newContext({ viewport:{width:1366,height:768} });
  await context.addInitScript(()=>{ window.__FORGE_TEST_FRAME_FAILURE__=true; });
  const page=await context.newPage();
  await page.route('**/assets/forge-reveal/**/*.webp',route=>route.abort());
  await page.goto(baseUrl,{ waitUntil:'domcontentloaded',timeout:90000 });
  await page.waitForFunction(()=>document.getElementById('forge-intro')?.dataset.loadState==='failed',undefined,{timeout:12000});
  const result=await state(page);
  assert(result.complete && !result.mainInert && result.visibility==='hidden','Frame-load failure did not fail open to the real homepage.');
  diagnostics.push({ test:'image-load-failure',result });
  await context.close();
}

async function auditNoJavaScript(){
  const context=await browser.newContext({ viewport:{width:1366,height:768},javaScriptEnabled:false });
  const page=await context.newPage();
  await page.goto(baseUrl,{ waitUntil:'domcontentloaded',timeout:90000 });
  const result=await page.evaluate(()=>({
    introDisplay:getComputedStyle(document.getElementById('forge-intro')).display,
    mainPointerEvents:getComputedStyle(document.getElementById('main-content')).pointerEvents,
    bodyClasses:document.body.className
  }));
  assert(result.introDisplay==='none' && result.mainPointerEvents==='auto','No-JavaScript fallback leaves the homepage covered or non-interactive.');
  diagnostics.push({ test:'no-javascript',result });
  await context.close();
}

try{
  for(const viewport of viewports) await auditViewport(viewport);
  await auditReducedMotion();
  await auditLoadFailure();
  await auditNoJavaScript();
  await recordMotion('desktop-1366x768',{width:1366,height:768},'down');
  await recordMotion('desktop-1366x768',{width:1366,height:768},'up');
  await recordMotion('mobile-390x844',{width:390,height:844},'down');
  await recordMotion('mobile-390x844',{width:390,height:844},'up');
  await writeFile(path.join(outputDirectory,'diagnostics.json'),`${JSON.stringify(diagnostics,null,2)}\n`,'utf8');
}finally{
  await browser.close();
}

console.log(`Captured ${viewports.length*phases.length} screenshots, four motion recordings and expanded validation evidence in ${outputDirectory}.`);
