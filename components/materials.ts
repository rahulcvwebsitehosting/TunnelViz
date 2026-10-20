import * as THREE from 'three';

export function surfaceTexture(kind: 'concrete' | 'asphalt' | 'sign') {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  if (kind === 'sign') {
    ctx.fillStyle = '#056e4c'; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#ddfff2'; ctx.lineWidth = 10; ctx.strokeRect(16, 16, 480, 480);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.font = 'bold 68px sans-serif'; ctx.fillText('EXIT', 256, 150);
    ctx.font = '180px sans-serif'; ctx.fillText('←', 256, 340);
    ctx.font = '32px sans-serif'; ctx.fillText('ESCAPE ROUTE', 256, 435);
  } else {
    const img = ctx.createImageData(size, size);
    let seed = 1997;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const grain = seed % 18 - 9;
      const cloud = Math.sin(x / 47) * Math.cos(y / 81) * 7 + Math.sin((x+y) / 97) * 4;
      const v = (kind === 'concrete' ? 173 : 57) + grain + cloud, i = (y * size + x) * 4;
      img.data[i] = v; img.data[i + 1] = v + (kind === 'concrete' ? 1 : 3);
      img.data[i + 2] = v + (kind === 'concrete' ? -3 : 4); img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    if (kind === 'concrete') {
      for (let i = 0; i < 110; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const x = seed % size;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const y = seed % size;
        ctx.fillStyle = 'rgba(40,48,44,.12)'; ctx.beginPath();
        ctx.ellipse(x, y, 1.2 + i % 3, .6 + i % 2, .2, 0, Math.PI * 2); ctx.fill();
      }
      const g = ctx.createLinearGradient(0, 0, 0, size);
      g.addColorStop(0, 'rgba(45,50,43,.12)'); g.addColorStop(.16, 'rgba(45,50,43,0)');
      g.addColorStop(.85, 'rgba(45,50,43,0)'); g.addColorStop(1, 'rgba(45,50,43,.16)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  texture.repeat.set(kind === 'sign' ? 1 : 1.2, kind === 'sign' ? 1 : 1.2);
  return texture;
}

export function segmentShape(radius: number, thickness: number, count: number) {
  const shape = new THREE.Shape(), angle = Math.PI * 2 / count, gap = .002;
  shape.absarc(0, 0, radius, gap, angle - gap, false);
  shape.lineTo((radius - thickness) * Math.cos(angle - gap), (radius - thickness) * Math.sin(angle - gap));
  shape.absarc(0, 0, radius - thickness, angle - gap, gap, true);
  shape.closePath();
  return shape;
}

// Map segment walls in metres around the circumference and along the alignment.
// ExtrudeGeometry's default projection stretches the concrete near the springline.
export const segmentUV = {
 generateTopUV(_geometry:THREE.ExtrudeGeometry,vertices:number[],a:number,b:number,c:number) {
  return [a,b,c].map(i=>new THREE.Vector2(vertices[i*3],vertices[i*3+1]));
 },
 generateSideWallUV(_geometry:THREE.ExtrudeGeometry,vertices:number[],a:number,b:number,c:number,d:number) {
  const base=Math.atan2(vertices[a*3+1],vertices[a*3]);
  return [a,b,c,d].map(i=>{
   const x=vertices[i*3],y=vertices[i*3+1];
   let angle=Math.atan2(y,x);
   while(angle-base>Math.PI)angle-=2*Math.PI;
   while(angle-base<-Math.PI)angle+=2*Math.PI;
   return new THREE.Vector2(angle*Math.hypot(x,y),vertices[i*3+2]);
  });
 }
};
