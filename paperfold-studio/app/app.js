import * as T from './vendor/three.module.min.js';
import {createPaper, corner, mouthPoint, pocketWallPoint, tuckMotion} from './paper.js';

import {drawShadow} from './shadow.js';
import {drawFoldGuide} from './fold-guide.js';
import {createBeginnerModel} from './beginner.js';
import {courseText, copy} from './courses.js';
import {createStudioModel} from './studio-paper.js';

const bookmarkZh = [
  ['沿对角线合起','捏住下方纸角，向上折，让它与最上方的纸角重合。','压平后是一只双层三角形，长边在下。'],
  ['折下前面一层','只拿前面的顶角，向下折到长边的中点。后面一层留在原位。','两层之间留出了袋口，后面的尖角仍朝上。'],
  ['抬起右角','沿虚线折起右侧的两层纸，把右角送到顶角。','右下边对齐中线，左角仍向外伸展。'],
  ['把右尖角塞进口袋','捏住刚折上去的右尖角，向下弯，把它送到袋口前壁与后壁之间。','打开透视，橙色纸尖应越过虚线，落在两层之间。'],
  ['抬起左角','把左侧两层一起向上折，左角与后面的顶角对齐。','左下边贴齐中线，刚塞好的右角留在袋内。'],
  ['塞入左角，压平','将左尖角向下送进同一袋口，然后把书角轻轻压平。','两个尖角都收在袋内，完成的书角可以套在书页一角。']
];
const $ = id => document.getElementById(id);
const downloadPage='https://lihywh.github.io/paperfold-studio/';
function readLocal(key,fallback){
  try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}
  catch{return fallback;}
}
function writeLocal(key,value){
  try{localStorage.setItem(key,JSON.stringify(value));}
  catch{/* The lesson still works when local storage is unavailable. */}
}
let lang=readLocal('paperfold-language',navigator.language.startsWith('zh')?'zh':'en');
const words=key=>copy[key][lang==='zh'?0:1];
const pick=pair=>pair[lang==='zh'?0:1];
let saved=readLocal('paperfold-progress',{});
let activeId=null, lessons=[], paper=null, courseViews=[];
let lastSave=-1;
const clipEnglish=[
  'Lift the front wall while keeping the back wall flat. Locate the opening.',
  'Follow the dashed opening. The orange point slides between the front and back walls.',
  'Press the front wall flat once the point is inside.'
];
const stage=$('stage'), handle=$('handle'), indicator=$('percent'), range=$('scrub');
const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
let step=0, progress=0, playing=false, dwell=0, dirty=true;
let paperView='solid';
const paperViews=['solid','xray','spread','cutaway'];
const views={front:[0,.06],angle:[-.42,.34],side:[-.99,.72],back:[Math.PI,.13]};
const stepViews = [
  ['angle', -.53, .29], // Open up the arc of the diagonal fold.
  ['angle', .59, .34],  // Reveal the layer staying in place.
  ['angle', -.40, .18], // Keep the starting corner and top point in view.
  ['side', -.92, .70], // Look into the pocket from the right fold's approach.
  ['angle', .40, .18],
  ['side', .92, .70]
];
const previewSeconds = .65;
const pocketClips = [
  {start:0, end:tuckMotion.openEnd, duration:1.25, cue:'轻撑前壁，后壁留在原位，让袋口张开。'},
  {start:tuckMotion.openEnd, end:tuckMotion.insertEnd, duration:2.9, cue:'沿虚线袋口送入纸尖，让它滑到蓝色前壁和绿色后壁之间。'},
  {start:tuckMotion.insertEnd, end:1, duration:1.45, cue:'纸尖已经在袋里。把前壁轻轻压平，对照纸尖是否藏好。'}
];
const isTuck = () => activeId==='bookmark'&&(step===3||step===5);
let pocketHold = 0, replay = null;
let [cameraMode, yaw, pitch] = stepViews[0];
let drag=null, lastFrame=0, previewRemaining=0;
let zoom=1, pocketCloseUp=false, transition=null, geometryKey='';
const scene=new T.Scene(), camera=new T.OrthographicCamera(-1,1,1,-1,.1,20);
let renderer;
try {
  const surface=document.createElement('canvas');
  const gl=surface.getContext('webgl2',{antialias:true,alpha:true,powerPreference:'low-power'});
  if(gl) renderer=new T.WebGLRenderer({canvas:surface,context:gl,antialias:true,alpha:true});
  else {
    const {SoftwareRenderer}=await import('./software-renderer.js');
    renderer=new SoftwareRenderer();
  }
} catch(e) {
  $('failure').hidden=false; handle.hidden=true;
  document.querySelectorAll('button,input').forEach(el=>{if(!el.closest('#failure')) el.disabled=true;});
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setClearColor(0x000000,0);
stage.prepend(renderer.domElement);
const canvas=renderer.domElement;canvas.classList.add('paper-canvas');
scene.add(new T.HemisphereLight(0xfff8eb,0xb7c8c4,1.55));
const key=new T.DirectionalLight(0xffefd5,2.15);
key.position.set(-2.2,3.1,4.1);
key.castShadow=true;
key.shadow.mapSize.set(1024,1024);
Object.assign(key.shadow.camera,{left:-1.8,right:1.8,top:1.8,bottom:-1.8,near:.5,far:10});
key.shadow.bias=-.00018;
key.shadow.normalBias=.008;
key.shadow.radius=2;
scene.add(key);
const rim=new T.DirectionalLight(0xd4e6f5,.75);
rim.position.set(2,-2,-3);
scene.add(rim);
if(renderer.shadowMap){
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFShadowMap;
  renderer.shadowMap.autoUpdate=false;
}
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.03;
const courseModels=new Map();
let paperObjects=[];
function modelFor(id){
  if(!courseModels.has(id)){
    const old=new Set(scene.children);
    const entry=courseText[id];
    const model=id==='bookmark' ? {...createPaper(scene),corner,angles:stepViews} :
      entry.folds ? createStudioModel(scene,entry) : createBeginnerModel(scene,id);
    const objects=scene.children.filter(object=>!old.has(object));
    courseModels.set(id,{model,objects});
  }
  return courseModels.get(id);
}
function currentPose(){
  if(paper) return {step,progress:Math.round(progress*1000)/1000,view:paperView};
  return null;
}
function saveProgress(force=false){
  if(!activeId||!paper)return;
  const stamp=performance.now();
  if(!force&&stamp-lastSave<400)return;
  lastSave=stamp;
  saved[activeId]={...saved[activeId],...currentPose()};
  saved.recent=activeId;
  writeLocal('paperfold-progress',saved);
}
function localize(){
  document.documentElement.lang=lang==='zh'?'zh-CN':'en';
  document.title=words('brand');
  $('language').textContent=lang==='zh'?'English':'简体中文';
  $('share-app').textContent=words('share');
  $('share-address').setAttribute('aria-label',words('share'));
  $('search-label').textContent=words('search');
  $('course-search').placeholder=words('search');
  $('catalog-filters').setAttribute('aria-label',words('filters'));
  $('no-results').textContent=words('noResults');
  document.querySelector('.brand').lastChild.textContent=words('brand');
  const labels={
    'library-title':'library','library-intro':'intro','library-link':'navBack',
    'resume-course':'resume','legend-back':'backWall','legend-front':'frontWall',
    'front-wall':'frontWall','back-wall':'backWall','legend-moving':'moving','mouth-label':'mouth','tip-stop':'tipStop','gesture-text':'drag',
    'current-fold':'current','tipLabel':'check','progress-label':'progress',
    prev:'prev',next:'next','load-message':'no3d',reload:'reload',
    'clip-open':'open','clip-tuck':'tuck','clip-flatten':'flatten'
  };
  for(const name of [...Object.keys(views),...paperViews])labels[name]=name;
  for(const [id,key] of Object.entries(labels))$(id).textContent=id.startsWith('clip-')?'↻ '+words(key):words(key);
  $('focus').firstChild.textContent=words('focus')+' ';
  for(const id of ['handle','minus','plus'])$(id).setAttribute('aria-label',words(id));
}
const hasCourse=id=>Object.prototype.hasOwnProperty.call(courseText,id);
const courseGroups=['all','animals','nature','play','objects'];
let courseGroup='all';
function renderLibrary(){
  $('resume-course').hidden=!hasCourse(saved.recent)||!!saved[saved.recent]?.done;
  $('catalog-filters').replaceChildren(...courseGroups.map(group=>{
    const chip=document.createElement('button');
    chip.dataset.group=group;
    chip.textContent=words(group==='play'?'playCategory':group);
    chip.setAttribute('aria-pressed',String(group===courseGroup));
    chip.onclick=()=>{
      courseGroup=group;
      renderLibrary();
      $('catalog-filters').querySelector('[aria-pressed=true]').focus();
    };
    return chip;
  }));
  const query=$('course-search').value.trim().toLowerCase();
  const results=Object.entries(courseText).filter(([id,info])=>{
    const matchesGroup=courseGroup==='all'||info.group===courseGroup;
    return matchesGroup&&[id,...info.names,...info.details].some(word=>word.toLowerCase().includes(query));
  });
  $('catalog-count').textContent=lang==='zh'?`${results.length} 门课程`:
    `${results.length} ${results.length===1?'lesson':'lessons'}`;
  $('no-results').hidden=results.length!==0;
  $('course-grid').replaceChildren(...results.map(([id,info])=>{
    const button=document.createElement('button');
    button.className='course-card';
    button.dataset.course=id;
    const title=document.createElement('strong');
    title.textContent=pick(info.names);
    const detail=document.createElement('small');
    detail.textContent=pick(info.details)+' · '+(info.en.length)+(lang==='zh'?' 步':' steps');
    const completed=document.createElement('small');
    completed.className='completed';
    completed.textContent=saved[id]?.done?words('done'):'';
    const thumbnail=document.createElement('img');
    thumbnail.src='./thumb-'+id+'.png';
    thumbnail.alt='';
    thumbnail.loading='lazy';
    thumbnail.onerror=()=>{thumbnail.hidden=true;};
    const description=document.createElement('div');
    description.append(title,detail,completed);
    button.append(thumbnail,description);
    button.onclick=()=>{location.hash=id;};
    return button;
  }));
}
function rebuildLessons(){
  const info=courseText[activeId];
  lessons=lang==='en'?info.en:activeId==='bookmark'?bookmarkZh:info.cn;
  $('course-name').textContent=pick(info.names);
  $('course-detail').textContent=pick(info.details)+' · '+lessons.length+(lang==='zh'?' 步':' steps');
  $('focus').hidden=activeId!=='bookmark';
  navButtons=lessons.map(([name],i)=>{
    const button=document.createElement('button');
    button.title=name;
    button.setAttribute('aria-label',(i+1)+'. '+name);
    button.onclick=()=>select(i);
    return button;
  });
  $('rail').replaceChildren(...navButtons);
}
function showRoute(){
  saveProgress(true);
  const route=location.hash.slice(1);
  const id=route==='pocket'||route==='cutaway'?'bookmark':route;
  if(!hasCourse(id)){
    activeId=null;
    playing=false;
    $('lesson-view').hidden=true;
    $('library').hidden=false;
    renderLibrary();
    return;
  }
  activeId=id;
  for(const object of paperObjects)scene.remove(object);
  const entry=modelFor(id);
  paper=entry.model;
  paperObjects=entry.objects;
  for(const object of paperObjects)if(object.parent!==scene)scene.add(object);
  courseViews=paper.angles.map(([name,y,p])=>[typeof name==='number'?(name===3?'back':'angle'):name,y,p]);
  rebuildLessons();
  $('library').hidden=true;
  $('lesson-view').hidden=false;
  const special=route==='pocket'||route==='cutaway';
  const record=saved[id];
  const initial=clamp(record?.step||0,0,lessons.length-1);
  select(special?3:initial,special?.52:clamp(record?.progress||0));
  if(route==='cutaway')paperView='cutaway';
  else if(!special&&isTuck()&&paperViews.includes(record?.view))paperView=record.view;
  setView(...courseViews[step],true);
  saveProgress(true);
  window.scrollTo(0,0);
}
$('language').onclick=()=>{
  lang=lang==='zh'?'en':'zh';
  writeLocal('paperfold-language',lang);
  localize();
  if(activeId){rebuildLessons();updateUI();}else renderLibrary();
};
$('share-app').onclick=async()=>{
  if(navigator.userAgent.includes(' PaperFoldAndroid')){
    location.assign('./share-app');
    return;
  }
  if(typeof navigator.share==='function'){
    try{
      await navigator.share({title:words('brand'),url:downloadPage});
      return;
    }catch(error){
      if(error.name==='AbortError')return;
    }
  }
  const feedback=$('share-feedback');
  const address=$('share-address');
  try{
    await navigator.clipboard.writeText(downloadPage);
    feedback.textContent=words('copied');
    address.hidden=true;
  }catch{
    feedback.textContent=words('copyManually');
    address.hidden=false;
    address.value=downloadPage;
    address.select();
    address.focus();
  }
  feedback.hidden=false;
};
$('course-search').oninput=event=>{if(!event.isComposing)renderLibrary();};
$('course-search').oncompositionend=renderLibrary;
$('resume-course').onclick=()=>{location.hash=saved.recent;};
$('library-link').onclick=()=>{location.hash='library';};
$('mark-done').onclick=()=>{
  if(!activeId||step!==lessons.length-1||progress<1)return;
  saved[activeId]={...saved[activeId],done:true};
  saveProgress(true);
  updateUI();
};
addEventListener('hashchange',showRoute);
addEventListener('pagehide',()=>saveProgress(true));
const clipButtons=[...document.querySelectorAll('#replays button')];
const clipAt = p => p<tuckMotion.openEnd ? 0 : p<tuckMotion.insertEnd ? 1 : 2;
clipButtons.forEach((button,index)=>{
  button.onclick=()=>{
    replay=index;
    progress=pocketClips[index].start;
    playing=true;
    pocketHold=0;
    previewRemaining=0;
    dwell=0;
    drag=null;
    if(paperView!=='cutaway')paperView='xray';
    zoom=1;
    pocketCloseUp=true;
    setView(...courseViews[step]);
  };
});
let navButtons=[];
function updateUI() {
  if(!activeId)return;
  const pct=Math.round(progress*100);
  $('count').textContent=String(step+1).padStart(2,'0')+' / '+String(lessons.length).padStart(2,'0');
  $('title').textContent=lessons[step][0];$('instruction').textContent=lessons[step][1];
  const clip=replay ?? clipAt(progress);
  $('tip').textContent=isTuck() ? (lang==='en'?clipEnglish[clip]:pocketClips[clip].cue) : lessons[step][2];
  $('replays').hidden=!isTuck();
  clipButtons.forEach((button,i)=>{
    if(isTuck()&&clip===i)button.setAttribute('aria-current','step');
    else button.removeAttribute('aria-current');
  });
  const final=step===lessons.length-1;
  $('prev').disabled=step===0;$('next').disabled=final;
  $('play').textContent=words(playing?'pause':replay!==null&&progress<pocketClips[replay].end?'replay':
    final&&progress>=1?'restart':step===0&&progress===0?'play':'continue');
  $('mark-done').hidden=!final||progress<1;
  $('mark-done').disabled=!!saved[activeId]?.done;
  $('mark-done').textContent=words(saved[activeId]?.done?'done':'mark');
  navButtons.forEach((b,i)=>{b.className=i<step?'past':i===step?'now':'';if(i===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  $('look').hidden=!isTuck();
  $('legend').hidden=paperView==='solid'||$('look').hidden;
  for(const id of paperViews)$(id).setAttribute('aria-pressed',String(id===paperView));
  $('handle').classList.toggle('seated',paperView==='cutaway'&&progress>=tuckMotion.insertEnd);
  for(const name of Object.keys(views)) $(name).setAttribute('aria-pressed',String(name===cameraMode));
  indicator.textContent=pct+'%';range.value=Math.round(progress*1000);
  handle.classList.toggle('inside',isTuck()&&progress>.5);
}
function select(i,p=0,auto=false) {
  step=i;progress=p;playing=auto;dwell=0;previewRemaining=previewSeconds;pocketHold=0;replay=null;drag=null;
  paperView=isTuck()?'xray':'solid';
  pocketCloseUp=isTuck();
  // Frame a whole new fold even if the previous step was zoomed in.
  zoom=1;
  setView(...courseViews[i]);
  saveProgress(true);
}
function setProgress(p) {
  progress=clamp(p);playing=false;dwell=0;pocketHold=0;replay=null;dirty=true;updateUI();saveProgress();
}
function setView(view,toYaw,toPitch,instant=false) {
  const delta=Math.atan2(Math.sin(toYaw-yaw),Math.cos(toYaw-yaw));
  if(instant||(Math.abs(delta)<.001&&Math.abs(toPitch-pitch)<.001)||matchMedia('(prefers-reduced-motion: reduce)').matches){
    yaw=toYaw;pitch=toPitch;transition=null;
  }else transition={fromYaw:yaw,delta,fromPitch:pitch,toPitch,start:performance.now()};
  cameraMode=view;dirty=true;updateUI();
}
for(const id of Object.keys(views))$(id).onclick=()=>{
  playing=false;
  pocketCloseUp=id==='side'&&isTuck();
  if(pocketCloseUp){
    zoom=1;
    setView(...courseViews[step]);
  }else setView(id,...views[id]);
};
$('focus').onclick=()=>{select(3,.52);};
for(const id of paperViews)$(id).onclick=()=>{
  paperView=id;
  playing=false;
  if(id==='cutaway'&&cameraMode!=='side'){
    pocketCloseUp=true;
    zoom=1;
    setView(...courseViews[step]);
  }
  dirty=true;updateUI();
};
function setZoom(z){zoom=clamp(z,.70,1.85);dirty=true;}
$('plus').onclick=()=>setZoom(zoom*1.15);$('minus').onclick=()=>setZoom(zoom/1.15);
canvas.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom*Math.exp(-e.deltaY*.002));},{passive:false});
$('prev').onclick=()=>select(Math.max(0,step-1));$('next').onclick=()=>select(Math.min(lessons.length-1,step+1));
$('play').onclick=()=>{
  if(!playing&&step===lessons.length-1&&progress>=1)select(0);
  if(!playing&&replay!==null&&progress>=pocketClips[replay].end)replay=null;
  playing=!playing;dwell=0;
  if(playing&&progress===0&&replay===null)previewRemaining=previewSeconds;
  updateUI();
};
range.oninput=()=>setProgress(Number(range.value)/1000);
handle.onkeydown=e=>{
  const delta={ArrowRight:.025,ArrowUp:.025,ArrowLeft:-.025,ArrowDown:-.025}[e.key];
  if(delta!==undefined){e.preventDefault();setProgress(progress+delta);}
};

let w=1,h=1;
const target=new T.Vector3(),tmp=new T.Vector3();
function cameraSetup() {
  const sizes=[2.65,2.48,2.48,2.10,2.10,1.78],aspect=w/h;
  const heights=[2.58,1.62,1.76,1.75,1.76,1.58];
  const toolbarClearance=step===0&&h<270 ? 1.11 : 1;
  const closeUp=pocketCloseUp;
  const simple=activeId!=='bookmark';
  const framing=paper.framing?.(step);
  const simpleHeight=step===0?2.54:1.71;
  const height=framing ? Math.max(framing.height+.70,(framing.width+.69)/aspect,1.58)/zoom :
    simple ? Math.max(simpleHeight,2.52/aspect)/zoom :
    closeUp ? Math.max(1.30,1.36/aspect)/zoom :
    Math.max(heights[step],sizes[step]/aspect)*toolbarClearance/zoom;
  camera.top=height/2;camera.bottom=-height/2;camera.right=height*aspect/2;camera.left=-camera.right;
  const cx=closeUp ? 0 : step===3||step===4 ? -.16 : 0;
  const cy=step===0 ? (h<270 ? .24 : .14) : .47;
  target.set(simple?0:cx,simple?(activeId==='dog'?(step===0?.30:-.39):(step===0?0:.39)):cy,closeUp ? .17 : .06);
  if(framing)target.set(framing.x,framing.y+.12,.07);
  camera.position.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(4).add(target);
  camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  if(framing&&zoom===1)keepFoldHandleClear(height);
}
function keepFoldHandleClear(height) {
  const topSpace=h<350 ? 54 : 62, bottomSpace=54;
  const range=h-topSpace-bottomSpace;
  if(range<90)return;
  const ys=Array.from({length:13},(_,index)=>{
    paper.corner(step,index/12,tmp).project(camera);
    return (1-tmp.y)*h/2;
  });
  const min=Math.min(...ys), max=Math.max(...ys);
  const scale=Math.max(1,(max-min)/range);
  const center=h/2;
  const shift=Math.max(topSpace-(center+(min-center)/scale),
    Math.min(0,h-bottomSpace-(center+(max-center)/scale)));
  const worldShift=shift*height*scale/h;
  camera.top=camera.top*scale+worldShift;
  camera.bottom=camera.bottom*scale+worldShift;
  camera.left*=scale;
  camera.right*=scale;
  camera.updateProjectionMatrix();
}
function projectCorner(p) {
  paper.corner(step,p,tmp,paperView==='spread').project(camera);
  return {x:(tmp.x+1)*w/2,y:(1-tmp.y)*h/2};
}
function draw() {
  if(!activeId)return;
  cameraSetup();
  const spread=paperView==='spread';
  const cutaway=paperView==='cutaway';
  const key=[activeId,step,progress,paperView].join('/');
  if(key!==geometryKey){
    paper.update(step,progress,paperView==='xray',spread,cutaway);
    if(renderer.shadowMap)renderer.shadowMap.needsUpdate=true;
    geometryKey=key;
  }
  drawShadow($('shadow'),scene,camera,w,h);
  const p=projectCorner(progress);
  handle.style.transform='translate('+(p.x-24)+'px,'+(p.y-24)+'px)';
  const label=$('mouth-label');
  label.hidden=paperView==='solid'||!isTuck();
  if(!label.hidden){
    label.classList.toggle('left-tuck',step===5);
    mouthPoint(step,progress,tmp,spread).project(camera);
    label.style.left=((tmp.x+1)*w/2)+'px';
    label.style.top=((1-tmp.y)*h/2)+'px';
  }
  const endLabel=$('tip-stop');
  endLabel.hidden=!cutaway||progress<tuckMotion.insertEnd;
  if(!endLabel.hidden){
    endLabel.style.left=p.x+'px';
    endLabel.style.top=p.y+'px';
    endLabel.classList.toggle('label-right',step===5);
  }
  for(const [id,front] of [['front-wall',true],['back-wall',false]]){
    const wall=$(id);
    wall.hidden=!isTuck()||cameraMode!=='side'||paperView==='solid';
    if(wall.hidden)continue;
    pocketWallPoint(step,progress,front,tmp,spread,cutaway).project(camera);
    wall.style.left=((tmp.x+1)*w/2)+'px';
    wall.style.top=((1-tmp.y)*h/2)+'px';
    wall.classList.toggle('label-right',front===(step===3));
  }
  renderer.render(scene,camera);
  if (isTuck()) {
    const {openEnd, insertEnd} = tuckMotion;
    const preview = clamp((progress / openEnd - .45) / .55);
    drawFoldGuide($('fold-guide'), w, h, Math.max(progress, openEnd),
      projectCorner, insertEnd, preview * preview * (3 - 2 * preview));
  } else {
    drawFoldGuide($('fold-guide'), w, h, progress, projectCorner);
  }
  dirty=false;
}
new ResizeObserver(()=>{
  w=stage.clientWidth;h=stage.clientHeight;renderer.setSize(w,h,false);dirty=true;
}).observe(stage);

// Pick the closest point on the projected 3D trajectory. A slight continuity
// preference resolves ties when two segments overlap in an oblique view.
handle.onpointerdown=e=>{
  if(drag||e.button!==0)return;
  e.preventDefault();transition=null;playing=false;updateUI();cameraSetup();
  const path=Array.from({length:101},(_,i)=>projectCorner(i/100));
  const start=projectCorner(progress);
  drag={kind:'fold',id:e.pointerId,path,start,px:e.clientX,py:e.clientY,initial:progress};
  handle.setPointerCapture(e.pointerId);
};
handle.onpointermove=e=>{
  if(drag?.kind!=='fold'||drag.id!==e.pointerId)return;
  const {path,start,px,py,initial}=drag;
  const dx=e.clientX-px,dy=e.clientY-py;
  const tx=start.x+dx,ty=start.y+dy;
  const span=Math.hypot(path[100].x-path[0].x,path[100].y-path[0].y);
  if(span<22){setProgress(initial+dx/Math.max(w*.48,90));return;}
  let best=Infinity,chosen=progress;
  for(let i=0;i<100;i++){
    const a=path[i],b=path[i+1],vx=b.x-a.x,vy=b.y-a.y;
    const u=clamp(((tx-a.x)*vx+(ty-a.y)*vy)/(vx*vx+vy*vy||1));
    const p=(i+u)/100;
    const cost=(tx-a.x-vx*u)**2+(ty-a.y-vy*u)**2+3*(p-progress)**2;
    if(cost<best){best=cost;chosen=p;}
  }
  setProgress(chosen<.004?0:chosen>.996?1:chosen);
};
canvas.onpointerdown=e=>{
  if(drag||e.button!==0)return;
  e.preventDefault();playing=false;updateUI();
  transition=null;drag={kind:'orbit',id:e.pointerId,px:e.clientX,py:e.clientY,yaw,pitch};
  canvas.setPointerCapture(e.pointerId);
};
canvas.onpointermove=e=>{
  if(drag?.kind!=='orbit'||drag.id!==e.pointerId)return;
  yaw=drag.yaw-(e.clientX-drag.px)*.011;pitch=clamp(drag.pitch+(e.clientY-drag.py)*.009,-1.4,1.4);
  cameraMode='custom';dirty=true;updateUI();
};
function release(e){if(drag?.id===e.pointerId)drag=null;}
for(const el of [handle,canvas])for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,release);
const touches=new Map();
const distance=()=>{const [a,b]=[...touches.values()];return Math.max(1,Math.hypot(a.x-b.x,a.y-b.y));};
stage.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch'||e.target.closest('.viewbar,.look,.zoom'))return;
  touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(touches.size===2){
    playing=false;transition=null;drag={kind:'pinch',span:distance(),start:zoom};
    for(const id of touches.keys())stage.setPointerCapture(id);
    e.stopPropagation();e.preventDefault();updateUI();
  }
},true);
stage.addEventListener('pointermove',e=>{
  if(!touches.has(e.pointerId))return;
  touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(drag?.kind==='pinch'&&touches.size>=2){
    setZoom(drag.start*distance()/drag.span);e.preventDefault();e.stopPropagation();
  }
},true);
for(const ev of ['pointerup','pointercancel'])stage.addEventListener(ev,e=>{
  touches.delete(e.pointerId);if(drag?.kind==='pinch'&&touches.size<2)drag=null;
},true);
const foldedSeconds=()=>isTuck()?4.6:2.5;
function frame(now) {
  const dt=Math.min((now-lastFrame)/1000,.08);lastFrame=now;
  if(transition){
    const t=clamp((now-transition.start)/310),u=t*t*(3-2*t);
    yaw=transition.fromYaw+transition.delta*u;pitch=transition.fromPitch+(transition.toPitch-transition.fromPitch)*u;
    if(t>=1)transition=null;dirty=true;
  }
  if(playing){
    const clip=replay===null ? null : pocketClips[replay];
    const end=clip?.end ?? 1;
    if(progress<end){
      if(!transition){
        if(progress===0&&previewRemaining>0)previewRemaining=Math.max(0,previewRemaining-dt);
        else if(pocketHold>0)pocketHold=Math.max(0,pocketHold-dt);
        else{
          const speed=clip ? (clip.end-clip.start)/clip.duration : 1/foldedSeconds();
          const next=Math.min(end,progress+dt*speed);
          if(isTuck()&&progress<tuckMotion.crossing&&next>=tuckMotion.crossing){
            progress=tuckMotion.crossing;
            pocketHold=1;
          }else progress=next;
          dirty=true;updateUI();saveProgress();
        }
      }
    }
    else if(clip){playing=false;updateUI();}
    else if((dwell+=dt)>.85){
      if(step===lessons.length-1){playing=false;updateUI();saveProgress(true);}
      else select(step+1,0,true);
    }
  }
  if(dirty&&w>1)draw();
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){playing=false;saveProgress(true);updateUI();}
});
localize();
showRoute();
requestAnimationFrame(frame);
