// A small orthographic depth-buffer renderer for browsers with WebGL disabled.
// It projects the very same Three.js triangles, fold guides and camera.
import * as T from './vendor/three.module.min.js';

export class SoftwareRenderer {
  constructor() {
    this.domElement=document.createElement('canvas');
    this.ctx=this.domElement.getContext('2d');
    if(!this.ctx) throw new Error('Canvas unavailable');
    this.matrix=new T.Matrix4();
    this.textures=new WeakMap();
  }
  setPixelRatio() {}
  setClearColor() {}
  setSize(width,height) {
    const ratio=Math.min(1.35,720/Math.max(width,height));
    this.w=this.domElement.width=Math.max(1,Math.round(width*ratio));
    this.h=this.domElement.height=Math.max(1,Math.round(height*ratio));
    this.image=this.ctx.createImageData(this.w,this.h);
    this.depth=new Float32Array(this.w*this.h);
  }
  project(x,y,z) {
    const m=this.matrix.elements;
    return [(m[0]*x+m[4]*y+m[8]*z+m[12]+1)*.5*this.w,
      (1-m[1]*x-m[5]*y-m[9]*z-m[13])*.5*this.h,
      m[2]*x+m[6]*y+m[10]*z+m[14]];
  }
  triangle(a,b,c,color,alpha,texture,[u0,v0,du,dv,eu,ev]) {
    const area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    if(Math.abs(area)<.0001)return;
    const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0])));
    const maxX=Math.min(this.w-1,Math.ceil(Math.max(a[0],b[0],c[0])));
    const minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1])));
    const maxY=Math.min(this.h-1,Math.ceil(Math.max(a[1],b[1],c[1])));
    const data=this.image.data;
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const px=x+.5-a[0],py=y+.5-a[1];
      const v=(px*(c[1]-a[1])-py*(c[0]-a[0]))/area;
      const w=((b[0]-a[0])*py-(b[1]-a[1])*px)/area;
      if(v<-.000001||w<-.000001||v+w>1.000001)continue;
      const z=a[2]+v*(b[2]-a[2])+w*(c[2]-a[2]),i=y*this.w+x;
      if(z>this.depth[i])continue;
      if(alpha===1)this.depth[i]=z;
      const j=i*4,old=data[j+3]/255,next=alpha+old*(1-alpha);
      const u=u0+du*v+eu*w, t=v0+dv*v+ev*w;
      const tx=Math.floor((u-Math.floor(u))*texture.width);
      const ty=Math.floor((t-Math.floor(t))*texture.height);
      const shade=texture.data[(ty*texture.width+tx)*4]/255;
      for(let ch=0;ch<3;ch++)data[j+ch]=(color[ch]*shade*alpha+data[j+ch]*old*(1-alpha))/next;
      data[j+3]=next*255;
    }
  }
  render(scene,camera) {
    if(!this.image)return;
    this.image.data.fill(0);this.depth.fill(Infinity);
    this.matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    const transparent=[],lines=[];
    for(const mesh of scene.children){
      if(mesh.isLine){if(mesh.visible)lines.push(mesh);continue;}
      if(!mesh.isMesh||!mesh.visible)continue;
      const pos=mesh.geometry.attributes.position.array,idx=mesh.geometry.index.array;
      const verts=[];
      for(let j=0;j<pos.length;j+=3)verts.push(this.project(pos[j],pos[j+1],pos[j+2]));
      const mat=mesh.material,hex=mat.color.getHex();
      const base=[hex>>16,(hex>>8)&255,hex&255];
      const source=mat.map.image;
      let texture=this.textures.get(source);
      if(!texture){
        texture=source.getContext('2d').getImageData(0,0,source.width,source.height);
        this.textures.set(source,texture);
      }
      const uv=mesh.geometry.attributes.uv.array;
      const shades=mesh.geometry.attributes.color.array;
      for(let i=0;i<idx.length;i+=3){
        const ia=idx[i],ib=idx[i+1],ic=idx[i+2];
        const a=verts[ia],b=verts[ib],c=verts[ic];
        const front=(b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1])<0;
        if(front!==(mat.side===T.FrontSide))continue;
        const va=ia*3,vb=ib*3,vc=ic*3;
        const ux=pos[vb]-pos[va],uy=pos[vb+1]-pos[va+1],uz=pos[vb+2]-pos[va+2];
        const vx=pos[vc]-pos[va],vy=pos[vc+1]-pos[va+1],vz=pos[vc+2]-pos[va+2];
        const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
        const dot=(front?1:-1)*(-.34*nx+.50*ny+.8*nz)/(Math.hypot(nx,ny,nz)||1);
        const lit=.74+.31*Math.max(0,dot);
        const shade=(shades[va]+shades[vb]+shades[vc])/3;
        const color=base.map(value=>value*lit*shade);
        const u=uv[ia*2], t=1-uv[ia*2+1];
        const mapping=[u,t,uv[ib*2]-u,1-uv[ib*2+1]-t,uv[ic*2]-u,1-uv[ic*2+1]-t];
        if(mat.transparent)transparent.push({a,b,c,color,alpha:mat.opacity,z:a[2]+b[2]+c[2],texture,mapping});
        else this.triangle(a,b,c,color,1,texture,mapping);
      }
    }
    transparent.sort((a,b)=>b.z-a.z);
    for(const t of transparent)this.triangle(t.a,t.b,t.c,t.color,t.alpha,t.texture,t.mapping);
    for(const line of lines){
      const p=line.geometry.attributes.position.array, dist=line.geometry.attributes.lineDistance?.array;
      const shade=line.material.color.getHex(),color=[shade>>16,(shade>>8)&255,shade&255];
      for(let j=3;j<p.length;j+=3){
        const a=this.project(p[j-3],p[j-2],p[j-1]),b=this.project(p[j],p[j+1],p[j+2]);
        const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]))),k=j/3;
        for(let q=0;q<=n;q++){
          const t=q/n;if(dist&&(dist[k-1]+t*(dist[k]-dist[k-1]))%.057>.035)continue;
          const x=Math.round(a[0]+t*(b[0]-a[0])),y=Math.round(a[1]+t*(b[1]-a[1]));
          if(x<0||y<0||x>=this.w||y>=this.h)continue;
          const i=y*this.w+x;
          if(a[2]+t*(b[2]-a[2])>this.depth[i]+.00008)continue;
          const data=this.image.data,alpha=line.material.opacity;
          for(let ch=0;ch<3;ch++)data[4*i+ch]=data[4*i+ch]*(1-alpha)+alpha*color[ch];
          data[4*i+3]=Math.max(data[4*i+3],alpha*255);
        }
      }
    }
    this.ctx.putImageData(this.image,0,0);
  }
}
