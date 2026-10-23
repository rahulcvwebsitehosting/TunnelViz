import { profile, sectionArea } from './engineering';
import type { TunnelDesign } from '../types';

export const siteDefaults = { length: 100, bulking: 1.25, workers: 20, freeArea: 15, flow: 10, head: 25, efficiency: 70 };
export type SiteInputs = typeof siteDefaults;
export function siteCalculations(d: TunnelDesign, p: SiteInputs, dusty: boolean) {
 if (Object.values(p).some(v=>!Number.isFinite(v)) || p.length<=0 || p.bulking<1 || !Number.isInteger(p.workers) || p.workers<0 || p.freeArea<=0 || p.freeArea>sectionArea(d,d.wallThickness) || p.flow<0 || p.head<0 || p.efficiency<=0 || p.efficiency>100) return null;
 const length=p.length*Math.hypot(1,d.verticalGrade/100);
 const excavation=sectionArea(d)*length;
 const personnelAir=p.workers*200*0.028316846592/60;
 const velocityAir=dusty?p.freeArea*30*0.3048/60:0;
 return { length, excavation, looseMuck:excavation*p.bulking, concrete:(sectionArea(d)-sectionArea(d,d.wallThickness))*length, rise:p.length*d.verticalGrade/100, personnelAir, velocityAir, minimumAir:Math.max(personnelAir,velocityAir), pumpPower:9.81*(p.flow/1000)*p.head/(p.efficiency/100) };
}

/** R12 ASCII DXF: metre coordinates; closed sampled outer/inner section. */
export function sectionDXF(d:TunnelDesign) {
 const lines=['0','SECTION','2','HEADER','9','$ACADVER','1','AC1009','0','ENDSEC','0','SECTION','2','ENTITIES'];
 for(const [layer,inset] of [['EXCAVATION',0],['CLEAR_OPENING',d.wallThickness]] as const){
  lines.push('0','POLYLINE','8',layer,'66','1','70','1');
  for(const [x,y] of profile(d,inset)) lines.push('0','VERTEX','8',layer,'10',String(x),'20',String(y),'30','0');
  lines.push('0','SEQEND');
 }
 lines.push('0','TEXT','8','NOTES','10','0','20',String(-d.height-2),'40','0.25','1','METRES - NOMINAL SECTION - NOT A CONSTRUCTION DRAWING','0','ENDSEC','0','EOF');
 return lines.join('\r\n');
}
