import * as T from './vendor/three.module.min.js';
import {paperTexture} from './paper.js';

const EPSILON = 1e-8;
const PAPER_UV_SCALE = .52;
const blend = (a, b, amount) => a + (b - a) * amount;
const distance = (point, fold) => point.x * fold.nx + point.y * fold.ny - fold.offset;

function polygonArea(points) {
  return points.reduce((sum, a, index) => {
    const b = points[(index + 1) % points.length];
    return sum + a.u * b.v - a.v * b.u;
  }, 0) / 2;
}

function split(points, fold) {
  const stationary = [], moving = [];
  for (let index = 0; index < points.length; index++) {
    const point = points[index], next = points[(index + 1) % points.length];
    const a = distance(point, fold), b = distance(next, fold);
    if (a <= EPSILON) stationary.push(point);
    if (a >= -EPSILON) moving.push(point);
    if (a * b < 0 && Math.abs(a) > EPSILON && Math.abs(b) > EPSILON) {
      const amount = a / (a - b);
      const intersection = Object.fromEntries(['x', 'y', 'z', 'u', 'v']
        .map(key => [key, blend(point[key], next[key], amount)]));
      stationary.push(intersection);
      moving.push(intersection);
    }
  }
  return [stationary, moving];
}

function transform(point, fold, progress, separation = 0) {
  const amount = Math.max(0, distance(point, fold));
  const radians = fold.radians * progress;
  const travel = amount * (Math.cos(radians) - 1);
  return {
    ...point,
    x: point.x + fold.nx * travel,
    y: point.y + fold.ny * travel,
    z: point.z + fold.direction * amount * Math.sin(radians)
      + progress * (separation - point.z) * Math.min(1, amount * 28)
  };
}

function within(point, polygon, tolerance = .002){
  let positive=false,negative=false;
  for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length];
    const cross=(b.x-a.x)*(point.y-a.y)-(b.y-a.y)*(point.x-a.x);
    positive ||= cross>tolerance;
    negative ||= cross<-tolerance;
  }
  return !(positive&&negative);
}

export function compileCourse(spec) {
  // Keep each patch's material coordinates through clipping and reflection.
  // Every prepared step can be visited independently.
  let sheet = [{
    points: spec.sheet.map(([x,y])=>({x,y,z:0,u:x,v:y})),
    layer:0
  }];
  return spec.folds.map((fold,index)=>{
    const pieces = [];
    const contact = [];
    const nextLayers = sheet.map(piece=>piece.layer);
    const layerEdge = fold.direction===1 ? Math.max(...nextLayers) : Math.min(...nextLayers);
    const role = piece => {
      if(!fold.layer)return true;
      const center=piece.points.reduce((sum,point)=>sum+point[fold.layer.axis],0)/piece.points.length;
      return fold.layer.sign*center>EPSILON;
    };
    for(const piece of sheet){
      if(!role(piece)){
        pieces.push({...piece,active:false});
        continue;
      }
      const [fixed,moved]=split(piece.points,fold);
      if(fixed.length>=3&&Math.abs(polygonArea(fixed))>EPSILON)pieces.push({...piece,points:fixed,active:false});
      if(moved.length>=3&&Math.abs(polygonArea(moved))>EPSILON){
        const layer=2*layerEdge+fold.direction-piece.layer;
        pieces.push({points:moved,active:true,layer});
        contact.push(...moved.filter(point=>Math.abs(distance(point,fold))<EPSILON));
      }
    }
    const moving=pieces.filter(piece=>piece.active);
    if(!moving.length||contact.length<2)throw Error('Fold '+(index+1)+' cannot make its crease');
    const candidates=moving.flatMap(piece=>piece.points);
    const requested=fold.point&&{x:fold.point[0],y:fold.point[1]};
    const selected=requested&&distance(requested,fold)>EPSILON&&
      moving.some(piece=>within(requested,piece.points)) ? requested :
      candidates.reduce((farthest,point)=>distance(point,fold)>distance(farthest,fold)?point:farthest);
    const anchor={x:selected.x,y:selected.y,z:Math.max(...moving.filter(piece=>within(selected,piece.points))
      .flatMap(piece=>piece.points).map(point=>point.z))};
    const order=point=>fold.ny*point.x-fold.nx*point.y;
    contact.sort((a,b)=>order(a)-order(b));
    const crease=[contact[0],contact.at(-1)];
    const pose=(piece,point,progress)=>{
      if(!piece.active)return point;
      // Thin height offsets give stacked sheets a readable order at full fold.
      const separation=piece.layer*.0028;
      if(!progress)return point;
      return transform(point,fold,progress,separation);
    };
    sheet=pieces.map(piece=>({layer:piece.layer,
      points:piece.points.map(point=>pose(piece,point,1))}));
    return {pieces,crease,anchor,fold,pose,finished:sheet};
  });
}

function geometry(piece) {
  const {points} = piece;
  const uv=[], indices=[];
  for(const point of points)uv.push(point.u*PAPER_UV_SCALE+.5,point.v*PAPER_UV_SCALE+.5);
  for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);
  const mesh = new T.BufferGeometry();
  mesh.setIndex(indices);
  mesh.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  mesh.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(points.length*3),3));
  mesh.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(points.length*3).fill(1),3));
  return mesh;
}

let maps;
export function createStudioModel(scene,spec) {
  const frames=compileCourse(spec);
  maps ??= [paperTexture(true),paperTexture(false)];
  const materials=[T.FrontSide,T.BackSide].map((side,i)=>new T.MeshStandardMaterial({
    side,map:maps[i],color:i?0xf6e5c0:spec.color,roughness:.93,shadowSide:T.DoubleSide,vertexColors:true
  }));
  const layouts=frames.map(frame=>frame.pieces.map(piece=>{
    const geo=geometry(piece);
    const meshes=materials.map((material,i)=>{
      const mesh=new T.Mesh(geo,material);
      mesh.frustumCulled=false;
      mesh.receiveShadow=true;
      mesh.castShadow=i===0;
      mesh.visible=false;
      scene.add(mesh);
      return mesh;
    });
    return {piece,geo,meshes};
  }));
  const guideGeo=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]);
  const guide=new T.Line(guideGeo,new T.LineDashedMaterial({color:0x8b4829,dashSize:.035,gapSize:.022}));
  guide.frustumCulled=false;
  scene.add(guide);
  let layoutIndex=-1;
  function update(step,progress) {
    const frame=frames[step];
    if(layoutIndex!==step){
      if(layoutIndex>=0)for(const item of layouts[layoutIndex])item.meshes.forEach(mesh=>mesh.visible=false);
      layoutIndex=step;
      for(const item of layouts[step])item.meshes.forEach(mesh=>mesh.visible=true);
    }
    for(const {piece,geo} of layouts[step]){
      const positions=geo.attributes.position;
      piece.points.forEach((point,i)=>{
        const placed=frame.pose(piece,point,progress);
        positions.setXYZ(i,placed.x,placed.y,placed.z);
      });
      positions.needsUpdate=true;
      geo.computeVertexNormals();
    }
    const attr=guideGeo.attributes.position;
    frame.crease.forEach((p,i)=>attr.setXYZ(i,p.x,p.y,Math.max(p.z,0)+.022));
    attr.needsUpdate=true;
    guide.visible=progress<.94;
    guide.computeLineDistances();
  }
  function corner(step,progress,out){
    const {anchor,fold}=frames[step];
    const point=transform(anchor,fold,progress);
    return out.set(point.x,point.y,point.z);
  }
  function framing(step){
    const {pieces,finished}=frames[step];
    const points=[...pieces,...finished].flatMap(piece=>piece.points);
    const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
    return {x:(Math.max(...xs)+Math.min(...xs))/2,y:(Math.max(...ys)+Math.min(...ys))/2,
      width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
  }
  return {update,corner,framing,angles:spec.folds.map(fold=>fold.direction<0?
    ['back',2.61,.30]:['angle',fold.nx>0?-.49:.49,.30])};
}
