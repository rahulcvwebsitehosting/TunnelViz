import { ConstructionMethod, TunnelShape, GeoMaterial, type TunnelDesign, type GeologicalLayer, type SimulationSettings } from '../types';
export const DEFAULT_DESIGN:TunnelDesign={shape:TunnelShape.Circular,width:6,height:6,wallThickness:0.3,depth:20,method:ConstructionMethod.TBM,segmentCount:6,ringWidth:1.5,boltLength:3,boltSpacing:1.5,horizontalRadius:1000,verticalGrade:0};
export const DEFAULT_SIMULATION:SimulationSettings={waterTableLevel:-5,natmSequence:3,deviation:0,showStress:false,showGrouting:false,showAlignment:false,showBorehole:true,showBMD:false,showSettlement:false,showHydrostaticVectors:false,surcharge:0,earthPressureCoefficient:0.5,volumeLossPercent:0.5,troughWidthFactor:0.5};
export const DEFAULT_LAYERS:GeologicalLayer[]=[
{id:'1',type:GeoMaterial.SoftClay,thickness:15,color:'#967660',density:18,saturatedUnitWeight:20,permeability:'Low',spt_n:12},
{id:'2',type:GeoMaterial.Sand,thickness:10,color:'#ccb58a',density:20,saturatedUnitWeight:21,permeability:'High',spt_n:35},
{id:'3',type:GeoMaterial.SoundRock,thickness:40,color:'#77878a',density:25,saturatedUnitWeight:26,permeability:'Low',rqd:85}];
export const STORAGE_KEY='tunnelviz.project.v1';
export interface Project {version:1;design:TunnelDesign;layers:GeologicalLayer[];simulation:SimulationSettings;}
const finite=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export function parseProject(raw:string):Project|null {
 try{
  const p=JSON.parse(raw);const d=p.design,s=p.simulation;
  if(p.version!==1||!d||!s||!Array.isArray(p.layers)||p.layers.length<1||p.layers.length>20)return null;
  if(!Object.values(ConstructionMethod).includes(d.method)||!Object.values(TunnelShape).includes(d.shape))return null;
  for(const [key,min,max] of [['width',3,15],['height',3,15],['wallThickness',0.1,1],['depth',5,100],['segmentCount',3,10],['ringWidth',1,2.5],['boltLength',1,6],['boltSpacing',0.5,3],['horizontalRadius',200,2000],['verticalGrade',-5,5]] as const)if(!finite(d[key],min,max))return null;
  if(!Number.isInteger(d.segmentCount))return null;
  if(d.method===ConstructionMethod.TBM&&d.shape!==TunnelShape.Circular)return null;
  if(d.method===ConstructionMethod.CutAndCover&&d.shape!==TunnelShape.Rectangular)return null;
  for(const l of p.layers)if(typeof l.id!=='string'||!Object.values(GeoMaterial).includes(l.type)||!finite(l.thickness,1,150)||!finite(l.density,10,30)||!finite(l.saturatedUnitWeight??l.density,10,30)||!/^#[\da-f]{6}$/i.test(l.color)||!['Low','Medium','High'].includes(l.permeability))return null;
  if(new Set(p.layers.map((l:GeologicalLayer)=>l.id)).size!==p.layers.length)return null;
  for(const [key,min,max] of [['waterTableLevel',-20,10],['surcharge',0,200],['earthPressureCoefficient',0.2,2],['volumeLossPercent',0,5],['troughWidthFactor',0.2,0.8]] as const)if(!finite(s[key]??DEFAULT_SIMULATION[key],min,max))return null;
  for(const key of ['showStress','showAlignment','showSettlement','showHydrostaticVectors'] as const)if(typeof s[key]!=='boolean')return null;
  return {version:1,design:d,layers:p.layers,simulation:{...DEFAULT_SIMULATION,...s}};
 }catch{return null;}
}
export function freshProject():Project{return {version:1,design:{...DEFAULT_DESIGN},layers:DEFAULT_LAYERS.map(l=>({...l})),simulation:{...DEFAULT_SIMULATION}};}
