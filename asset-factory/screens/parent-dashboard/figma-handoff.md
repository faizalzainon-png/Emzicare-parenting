# Figma Handoff — Parent Dashboard

Generated: 2026-07-17T17:07:14.529Z
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
| Asset file | `assets/eq-greeting-companion.png` |
| Asset class | reusable_asset |
| Reuse scope | global — do NOT duplicate-generate for other screens, reuse this file |
| Must include | isolated approved EQ pose; glowing lantern; raised fist; locked EQ Character DNA |
| Must NOT include | landscape; cards; text; UI; extra characters |
| Native UI overlay | greeting text,momentum pill,dashboard card |
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
| Actual source resolution | 1024×1024 |

### Dashboard — Hero Landscape

| Field | Value |
|---|---|
| Asset file | `assets/hero-landscape.webp` |
| Asset class | composite_artwork |
| Reuse scope | screen_only |
| Must include | genuine wide blue-sky landscape; soft clouds; rolling green hills and trees; distant mosque domes/minaret on the right; safe open area for EQ placement |
| Must NOT include | EQ; text; buttons; cards; navigation |
| Native UI overlay | greeting,notification/profile controls,EQ cutout,momentum pill |
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
| Actual source resolution | 2688×1520 |

### Dashboard — Family Quest Card Artwork

| Field | Value |
|---|---|
| Asset file | `assets/family-quest-island.webp` |
| Asset class | composite_artwork |
| Reuse scope | screen_only |
| Must include | sky and soft clouds; floating island; cream-and-teal mosque; crescent moon; green flag with golden heart; cohesive dashboard lighting |
| Must NOT include | text; CTA button; card border; navigation |
| Native UI overlay | Family Quest title,descriptive text,CTA button |
| Intended UI section | Family Quest card |
| Placement notes | Full card background artwork; Family Quest title, descriptive text and CTA button are native components overlaid on top. |
| Recommended rendered width | 1200px (design scale) |
| Alignment | full-bleed within the card |
| Anchor point | center |
| Crop / object-fit | cover |
| Z-index / layer order | 2 |
| Responsive behaviour | Full-bleed within the card at all widths; crop from edges first; keep the island and mosque within the safe center 70%. |
| Transparent background | no — retains its own background |
| Native components built around it | Family Quest text and button |
| Actual source resolution | 2688×1520 |

### Dashboard — Navigation Home Icon

| Field | Value |
|---|---|
| Asset file | `assets/nav-home-icon.png` |
| Asset class | reusable_asset |
| Reuse scope | global — do NOT duplicate-generate for other screens, reuse this file |
| Must include | simple rounded house/home silhouette icon, premium 3D-lite style matching the established premium 3D-lite icon rendering style |
| Must NOT include | any other icon or object in frame; text, letters, numbers or labels; background scenery; multiple icon variants side by side; the surrounding navigation bar, button, or card |
| Native UI overlay | none — used standalone inside a native nav/button/badge component; active/inactive state color handled natively, never baked into the image |
| Intended UI section | Bottom navigation |
| Placement notes | Single isolated icon placed inside the existing Bottom navigation native component; native component handles layout, active/inactive state, and any label. |
| Recommended rendered width | 256px (design scale) |
| Alignment | centered within its native slot |
| Anchor point | center |
| Crop / object-fit | contain |
| Z-index / layer order | 4 |
| Responsive behaviour | Fixed small icon size; scales with the native component it sits inside. |
| Transparent background | yes — usable alpha required |
| Native components built around it | Bottom navigation |
| Actual source resolution | 1024×1024 |

### Dashboard — Navigation Tasks/Verify Icon

| Field | Value |
|---|---|
| Asset file | `assets/nav-tasks-icon.png` |
| Asset class | reusable_asset |
| Reuse scope | global — do NOT duplicate-generate for other screens, reuse this file |
| Must include | simple rounded checklist/tasks silhouette icon, premium 3D-lite style matching the established premium 3D-lite icon rendering style |
| Must NOT include | any other icon or object in frame; text, letters, numbers or labels; background scenery; multiple icon variants side by side; the surrounding navigation bar, button, or card |
| Native UI overlay | none — used standalone inside a native nav/button/badge component; active/inactive state color handled natively, never baked into the image |
| Intended UI section | Bottom navigation |
| Placement notes | Single isolated icon placed inside the existing Bottom navigation native component; native component handles layout, active/inactive state, and any label. |
| Recommended rendered width | 256px (design scale) |
| Alignment | centered within its native slot |
| Anchor point | center |
| Crop / object-fit | contain |
| Z-index / layer order | 5 |
| Responsive behaviour | Fixed small icon size; scales with the native component it sits inside. |
| Transparent background | yes — usable alpha required |
| Native components built around it | Bottom navigation |
| Actual source resolution | 1024×1024 |

### Dashboard — Navigation Report Icon

| Field | Value |
|---|---|
| Asset file | `assets/nav-report-icon.png` |
| Asset class | reusable_asset |
| Reuse scope | global — do NOT duplicate-generate for other screens, reuse this file |
| Must include | simple rounded ascending bar-chart silhouette icon, premium 3D-lite style matching the established premium 3D-lite icon rendering style |
| Must NOT include | any other icon or object in frame; text, letters, numbers or labels; background scenery; multiple icon variants side by side; the surrounding navigation bar, button, or card |
| Native UI overlay | none — used standalone inside a native nav/button/badge component; active/inactive state color handled natively, never baked into the image |
| Intended UI section | Bottom navigation |
| Placement notes | Single isolated icon placed inside the existing Bottom navigation native component; native component handles layout, active/inactive state, and any label. |
| Recommended rendered width | 256px (design scale) |
| Alignment | centered within its native slot |
| Anchor point | center |
| Crop / object-fit | contain |
| Z-index / layer order | 6 |
| Responsive behaviour | Fixed small icon size; scales with the native component it sits inside. |
| Transparent background | yes — usable alpha required |
| Native components built around it | Bottom navigation |
| Actual source resolution | 1024×1024 |

### Dashboard — Navigation Profile Avatar

| Field | Value |
|---|---|
| Asset file | `assets/nav-profile-avatar.png` |
| Asset class | reusable_asset |
| Reuse scope | global — do NOT duplicate-generate for other screens, reuse this file |
| Must include | friendly generic parent profile avatar portrait, circular-crop-ready, premium 3D-lite style matching the established premium 3D-lite icon rendering style |
| Must NOT include | any other icon or object in frame; text, letters, numbers or labels; background scenery; multiple icon variants side by side; the surrounding navigation bar, button, or card |
| Native UI overlay | none — used standalone inside a native nav/button/badge component; active/inactive state color handled natively, never baked into the image |
| Intended UI section | Header / greeting area |
| Placement notes | Single isolated icon placed inside the existing Header / greeting area native component; native component handles layout, active/inactive state, and any label. |
| Recommended rendered width | 256px (design scale) |
| Alignment | centered within its native slot |
| Anchor point | center |
| Crop / object-fit | contain |
| Z-index / layer order | 7 |
| Responsive behaviour | Fixed small icon size; scales with the native component it sits inside. |
| Transparent background | yes — usable alpha required |
| Native components built around it | Headline |
| Actual source resolution | 1024×1024 |

### Dashboard — Momentum Star Icon

| Field | Value |
|---|---|
| Asset file | `assets/momentum-star-icon.png` |
| Asset class | reusable_asset |
| Reuse scope | global — do NOT duplicate-generate for other screens, reuse this file |
| Must include | rounded-square badge with a golden star centered on it, premium 3D-lite style matching the established premium 3D-lite icon rendering style |
| Must NOT include | any other icon or object in frame; text, letters, numbers or labels; background scenery; multiple icon variants side by side; the surrounding navigation bar, button, or card |
| Native UI overlay | none — used standalone inside a native nav/button/badge component; active/inactive state color handled natively, never baked into the image |
| Intended UI section | Streak card |
| Placement notes | Single isolated icon placed inside the existing Streak card native component; native component handles layout, active/inactive state, and any label. |
| Recommended rendered width | 256px (design scale) |
| Alignment | centered within its native slot |
| Anchor point | center |
| Crop / object-fit | contain |
| Z-index / layer order | 8 |
| Responsive behaviour | Fixed small icon size; scales with the native component it sits inside. |
| Transparent background | yes — usable alpha required |
| Native components built around it | Streak card |
| Actual source resolution | 1024×1024 |

### Dashboard — Verify Clipboard Icon

| Field | Value |
|---|---|
| Asset file | `assets/verify-clipboard-icon.png` |
| Asset class | reusable_asset |
| Reuse scope | global — do NOT duplicate-generate for other screens, reuse this file |
| Must include | rounded clipboard icon with a checkmark, premium 3D-lite style matching the established premium 3D-lite icon rendering style |
| Must NOT include | any other icon or object in frame; text, letters, numbers or labels; background scenery; multiple icon variants side by side; the surrounding navigation bar, button, or card |
| Native UI overlay | none — used standalone inside a native nav/button/badge component; active/inactive state color handled natively, never baked into the image |
| Intended UI section | Verify row |
| Placement notes | Single isolated icon placed inside the existing Verify row native component; native component handles layout, active/inactive state, and any label. |
| Recommended rendered width | 256px (design scale) |
| Alignment | centered within its native slot |
| Anchor point | center |
| Crop / object-fit | contain |
| Z-index / layer order | 9 |
| Responsive behaviour | Fixed small icon size; scales with the native component it sits inside. |
| Transparent background | yes — usable alpha required |
| Native components built around it | Verify row |
| Actual source resolution | 1024×1024 |

### Dashboard — Family Streak Fire Icon

| Field | Value |
|---|---|
| Asset file | `assets/family-streak-fire-icon.png` |
| Asset class | reusable_asset |
| Reuse scope | global — do NOT duplicate-generate for other screens, reuse this file |
| Must include | soft rounded flame shape, premium 3D-lite style matching the established premium 3D-lite icon rendering style |
| Must NOT include | any other icon or object in frame; text, letters, numbers or labels; background scenery; multiple icon variants side by side; the surrounding navigation bar, button, or card |
| Native UI overlay | none — used standalone inside a native nav/button/badge component; active/inactive state color handled natively, never baked into the image |
| Intended UI section | Streak card |
| Placement notes | Single isolated icon placed inside the existing Streak card native component; native component handles layout, active/inactive state, and any label. |
| Recommended rendered width | 256px (design scale) |
| Alignment | centered within its native slot |
| Anchor point | center |
| Crop / object-fit | contain |
| Z-index / layer order | 10 |
| Responsive behaviour | Fixed small icon size; scales with the native component it sits inside. |
| Transparent background | yes — usable alpha required |
| Native components built around it | Streak card |
| Actual source resolution | 1024×1024 |
