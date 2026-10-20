import {profile,sectionDimensions} from '../services/engineering';
import type {TunnelDesign} from '../types';

export function SectionPreview({design}:{design:TunnelDesign}){
 const {width,height}=sectionDimensions(design);
 const scale=82/Math.max(width,height), path=(inset:number)=>profile(design,inset).map(([x,y],i)=>`${i?'L':'M'}${70+x*scale},${57-y*scale}`).join(' ')+'Z';
 return <div className="section-preview">
  <svg viewBox="0 0 140 118" role="img" aria-label={`${design.shape} section, ${width.toFixed(1)} metres wide, ${height.toFixed(1)} metres high`}>
   <path d={`${path(0)} ${path(design.wallThickness)}`} fillRule="evenodd" fill="#bdd5d1" stroke="#427d78" strokeWidth="1.2"/>
   <path d="M15 57H125M70 9V105" stroke="#aac0c1" strokeDasharray="3 4" strokeWidth=".6"/>
   <path d={`M${70-width*scale/2} 107H${70+width*scale/2}m0 -3v6M${70-width*scale/2} 104v6`} stroke="#427d78" fill="none"/>
  </svg>
  <div><strong>{width.toFixed(1)} × {height.toFixed(1)} m</strong><span>Outer cross-section</span><p>{Math.round(design.wallThickness*1000)} mm lining</p><small>Updates with your geometry</small></div>
 </div>;
}
