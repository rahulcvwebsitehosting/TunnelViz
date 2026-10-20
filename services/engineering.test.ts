import assert from 'node:assert/strict';
import { evaluateTunnel, sectionArea, profile, alignment } from '../services/engineering';
import { TunnelShape, ConstructionMethod, GeoMaterial } from '../types';
const d={shape:TunnelShape.Circular,width:6,height:9,wallThickness:0.3,depth:20,method:ConstructionMethod.TBM,segmentCount:6,ringWidth:1.5,boltLength:3,boltSpacing:1.5,horizontalRadius:1000,verticalGrade:0};
const s={waterTableLevel:-20,natmSequence:3,deviation:0,showStress:false,showGrouting:false,showAlignment:false,showBorehole:false,showBMD:false,showSettlement:false,showHydrostaticVectors:false};
const layers=[{id:'1',type:GeoMaterial.Sand,thickness:10,density:18,saturatedUnitWeight:20,color:'#aaa',permeability:'High' as const},{id:'2',type:GeoMaterial.StiffClay,thickness:40,density:20,saturatedUnitWeight:22,color:'#bbb',permeability:'Low' as const}];
const close=(actual:number,expected:number,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);
const dry=evaluateTunnel(d,layers,s);
close(dry.area,Math.PI*9);close(dry.crownDepth,14);close(dry.axisDepth,17);close(dry.axis!.total,320);close(dry.axis!.water,0);close(dry.axis!.horizontal,160);
const wet=evaluateTunnel(d,layers,{...s,waterTableLevel:9}); // water depth = 5
close(wet.axis!.total,18*5+20*5+22*7);close(wet.axis!.water,9.81*12);close(wet.axis!.effective,344-117.72);close(wet.invert!.water-wet.crown!.water,9.81*6);
const pond=evaluateTunnel(d,layers,{...s,waterTableLevel:16});
close(pond.axis!.total,20*10+22*7+2*9.81);close(pond.axis!.effective,20*10+22*7-17*9.81);
close(evaluateTunnel(d,layers,{...s,surcharge:30}).axis!.total,dry.axis!.total+30);
close(evaluateTunnel(d,layers,{...s,volumeLossPercent:1}).settlementMax!,dry.settlementMax!*2);
close(evaluateTunnel(d,layers,{...s,volumeLossPercent:0}).settlementMax!,0);
let integral=0;const dx=0.01;for(let x=-80;x<=80;x+=dx)integral+=dry.settlementAt(x)!*dx;
close(integral,0.005*dry.area,1e-7);close(dry.settlementAt(-5)!,dry.settlementAt(5)!);
assert.equal(evaluateTunnel({...d,depth:60},layers,s).axis,null);
assert.equal(evaluateTunnel({...d,depth:4},layers,s).settlementMax,null);
assert.equal(evaluateTunnel({...d,shape:TunnelShape.Rectangular},layers,s).ringForce,null);
for(const shape of Object.values(TunnelShape))for(const inset of [0,0.3]){
 const design={...d,shape};const p=profile(design,inset);const a=Math.abs(p.reduce((sum,v,i)=>{const next=p[(i+1)%p.length];return sum+v[0]*next[1]-next[0]*v[1];},0)/2);
 close(a,sectionArea(design,inset),0.03);
}
close(alignment({...d,verticalGrade:5},20)[1],1);close(alignment({...d,horizontalRadius:Infinity},20)[2],20);
close(dry.ringStress!,dry.ringForce!/0.3/1000);
console.log('Engineering tests passed: layered dry/wet/ponded loads, surcharge, section areas, settlement volume conservation, invalid domains, alignment, and ring units.');
assert.equal(evaluateTunnel({...d,method:ConstructionMethod.CutAndCover},layers,s).settlementMax,null);
assert.equal(evaluateTunnel(d,[{...layers[0],type:GeoMaterial.SoundRock,thickness:50}],s).settlementMax,null);
