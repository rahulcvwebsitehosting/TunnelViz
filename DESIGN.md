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
