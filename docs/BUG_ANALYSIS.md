# TunnelViz bug analysis and verification

Reviewed 20 October 2026. This report covers the local React/Vite app, its 3D scene, calculations, data entry, storage, navigation, dependency audit and responsive layout. It records implementation defects and usability problems found during this change; it is not a tunnel-design certification.

## Findings addressed

| Severity | Before | After | Why / verification |
| --- | --- | --- | --- |
| High | The non-working tutor depended on a Gemini API key injected into frontend code. | Tutor controls, chat state, service, SDK dependency and key injection removed. | No API key or AI network request is needed; the browser test checks that no tutor remains. |
| High | Save Design only displayed a toast and awarded XP; nothing was persisted. | Save project writes a versioned local project and restores it on reload. | Browser test edits diameter, saves, reloads and checks both the value and updated area. |
| Medium | Stored data had no validated recovery path. | A parser rejects corrupt JSON, unsupported versions, invalid dimensions, fractional segments, duplicate layer IDs and invalid material properties. Storage errors receive an actionable message. | Project regression suite checks round-trips and failure cases. |
| Medium | Numeric controls could admit fractional segment counts and unclear invalid drafts. | Inputs validate on commit with a visible, field-associated error; invalid drafts never update the model. | Browser test enters 6.5 segments, sees the error and corrects the value. |
| Medium | Leaving the page could silently lose unsaved work. | A changed project is visibly marked and registers the browser's before-unload warning. Export provides a JSON copy. | Save status and downloaded JSON content are tested. |
| Medium | Styling depended on a live Tailwind CDN; an import map listed versions inconsistent with npm dependencies. | CSS is compiled locally using Tailwind's Vite integration; the import map and CDN script are gone. | The production build emits local CSS and JS. |
| High | Dependency audit found vulnerable development packages. | Vite, its React plugin and the styling toolchain were upgraded; obsolete PostCSS setup and unused dependencies were removed. | The final npm audit reports zero known vulnerabilities. This is a package audit, not a penetration test. |
| Medium | Important navigation labels were hidden behind icons and learning chapters were gated by XP. | Three labeled destinations open the design studio, method comparison and reference library. Chapters are directly accessible. | Browser test opens research and its primary-source link. |
| Medium | The studio used several narrow panels, nested scrolling and repeated controls. | Geometry, Ground and Analysis share one organized parameter panel beside a larger viewport; detailed results expand below it. | Desktop and mobile screenshots verify the new layout. |
| Medium | Parameter tabs had incomplete keyboard behavior. | Arrow keys, Home and End move between tabs with roving focus and associated tab panels. | Browser test moves from Geometry to Ground with the keyboard. |
| Medium | Mobile navigation overflowed at 390 px during the redesign. | Navigation buttons share the available width, with smaller gaps and wrapping labels. | Automated viewport checks pass at 390, 768 and 1440 px. |
| Medium | Phone-sized numeric inputs could trigger iOS focus zoom. | Numeric and select controls use 16 px text at narrow widths; common touch controls have larger targets. | CSS verified; actual iOS hardware was not tested. |
| Medium | A section clip remained perpendicular to world Z even when the alignment curved or graded. | Clip plane and section camera follow the local alignment frame. | Source geometry review plus production rendering. No finite-element interpretation is implied. |
| Medium | The camera had no reset action and its interior position ignored alignment offsets. | Reset view restores a useful framing; the interior camera follows the alignment. | Rendered interior inspected; three view controls remain available. |
| Medium | TBM segment joints were lines over a continuous shell. | The lining now has separate beveled sector meshes, visible seams, staggered joints and bolt fittings. | Interior screenshots show the assembled rings. Quantities remain nominal analytical quantities. |
| Low | Handrails floated without posts; lighting and service details were sparse. | Posts, textured concrete and pavement, service pipe, supported cable tray, drain channels, cabinets and exit signs add scale cues. | Inspected at desktop and phone widths. Fixtures are illustrative, not a compliance layout. |
| Medium | Fittings could crowd very small clear sections. | Service fittings are suppressed when the floor width or internal height cannot accommodate them. | Source check; clearance design still requires a real road/rail envelope. |
| Low | The static scene rendered continuously while idle. | The Canvas renders on demand and the lining is memoized when geometry is unchanged. | Source review; no device-specific frame-rate benchmark is claimed. |
| Medium | Method comparison inferred ground only at the axis, so a mixed excavation face could appear uniform. | Classification now considers every layer intersecting the excavation envelope. | Browser comparison test verifies the default mixed clay/sand face. |
| Medium | Comparator charts could show an empty, unexplained result when geology did not cover the tunnel. | A clear unavailable-state message identifies missing cover or an insufficient ground log. | Source review; numerical ground-log limits are regression-tested in the engineering model. |
| Medium | Comparison cards shared a fixed row height even when stacked on a phone. | Cards have usable minimum heights and the fixed row height applies only to desktop columns. | Phone comparison test checks that the controls and table fit without horizontal overflow. |
| Low | A Windows encoding regression garbled multiplication signs and separator dots in the scene labels. | The affected file was restored to UTF-8. | Final screenshots show normal symbols. |
| Medium | A failed WebGL scene could take down the main workspace. | A viewport error boundary offers a retry while leaving parameter editing and calculations available. | Source boundary review; the main browser run verifies a working canvas with no runtime exception. |

## Verification performed

- `npm test`: engineering calculations and project-storage regression checks pass.
- `npm run typecheck`: passes.
- `npm run build`: passes with locally generated CSS and lazy-loaded chart/3D chunks.
- `npm run test:e2e`: 10 Playwright Chromium tests pass against the production preview in an isolated origin.
- `npm audit`: zero known vulnerabilities after dependency updates.
- Screenshots: `studio-390.png`, `studio-768.png`, `studio-1440.png`.
- Impeccable source detector: one warning about an Inter font declaration. That unused declaration was removed in favor of the native Segoe UI/Arial stack appropriate to an editing workspace. No claim of a full WCAG audit is made.

The browser checks cover rendering, invalid inputs, save/reload, export/reset, method changes, groundwater changes, keyboard tabs, reference navigation, phone comparison and viewport overflow. Screenshots and a manual browser inspection establish visual evidence. Phone checks use emulated widths; touch gestures and physical iOS/Android hardware were not exercised.

## Practical limits that remain

- WebGL and adequate GPU support are still needed for 3D. The lazy 3D chunk remains large (about 840 kB before gzip); this is the main performance opportunity, despite the much smaller initial application bundle.
- The geotechnical and lining estimates remain preliminary. No jointed-lining solver, support-capacity calculation, failure analysis, calibrated seepage model, ventilation/fire design or field validation has been added.
- Method comparison still uses explicit illustrative assumptions, not local market prices or an engineering recommendation.
- Saving is browser-local and origin-specific. Export JSON before changing browsers, devices or hosting origins. A JSON import UI is not currently provided.
- The audit checks representative workflows and failure cases; it does not prove that every possible browser, GPU, input combination or accessibility requirement is satisfied.
