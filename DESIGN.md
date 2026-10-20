# TunnelViz interface system

This documents the implemented design studio, rather than proposing a new visual direction.

## Purpose and layout

An engineering editing workspace with the tunnel as its central artifact. The desktop layout uses a 300 px parameter column and a flexible model column. On narrow screens the model comes first, with an Edit parameters link to the controls. Geometry, Ground and Analysis are grouped separately; the advanced equations and detailed results expand below the viewport.

## Visual tokens

- Native type: Segoe UI, Arial, sans-serif; tabular figures for numeric values.
- Ink: `#18343c`; body text: `#203540`; secondary text: `#60727b`.
- Ground: `#f3f5f6`; panels: white; borders: `#dce3e6`.
- Action and selection accent: `#087e80`; primary button: `#183c45`.
- Main grid gap: 22 px; page gutter: 32 px desktop, 14 px phone.
- Panel radius: 10 px; field radius: 6 px; fields use explicit labels and units.
- Scene materials use muted concrete, steel, pavement, pipe and signage colors. They illustrate construction detail independently of the UI palette.

## Interaction

Data-entry errors stay next to the field. Invalid drafts never reach the project model. Tabs support arrow/Home/End navigation. Saving is explicit, local and accompanied by status feedback. Reset asks inline because it replaces the current parameters. Ordinary editing stays immediate; no staged entrance animation delays the workspace. Reduced-motion preferences are respected.

## Verification

The implementation has screenshot evidence at 390, 768 and 1440 px and a Playwright workflow suite. See `docs/BUG_ANALYSIS.md` for scope and limits.


## Motion and scene refinement — 20 October 2026

Uses Impeccable, Taste Skill's app-screen guidance and Emil's animation guidance.
The screen answers: what does this selected tunnel look like, and what does its geometry imply?
The product signature is a measured section preview beside the full-size navigable alignment.
The existing native type and teal/stone palette are retained; no new font or animation dependency.

Camera views transition over 500 ms for pointer actions, interrupted by direct canvas interaction.
Keyboard view changes are immediate. Walk through is opt-in, follows the selected alignment at a
nominal 1.4 m/s, stops at the model end, and pauses on Escape, drag, scroll, hidden tab, or geometry
change. Reduced motion disables travel and camera transitions by default; an explicit preview-only override enables the camera without changing system preferences. Idle rendering stays demand-driven.
Buttons use 160 ms feedback; the save notice uses a 250 ms entrance. Data values never count up.

Concrete segment UVs follow circumference and longitudinal distance to avoid springline stretching.
Luminaires include housings; bolts include washers; services include clamps and tray rungs.
These are illustrative details, not additional engineering calculations or clearance validation.
The preview section uses the same profile function as the tunnel geometry.


## Dimensional interface

The user's request for a more animated, three-dimensional UI extends the visual system beyond
camera motion. Method selectors contain five-layer CSS 3D section models which separate on
pointer hover. Raised surfaces and recessed fields communicate control depth; engineering data
remains stationary. Navigation and parameter selection use sliding backgrounds. Pointer-driven
page transitions tilt back from the top edge and settle over 350 ms; parameter/chapter content
changes over 200 ms. Keyboard navigation is immediate. Native disclosures animate height only
where interpolate-size is supported, with an ordinary disclosure fallback.

The header's Interface motion control defaults to the OS preference and can override it for the
current session. Turning it off cancels in-progress content animations and removes CSS transitions.
Camera motion has its separate preview control. No animation library or additional WebGL canvas
was added. The 768 px header wraps navigation into its own row. Layouts verified at 390/768/1440 px.
