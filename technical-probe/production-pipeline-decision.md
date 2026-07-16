# EQrel Visual Asset Production — Pipeline Decision Report

Date: 2026-07-16
Author role: senior AI production systems architect (analysis only — nothing built)
Inputs: verified Higgsfield/GPT Image 2 probe (`feasibility-report.md`, `request-response-log.json`), EQ Character DNA spec, EQrel product constraints.

---

## 1. Executive recommendation

**Do not build the custom React + Node Asset Factory. Split production into two pipelines by asset class, because the EQ character and the environment art are fundamentally different manufacturing problems:**

- **Pipeline A — EQ character, child avatars, UI icons: vector-first, AI-free.**
  The EQ DNA spec (exact hex colors, rounded-square head with one signature corner, chevron left eye, round right eye, no fingers) is a *geometric vector specification*, not an art direction. No current image model — with or without seeds — can hold `#00B894` on the left limbs and `#FFB703` on the right limbs across hundreds of generations. Trying to make generative AI reproduce a precise mascot is fighting the tool. Build EQ **once** as an SVG/Figma component "paper-doll rig" (head, eyes, mouth, torso, four limbs, heart as separate parts), assemble poses from parts, export PNG/SVG. Perfect transparency, perfect reproducibility, zero credits, zero drift, forever owned.

- **Pipeline B — environments and organic props (islands, mosques, trees, clouds, rocks): AI generation with a fixed post-processing chain and mandatory human approval.**
  `gpt_image_2` via Higgsfield MCP, orchestrated from **local** Claude Code sessions (not remote sandboxes — that's what unblocks CDN downloads), with: generate on plain background → `remove_background` (accepts the generation `job_id` directly) → optional `upscale_image` → human approve → commit PNG + prompt manifest to a git assets repo. **Git is the system of record, not the chat session** — sessions are disposable workers; the repo carries all durable state.

The "custom Asset Factory app" adds a UI, a server, and a maintenance burden on top of exactly this pipeline while removing none of its bottlenecks (generation latency and human review dominate; a web app speeds up neither).

## 2. Best primary pipeline
The split pipeline above (A for EQ/icons, B for environments). Named here as **"Vector Canon + AI Environments."**

## 3. Best fallback pipeline
**OpenAI Images API directly** (option 4) for the environment class, if Higgsfield availability/quality degrades. Per current knowledge, OpenAI's Images API natively supports `background: "transparent"` and multi-image reference edits — both of which the Higgsfield wrapper strips — plus first-party SLAs. Cost is pay-per-image via API key; requires a ~50-line script (Claude can write and Faizal can run it with one command). **Verify current OpenAI docs for the exact model/params before adopting.** For Pipeline A there is no fallback needed — vector assets don't depend on any vendor.

## 4. Best low-cost pipeline
Pipeline A costs almost nothing after the one-time rig build, and covers the highest-value assets (EQ). For environments on a tight budget: generate drafts at `1k`/`low` (preflight cost with `get_cost` before every submit), only re-render the *approved* composition at `4k`/`high`. Draft-cheap/finalize-expensive typically cuts credit spend 60–80% versus generating everything at top tier.

## 5. Best highest-quality pipeline
**Option 9 hybrid**: commission a human illustrator once for (a) the canonical EQ vector master + pose sheet and (b) a 5–8 image environment "style bible" (one island, one mosque, one tree, one sky, one prop, painted in the target style). Then run Pipeline B using those approved anchors as multi-reference inputs (schema supports it; verify empirically in the pilot) so every AI generation is pulled toward the canonical style. Highest consistency ceiling available today; adds ~1–3k USD one-time cost and 2–4 weeks lead time.

## 6. Options comparison table

Scores 1 (poor) – 5 (excellent).

| Criterion | 1 Custom Factory | 2 Higgsfield UI | 3 Claude+MCP+git | 4 OpenAI API | 5 Hybrid chain | 6 ComfyUI | 7 Blender | 8 Figma vector | 9 Illustrator+AI | 10 Split (rec.) |
|---|---|---|---|---|---|---|---|---|---|---|
| Character consistency | 2 | 2 | 2 | 3 | 3 | 4 | 4 | **5** | 5 | **5** |
| Art quality (environments) | 4 | 4 | 4 | 4 | 4 | 4 | 3 | 2 | 5 | 4–5 |
| Transparency quality | 3 | 3 | 3 | **5** | 4 | 5 | 5 | **5** | 5 | 4–5 |
| Reproducibility | 3 | 2 | 3 | 3 | 3 | **5** | 5 | **5** | 5 | 4–5 |
| Multiple references | 3 | 3 | 3 | 4 | 3 | 5 | n/a | n/a | 4 | 4 |
| Production speed | 3 | 2 | 3 | 4 | 3 | 3 | 1 | 4 | 2 (lead time) | 4 |
| Setup complexity (5=easy) | 1 | 5 | 4 | 3 | 3 | 1 | 1 | 4 | 3 | 4 |
| Operating complexity (5=easy) | 2 | 4 | 4 | 3 | 3 | 1 | 1 | 5 | 4 | 4 |
| Cost predictability | 3 | 3 | 4 | 4 | 4 | 3 | 4 | **5** | 4 | 4–5 |
| Vendor lock-in (5=low) | 2 | 2 | 3 | 3 | 3 | **5** | 5 | 4 | **5** | 4 |
| Local file control | 4 | 2 | **5** | 5 | 5 | 5 | 5 | 4 | 5 | **5** |
| Batch generation | 4 | 1 | 4 | **5** | 4 | 5 | 2 | 3 | 2 | 4 |
| Review/approval workflow | 3 | 2 | 4 (git/PR) | 3 | **5** | 2 | 2 | 4 | 4 | **5** |
| React integration | 4 | 3 | 4 | 4 | 4 | 3 | 3 | **5** (SVG) | 4 | **5** |
| Figma integration | 2 | 2 | 3 (manual upload) | 3 | 3 | 2 | 2 | **5** | 4 | 4–5 |
| Base44 integration | 3 | 3 | 4 (plain files) | 4 | 4 | 3 | 3 | 4 | 4 | 4 |
| Scale to 100s of assets | 4 | 1 | 4 | 4 | 4 | 4 | 2 | 3 | 2 | 4 |
| Maintenance burden (5=low) | 1 | 5 | 4 | 4 | 4 | 1 | 2 | 4 | 4 | 4 |
| Non-coder founder fit | 1 | 5 | 4 | 2 | 3 | 1 | 1 | 4 | 4 | 4 |
| Visual drift risk (5=low) | 2 | 1 | 3 | 3 | 3 | 4 | 4 | **5** | 5 | 4–5 |
| Long-term asset ownership | 4 | 2 | **5** | 5 | 5 | 5 | 5 | **5** | **5** | **5** |

Notes on the table:
- Options 1–5 all inherit gpt_image_2's hard limits (no seed, no native transparency via Higgsfield, ~10–15 min at 4k/high) — a custom app cannot fix any of them.
- Option 5 (hybrid chain) is not really an alternative to 1/3/4; it is a *process layer* that should sit on top of whichever generator is used. The recommended option 10 embeds it.
- Option 6 (ComfyUI) is the only path to true seeds + IPAdapter-grade reference control + a custom style LoRA, but demands a GPU, node-graph literacy, and ongoing model wrangling — the single worst fit for a non-coder founder. Revisit only if EQrel someday needs thousands of on-style assets and has hired a technical artist.
- Option 7 (Blender) gives perfect alpha and infinite re-renders of reusable props, but the modeling skill barrier makes it a "phase 3, if ever" option; the `generate_3d` (image→GLB) tool is a cheaper future experiment for the floating islands.
- Option 2 (Higgsfield web UI) is fine for *exploration* but has no batch story, weak file discipline, and encourages the drift the brief is trying to kill.

## 7. Technical architecture for the recommended option

```
┌──────────────────────── eqrel-assets (git repo, system of record) ───────────────────────┐
│  /canon/eq/            EQ SVG master + paper-doll parts + pose exports (Pipeline A)      │
│  /canon/style-bible/   approved anchor environment images (references for Pipeline B)    │
│  /assets/<class>/<name>/  final approved PNGs (raw + transparent + web-sized)            │
│  /assets/<class>/<name>/manifest.json  prompt, model, params, job_id, cost, approver,    │
│                                        date, post-processing steps (reproducibility log) │
│  /rejected/            kept for 30 days for comparison, then pruned                      │
└───────────────────────────────────────────────────────────────────────────────────────────┘
        ▲ commits (human-approved only)
        │
  LOCAL Claude Code session (normal network ⇒ CDN downloads work; sessions are disposable)
        │
  Pipeline B loop per asset:
    brief → prompt template (per asset class) → get_cost preflight → generate_image
    (gpt_image_2, draft 1k/low) → poll job_display → human picks composition →
    re-render 4k/high → remove_background(job_id) → [upscale_image if needed] →
    download rawUrl → visual QA vs style bible → commit + manifest
        │
  Figma: approved PNGs manually dragged into an "EQrel Asset Library" page
  (minutes per batch; Figma stays source of truth for Parent Mode UI; no fragile automation)
        │
  React app / Base44: consumes /assets and /canon exports as plain files (no runtime
  dependency on Higgsfield, Claude, or any AI service)
```

Pipeline A architecture: EQ master lives as Figma components (and mirrored SVG in `/canon/eq/`). Poses = recombinations of parts, never redraws. Exports at any resolution with true alpha. Claude can draft the initial SVG rig from the DNA spec for Faizal to approve; a freelance vector illustrator can polish it if needed.

## 8. Operational workflow, brief → approved asset (Pipeline B)

1. **Brief** (1 line in an assets-todo list in the repo): "floating island, small, with one palm tree, style-bible palette."
2. **Prompt assembly**: Claude fills the fixed per-class prompt template (style constants + negative constraints: no text, no UI, plain background, centered subject).
3. **Cost preflight** (`get_cost:true`) — logged.
4. **Draft round**: 2–4 candidates at 1k/low, submitted in one batch, polled while doing other work.
5. **Human selection** (Faizal): pick one composition or reject all (max 3 draft rounds — see stop-loss).
6. **Final render**: chosen prompt at 4k/high (~10–15 min, async).
7. **Post-process**: `remove_background(job_id)` → inspect alpha edge quality → `upscale_image` only if edge/detail quality demands it.
8. **Download** raw + transparent PNGs locally; generate web-sized derivative.
9. **Human approval**: side-by-side with style bible + DNA/product checklist (no text baked in, no UI elements, culturally appropriate mosque/Islamic depiction).
10. **Commit** with manifest.json; drag into Figma asset library page at end of batch.

Pipeline A workflow: new pose request → assemble from parts in Figma → export → commit. No generation, no review beyond a glance.

## 9. Estimated setup effort
- Assets repo + folder conventions + manifest template + prompt templates: **half a day** (Claude does it, Faizal approves).
- EQ vector rig (draft by Claude from DNA spec → 2–3 revision rounds → optional freelance polish): **2–5 days elapsed**, ~4–6 hours of Faizal's attention.
- Style bible for environments: **2–4 hours** of curated generation + selection (or 2–4 weeks if commissioning an illustrator for the highest-quality variant).
- OpenAI fallback script (only if/when needed): **~1 hour**.
- Total to first production asset: **about one week elapsed, mostly waiting on EQ rig iterations.**

## 10. Estimated monthly operating effort
For ~30–50 environment assets/month: **6–10 hours** of Faizal's time (selection + approval + Figma drops), plus unattended generation time. EQ poses: **minutes each**. No servers, no deployments, no dependency updates.

## 11. Expected bottlenecks
1. **Human review** — deliberately so; it is the quality gate. ~5 min/asset.
2. **4k/high latency (10–15 min/job)** — mitigated by batch-submit + async polling and by drafting at low tier.
3. **`remove_background` edge quality on wispy subjects** (clouds, foliage) — the pilot must test this; fallback is generating clouds/glow effects as soft-edged squares composited in-app rather than hard cutouts.
4. **Figma import is manual** — acceptable at human-review cadence; do not automate against sandbox restrictions.
5. **Actual output size ≠ tier label** (4k → 2880×2880 observed) — manifests record real dimensions; design for 2880 max.

## 12. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Style drift across environment batches | Fixed prompt templates + style-bible anchors as multi-reference input (pilot-verify) + every approval done side-by-side with anchors |
| EQ redesign/reinterpretation | EQ never enters any AI pipeline. Hard rule. AI-generated EQ lookalikes are auto-rejected |
| Higgsfield outage/quality regression | Outputs + prompts are vendor-portable; OpenAI API fallback script ready; approved assets already owned in git |
| No seed ⇒ can't re-create a lost asset | The PNG in git *is* the asset; manifest preserves intent. Never rely on re-generation |
| `remove_background`/multi-reference unverified | Both are explicit pilot gates before any scale-up |
| Credit burn on failed explorations | Stop-loss rule (§19) + get_cost preflight + draft-tier-first discipline |
| Cultural/religious inappropriateness in Islamic assets | Mandatory human review item on every environment approval; never auto-publish |
| Dependence on one chat session | All state in git; any Claude Code session (or a human with the Higgsfield UI) can resume from the repo |

## 13. What should be automated
Prompt templating, cost preflight, job submission and polling, background removal, upscaling, download, file naming, web-size derivatives, manifest writing, git commits of *approved* files, batch status summaries.

## 14. What must remain human-reviewed
Composition selection at draft stage; final approval of every asset; EQ DNA conformance (any EQ-adjacent output); Islamic/cultural appropriateness; style-bible conformance; anything that ships to children. **No uncontrolled batch generation straight to the app — ever.**

## 15. Should a custom Asset Factory be built?
**No.** It automates the cheap parts (form-filling, polling) and none of the expensive parts (waiting on the model, human judgment). For a non-coder founder it converts a zero-maintenance workflow into a codebase to own. The probe was still valuable: it proved the underlying pipeline that the *simpler* system now reuses.

## 16. If yes — minimum useful scope
Not applicable now. The only future trigger: a non-technical *team* (3+ people) needs to submit briefs and approve assets without Claude Code. Then the minimum scope is a single-page internal tool: brief form → job queue → approval gallery → writes to the same git repo. Nothing more (no auth systems, no dashboards, no editing).

## 17. If no — the simpler replacement
**Git assets repo + prompt templates + local Claude Code sessions as disposable operators + manual Figma drops** (architecture in §7). One repo, zero servers.

## 18. Three-asset pilot plan
Order matters — each asset retires a specific unknown:
1. **EQ canonical "hero wave" pose (Pipeline A)** — Claude drafts the SVG rig from the DNA spec; Faizal iterates to approval. Retires: "can EQ be production-built as vector without an illustrator?" If approval isn't reached in 3 revision rounds → engage a freelance vector illustrator for the rig (small fixed cost).
2. **Golden lantern (Pipeline B, zero new generation cost)** — run `remove_background` on the already-completed probe job `e3cb2c62-e037-43bb-9f20-b4b9a87d30a2`, download from a local session, inspect alpha edges at 100% and against dark/light backgrounds, commit with manifest. Retires: cutout quality, job_id→rmbg path, local download.
3. **Floating island with tree (Pipeline B, full loop)** — draft round at 1k/low (3 candidates), select, final 4k/high, rmbg, approve, commit; include 1–2 style-bible anchors as multi-reference input. Retires: full workflow timing, cost-per-approved-asset, and the unverified multi-reference support.

Exit review after the pilot: cost per approved asset, wall-clock per asset, cutout quality verdict, multi-reference verdict → then decide scale-up or fallback adjustments.

## 19. Stop-loss rule
- **Per asset:** max 3 draft rounds *or* 60 credits, whichever first. Not approved → park it, move on; a parked asset gets one retry in a later batch with a rewritten brief, then goes to the "needs human illustration" list.
- **Per batch:** if 2 consecutive assets hit the per-asset stop-loss, halt the batch and reassess the prompt template/style bible instead of brute-forcing.
- **Pilot-level:** if the 3-asset pilot consumes more than ~150 credits or two working sessions without all three gates passing, stop and switch the environment class to the OpenAI-direct fallback evaluation before spending more.
- **Standing budget:** agree a monthly credit ceiling up front (current balance 510.75; a 12-credit 4k/high render means a burst of failed experiments is the main leak — the preflight + draft-tier rules exist to prevent exactly that).

## 20. Final recommendation for Faizal (non-coder founder)
Don't build software, and don't ask one AI model to be your entire art department. Your mascot is a *specification* — manufacture it once as vectors and own it forever; your environments are *paintings* — let AI draft them cheaply, always behind your personal approval. Keep everything that matters (the EQ rig, approved PNGs, the prompts that made them) in one git repo that works without any vendor, any app, or any particular Claude session. Run the 3-asset pilot before committing to volume, respect the stop-loss, and only revisit "build a tool" if a team forms around you. The most valuable thing you can personally do next is not technical at all: approve the canonical EQ rig and the environment style bible — those two artifacts are what actually protect quality at scale.
