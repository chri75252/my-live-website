const clamp = value => Math.min(1, Math.max(0, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const smooth = (from, to, value) => {
  const x = clamp((value - from) / (to - from));
  return x * x * (3 - 2 * x);
};

const SEGMENTS = [
  { start:-2.72, end:-.48, delay:.06, rotation:-.09, x:-.025, y:.015 },
  { start:-.20, end:1.78, delay:.13, rotation:.12, x:.018, y:-.01 },
  { start:1.98, end:3.62, delay:.20, rotation:-.02, x:.008, y:.018 },
  { start:3.78, end:5.86, delay:.27, rotation:.07, x:-.016, y:-.016 }
];

const SPARKS = [
  { angle:-.31, seed:1.17 },
  { angle:1.83, seed:2.43 },
  { angle:3.67, seed:3.91 },
  { angle:5.93, seed:5.21 }
];

export function createForgeIntroScene(canvas){
  if (!canvas) return null;
  const context = canvas.getContext('2d',{ alpha:true,desynchronized:true });
  if (!context) return null;

  let width=0;
  let height=0;
  let pixelRatio=1;
  let progress=0;

  function resize(){
    width=Math.max(1,window.innerWidth);
    height=Math.max(1,window.innerHeight);
    pixelRatio=Math.min(window.devicePixelRatio || 1,1.75);
    canvas.width=Math.round(width*pixelRatio);
    canvas.height=Math.round(height*pixelRatio);
    canvas.style.width=`${width}px`;
    canvas.style.height=`${height}px`;
    context.setTransform(pixelRatio,0,0,pixelRatio,0,0);
    draw();
  }

  function ellipsePoint(angle,radiusX,radiusY,scale,rotation,offsetX,offsetY){
    const x=Math.cos(angle)*radiusX*scale;
    const y=Math.sin(angle)*radiusY*scale;
    const cos=Math.cos(rotation);
    const sin=Math.sin(rotation);
    return {
      x:width/2+x*cos-y*sin+offsetX,
      y:height/2+x*sin+y*cos+offsetY
    };
  }

  function drawArc(segment,index,gateScale,formation,passage){
    const local=smooth(segment.delay,segment.delay+.34,progress);
    if (local<=0) return;

    const radius=Math.min(width,height)*.285;
    const radiusX=radius*1.02;
    const radiusY=radius*.86;
    const centreX=width/2+segment.x*width;
    const centreY=height/2+segment.y*height;
    const arcEnd=lerp(segment.start,segment.end,local);
    const heat=smooth(.1,.78,local)*(1-passage*.48);
    const baseWidth=Math.max(2.2,Math.min(width,height)*.0074);

    context.save();
    context.translate(centreX,centreY);
    context.rotate(segment.rotation);
    context.scale(gateScale,gateScale*.94);

    context.beginPath();
    context.ellipse(0,0,radiusX,radiusY,0,segment.start,arcEnd,false);
    context.lineCap='round';
    context.lineWidth=baseWidth*1.8;
    context.strokeStyle=`rgba(35,12,2,${.78*formation})`;
    context.stroke();

    const gradient=context.createLinearGradient(-radiusX,0,radiusX,0);
    gradient.addColorStop(0,`rgba(91,35,5,${.92*formation})`);
    gradient.addColorStop(.42,`rgba(193,82,10,${.98*formation})`);
    gradient.addColorStop(.66,`rgba(238,150,47,${.96*formation})`);
    gradient.addColorStop(1,`rgba(105,38,5,${.92*formation})`);
    context.beginPath();
    context.ellipse(0,0,radiusX,radiusY,0,segment.start,arcEnd,false);
    context.lineWidth=baseWidth;
    context.strokeStyle=gradient;
    context.shadowColor=`rgba(219,105,18,${.26*heat})`;
    context.shadowBlur=10*heat;
    context.stroke();

    context.beginPath();
    context.ellipse(0,0,radiusX,radiusY,0,segment.start+.012,arcEnd-.012,false);
    context.lineWidth=Math.max(.75,baseWidth*.19);
    context.strokeStyle=`rgba(255,215,137,${.82*heat})`;
    context.shadowBlur=0;
    context.stroke();
    context.restore();

    if (local>.7 && passage<.65){
      const tip=ellipsePoint(
        arcEnd,
        radiusX,
        radiusY,
        gateScale,
        segment.rotation,
        segment.x*width,
        segment.y*height
      );
      context.save();
      const glow=context.createRadialGradient(tip.x,tip.y,0,tip.x,tip.y,18);
      glow.addColorStop(0,`rgba(255,226,154,${.58*(1-passage)})`);
      glow.addColorStop(.25,`rgba(234,130,35,${.32*(1-passage)})`);
      glow.addColorStop(1,'rgba(147,60,7,0)');
      context.fillStyle=glow;
      context.beginPath();
      context.arc(tip.x,tip.y,18,0,Math.PI*2);
      context.fill();
      context.restore();
    }

    void index;
  }

  function drawSparks(radiusX,radiusY,gateScale,passage){
    const sparkWindow=smooth(.24,.34,progress)*(1-smooth(.56,.69,progress));
    if (sparkWindow<=0) return;

    context.save();
    context.globalCompositeOperation='screen';
    SPARKS.forEach((spark,sparkIndex)=>{
      const point=ellipsePoint(spark.angle,radiusX,radiusY,gateScale,0,0,0);
      const count=4+(sparkIndex%2);
      for(let ray=0;ray<count;ray+=1){
        const angle=spark.angle+Math.PI/2+(ray-(count-1)/2)*.24+Math.sin(spark.seed+ray)*.08;
        const length=(7+((spark.seed*17+ray*11)%13))*sparkWindow;
        const alpha=(.16+((ray+1)/(count+1))*.22)*sparkWindow;
        context.beginPath();
        context.moveTo(point.x,point.y);
        context.lineTo(point.x+Math.cos(angle)*length,point.y+Math.sin(angle)*length);
        context.lineWidth=ray%2 ? .7 : 1;
        context.strokeStyle=`rgba(255,185,83,${alpha})`;
        context.stroke();
      }
      context.beginPath();
      context.arc(point.x,point.y,1.6+sparkWindow*1.8,0,Math.PI*2);
      context.fillStyle=`rgba(255,218,137,${.56*sparkWindow})`;
      context.fill();
    });
    context.restore();
    void passage;
  }

  function draw(){
    context.clearRect(0,0,width,height);
    const formation=smooth(.06,.48,progress);
    const passage=smooth(.43,.86,progress);
    const release=smooth(.78,1,progress);
    if (release>=.999) return;

    const gateScale=lerp(.76,4.45,passage);
    const radius=Math.min(width,height)*.285;
    const radiusX=radius*1.02;
    const radiusY=radius*.86;

    const haze=context.createRadialGradient(width/2,height/2,0,width/2,height/2,Math.max(width,height)*.48);
    haze.addColorStop(0,`rgba(165,73,10,${.075*(1-release)})`);
    haze.addColorStop(.34,`rgba(72,27,4,${.05*(1-release)})`);
    haze.addColorStop(1,'rgba(0,0,0,0)');
    context.fillStyle=haze;
    context.fillRect(0,0,width,height);

    SEGMENTS.forEach((segment,index)=>drawArc(segment,index,gateScale,formation,passage));
    drawSparks(radiusX,radiusY,gateScale,passage);
  }

  function setProgress(value){
    progress=clamp(value);
    draw();
  }

  resize();
  return { setProgress,resize,dispose(){ context.clearRect(0,0,width,height); } };
}
