/**
 * Independent hand-check benchmark for TunnelViz's current settlement/load model.
 * Reference equations below are independent of the application service.
 * The service is bundled separately for the actual-versus-reference comparison.
 * Units: m, kN, kPa, kN/m³. Settlement is reported in mm.
 */
import assert from 'node:assert/strict';
import { build } from 'esbuild';
await build({entryPoints:['services/engineering.ts'],outfile:'.test-output/benchmark-engineering.mjs',bundle:true,platform:'node',format:'esm'});
const { evaluateTunnel } = await import('../.test-output/benchmark-engineering.mjs');

const gammaW = 9.81;
const area = Math.PI * 6 ** 2 / 4;
const axisDepth = 17;
const crownDepth = 14;

function handCheck({ waterDepth, layers, surcharge = 0, k0 = 0.5, vl = 0.5, troughK = 0.5 }) {
  let top = 0, total = surcharge;
  for (const layer of layers) {
    const bottom = Math.min(axisDepth, top + layer.thickness);
    const dz = Math.max(0, bottom - top);
    const saturated = Math.max(0, bottom - Math.max(top, waterDepth));
    total += (dz - saturated) * layer.moist + saturated * layer.saturated;
    top += layer.thickness;
    if (top >= axisDepth) break;
  }
  const water = gammaW * Math.max(0, axisDepth - waterDepth);
  const effective = total - water;
  const horizontal = k0 * effective + water;
  const i = troughK * axisDepth;
  const settlement = (vl / 100) * area / (Math.sqrt(2 * Math.PI) * i) * 1000;
  return { area, crownDepth, axisDepth, total, water, effective, horizontal, settlement, troughWidth: i };
}

const cases = [
  {
    id: 'dry-two-layer', waterDepth: 34,
    layers: [{ thickness: 10, moist: 18, saturated: 20 }, { thickness: 40, moist: 20, saturated: 22 }],
    expected: { total: 320, water: 0, effective: 320, horizontal: 160 }
  },
  {
    id: 'partial-saturation', waterDepth: 5,
    layers: [{ thickness: 10, moist: 18, saturated: 20 }, { thickness: 40, moist: 20, saturated: 22 }],
    expected: { total: 344, water: 117.72, effective: 226.28, horizontal: 230.86 }
  },
  {
    id: 'layered-ground', waterDepth: 8,
    layers: [
      { thickness: 4, moist: 17, saturated: 19 },
      { thickness: 6, moist: 19, saturated: 20 },
      { thickness: 30, moist: 21, saturated: 22 }
    ],
    expected: { total: 338, water: 88.29, effective: 249.71, horizontal: 213.145 }
  }
];

for (const benchmark of cases) {
  const actual = handCheck(benchmark);
  for (const key of Object.keys(benchmark.expected)) assert.ok(Math.abs(actual[key] - benchmark.expected[key]) < 1e-9, `${benchmark.id}.${key}`);
  console.log(JSON.stringify({ id: benchmark.id, ...actual }));
  const design={shape:'Circular',width:6,height:6,wallThickness:0.3,depth:20,method:'TBM',segmentCount:6,ringWidth:1.5,boltLength:3,boltSpacing:1.5,horizontalRadius:1000,verticalGrade:0};
  const model=evaluateTunnel(design,benchmark.layers.map((l,j)=>({id:String(j),type:'Sand',thickness:l.thickness,density:l.moist,saturatedUnitWeight:l.saturated,color:'#aaa',permeability:'Low'})),{waterTableLevel:14-benchmark.waterDepth});
  const values={area:model.area,crownDepth:model.crownDepth,axisDepth:model.axisDepth,...model.axis,settlement:model.settlementMax*1000,troughWidth:model.troughWidth};
  for(const [quantity,expected] of Object.entries(actual)){
    const difference=values[quantity]-expected;
    assert.ok(Math.abs(difference)<1e-8,`${benchmark.id}: ${quantity}, difference ${difference}`);
    console.log(JSON.stringify({case:benchmark.id,quantity,reference:expected,tunnelviz:values[quantity],difference,unit:['total','water','effective','horizontal'].includes(quantity)?'kPa':quantity==='settlement'?'mm':quantity==='area'?'m²':'m'}));
  }
}
for(const depth of [10,17,25])for(const loss of [0.25,0.5,1])for(const k of [0.3,0.5,0.7]){
 const i=k*depth, peak=(loss/100)*area/(Math.sqrt(2*Math.PI)*i)*1000;
 console.log(JSON.stringify({study:true,axisDepth_m:depth,volumeLoss_percent:loss,K:k,i_m:i,peak_mm:peak,settlementVolume_m2:loss/100*area}));
}
console.log('Independent benchmark checks passed.');
