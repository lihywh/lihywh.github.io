// Project the folded sheet onto a desk plane. Both render paths use this
// same soft contact shadow so lifted corners retain a visual height cue.
import {Vector3} from './vendor/three.module.min.js';
const v=new Vector3();
export function drawShadow(canvas,scene,camera,w,h) {
  const scale=.55;
  const cw=Math.ceil(w*scale),ch=Math.ceil(h*scale);
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,cw,ch);
  if(camera.position.z<.4)return;
  ctx.beginPath();
  for(const mesh of scene.children){
    if(!mesh.isMesh||!mesh.visible||mesh.material.side!==0)continue;
    const pos=mesh.geometry.attributes.position.array,idx=mesh.geometry.index.array;
    const coords=new Float32Array(pos.length/3*2);
    for(let i=0;i<pos.length;i+=3){
      const lift=pos[i+2]+.04;
      v.set(pos[i]+lift*.25,pos[i+1]-lift*.30,-.04).project(camera);
      coords[i/3*2]=(v.x+1)*cw/2;coords[i/3*2+1]=(1-v.y)*ch/2;
    }
    for(let i=0;i<idx.length;i+=3){
      const a=2*idx[i],b=2*idx[i+1],c=2*idx[i+2];
      const left=(coords[b]-coords[a])*(coords[c+1]-coords[a+1])>(coords[b+1]-coords[a+1])*(coords[c]-coords[a]);
      const m=left?b:c,n=left?c:b;
      ctx.moveTo(coords[a],coords[a+1]);ctx.lineTo(coords[m],coords[m+1]);ctx.lineTo(coords[n],coords[n+1]);ctx.closePath();
    }
  }
  ctx.fillStyle='#484f3c';ctx.fill();
}
