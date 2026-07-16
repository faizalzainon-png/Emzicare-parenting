# EQrel Screen-to-Asset Factory

Local internal tool: turns an **approved EQrel screen concept** into the small
number of high-quality **individual illustration assets** needed to recreate that
screen in Figma and Base44.

It never generates complete UI screens as final images, never crops assets out of
the approved screenshot, and never generates anything before Faizal approves the
screen manifest. The approved screenshot is used only as a composition/style
reference; every asset is regenerated independently at high resolution with
Higgsfield **GPT Image 2** (`gpt_image_2` — locked, no silent fallback).

## Run (local machine, no cloud, no auth)

```bash
cd asset-factory
npm install            # installs server + client workspaces
npm run server         # backend on http://localhost:5178
npm run client         # UI on http://localhost:5173 (separate terminal)
```

Generation jobs are executed by a local Claude Code session with the Higgsfield
MCP connected — see **WORKER.md** for the exact protocol. The web UI queues jobs
and reviews results; the worker session does the MCP calls; the backend downloads
and files everything.

## Workflow

1. **Import** an approved screen (master image + name + category + EQ Master
   Reference + environment style references).
2. **Decompose** into native UI vs. generated assets in `screen-manifest.json`
   (editable in the UI). Rule: generate only what cannot reasonably be built as
   native React/Figma UI.
3. **Approve** the manifest (blocked until the master reference and every
   referenced file exist).
4. **Generate** each asset individually — draft (1k/low) first, final (4k/high)
   after composition is chosen. Cost preflight is mandatory; prompts are logged
   before submission; actual output dimensions are recorded from the API.
5. **Background removal** runs only where the manifest requires it
   (characters/floating objects usually yes, landscapes usually no).
6. **Review** every attempt: approve / reject / regenerate. Stop-loss: 3 attempts
   per asset, then the asset is parked unless a human forces another round.
7. **Export**: `screens/<slug>/` is the package (see layout below), downloadable
   as a zip, including `figma-handoff.md` with exact placement guidance.

## Package layout

```
screens/<screen-slug>/
├── master-reference.png    # approved concept (reference only, never a layer)
├── screen-manifest.json    # editable decomposition + generation state
├── assets/                 # final approved assets, one file per asset
├── raw/                    # every downloaded attempt (+ cutouts)
├── prompts/                # full prompt + params logged per attempt
├── previews/               # small webp previews
├── references/             # EQ master + style references
└── figma-handoff.md        # placement, anchors, z-order, responsive notes
```

## Hard rules enforced by the backend

- one request = one asset; no sheets, collages, or full screens
- no embedded text/labels (baked into every prompt)
- model locked to `gpt_image_2`; worker must fail rather than substitute
- generation refuses to run without an approved manifest
- generation refuses to run if any required reference file is missing
- editing a manifest drops its approval automatically
- approving a cutout-required asset without usable alpha is rejected
- nothing is ever auto-approved

## Pilot

`screens/parent-dashboard/` is pre-seeded with the decomposition (7 native UI
components, 3 generated assets: EQ Greeting Companion, Hero Landscape, Family
Quest Floating Island). It is blocked awaiting the master design upload and
Faizal's manifest approval — by design.
