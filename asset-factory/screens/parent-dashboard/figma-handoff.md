# Figma Handoff — Parent Dashboard

Generated: 2026-07-16T12:52:34.494Z
Source reference: `master-reference.png` (composition/style reference ONLY)

## ⚠️ Rules for whoever builds this screen

- **Do NOT flatten the master screenshot into the design.** It is a reference, never a production layer.
- **Do NOT crop anything out of the master screenshot.** Every illustration below exists as its own high-resolution file in `assets/`.
- All text, buttons, cards, rings, navigation and backgrounds listed under "Native UI" must be built as real Figma/React components, never as images.
- Rebuild the approved composition exactly — do not redesign it.

## Native UI components (build in Figma/React, never generate as images)

- **Greeting** — Text component (personalised salutation). Native text, never an image.
- **Headline** — Text component. Native text, never an image.
- **Progress rings** — SVG/CSS ring components with animated stroke. Never generated as image.
- **Streak card** — Card component: background, radius, shadow via CSS; streak number and label are native text.
- **Verify row** — Native row component with SVG icon and text.
- **Family Quest text and button** — Native text + button component. The button is never part of any generated image.
- **Bottom navigation** — Native nav bar with existing SVG icon set.

## Generated illustration assets

### Dashboard — EQ Greeting Companion

| Field | Value |
|---|---|
| Asset file | `assets/eq-greeting-companion.png (pending approval)` |
| Intended UI section | Header / greeting area |
| Placement notes | To the right of the greeting and headline text block, bottom-aligned with the header section. |
| Recommended rendered width | 480px (design scale) |
| Alignment | right edge of header content, baseline-aligned with headline |
| Anchor point | bottom-right |
| Crop / object-fit | contain |
| Z-index / layer order | 3 |
| Responsive behaviour | Scales down to 96px width on small screens; hide below 320px viewport rather than shrinking further. |
| Transparent background | yes — usable alpha required |
| Native components built around it | Greeting, Headline |
| Actual source resolution | 2880×2880 |

### Dashboard — Hero Landscape

| Field | Value |
|---|---|
| Asset file | `assets/hero-landscape.png (pending approval)` |
| Intended UI section | Hero band |
| Placement notes | Full-width band directly under the header greeting area, behind no interactive elements; progress rings sit below it, not on top of it. |
| Recommended rendered width | 880px (design scale) |
| Alignment | full-bleed horizontally, top-anchored in the hero band |
| Anchor point | center |
| Crop / object-fit | cover |
| Z-index / layer order | 1 |
| Responsive behaviour | Full-bleed at all widths; crop from bottom first; keep mosque silhouettes (right) and open character space (center-left) inside the safe area. |
| Transparent background | no — retains its own background |
| Native components built around it | Headline, Progress rings |
| Actual source resolution | 2480×3312 |

### Dashboard — Family Quest Floating Island

| Field | Value |
|---|---|
| Asset file | `assets/family-quest-island.png (pending approval)` |
| Intended UI section | Family Quest card |
| Placement notes | Right side of the Family Quest card, vertically centered; quest text and button sit to its left as native components. |
| Recommended rendered width | 512px (design scale) |
| Alignment | right-aligned inside the card with 16px inset |
| Anchor point | center-right |
| Crop / object-fit | contain |
| Z-index / layer order | 2 |
| Responsive behaviour | Scales with card height; minimum 72px rendered width; never overlaps the native button. |
| Transparent background | yes — usable alpha required |
| Native components built around it | Family Quest text and button |
| Actual source resolution | 2880×2880 |
