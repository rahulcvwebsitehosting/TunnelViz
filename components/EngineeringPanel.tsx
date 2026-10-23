import React from 'react';
import { SitePanel } from './SitePanel';
import { evaluateTunnel } from '../services/engineering';
import { engineeringReferences, RESEARCH_REVIEW_DATE } from '../data/research';
import type { TunnelDesign, GeologicalLayer, SimulationSettings } from '../types';
const fmt = (n: number | null | undefined, unit: string, digits = 1) => n == null ? 'Unavailable' : `${n.toFixed(digits)} ${unit}`;
export function EngineeringPanel({design,layers,simulation,onChange}: {design:TunnelDesign;layers:GeologicalLayer[];simulation:SimulationSettings;onChange:(s:SimulationSettings)=>void}) {
 const m = evaluateTunnel(design,layers,simulation);
 return <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 text-sm">
  <h3 className="font-bold text-slate-800">Engineering model</h3>
  <p className="text-xs text-slate-500">Preliminary, static estimates at mid-length. Outer excavation dimensions; depth to outer invert. All units are SI. No safety or capacity certification.</p>
  {([
    ['surcharge','Surface surcharge (kPa)',0,200,5,0],
    ['earthPressureCoefficient','At-rest stress ratio K₀',0.2,2,0.05,0.5],
    ['volumeLossPercent','Volume loss (%)',0,5,0.05,0.5],
    ['troughWidthFactor','Trough factor K',0.2,0.8,0.025,0.5],
  ] as const).map(([key,label,min,max,step,fallback]) => <label key={key} className="block text-xs text-slate-600">{label}: <strong>{simulation[key] ?? fallback}</strong><input aria-label={label} className="block w-full accent-blue-600 mt-2" type="range" min={min} max={max} step={step} value={simulation[key] ?? fallback} onChange={e=>onChange({...simulation,[key]:Number(e.target.value)})}/></label>)}
  <dl className="space-y-2 text-xs">{[
   ['Cover to crown',fmt(m.crownDepth,'m')],['Clear internal area',fmt(m.clearArea,'m²',2)],['Concrete / metre',fmt(m.liningArea,'m³/m',2)],
   ['Total vertical σv at axis',fmt(m.axis?.total,'kPa')],['Effective vertical σ′v',fmt(m.axis?.effective,'kPa')],
   ['Horizontal total σh',fmt(m.axis?.horizontal,'kPa')],['Water pressure at crown',fmt(m.crown?.water,'kPa')],['Water pressure at invert',fmt(m.invert?.water,'kPa')],
   ['Gaussian Smax',fmt(m.settlementMax === null ? null : m.settlementMax*1000,'mm',2)],['Trough width i = Kz₀',fmt(m.troughWidth,'m')],
   ['Ideal mean ring thrust',fmt(m.ringForce,'kN/m')],['Ideal membrane compression',fmt(m.ringStress,'MPa',2)]
  ].map(([name,value])=><div key={name} className="flex justify-between gap-3 border-b border-slate-100 pb-1"><dt>{name}</dt><dd className="font-mono text-right">{value}</dd></div>)}</dl>
  {m.warnings.map(w=><p key={w} className="bg-amber-50 text-amber-900 p-2 rounded text-xs">{w}</p>)}
  <details className="text-xs text-slate-600"><summary className="cursor-pointer font-bold">Equations & applicability</summary><div className="space-y-2 mt-3">
   <p>σv = q + Σγⱼhⱼ; u = 9.81 max(z − zw, 0); σ′v = σv − u; σh = K₀σ′v + u. Layers split at the water table use their entered moist and saturated unit weights.</p>
   <p>S(x) = Smax exp(−x² / 2i²); i = Kz₀; Smax = VL A / (√(2π)i). VL is a fraction, z₀ the axis depth. Greenfield soil approximation, no buildings, consolidation, twin tunnels or rock deformation.</p>
   <p>N = pmean Rmean; σ = N/t. Ideal continuous circular membrane under uniform mean pressure only; no joints, bending, buckling, reinforcement or construction loading. Bending requires a structural solver and is intentionally unavailable.</p>
   <p>Volume loss and K₀ are entered assumptions, not inferred from construction method. Bolt and segment settings change geometry, not a claimed capacity. Groundwater alone does not imply leakage through a sealed lining.</p>
  </div></details>
  <details className="text-xs"><summary className="cursor-pointer font-bold">Studies & sources · reviewed {RESEARCH_REVIEW_DATE}</summary><p className="my-3 text-slate-500">Curated primary sources, not an exhaustive or continuously updated literature review. Research summaries are distinguished from implemented calculations.</p>{engineeringReferences.map(r=><article key={r.url} className="border-t py-3 space-y-1"><a className="text-blue-700 underline" href={r.url} target="_blank" rel="noreferrer">{r.title} ({r.year})</a><p className="font-semibold">{r.status}</p><p className="text-slate-500">{r.detail}</p></article>)}</details>
 <SitePanel design={design}/>
 </section>;
}
