import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl=process.env.TBM_PREVIEW_URL || 'http://127.0.0.1:4173/index.html';
const outputDirectory=path.resolve('artifacts/forge-intro');
const viewports=[
  { name:'1920x1080',width:1920,height:1080 },
  { name:'1680x900',width:1680,height:900 },
  { name:'1366x768',width:1366,height:768 },
  { name:'mobile-390x844',width:390,height:844 }
];
const phases=[
  { name:'opening',progress:0 },
  { name:'formation',progress:.34 },
  { name:'passage',progress:.7 },
  { name:'homepage-exposed',progress:1 }
];
const diagnostics=[];

await mkdir(outputDirectory,{ recursive:true });
const browser=await chromium.launch({ headless:true });

try{
  for(const viewport of viewports){
    const page=await browser.newPage({ viewport:{ width:viewport.width,height:viewport.height },deviceScaleFactor:1 });
    const pageErrors=[];
    page.on('pageerror',error=>pageErrors.push(error.message));

    await page.goto(baseUrl,{ waitUntil:'networkidle',timeout:90000 });
    await page.evaluate(()=>document.fonts?.ready);
    await page.waitForSelector('#forge-intro');
    await page.waitForSelector('#hero-stage');

    for(const phase of phases){
      await page.evaluate(progress=>{
        const hero=document.querySelector('.hero-scroll-sequence');
        if(!hero) throw new Error('Approved hero was not found.');
        const heroTop=hero.getBoundingClientRect().top+window.scrollY;
        const desktop=window.innerWidth>=900;
        const travel=desktop
          ? Math.max(window.innerHeight*1.08,820)
          : Math.max(window.innerHeight*.92,640);
        const start=Math.max(0,heroTop-window.innerHeight*.035);
        const end=Math.max(1,heroTop+travel);
        window.scrollTo(0,start+(end-start)*progress);
      },phase.progress);

      await page.waitForTimeout(900);
      await page.screenshot({
        path:path.join(outputDirectory,`${viewport.name}--${phase.name}.png`),
        fullPage:false
      });
    }

    const finalState=await page.evaluate(()=>{
      const intro=document.getElementById('forge-intro');
      const style=intro ? getComputedStyle(intro) : null;
      const scrollingElement=document.scrollingElement;
      const originalScrollLeft=scrollingElement?.scrollLeft ?? 0;
      if(scrollingElement) scrollingElement.scrollLeft=1000;
      const horizontalScroll=scrollingElement?.scrollLeft ?? window.scrollX;
      if(scrollingElement) scrollingElement.scrollLeft=originalScrollLeft;
      return {
        exists:Boolean(intro),
        complete:intro?.classList.contains('is-complete') ?? false,
        pointerEvents:style?.pointerEvents,
        visibility:style?.visibility,
        opacity:style?.opacity,
        phase:intro?.dataset.phase,
        progress:intro?.style.getPropertyValue('--forge-progress'),
        release:intro?.style.getPropertyValue('--forge-release'),
        scrollY:window.scrollY,
        scrollHeight:document.documentElement.scrollHeight,
        horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        horizontalScroll,
        bodyOverflowX:getComputedStyle(document.body).overflowX
      };
    });

    diagnostics.push({ viewport:viewport.name,finalState,pageErrors });
    await writeFile(
      path.join(outputDirectory,'diagnostics.json'),
      `${JSON.stringify(diagnostics,null,2)}\n`,
      'utf8'
    );

    if(!finalState.exists || !finalState.complete || finalState.pointerEvents!=='none'){
      throw new Error(`${viewport.name}: intro did not release correctly: ${JSON.stringify(finalState)}`);
    }
    if(finalState.horizontalScroll>2){
      throw new Error(`${viewport.name}: page can scroll horizontally by ${finalState.horizontalScroll}px.`);
    }
    if(pageErrors.length){
      throw new Error(`${viewport.name}: page errors: ${pageErrors.join(' | ')}`);
    }

    await page.close();
  }
}finally{
  await browser.close();
}

console.log(`Captured ${viewports.length*phases.length} Forge Gate evidence screenshots in ${outputDirectory}.`);
