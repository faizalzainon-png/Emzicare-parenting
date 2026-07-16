# EQrel Asset Factory — Higgsfield / GPT Image 2 Feasibility Probe

Date: 2026-07-16
Scope: technical probe only, no application built.

## 1. Connection method used
Used the pre-connected **Higgsfield MCP server** (`mcp__higgsfield__*` tools) already available in this session. No separate CLI install was needed or attempted.

## 2. Available tool names (image-relevant subset)
`generate_image`, `models_explore`, `job_display`, `show_generations`, `media_upload`, `media_upload_widget`, `media_import_url`, `media_confirm`, `remove_background`, `outpaint_image`, `upscale_image`, `reframe`, `presets_show`, `balance`, `transactions`.

## 3. Exact GPT Image 2 model identifier
- **Model ID to pass in `generate_image(params.model)`: `gpt_image_2`**
- Display name: "GPT Image 2", provider: OpenAI
- The job metadata internally reports the backing engine as `videotape-alpha` (Higgsfield's internal alias) — not something you need to reference yourself, but worth knowing it appears in raw job responses.

GPT Image 2 **is explicitly selectable** — confirmed via `models_explore(action:"list", type:"image")` and `models_explore(action:"get", model_id:"gpt_image_2")`. Full list of other available image models is recorded in `request-response-log.json`.

## 4. Confirmed GPT Image 2 selectable
Yes — no substitution was made. All testing below used `model: "gpt_image_2"` only, per the mandatory model rule.

## 5. Supported parameters
| Capability | Supported? | Notes |
|---|---|---|
| Text prompt | ✅ | `prompt` string |
| Multiple image references | ⚠️ Likely, unverified | Schema declares a `medias` role of type `image` with **no stated max** (unlike e.g. `soul_2`, which caps at 1). Could not empirically confirm >1 reference because test-image import was blocked by this session's network egress policy. |
| Transparent background | ❌ | See below |
| Output resolution | ✅ | `resolution`: `1k` / `2k` / `4k`. **Caveat:** actual pixel output did not match the literal tier — requesting `4k` at `1:1` produced a **2880×2880** PNG, not 4096 or 3840. Always read actual `width`/`height` from the job result, don't assume from the tier label. |
| Aspect ratio | ✅ | `1:1, 4:3, 3:4, 16:9, 9:16, 3:2, 2:3` |
| Job status polling | ✅ | `job_display(id)` returns `pending → in_progress → completed` with full result payload. Our 4K/high-quality test took **~13 minutes** to complete — plan for long-running async jobs, not synchronous request/response. |
| Output download URL | ✅ | Completed jobs return `results.rawUrl` (full PNG) and `results.minUrl` (webp thumbnail), hosted on Higgsfield's CloudFront CDN. |
| Local file saving | ⚠️ Blocked in this sandbox | See item 8 below — this is an environment restriction, not an API limitation. |
| Seed / reproducibility | ❌ | Explicitly rejected — see below |
| Cost preflight | ✅ (bonus) | `generate_image(..., get_cost:true)` returns credit cost without submitting a job, and surfaces which requested params get silently dropped, with a reason string. Very useful for pipeline validation. |

## 6. Unsupported parameters
Confirmed via live `get_cost:true` preflight calls (server responded with explicit adjustment/reason, not silent success):
- **`background` / `transparent_background`** → `"GPT Image 2 does not support this parameter"` (tried both naming conventions)
- **`seed`** → `"GPT Image 2 does not support this parameter"` — **no reproducibility control exists** for this model via this API
- **`output_format`** → not accepted as a discrete parameter (output is always PNG)

Nuance worth flagging: this account's prior generation history (unrelated to this probe) shows earlier `gpt_image_2` jobs whose **prompt text** asked for "transparent background" in natural language (for app icon assets), rather than via a structured parameter. Whether the model actually honors that as true alpha transparency vs. just rendering a white/checkerboard-look background could not be verified in this session (downloading those files to inspect the alpha channel was blocked by network policy — see below). **Treat this as unconfirmed, not as a working feature.**

## 7. Can references be uploaded?
Mechanism exists — `media_upload` (presigned URL + `media_confirm`), `media_upload_widget` (interactive picker), `media_import_url` (from a web URL). `gpt_image_2`'s schema accepts a `medias` array with role `image` and no declared cap. **Upload path is real and wired up; multi-reference behavior for this specific model is unverified** due to the network restriction described below.

## 8. Does transparent PNG work?
**No — not as a structured, reliable parameter.** The API explicitly rejects both `background` and `transparent_background` for `gpt_image_2`. The reliable path to a transparent asset is a **two-step pipeline**:
1. Generate with `gpt_image_2` on a plain/white background.
2. Post-process with the separate `remove_background` tool (accepts a completed generation's `job_id` directly as `media_id`) to cut out the subject and add alpha transparency.

This is a real, verified tool path (confirmed via its schema — `media_id` accepts "a confirmed uploaded media_id **or a completed generation job_id**"), just not exercised end-to-end in this probe to keep to "one test asset only."

## 9. Can generated files be saved automatically?
**Yes, architecturally** — every completed job returns a durable CDN URL that any normal HTTP client can `GET`. **In this specific sandboxed Claude Code session, direct downloads of the Higgsfield CDN domain (`d8j0ntlcm91z4.cloudfront.net`) were blocked by the session's outbound network egress policy** (`403` on the CONNECT tunnel — confirmed via the proxy status endpoint, not a Higgsfield-side error). This is an environment configuration issue (network egress allowlist), not a capability gap in Higgsfield or GPT Image 2. A real Node/React backend running with normal internet access, or with this CDN domain added to the egress allowlist, would download and save these files with a standard `fetch`/`axios` call.

## 10. Location of the test output
- **`technical-probe/lantern-test.png` was NOT created** in this session, due to the network restriction above.
- The generated asset **does exist** and completed successfully:
  - Job ID: `e3cb2c62-e037-43bb-9f20-b4b9a87d30a2`
  - Model: `gpt_image_2`, resolution tier `4k` (actual: 2880×2880), quality `high`, aspect ratio `1:1`
  - URL: `https://d8j0ntlcm91z4.cloudfront.net/user_3FASFJ2KvAn9gbeFLa3MeLLQDbB/hf_20260716_101543_e3cb2c62-e037-43bb-9f20-b4b9a87d30a2.png`
  - Anyone with unrestricted network access (or after allowlisting this CDN domain for this session type) can fetch that URL directly and place it at `technical-probe/lantern-test.png`.
- Full request/response metadata (no secrets) is recorded in `technical-probe/request-response-log.json`.

## Recommended architecture for a local React/Node EQrel Asset Factory
- **Node/Express backend** calling Higgsfield's underlying REST API directly with an API key (not through Claude's MCP layer — MCP is an agent-session interface; a production app should hit Higgsfield's own HTTP API/CLI, not depend on an active Claude session). Confirm the direct REST endpoint & auth model from Higgsfield's own docs before implementation — this probe only had MCP-mediated access.
- **Async job queue, not request/response**: generation can take 10+ minutes at 4K/high quality. Submit → store `job_id` → poll or webhook → download on completion. Never block an HTTP request on a generation job.
- **Data model**: persist `{jobId, model, prompt, params (incl. actual returned width/height), status, rawUrl, localPath, costCredits, createdAt}` per asset for auditability, since there's no seed-based reproducibility — the prompt+params record *is* your reproducibility mechanism.
- **Transparency stage**: a dedicated post-generation step calling `remove_background` on the completed `job_id` whenever a transparent asset is required; don't rely on prompting GPT Image 2 for transparency.
- **Cost governance**: call the `get_cost` preflight before submitting a real job so the UI can show/confirm cost, and poll `balance`/`transactions` for budget tracking.
- **Network egress**: ensure the backend's runtime environment allows outbound HTTPS to Higgsfield's API and CDN domains — this was the one hard blocker found in this probe (specific to the current sandboxed dev session, not the production architecture).
- **React frontend**: a request form (prompt, aspect ratio, resolution, quality, reference upload), a job status/progress view (polling the backend, which polls Higgsfield), and a completed-asset gallery served from your own storage (S3/local disk) after backend download — don't have the browser hit Higgsfield's CDN URLs directly long-term, proxy through your own storage for control and stability.

## Bottom line
GPT Image 2 is real, explicitly selectable (`model: "gpt_image_2"`), and generation itself works end-to-end through the Higgsfield MCP/API. The pipeline is technically feasible **with two caveats to design around**: no native transparent-background or seed support (solve via a background-removal post-step and prompt/param logging respectively), and generation latency is significant at high resolution/quality (design for async, not sync). The one blocker hit in this probe — saving the file locally — is a network-egress restriction of this sandboxed session, not a Higgsfield/GPT Image 2 limitation, and won't apply to a normally-networked production backend.
