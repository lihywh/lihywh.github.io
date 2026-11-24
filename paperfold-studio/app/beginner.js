import * as T from './vendor/three.module.min.js';
import {paperTexture} from './paper.js';

const left = [-1, 0], right = [1, 0];
const dogTop = [0, -1], cupTop = [0, 1];
const cupLip = 2 - Math.SQRT2;
const cupLeftEnd = [1 - cupLip, cupLip];
const cupRightEnd = [-cupLeftEnd[0], cupLip];

function hinge(from, to, layer = 'both', direction = 1) {
  const dx = from[0] - to[0], dy = from[1] - to[1];
  const length = Math.hypot(dx, dy);
  return {from, layer, direction, x: (from[0] + to[0]) / 2,
    y: (from[1] + to[1]) / 2, nx: dx / length, ny: dy / length};
}

const models = {
  dog: {
    apex: dogTop, color: 0xcea173,
    angles: [
      [2, -.48, .32], [2, -.38, .28], [2, .38, .28], [2, -.58, .34]
    ],
    folds: [
      hinge(left, [-.17, -.45]), hinge(right, [.17, -.45]), hinge(dogTop, [0, -.46])
    ]
  },
  cup: {
    apex: cupTop, color: 0x84b2ca,
    angles: [
      [2, -.48, .32], [2, .46, .30], [2, -.46, .30], [2, .47, .30], [3, 2.67, .23]
    ],
    folds: [
      hinge(left, cupLeftEnd), hinge(right, cupRightEnd),
      hinge(cupTop, [0, 2 * cupLip - 1], 'upper'),
      hinge(cupTop, [0, 2 * cupLip - 1], 'lower', -1)
    ]
  }
};

function distance([x, y], fold) {
  return (x - fold.x) * fold.nx + (y - fold.y) * fold.ny;
}

function split(points, fold) {
  let last = points.at(-1), previous = distance(last, fold);
  const moving = [], fixed = [];
  for (const point of points) {
    const side = distance(point, fold);
    if (side * previous < -1e-12) {
      const ratio = previous / (previous - side);
      const mid = last.map((value, i) => value + ratio * (point[i] - value));
      moving.push(mid);
      fixed.push(mid);
    }
    if (side >= -1e-8) moving.push(point);
    if (side <= 1e-8) fixed.push(point);
    last = point;
    previous = side;
  }
  return [moving, fixed];
}

function panels(model) {
  const triangle = model.apex[1] > 0 ? [left, right, model.apex] : [right, left, model.apex];
  let pieces = ['upper', 'lower'].map(layer => ({points:triangle, layer, move:-1}));
  for (const [move, fold] of model.folds.entries()) {
    pieces = pieces.flatMap(part => {
      if (part.move >= 0 || (fold.layer !== 'both' && fold.layer !== part.layer)) return [part];
      const [moving, fixed] = split(part.points, fold);
      return [{...part, points:moving, move}, {...part, points:fixed}].filter(p => p.points.length > 2);
    });
  }
  return pieces;
}

function panelGeometry(points, layer) {
  const ids = [], uv = [];
  points.forEach(([x, y]) => uv.push(x + .5, (layer === 'upper' ? -y : y) + .5));
  for(let i=1;i<points.length-1;i++) {
    if(layer === 'upper') ids.push(0, i+1, i);
    else ids.push(0, i, i+1);
  }
  const geo = new T.BufferGeometry();
  geo.setIndex(ids);
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(points.length*3),3));
  geo.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(points.length*3).fill(1),3));
  return geo;
}

function vertex(model, uv, layer, move, step, progress, out) {
  let [x, y] = uv;
  const upper = layer === 'upper';
  // The two material triangles meet at the first fold line, y = 0.
  let z = upper ? .010 * Math.abs(y) : 0;
  if (step === 0 && upper) {
    const angle = Math.PI * (1 - progress);
    return out.set(x, y * Math.cos(angle), Math.abs(y) * Math.sin(angle) + z * progress);
  }
  if (move >= 0) {
    const fold = model.folds[move], i = move + 1;
    const amount = step > i ? 1 : step === i ? progress : 0;
    const offset = distance(uv, fold);
    const angle = (Math.PI - .020) * amount;
    const delta = offset * (Math.cos(angle) - 1);
    x += fold.nx * delta;
    y += fold.ny * delta;
    z += fold.direction * offset * (Math.sin(angle) + (.013 + move*.025) * amount);
  }
  return out.set(x, y, z);
}

export function createBeginnerModel(scene, id) {
  const model = models[id];
  const maps = [paperTexture(true), paperTexture(false)];
  const patches = panels(model).map(part => {
    const geo = panelGeometry(part.points, part.layer);
    for (const [i, side] of [T.FrontSide,T.BackSide].entries()) {
      const mat = new T.MeshStandardMaterial({color:i ? 0xf7e5bf : model.color, map:maps[i],
        side, roughness:.96, shadowSide:T.DoubleSide, vertexColors:true});
      const mesh = new T.Mesh(geo,mat);
      mesh.frustumCulled=false;
      mesh.castShadow=i===0;
      mesh.receiveShadow=true;
      scene.add(mesh);
    }
    return {...part,geo};
  });
  const guide = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),
    new T.LineDashedMaterial({color:0x92512c,dashSize:.045,gapSize:.025}));
  guide.frustumCulled=false;
  scene.add(guide);
  const v = new T.Vector3();

  function update(step, progress) {
    for (const {points, layer, move, geo} of patches) {
      const attr=geo.attributes.position;
      for(const [i,uv] of points.entries()) {
        vertex(model,uv,layer,move,step,progress,v);
        attr.setXYZ(i,v.x,v.y,v.z);
      }
      attr.needsUpdate=true;
      geo.computeVertexNormals();
    }
    const fold=model.folds[step-1];
    const attr=guide.geometry.attributes.position;
    if(fold) {
      const area=model.apex[1]>0?[left,right,model.apex]:[right,left,model.apex];
      const line=split(area,fold)[0].filter(p=>Math.abs(distance(p,fold))<1e-7);
      if(line.length>=2){
        attr.setXYZ(0,...line[0],.016);
        attr.setXYZ(1,...line[1],.016);
      }
    }else{
      attr.setXYZ(0,-1,0,.016);
      attr.setXYZ(1,1,0,.016);
    }
    attr.needsUpdate=true;
    guide.computeLineDistances();
  }
  function corner(step, progress, out) {
    if(step===0)return vertex(model,model.apex,'upper',-1,step,progress,out);
    const fold=model.folds[step-1];
    const layer=fold.layer==='lower'?'lower':'upper';
    return vertex(model,fold.from,layer,step-1,step,progress,out);
  }
  return {update,corner,angles:model.angles};
}
