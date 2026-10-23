import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import type {OrbitControls as Controls} from 'three-stdlib';
import * as THREE from 'three';
import {alignment,sectionDimensions} from '../services/engineering';
import type {TunnelDesign} from '../types';

export function CameraRig({design,mode,station,reset,touring,reducedMotion,animate,onStop}:{design:TunnelDesign;mode:string;station:number;reset:number;touring:boolean;reducedMotion:boolean;animate:boolean;onStop:()=>void}) {
 const controls=useRef<Controls>(null);
 const {camera,invalidate,gl}=useThree();
 const initialized=useRef(false), elapsed=useRef(0), walkStation=useRef(18);
 const transition=useRef(false);
 const from=useRef(new THREE.Vector3()), fromTarget=useRef(new THREE.Vector3());
 const destination=useRef(new THREE.Vector3()), target=useRef(new THREE.Vector3());
 const eyeHeight=()=>-sectionDimensions(design).height/2+design.wallThickness+sectionDimensions(design).height*.12+Math.min(1.65,(sectionDimensions(design).height-2*design.wallThickness)*.5);
 useEffect(()=>{
  if(!controls.current)return;
  if(mode==='inside'){
   destination.current.set(...alignment(design,18)).add(new THREE.Vector3(0,eyeHeight(),0));
   target.current.set(...alignment(design,-18)).add(new THREE.Vector3(0,eyeHeight(),0));
  }else if(mode==='section'){
   target.current.set(...alignment(design,station));
   const tangent=new THREE.Vector3(...alignment(design,station+.01)).sub(target.current).normalize();
   destination.current.copy(target.current).addScaledVector(tangent,design.width*2.1);
  }else{
   target.current.set(0,0,0);destination.current.set(design.width*1.6,design.width,24);
  }
  from.current.copy(camera.position);fromTarget.current.copy(controls.current.target);
  elapsed.current=0;walkStation.current=18;
  transition.current=initialized.current&&!reducedMotion&&animate;
  if(!transition.current){camera.position.copy(destination.current);controls.current.target.copy(target.current);controls.current.update();}
  initialized.current=true;invalidate();
 },[mode,design.width,design.height,design.shape,design.wallThickness,design.horizontalRadius,design.verticalGrade,mode==='section'?station:0,reset,reducedMotion]);
 const wasTouring=useRef(false);
 useEffect(()=>{
  if(wasTouring.current&&!touring)transition.current=false;
  wasTouring.current=touring;
  invalidate();
 },[touring,invalidate]);
 useEffect(()=>{
  const stop=()=>{transition.current=false;onStop();invalidate();};
  gl.domElement.addEventListener('pointerdown',stop);
  gl.domElement.addEventListener('wheel',stop,{passive:true});
  return()=>{gl.domElement.removeEventListener('pointerdown',stop);gl.domElement.removeEventListener('wheel',stop);};
 },[gl,invalidate,onStop]);
 useFrame((_,delta)=>{
  if(!controls.current)return;
  if(transition.current){
   elapsed.current+=Math.min(delta,.05);
   const t=Math.min(1,elapsed.current/.5), eased=1-Math.pow(1-t,3);
   camera.position.lerpVectors(from.current,destination.current,eased);
   controls.current.target.lerpVectors(fromTarget.current,target.current,eased);
   controls.current.update();transition.current=t<1;invalidate();
  }else if(touring&&!reducedMotion){
   walkStation.current=Math.max(-16,walkStation.current-Math.min(delta,.05)*1.4);
   camera.position.set(...alignment(design,walkStation.current)).add(new THREE.Vector3(0,eyeHeight(),0));
   controls.current.target.set(...alignment(design,walkStation.current-8)).add(new THREE.Vector3(0,eyeHeight(),0));
   controls.current.update();invalidate();
   if(walkStation.current<=-16)onStop();
  }
 });
 return <OrbitControls ref={controls} makeDefault enableDamping={false} minDistance={.5} maxDistance={120}/>;
}
