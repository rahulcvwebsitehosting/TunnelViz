# TunnelViz

Interactive tunnel engineering education app, using React, Three.js and TypeScript.

## Run

Use Node.js 22.12+ or 24 and run `npm ci`, then `npm run dev`. Verify with `npm test`, `npm run typecheck` and `npm run build`.

## Geometry and engineering

The designer supports circular TBM, arched NATM, and rectangular cut-and-cover sections, with actual lining thickness, staggered segment joint markings, rock bolts, service walkways, lighting, and overview / section / interior cameras. Fixtures illustrate scale rather than compliance with a particular road or railway standard.

The shared model in `services/engineering.ts` drives quantities and geometry. Dimensions describe the **outer excavation envelope**. Circular height always equals diameter. Depth means depth below ground to the outer invert at the centre of the displayed alignment. Water level is relative to the crown there. The displayed alignment spans 40 m horizontally along an arc, with entered radius and grade.

Implemented preliminary calculations:

- Layer-integrated vertical stress, splitting moist and saturated unit weights at the water table, with surface surcharge and ponded water weight.
- Hydrostatic pressure, effective vertical stress and entered K₀ lateral stress.
- Excavation / internal / lining areas and in-situ excavation volume per 100 m of tunnel. Bulking is not included.
- Gaussian greenfield soil settlement, using explicitly entered volume loss and trough-width factor. Disabled for rock-intersecting sections, cut-and-cover, above-ground crowns and insufficient geology.
- Ideal continuous circular ring membrane force and compression under mean pressure. This is not a capacity or jointed-lining design check.

The arched profile consists of vertical walls, a flat invert, and a semi-elliptical roof. Its nominal thickness is an inset of the horizontal and vertical semi-axes; it is not a constant-normal offset along an elliptical roof. Rendered curves are polygonal approximations of the analytical sections. Construction hardware is schematic, not fabrication geometry. The geology view places the log beside the tunnel for visibility; it is not an excavated solid ground mesh.

No finite-element solver, plasticity, face-stability calculation, rock mass deformation, consolidation, seepage-rate model, structural bending/capacity check, or ventilation/fire analysis is implemented. The app does not infer support pressure or stand-up time from a material label. Water does not automatically produce leakage through a sealed lining. Method comparison costs and production rates are explicitly illustrative, uncalibrated assumptions; dimensions and geology now come from the selected design.

## Research

The unlocked Research & calculation methods learning module and the engineering panel link FHWA guidance, ITA segmental lining guidance, 2025 ITA BIM guidance, and selected 2026 research papers. Each entry identifies whether it supplies an implemented baseline, a limitation, or a research summary. The review dated 20 October 2026 is curated, not exhaustive or automatically updated. Recent machine-learning methods are **not** represented as implemented trained models: reproducing them requires datasets, trained weights and site calibration.

## Verification

Numerical regression checks cover dry / saturated / ponded layered loads, partial groundwater submergence, surcharge, settlement symmetry and volume conservation, cross-section area agreement, circular-diameter independence from stored height, unsupported domains, ring unit conversions and alignment grade. Ten Playwright browser tests cover the studio, invalid inputs, save/reload, export, method changes, groundwater, keyboard navigation, sources and responsive layouts at 390/768/1440 px. Run them with `npm run build` followed by `npm run test:e2e` (install Chromium once with `npx playwright install chromium`). These checks establish implementation consistency, not field validation.

The AI tutor, Gemini SDK, API-key injection and external Tailwind CDN have been removed. No API key is required. Projects are saved locally in this browser with a versioned schema and can be exported as JSON. Storage recovery rejects invalid files and falls back to a fresh design. Save before closing the tab; unsaved changes trigger the browser's standard leave-page warning.

The refreshed studio groups inputs into Geometry, Ground and Analysis. The larger viewport opens in the interior view and includes overview, section and camera reset controls. Reference chapters are accessible without XP locks. Detailed audit findings and verification limits are in `docs/BUG_ANALYSIS.md`.
