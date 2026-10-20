import { ConstructionMethod, TunnelShape, type TunnelDesign, type GeologicalLayer, type SimulationSettings } from '../types';

export const WATER_UNIT_WEIGHT = 9.81; // kN/m³
export const MODEL_LENGTH = 40; // horizontal alignment arc length, m
export function sectionDimensions(d: TunnelDesign) {
  return { width: d.width, height: d.shape === TunnelShape.Circular ? d.width : d.height };
}
// Dimensions are excavation envelope; invert depth is to the outer bottom at station 0.
export function sectionArea(d: TunnelDesign, inset = 0) {
  const { width, height } = sectionDimensions(d);
  const w = width - 2 * inset, h = height - 2 * inset;
  if (w <= 0 || h <= 0) return 0;
  if (d.shape === TunnelShape.Circular) return Math.PI * w * w / 4;
  if (d.shape === TunnelShape.Rectangular) return w * h;
  const rise = Math.min(width / 2, height / 2) - inset;
  return w * (h - rise) + Math.PI * w * rise / 4;
}
export function profile(d: TunnelDesign, inset = 0): [number, number][] {
  const { width, height } = sectionDimensions(d);
  const a = width / 2 - inset, bottom = -height / 2 + inset;
  if (d.shape === TunnelShape.Rectangular) return [[-a,bottom],[a,bottom],[a,-bottom],[-a,-bottom]];
  if (d.shape === TunnelShape.Circular) return Array.from({length: 96}, (_,i) => {
    const t = i / 96 * Math.PI * 2; return [a * Math.cos(t), a * Math.sin(t)];
  });
  const rise = Math.min(width / 2, height / 2), spring = height / 2 - rise;
  return [[-a,bottom],[a,bottom], ...Array.from({length: 49}, (_,i): [number,number] => {
    const t = i / 48 * Math.PI; return [a * Math.cos(t), spring + (rise-inset) * Math.sin(t)];
  })];
}
export function alignment(d: TunnelDesign, station: number): [number,number,number] {
  const r = d.horizontalRadius;
  return [Number.isFinite(r) && r > 0 ? r * (1-Math.cos(station/r)) : 0,
    station*d.verticalGrade/100,
    Number.isFinite(r) && r > 0 ? r*Math.sin(station/r) : station];
}
export function evaluateTunnel(d: TunnelDesign, layers: GeologicalLayer[], s: SimulationSettings) {
  const { height } = sectionDimensions(d);
  const crownDepth = d.depth-height, axisDepth = d.depth-height/2;
  const waterDepth = crownDepth-s.waterTableLevel;
  const surcharge = s.surcharge ?? 0, k0 = s.earthPressureCoefficient ?? 0.5;
  const volumeLoss = s.volumeLossPercent ?? 0.5, troughK = s.troughWidthFactor ?? 0.5;
  const investigatedDepth = layers.reduce((sum,l) => sum+l.thickness,0);
  const warnings: string[] = [];
  if (crownDepth <= 0) warnings.push('Excavation reaches above the ground surface. Buried-tunnel models are unavailable.');
  if (d.depth + Math.abs(d.verticalGrade/100)*MODEL_LENGTH/2 > investigatedDepth) warnings.push('The geological log does not cover the deepest invert. Extend the log; loads below it are unavailable.');
  if (waterDepth < 0) warnings.push('Water surface is above ground: ponded water weight is included in total stress.');
  if (d.shape !== TunnelShape.Circular) warnings.push('Circular ring estimates are unavailable for this section; a frame or numerical lining model is required.');
  if (layers.some(l => /Rock|Granite/.test(l.type))) warnings.push('Rock stresses may be tectonic and discontinuity controlled; entered K₀ is an assumption, not an inferred rock stress ratio.');
  if (crownDepth > 0 && crownDepth / d.width < 1) warnings.push('Cover is less than one excavation width. Shallow-ground mechanisms can invalidate the settlement approximation.');
  const pressureAt = (depth: number) => {
    if (depth < 0 || depth > investigatedDepth) return null;
    let top = 0, total = surcharge + Math.max(0,-waterDepth)*WATER_UNIT_WEIGHT;
    for (const l of layers) {
      const bottom = Math.min(depth,top+l.thickness);
      const thickness = Math.max(0,bottom-top);
      const saturated = Math.max(0,bottom-Math.max(top,waterDepth));
      total += (thickness-saturated)*l.density + saturated*(l.saturatedUnitWeight ?? l.density);
      top += l.thickness;
      if (top >= depth) break;
    }
    const water = WATER_UNIT_WEIGHT*Math.max(0,depth-waterDepth);
    const effective = total-water;
    return { total, water, effective, horizontal: k0*effective+water };
  };
  const crown = pressureAt(crownDepth), axis = pressureAt(axisDepth), invert = pressureAt(d.depth);
  const area = sectionArea(d), clearArea = sectionArea(d,d.wallThickness);
  let layerTop=0;
  const intersectsRock=layers.some(l=>{const bottom=layerTop+l.thickness;const intersects=bottom>crownDepth&&layerTop<d.depth;layerTop=bottom;return intersects&&/Rock|Granite/.test(l.type);});
  if(intersectsRock)warnings.push('The excavation intersects rock. The soil Gaussian settlement estimate is unavailable; use a calibrated rock deformation model.');
  if(d.method===ConstructionMethod.CutAndCover)warnings.push('Gaussian excavation-loss settlement is unavailable for cut-and-cover; excavation wall movement and dewatering require separate analysis.');
  if(layers.some(l=>(l.saturatedUnitWeight ?? l.density)<l.density))warnings.push('A saturated unit weight is lower than its moist value. Check the entered material properties.');
  const valid = crownDepth > 0 && invert !== null;
  const i = troughK*axisDepth;
  const settlementMax = valid && !intersectsRock && d.method!==ConstructionMethod.CutAndCover && i > 0 ? volumeLoss/100*area/(Math.sqrt(2*Math.PI)*i) : null;
  // Ideal free circular ring under a uniform mean external pressure. No soil interaction or joints.
  const meanPressure = valid && axis ? (axis.total+axis.horizontal)/2 : null;
  const meanRadius = (d.width-d.wallThickness)/2;
  const ringForce = d.shape === TunnelShape.Circular && meanPressure !== null ? meanPressure*meanRadius : null;
  return { area, clearArea, liningArea: area-clearArea, excavationVol: area*100, crownDepth, axisDepth,
    waterDepth, crown, axis, invert, warnings, pressureAt, settlementMax, troughWidth: i,
    settlementAt: (x: number) => settlementMax === null ? null : settlementMax*Math.exp(-x*x/(2*i*i)),
    ringForce, ringStress: ringForce === null ? null : ringForce/d.wallThickness/1000,
    pressure: axis?.total ?? null };
}


