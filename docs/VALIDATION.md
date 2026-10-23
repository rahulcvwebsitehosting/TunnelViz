# Calculation verification and remaining field validation

Run `npm run benchmark`. Independent equations are compared with the bundled application service. Every comparison prints reference, application value, difference and unit with a tolerance of 1e-8. This checks implementation agreement, not field accuracy.

## Three benchmark examples

Common geometry: circular 6 m excavation, 0.3 m lining, invert 20 m below surface, crown 14 m, axis 17 m. K0 = 0.5, volume loss 0.5%, trough factor K = 0.5. Unit weights are kN/m³.

| Case | Hand total stress at axis | Water pressure | Effective stress | Horizontal total |
|---|---:|---:|---:|---:|
| Dry: 10 × 18 + 7 × 20 | 320 kPa | 0 kPa | 320 kPa | 160 kPa |
| Water 5 m below ground surface: 5 × 18 + 5 × 20 + 7 × 22 | 344 kPa | 117.72 kPa | 226.28 kPa | 230.86 kPa |
| Water 8 m below ground surface: 4 × 17 + 4 × 19 + 2 × 20 + 7 × 22 | 338 kPa | 88.29 kPa | 249.71 kPa | 213.145 kPa |

Area = 28.27433388 m²; i = 8.5 m; peak settlement = 6.63519249 mm. The comparator covers area, cover, axis depth, four axis stresses, peak settlement and trough width. Other outputs are not yet covered by a complete independent benchmark.

## Focused sensitivity study

The benchmark prints 27 combinations of axis depths 10/17/25 m, volume loss 0.25/0.5/1% and K 0.3/0.5/0.7. Diameter remains 6 m. At fixed loss/K, increasing axis depth from 10 to 25 m reduces peak settlement to 40%. Doubling loss doubles every ordinate. Increasing K from 0.3 to 0.7 reduces the peak to 3/7 while expanding width by 7/3.

These effects follow from i = Kz and Smax = VL A / (sqrt(2π)i). Integrated settlement is VL A: depth and K redistribute volume. This does not establish that deeper tunnels lose less ground. Soil stiffness, face support, consolidation and construction control are not predicted.

## Measured-profile evaluation: outstanding

Correct source: [Simulation of Surface Settlement Induced by Parallel Mechanised Tunnelling (2023)](https://www.mdpi.com/2071-1050/15/17/13265). An earlier draft attributed its results to a different paper; that error has been removed. Published numerical-model errors are not TunnelViz errors.

No verified marker dataset is bundled and no held-out field prediction has been performed. Obtain original readings or independently checked figure digitisation, record coordinates and construction stage, fit volume loss/K only on designated calibration sections, then lock those parameters. Report MAE, bias, maximum error and R² on separate evaluation sections. Final twin-tunnel measurements cannot directly validate this single-tunnel predictor.

## Site planning scope

The site panel adds constant-section quantities, grade correction, construction fresh-air screening, water pump input power and metre-based R12 DXF sections. Exports preserve inputs and units. Ventilation uses [OSHA 1926.800(k)(2–3)](https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.800), a US reference floor, not a local compliance determination. Broader scope: [FHWA](https://www.fhwa.dot.gov/bridge/tunnel/pubs/nhi09010/tunnel_manual.pdf) and [PIARC](https://tunnelsmanual.piarc.org/en/strategy-and-general-design).

Outstanding: structural limit states, joints, reinforcement, face stability, ground/support interaction, fire/smoke evacuation, equipment-specific ventilation, measured inflow, sump redundancy and monitoring alarms. Suitable for preliminary exploration and calculation review, not construction authorization. DXF targets R12 compatibility; an AutoCAD application round-trip has not been performed.
