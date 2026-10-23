import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { CameraRig } from './CameraRig';
import { PlayIcon, PauseIcon, ArrowPathIcon, CubeIcon, ScissorsIcon, EyeIcon, Square3Stack3DIcon } from '@heroicons/react/24/outline';
import { surfaceTexture, segmentShape, segmentUV } from './materials';
import { TunnelShape, ConstructionMethod, type TunnelDesign, type GeologicalLayer, type SimulationSettings } from '../types';
import { alignment, evaluateTunnel, profile, sectionDimensions, MODEL_LENGTH } from '../services/engineering';
interface ThreeViewProps {design:TunnelDesign;layers:GeologicalLayer[];slice:number;simulation:SimulationSettings;highlightedLayerId?:string|null;}

function sectionShape(d:TunnelDesign) {
 const outer = profile(d), inner = profile(d,d.wallThickness);
 const shape = new THREE.Shape(outer.map(p=>new THREE.Vector2(...p)));
 shape.closePath();
 const hole = new THREE.Path(inner.slice().reverse().map(p=>new THREE.Vector2(...p)));
 hole.closePath(); shape.holes.push(hole); return shape;
}
function transform(d:TunnelDesign,s:number) {
 const p = new THREE.Vector3(...alignment(d,s));
 const tangent = new THREE.Vector3().subVectors(new THREE.Vector3(...alignment(d,s+0.01)),p).normalize();
 return {position:p,quaternion:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),tangent)};
}
function boundarySamples(d:TunnelDesign) {
 const p=profile(d), samples:{x:number;y:number;nx:number;ny:number}[]=[];
 for(let i=0;i<p.length;i++){
  const a=p[i],b=p[(i+1)%p.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
  const count=p.length<=4?5:1;if(p.length>4 && i%4!==0)continue;
  for(let j=0;j<count;j++)samples.push({x:a[0]+dx*(j+0.5)/count,y:a[1]+dy*(j+0.5)/count,nx:dy/length,ny:-dx/length});
 }
 return samples;
}
const Lining=React.memo(function Lining({design}:{design:TunnelDesign}) {
 const interval=design.method===ConstructionMethod.TBM?design.ringWidth:design.method===ConstructionMethod.NATM?design.boltSpacing:5;
 const shape=useMemo(()=>sectionShape(design),[design.shape,design.width,design.height,design.wallThickness]);
 const texture=useMemo(()=>surfaceTexture('concrete'),[]); useEffect(()=>()=>texture.dispose(),[texture]);
 const {height}=sectionDimensions(design);
 const segment=useMemo(()=>segmentShape(design.width/2-.004,design.wallThickness-.008,design.segmentCount),[design.width,design.wallThickness,design.segmentCount]);
 const rings=Array.from({length:Math.ceil(MODEL_LENGTH/interval)},(_,i)=>{
  const start=-20+i*interval, length=Math.min(interval,20-start);
  return {start,length,...transform(design,start)};
 });
 return <group>{rings.map((r,i)=><group key={i} position={r.position} quaternion={r.quaternion}>
  {design.method===ConstructionMethod.TBM && design.shape===TunnelShape.Circular ? Array.from({length:design.segmentCount},(_,j)=><mesh key={`segment-${j}`} rotation={[0,0,2*Math.PI*(j+(i%2)*.5)/design.segmentCount]} castShadow receiveShadow>
   <extrudeGeometry args={[segment,{depth:Math.max(.01,r.length-.012),bevelEnabled:true,bevelThickness:.004,bevelSize:.004,bevelSegments:1,steps:1,curveSegments:24,UVGenerator:segmentUV}]}/>
   <meshStandardMaterial map={texture} bumpMap={texture} bumpScale={.003} color={['#d0cec4','#c5c4bc','#d8d6cc','#cccac2'][(i+j)%4]} roughness={.92}/>
  </mesh>):<mesh castShadow receiveShadow><extrudeGeometry args={[shape,{depth:Math.max(.01,r.length-.012),bevelEnabled:false,steps:1,curveSegments:48}]}/><meshStandardMaterial map={texture} bumpMap={texture} bumpScale={design.method===ConstructionMethod.NATM?.016:.003} color="#babbb2" roughness={.96}/></mesh>}
  {design.method===ConstructionMethod.TBM && design.shape===TunnelShape.Circular && Array.from({length:design.segmentCount},(_,j)=>{
   const angle=2*Math.PI*(j+(i%2)*0.5)/design.segmentCount;
   const radius=design.width/2-design.wallThickness-0.008;
   return <group key={j}>
    
    {[0.13,Math.max(0.14,r.length-0.14)].map((z,k)=><group key={k}><mesh position={[radius*Math.cos(angle+0.06),radius*Math.sin(angle+0.06),z]} rotation={[0,0,angle-Math.PI/2]}><cylinderGeometry args={[.078,.078,.008,16]}/><meshStandardMaterial color="#626762" roughness={.85}/></mesh><mesh key={k} position={[radius*Math.cos(angle+0.06),radius*Math.sin(angle+0.06),z]} rotation={[0,0,angle-Math.PI/2]}><cylinderGeometry args={[0.045,0.045,0.018,6]}/><meshStandardMaterial color="#707779" metalness={0.7} roughness={0.5}/></mesh></group>)}
   </group>;
  })}
  {design.method===ConstructionMethod.NATM && Array.from({length:7},(_,j)=>{
   const angle=(j+0.5)/7*Math.PI, a=design.width/2,b=Math.min(design.width/2,height/2),spring=height/2-b;
   return <group key={j} position={[a*Math.cos(angle),spring+b*Math.sin(angle),r.length/2]} rotation={[0,0,angle-Math.PI/2]}><mesh position={[0,design.boltLength/2,0]}><cylinderGeometry args={[0.025,0.025,design.boltLength,6]}/><meshStandardMaterial color="#88959b" metalness={0.7}/></mesh><mesh><boxGeometry args={[0.19,0.035,0.19]}/><meshStandardMaterial color="#465159"/></mesh></group>;
  })}
 </group>)}</group>;
});
function Scene({design,layers,slice,simulation,highlightedLayerId,mode,ground,reset,touring,reducedMotion,animate,onStop}:ThreeViewProps&{mode:string;ground:boolean;reset:number;touring:boolean;reducedMotion:boolean;animate:boolean;onStop:()=>void}) {
 const m=evaluateTunnel(design,layers,simulation), {height}=sectionDimensions(design);
 const end=-20+slice/100*40;
 const planes=useMemo(()=>{const f=transform(design,end),n=new THREE.Vector3(0,0,-1).applyQuaternion(f.quaternion);return mode==='inside'?[]:[new THREE.Plane().setFromNormalAndCoplanarPoint(n,f.position)];},[mode,end,design.horizontalRadius,design.verticalGrade]);
 const asphalt=useMemo(()=>surfaceTexture('asphalt'),[]),sign=useMemo(()=>surfaceTexture('sign'),[]);
 useEffect(()=>()=>{asphalt.dispose();sign.dispose();},[asphalt,sign]);
 const {gl}=useThree();
 useEffect(()=>{gl.clippingPlanes=planes;return()=>{gl.clippingPlanes=[];};},[gl,planes]);
 const floor=-height/2+design.wallThickness+height*0.12;
 const floorWidth=design.shape===TunnelShape.Circular?2*Math.sqrt(Math.max(0,(design.width/2-design.wallThickness)**2-floor**2)):design.width-2*design.wallThickness;
 const showServices=floorWidth>=1.8 && height-2*design.wallThickness>=2.4;
 const sections=Array.from({length:40},(_,i)=>transform(design,i-19.5));
 let top=0;
 const crossSectionStation=Math.min(19.9,end-0.04), frame=transform(design,crossSectionStation);
 const waterY=height/2+simulation.waterTableLevel;
 return <>
  <color attach="background" args={['#111c27']}/><fog attach="fog" args={['#111c27',65,150]}/>
  <hemisphereLight args={['#c6def1','#38372f',mode==='inside'?0.65:1.3]}/>
  <directionalLight position={[8,18,12]} intensity={mode==='inside'?0.5:2.4} castShadow shadow-mapSize={[2048,2048]}/>
  <Lining design={design}/>
  {sections.map((f,i)=><group key={i} position={f.position} quaternion={f.quaternion}>
   <mesh position={[0,floor-0.12,0]} receiveShadow><boxGeometry args={[floorWidth,0.24,1.025]}/><meshStandardMaterial color="#68757a" map={asphalt} bumpMap={asphalt} bumpScale={.025} roughness={0.88}/></mesh>
   {showServices&&[-1,1].map(side=><group key={side}>
    <mesh position={[side*(floorWidth/2-0.22),floor+0.07,0]} receiveShadow><boxGeometry args={[0.44,0.14,1.025]}/><meshStandardMaterial color="#979b98" roughness={0.9}/></mesh>
    <mesh position={[side*(floorWidth/2-0.48),floor+0.008,0]}><boxGeometry args={[0.08,0.012,1.025]}/><meshStandardMaterial color="#d2b969"/></mesh>
    {i%2===0&&<mesh position={[side*(floorWidth/2-0.2),floor+0.47,0]} castShadow><cylinderGeometry args={[.025,.025,.78,8]}/><meshStandardMaterial color="#819197" metalness={.75} roughness={.35}/></mesh>}
    <mesh position={[side*(floorWidth/2-.58),floor+.015,0]}><boxGeometry args={[.1,.025,.9]}/><meshStandardMaterial color="#202c31" metalness={.4} roughness={.8}/></mesh>
    {i%2===0&&<mesh position={[side*(floorWidth/2-.58),floor+.035,0]}><boxGeometry args={[.1,.008,.03]}/><meshStandardMaterial color="#63747b" metalness={.7}/></mesh>}
    <mesh position={[side*(floorWidth/2-0.2),floor+0.85,0]}><boxGeometry args={[0.08,0.08,1.025]}/><meshStandardMaterial color="#8c999f" metalness={0.65} roughness={0.4}/></mesh>
   </group>)}
   {showServices&&<group><mesh position={[design.width*.26,height*.24,0]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.065,.065,1.025,10]}/><meshStandardMaterial color="#926852" metalness={.35} roughness={.6}/></mesh>
   <mesh position={[-design.width*.28,height*.23,0]}><boxGeometry args={[.22,.07,1.025]}/><meshStandardMaterial color="#56656a" metalness={.7} roughness={.55}/></mesh>
   {i%3===0&&<group><mesh position={[design.width*.26,height*.24,0]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.076,.076,.055,12,1,true]}/><meshStandardMaterial color="#a3a9a5" metalness={.8} roughness={.35} side={THREE.DoubleSide}/></mesh><mesh position={[design.width*.26,height*.24+.13,0]}><boxGeometry args={[.035,.2,.035]}/><meshStandardMaterial color="#748382" metalness={.6}/></mesh></group>}
   {i%2===0&&<mesh position={[-design.width*.28,height*.23+.04,0]}><boxGeometry args={[.28,.035,.05]}/><meshStandardMaterial color="#9aa6a4" metalness={.7}/></mesh>}
   {i%4===0&&<mesh position={[-design.width*.28,height*.23-.12,0]}><boxGeometry args={[.05,.25,.04]}/><meshStandardMaterial color="#67757b" metalness={.6}/></mesh>}
   {i%12===0&&<group><mesh position={[floorWidth/2-.2,floor+1.35,0]} castShadow><boxGeometry args={[.28,.6,.18]}/><meshStandardMaterial color="#a44235" roughness={.5}/></mesh><mesh position={[-floorWidth/2+.22,floor+1.7,.1]}><planeGeometry args={[.42,.42]}/><meshStandardMaterial map={sign} emissiveMap={sign} emissive="#b6f8cc" emissiveIntensity={.65} side={THREE.DoubleSide}/></mesh></group>}
   </group>}
   {i%4===0 && <group>
    <mesh position={[0,height/2-design.wallThickness-.09,0]} castShadow><boxGeometry args={[Math.min(1.3,design.width/4+.1),.14,.7]}/><meshStandardMaterial color="#5e696b" metalness={.65} roughness={.4}/></mesh>
    {[-1,1].map(side=><mesh key={side} position={[side*Math.min(.42,design.width/12),height/2-design.wallThickness-.17,0]}><boxGeometry args={[.025,.035,.62]}/><meshStandardMaterial color="#9caaa9" metalness={.7} roughness={.3}/></mesh>)}
    <mesh position={[0,height/2-design.wallThickness-0.16,0]}><boxGeometry args={[Math.min(1.2,design.width/4),0.08,0.6]}/><meshStandardMaterial color="#fff5dc" emissive="#fff1ce" emissiveIntensity={1.2}/></mesh><pointLight position={[0,height/2-design.wallThickness-0.4,0]} intensity={18} distance={9} decay={2}/></group>}
  </group>)}
  {ground && layers.map(layer=>{const y=m.axisDepth-top-layer.thickness/2;top+=layer.thickness;return <mesh key={layer.id} position={[-design.width/2-4,y,0]}><boxGeometry args={[5,layer.thickness,40]}/><meshStandardMaterial color={layer.color} transparent opacity={highlightedLayerId===layer.id?0.85:0.35} roughness={1} depthWrite={false}/></mesh>;})}
  {ground && <gridHelper position={[0,m.axisDepth,0]} args={[60,30,'#526854','#35443c']}/>}
  {ground && <mesh position={[0,waterY,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[30,40]}/><meshBasicMaterial color="#359adc" transparent opacity={0.13} side={THREE.DoubleSide} depthWrite={false}/></mesh>}
  {simulation.showAlignment && <Line points={Array.from({length:81},(_,i)=>alignment(design,-20+i/2))} color="#7fe2aa" dashed dashSize={0.5} gapSize={0.3}/>}
  {simulation.showHydrostaticVectors && <group position={frame.position} quaternion={frame.quaternion}>{boundarySamples(design).map(({x,y,nx,ny},i)=>{
   const u=9.81*Math.max(0,waterY-new THREE.Vector3(x,y,0).applyQuaternion(frame.quaternion).add(frame.position).y);if(u===0)return null;
   const direction=new THREE.Vector3(-nx,-ny,0);const point=new THREE.Vector3(x,y,0).addScaledVector(direction,-Math.min(3,u/100));
   return <arrowHelper key={i} args={[direction,point,Math.min(3,u/100),0x45bfff,0.15,0.09]}/>;
  })}</group>}
  {simulation.showStress && <group position={frame.position} quaternion={frame.quaternion}>{boundarySamples(design).map(({x,y,nx,ny},i)=>{
   const p=m.pressureAt(m.axisDepth-new THREE.Vector3(x,y,0).applyQuaternion(frame.quaternion).add(frame.position).y);if(!p)return null;
   const force=new THREE.Vector3(-nx*p.horizontal,-ny*p.total,0), len=Math.min(3,force.length()/200);
   const direction=force.normalize(), point=new THREE.Vector3(x,y,0).addScaledVector(direction,-len);
   return <arrowHelper key={i} args={[direction,point,len,0xffb657,0.15,0.09]}/>;
  })}</group>}
  {simulation.showSettlement && m.settlementMax!==null && <Line points={Array.from({length:101},(_,i):[number,number,number]=>{const x=(i-50)/50*3*m.troughWidth;return [x,m.axisDepth-(m.settlementAt(x)??0)*100,end-0.1];})} color="#f0b85c" lineWidth={3}/>}
  {mode==='section' && <group position={frame.position} quaternion={frame.quaternion}>
   <Line points={[[-design.width/2,-height/2-.6,.05],[design.width/2,-height/2-.6,.05]]} color="#a4e5db" lineWidth={1}/>
   {[-1,1].map(side=><Line key={side} points={[[side*design.width/2,-height/2-.3,.05],[side*design.width/2,-height/2-.9,.05]]} color="#a4e5db"/>)}
   <Html center position={[0,-height/2-.85,.05]} style={{pointerEvents:'none',whiteSpace:'nowrap',background:'#14282d',color:'#ecfff9',padding:'4px 8px',borderRadius:4,fontSize:12}}>{design.width.toFixed(2)} m excavation · {(design.width-2*design.wallThickness).toFixed(2)} m clear width</Html>
  </group>}
  <CameraRig mode={mode} design={design} station={end} reset={reset} touring={touring} reducedMotion={reducedMotion} animate={animate} onStop={onStop}/>
 </>;
}
export function ThreeView(props:ThreeViewProps) {
 const [mode,setMode]=useState('inside'),[ground,setGround]=useState(false),[reset,setReset]=useState(0);
 const [touring,setTouring]=useState(false),[animate,setAnimate]=useState(true);
 const [reducedMotion,setReducedMotion]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const stop=useCallback(()=>setTouring(false),[]);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>{setReducedMotion(media.matches);if(media.matches)stop();};
  const visibility=()=>{if(document.hidden)stop();};
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')stop();};
  media.addEventListener('change',update);document.addEventListener('visibilitychange',visibility);window.addEventListener('keydown',escape);
  return()=>{media.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('keydown',escape);};
 },[stop]);
 useEffect(stop,[props.design,stop]);
 const {height}=sectionDimensions(props.design);
 const views=[{id:'overview',label:'Overview',icon:CubeIcon},{id:'section',label:'Section',icon:ScissorsIcon},{id:'inside',label:'Inside',icon:EyeIcon}];
 return <div className="tunnel-view">
  <div className="scene-toolbar">
   <div className="view-switch" aria-label="Camera views">{views.map(v=><button key={v.id} onClick={e=>{stop();setAnimate(e.detail>0);setMode(v.id);}} aria-pressed={v.id===mode}><v.icon/>{v.label}</button>)}</div>
   <div className="scene-actions"><button onClick={e=>{stop();setAnimate(e.detail>0);setReset(v=>v+1);}} title="Reset camera position" aria-label="Reset view"><ArrowPathIcon/></button><button onClick={()=>{stop();setGround(!ground);}} aria-pressed={ground}><Square3Stack3DIcon/><span>{ground?'Hide':'Show'} geology</span></button></div>
  </div>
  <Canvas frameloop="demand" shadows dpr={[1,1.5]} camera={{fov:48,near:0.05,far:300}} gl={{antialias:true,localClippingEnabled:true}}><Scene {...props} mode={mode} ground={ground} reset={reset} touring={touring} reducedMotion={reducedMotion} animate={animate} onStop={stop}/></Canvas>
  <div className="scene-bottom">
   <div className="scene-caption"><div><strong>{props.design.method} · {props.design.shape}</strong><span>{props.design.width.toFixed(1)} × {height.toFixed(1)} m · {Math.round(props.design.wallThickness*1000)} mm lining</span></div>
   <button className={`tour-button ${touring?'is-playing':''}`} disabled={reducedMotion} onClick={()=>{if(touring)stop();else{setMode('inside');setAnimate(true);setReset(v=>v+1);setTouring(true);}}} aria-pressed={touring}>{touring?<PauseIcon/>:<PlayIcon/>}{touring?'Pause walkthrough':'Walk through'}</button></div>
   <p className="scene-help">{reducedMotion?'Reduced motion enabled · camera views change instantly.':touring?'Walking at 1.4 m/s · drag, scroll or press Esc to stop.':'Drag to orbit · scroll to zoom · explore a 40 m alignment.'}{reducedMotion&&<button className="enable-motion" onClick={()=>setReducedMotion(false)}>Enable motion for this preview</button>}</p>
   <details className="scene-notes"><summary>Model information & overlays</summary><p>Fittings illustrate scale, not clearance compliance. {props.design.verticalGrade}% grade.</p>
   {props.simulation.showSettlement && <p className="text-amber-300">Gaussian settlement line · vertical displacement exaggerated ×100</p>}
   {props.simulation.showStress && <p className="text-amber-300">Far-field total stress traction · 1 m arrow / 200 kPa, capped at 3 m · not lining stress</p>}
   {props.simulation.showHydrostaticVectors && <p className="text-blue-300">Hydrostatic pressure · 1 m arrow / 100 kPa, capped at 3 m</p>}
   {props.simulation.showBMD && <p className="text-amber-300">Bending moment unavailable: requires a calibrated structural analysis.</p>}
   {props.simulation.showBorehole && ground && <p>Layer log shown beside alignment; ground surface is at the reference invert depth.</p>}
   </details>
  </div>
 </div>;
}
