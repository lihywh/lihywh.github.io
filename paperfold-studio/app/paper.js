// Material coordinates cover both halves of one diamond. Each wing is split at
// its second crease so the same vertices can be followed through the tuck.
import * as T from './vendor/three.module.min.js';

const pi = Math.PI;
const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => { const u = clamp(n); return u * u * (3 - 2 * u); };
const M = [0, 0], P = [-.5, .5], Q = [.5, .5], C = [0, 1];
const A = [-1, 0], B = [1, 0], L = [-.5, 0], R = [.5, 0];
const panels = [
  ['base', [M, Q, P]], ['crown', [P, Q, C]],
  ['rightRoot', [M, R, Q]], ['rightTip', [R, B, Q]],
  ['leftRoot', [M, P, L]], ['leftTip', [L, P, A]]
];
export const tuckMotion = {openEnd: .20, insertEnd: .79, crossing: .50};

const steps = [
  [true, 'crown', C], [true,'crown',C],
  [false,'rightTip', B], [false,'rightTip', B],
  [false,'leftTip', A], [false,'leftTip', A]
];

export function pose(step, progress, spread=false) {
  const f = i => i < step ? 1 : i === step ? progress : 0;
  const tucks = [f(3), f(5)];
  const open = Math.max(...tucks.map(t => .50 * Math.sin(pi * t) + .038 * t));
  return {fold:f(0), mouth:f(1), right:f(2), left:f(4), tucks, open:open+(spread?.40:0)};
}

function point(out, x0, y0, front, panel, s) {
  let x = x0, y = y0;
  // A small layer spacing avoids coplanar flicker; it vanishes at the hinge.
  let z = front ? .008 * y * s.fold : 0;
  if (front && panel === 'crown') {
    const h = y - .5, a = (pi - .018) * s.mouth;
    y = .5 + h * Math.cos(a);
    z += h * Math.sin(a);
  }
  const right = panel.startsWith('right'), left = panel.startsWith('left');
  if (right || left) {
    const side = right ? 1 : -1;
    const a = -side * (pi - .034) * (right ? s.right : s.left);
    const ax = side * Math.SQRT1_2, ay = Math.SQRT1_2;
    const along = ax * x + ay * y, away = ax * y - ay * x;
    const perp = away * Math.cos(a) - z * Math.sin(a);
    z = away * Math.sin(a) + z * Math.cos(a);
    x = ax * along - ay * perp;
    y = ay * along + ax * perp;
    // The folded stack rides over the already folded front flap. Let the
    // offset vanish at its crease so the wing stays attached to the base.
    const settle = smooth(((right ? s.right : s.left) - .88) / .12);
    z += .025 * settle * smooth((y - Math.abs(x)) / .045);
  }
  const t = right ? s.tucks[0] : s.tucks[1];
  const tip = (right || left) && panel.endsWith('Tip');
  const turn = smooth((t - tuckMotion.openEnd) / (tuckMotion.insertEnd - tuckMotion.openEnd));
  let depthRatio = 0, tipFraction = 0;
  if (tip && turn > 0) {
    const h = Math.max(0, y - .5);
    tipFraction = clamp(h / Math.max(.001, .5 - Math.abs(x)));
    const angle = pi * turn;
    // The tip curls over the mouth. At 90 degrees it crosses the opening
    // between its front and back walls. The final small inset keeps the
    // tip just inside the pocket instead of protruding at the bottom seam.
    y = .5 + h * (Math.cos(angle) + .045 * turn + .18 * (1-tipFraction) * Math.sin(angle));
    const flatten = smooth((turn - .5) * 2);
    const inside = 1 - Math.exp(-12 * tipFraction);
    depthRatio = smooth(turn * 2) * ((1-flatten)*tipFraction + flatten*inside);
    z = z*(1-depthRatio) + Math.min(z,.0015*y)*depthRatio;
  }
  if (front || right || left) {
    const room = 2 * Math.max(0, Math.min(.5, y) - Math.abs(x));
    z += s.open * room * (1 - .79 * depthRatio);
    if (depthRatio) z += (front ? .0004 : .0008) * tipFraction * turn * y;
  }
  if (front && s.fold < 1) {
    const a = pi * (1 - s.fold), c = Math.cos(a), sn = Math.sin(a);
    const lifted = y * sn + z * c;
    y = y * c - z * sn;
    z = lifted;
  }
  return out.set(x, y, z);
}

const temp = new T.Vector3();
export function mouthPoint(step,progress,out=new T.Vector3(),spread=false) {
  return point(out,step===5 ? .2 : -.2,.5,true,'crown',pose(step,progress,spread));
}
export function pocketWallPoint(step,progress,front,out=new T.Vector3(),spread=false,cutaway=false) {
  const y=front&&cutaway ? .473 : .406;
  return point(out,0,y,front,'base',pose(step,progress,spread));
}
export function corner(step, progress, out = new T.Vector3(), spread=false) {
  const [front, panel, uv] = steps[step];
  return point(out, ...uv, front, panel, pose(step, progress,spread));
}

export function paperTexture(dotted) {
  const canvas = document.createElement('canvas');
  const size=512;
  canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';
  ctx.fillRect(0,0,size,size);
  let seed=4817;
  const rand=()=> (seed=seed*16807%2147483647)/2147483647;
  // Sparse long inclusions sit over a finer pulp grain. Both are printed
  // into the paper UVs, so the surface detail moves with the folds.
  for(let i=0;i<12500;i++){
    const x=rand()*size,y=rand()*size;
    ctx.fillStyle='rgba(74,59,39,'+(.018+.105*rand())+')';
    ctx.fillRect(x,y,.6+2.0*rand(),.5+1.4*rand());
  }
  for(let i=0;i<580;i++){
    ctx.save();
    ctx.translate(rand()*size,rand()*size);
    ctx.rotate((rand()-.5)*Math.PI);
    ctx.fillStyle='rgba(103,79,48,'+(.028+.084*rand())+')';
    ctx.fillRect(0,0,2+7*rand(),.45+1.0*rand());
    ctx.restore();
  }
  // The larger marks remain subtle so the paper and its shadows read first.
  for(let y=32;y<size;y+=64)for(let x=32;x<size;x+=64){
    ctx.fillStyle=dotted?'#263b3330':'#46352129';
    if(dotted){
      ctx.beginPath();
      ctx.arc(x,y,6.3,0,Math.PI*2);
      ctx.fill();
    }else{
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(-Math.PI/4);
      ctx.fillRect(-9,-2,18,4);
      ctx.restore();
    }
  }
  const tex = new T.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.colorSpace = T.SRGBColorSpace;
  return tex;
}

// The window sits in the flat silhouette of the pocket. It leaves a strip
// below the lip and follows the narrowing walls toward the lower seam.
const cutWindow = [
  [-.275,.446],[-.300,.414],[-.011,.012],
  [.011,.012],[.300,.414],[.275,.446]
];

// Clip in material coordinates before bending the patches. The same paper
// vertices and depth ordering drive both the intact and cutaway views.
function splitAtEdge(polygon, distance) {
  const inside = [], outside = [];
  let previous = polygon.at(-1);
  let prior = distance(previous);
  for (const current of polygon) {
    const next = distance(current);
    if ((prior >= 0) !== (next >= 0)) {
      const t = prior / (prior-next);
      const mid = previous.map((value,i)=>value+t*(current[i]-value));
      inside.push(mid);
      outside.push(mid);
    }
    (next >= 0 ? inside : outside).push(current);
    previous = current;
    prior = next;
  }
  return [inside,outside];
}

function sectionCoordinates(panel,x,y) {
  if(panel==='crown') return [x,1-y];
  if(panel==='base') return [x,y];
  // Right and left cover flaps reflect across their completed fold creases.
  return panel==='rightRoot' ? [y,x] : [-y,-x];
}

function subtractWindow(points,panel) {
  let remainder = points;
  const pieces = [];
  for(let i=0;i<cutWindow.length&&remainder.length>=3;i++){
    const [x0,y0]=cutWindow[i], [x1,y1]=cutWindow[(i+1)%cutWindow.length];
    const [inside,outside]=splitAtEdge(remainder,([x,y])=>{
      const [u,v]=sectionCoordinates(panel,x,y);
      return (x1-x0)*(v-y0)-(y1-y0)*(u-x0);
    });
    if(outside.length>=3)pieces.push(outside);
    remainder=inside;
  }
  return pieces;
}

function cutGeometry(coords,indices,panel,front) {
  const clippedCoords=[], clippedIndices=[];
  for(let i=0;i<indices.length;i+=3){
    const face=indices.slice(i,i+3).map(j=>coords.slice(j*2,j*2+2));
    for(const polygon of subtractWindow(face,panel)){
      const first=clippedCoords.length/2;
      clippedCoords.push(...polygon.flat());
      for(let j=1;j<polygon.length-1;j++)clippedIndices.push(first,first+j,first+j+1);
    }
  }
  return makeGeometry(clippedCoords,clippedIndices,front);
}

function makeGeometry(coords,indices,front) {
  const uv=[];
  for(let i=0;i<coords.length;i+=2)uv.push(coords[i]+.5,(front ? -coords[i+1] : coords[i+1])+.5);
  const geo=new T.BufferGeometry();
  geo.setIndex(indices);
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  const components=coords.length/2*3;
  geo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(components),3));
  geo.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(components).fill(1),3));
  return {geo,coords};
}

function subdivide(points, front, panel) {
  const n = 16, coords = [], indices = [], offsets = [];
  // Split the central wall on its ridge. A triangle across the ridge would
  // interpolate straight across the opening and cut off the pocket tip.
  const center=[0,.5];
  const parts=panel==='base'?[[M,Q,center],[M,center,P]]:
    panel==='crown'?[[P,center,C],[center,Q,C]]:[points];
  for(const [a,b,c] of parts){
  for (let i = 0; i <= n; i++) {
    offsets[i] = coords.length / 2;
    for (let j = 0; j <= n-i; j++) {
      const x = a[0]+(b[0]-a[0])*i/n+(c[0]-a[0])*j/n;
      const y = a[1]+(b[1]-a[1])*i/n+(c[1]-a[1])*j/n;
      coords.push(x,y);
    }
  }
  const tri = (a,b,c) => indices.push(a,front ? c:b,front ? b:c);
  for (let i = 0; i < n; i++) for (let j = 0; j < n-i; j++) {
    const k = offsets[i]+j, l = offsets[i+1]+j;
    tri(k,l,k+1);
    if (j<n-i-1) tri(l,l+1,k+1);
  }
  }
  const patch=makeGeometry(coords,indices,front);
  const hasWindow=(front&&(panel==='crown'||panel==='base'))||panel.endsWith('Root');
  return {...patch, cut:hasWindow ? cutGeometry(coords,indices,panel,front) : null};
}

export function createPaper(scene) {
  const frontTexture = paperTexture(true), backTexture = paperTexture(false);
  const patches = [],edges=[];
  const mat=(color,side)=>new T.MeshStandardMaterial({
    color,map:side===T.FrontSide?frontTexture:backTexture,side,roughness:.95,
    metalness:0,vertexColors:true,shadowSide:T.DoubleSide
  });
  for (const front of [false,true]) for (const [panel,points] of panels) {
    const {geo,coords,cut} = subdivide(points,front,panel);
    const mats = [mat(0x81ad91,T.FrontSide),mat(0xf3dfad,T.BackSide)];
    const meshes = mats.map(m => {
      const o=new T.Mesh(geo,m);
      o.frustumCulled=false;
      o.receiveShadow=true;
      scene.add(o);
      return o;
    });
    patches.push({geo,coords,cut,panel,front,mats,meshes});
    for(let k=0;k<3;k++){
      const a=points[k],b=points[(k+1)%3],x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;
      const perimeter=Math.abs(Math.abs(x)+y-1)<.001;
      const seam=y===0, lip=y===.5 && panel==='crown' && front;
      const hinge=Math.abs(Math.abs(x)-y)<.001 && panel.endsWith('Root');
      if(!(perimeter||seam||lip||hinge))continue;
      const g=new T.BufferGeometry().setFromPoints(Array.from({length:25},()=>new T.Vector3()));
      const edge=new T.Line(g,new T.LineBasicMaterial({color:0x496b5a,transparent:true,opacity:.52,depthWrite:false}));
      edge.frustumCulled=false;scene.add(edge);edges.push({a,b,edge,front,panel,perimeter,seam,lip,hinge});
    }
  }
  // The mouth guide is on the front lip. During the tuck it shows exactly
  // where the tip passes from the outside of the model into the pocket.
  const lineGeo = new T.BufferGeometry().setFromPoints(Array.from({length:49},() => new T.Vector3()));
  const line = new T.Line(lineGeo,new T.LineDashedMaterial({color:0x92512c,dashSize:.035,gapSize:.022}));
  line.frustumCulled = false; scene.add(line);
  const rimSamples=14;
  const rimGeometry=new T.BufferGeometry().setFromPoints(
    Array.from({length:cutWindow.length*rimSamples+1},()=>new T.Vector3())
  );
  const rim=new T.Line(rimGeometry,new T.LineBasicMaterial({color:0x235966}));
  rim.frustumCulled=false;
  rim.visible=false;
  scene.add(rim);

  function update(step, progress, xray, spread=false, cutaway=false) {
    const s = pose(step, progress, spread);
    const isTuck = step === 3 || step === 5;
    const active = step === 5 ? 'leftTip' : 'rightTip';
    const section=cutaway&&isTuck;
    for (const patch of patches) {
      const {panel,front,mats,meshes}=patch;
      const foldedCover=panel==='rightRoot'&&s.right===1||panel==='leftRoot'&&s.left===1;
      const wall=front&&(panel==='base'||panel==='crown');
      const sectionPatch=section&&(foldedCover||wall) ? patch.cut : patch;
      const {geo,coords}=sectionPatch;
      const attr=geo.attributes.position;
      const light=geo.attributes.color;
      for (let i=0;i<coords.length;i+=2) {
        point(temp, coords[i],coords[i+1],front,panel,s);
        attr.setXYZ(i/2,temp.x,temp.y,temp.z);
        let shade=1;
        if(s.mouth===1&&(panel==='base'||panel==='crown')){
          // The contact shading follows the walls from a closed pocket to
          // an open one. Leave the exposed rear crown fully lit.
          const depth=.5-temp.y;
          if(depth>=0){
            const gap=2*s.open*Math.max(0,temp.y-Math.abs(temp.x));
            const lipFalloff=Math.exp(-depth*11);
            const shadow=front ? .08*lipFalloff :
              (section?.18:.27)*Math.exp(-gap*4)*(.45+.55*lipFalloff);
            shade-=shadow;
          }
        }
        light.setXYZ(i/2,shade,shade,shade);
      }
      attr.needsUpdate=true; light.needsUpdate=true; geo.computeVertexNormals();
      const inspect = (xray||spread||section) && isTuck, target = panel === active;
      const coveringWing = panel === (step === 5 ? 'leftRoot' : 'rightRoot');
      const ghost = xray && isTuck && (wall || coveringWing);
      mats.forEach((m,k) => {
        const color = inspect && target ? (k ? 0xe9964d : 0xd7783c) :
          inspect && wall ? (k ? 0x86b9bd : 0x91c6c5) :
          inspect && !front && (panel==='base'||panel==='crown') ? 0x62937c :
          (k ? 0xf4dfae : 0x85b39a);
        m.color.setHex(color);
        if (m.transparent !== ghost) {m.transparent = ghost; m.needsUpdate = true;}
        m.opacity = ghost ? .32 : 1; m.depthWrite = !ghost;
        meshes[k].geometry = geo;
        meshes[k].castShadow=!ghost&&k===0;
        meshes[k].renderOrder = ghost ? 2 : 0;
      });
    }
    for(const {a,b,edge,front,panel,perimeter,seam,lip,hinge} of edges) {
      edge.visible=perimeter || seam && s.fold>.03 || lip && s.mouth>.02 ||
        hinge && (panel==='rightRoot'?s.right:s.left)>.03;
      if(!edge.visible)continue;
      const positions=edge.geometry.attributes.position;
      for(let i=0;i<positions.count;i++){
        const u=i/(positions.count-1);
        point(temp,a[0]+u*(b[0]-a[0]),a[1]+u*(b[1]-a[1]),front,panel,s);
        positions.setXYZ(i,temp.x,temp.y,temp.z+.00065);
      }
      positions.needsUpdate=true;
      edge.material.opacity=xray?.30:.53;
    }
    rim.visible=section;
    if(section){
      const positions=rimGeometry.attributes.position;
      for(let i=0;i<positions.count;i++){
        const edge=Math.floor(i/rimSamples)%cutWindow.length, t=(i%rimSamples)/rimSamples;
        const [a,b]=[cutWindow[edge],cutWindow[(edge+1)%cutWindow.length]];
        point(temp,a[0]+t*(b[0]-a[0]),1-a[1]-t*(b[1]-a[1]),true,'crown',s);
        positions.setXYZ(i,temp.x,temp.y,temp.z+.002);
      }
      positions.needsUpdate=true;
    }
    const ends = [
      [A,B,false,'base'],[P,Q,true,'crown'],[M,Q,false,'rightRoot'],
      [P,Q,true,'crown'],[M,P,false,'leftRoot'],[P,Q,true,'crown']
    ][step];
    for (let i=0;i<49;i++) {
      const u=i/48,[a,b,front,panel]=ends;
      point(temp,a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,front,panel,s);
      lineGeo.attributes.position.setXYZ(i,temp.x,temp.y,temp.z+.007);
    }
    lineGeo.attributes.position.needsUpdate=true; line.computeLineDistances();
  }
  return {update};
}
