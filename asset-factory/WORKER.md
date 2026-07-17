# Generation Worker Protocol (Claude Code ↔ Higgsfield MCP)

The backend cannot call MCP tools itself — the Higgsfield MCP is bound to a Claude
session, not exposed as a keyed REST endpoint we possess. So generation is executed
by a **local Claude Code session acting as the worker**, speaking a tiny HTTP
protocol to the backend at `http://localhost:5178`. All durable state lives in the
backend's files (`screens/`, `data/jobs.json`) — the worker session is disposable
and any session can resume the queue.

## Preconditions

- Run everything on Faizal's normal machine (normal network — CDN downloads work).
- The Claude Code session must have the Higgsfield MCP connected.
- The backend must be running (`npm run server` from `asset-factory/`).

## Worker loop (paste this instruction to a local Claude Code session)

> You are the generation worker for the EQrel Screen-to-Asset Factory.
> Repeat until `GET http://localhost:5178/api/worker/next` returns `{"job": null}`:
>
> 1. `GET /api/worker/next` → receive a `job`.
> 2. HARD RULE: `job.params.model` is `gpt_image_2`. If Higgsfield rejects that
>    model id, `POST /api/worker/<job.id>/failed` with the reason. NEVER
>    substitute another model.
> 3. For each `job.reference_files` entry: call `media_upload` for a presigned
>    URL, `curl -T <local_path>` the file to it, then `media_confirm`. Collect
>    the media ids.
> 4. Call `generate_image` with `get_cost: true` using `job.params` plus
>    `medias: [{value: <media_id>, role: "image"}, ...]`. Note the credit cost.
> 5. Call `generate_image` for real (same params, `count: 1` — one request, one
>    asset). `POST /api/worker/<job.id>/submitted` with
>    `{"hf_job_id": "...", "cost_credits": N}`.
> 6. Poll `job_display(id)` until `status: "completed"` (4k/high can take
>    10–15 minutes; wait with long intervals, don't spam).
> 7. If `job.remove_background` is true, call `remove_background` with the
>    completed generation job id and poll it to completion too.
> 8. `POST /api/worker/<job.id>/complete` with JSON:
>    `{"hf_job_id", "raw_url", "min_url", "width", "height",
>      "rmbg_url": <if any>, "rmbg_job_id": <if any>, "cost_credits"}`
>    (width/height are the ACTUAL dimensions from the job result params —
>    record what the API reports, the 4k tier may not be 4096px.)
> 9. On any unrecoverable error: `POST /api/worker/<job.id>/failed` with
>    `{"reason": "..."}` and continue to the next job.
>
> Never approve anything. Approval is exclusively Faizal's, in the web UI.

## Endpoint summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/worker/next` | Claim the oldest queued job (returns `{job: null}` when idle) |
| POST | `/api/worker/:jobId/submitted` | Record Higgsfield job id + preflight cost |
| POST | `/api/worker/:jobId/complete` | Deliver result URLs + actual dimensions; backend downloads files |
| POST | `/api/worker/:jobId/failed` | Record failure reason |

The backend performs all downloads itself (raw → `raw/`, preview → `previews/`,
cutout → `raw/*-cutout.png`), writes the prompt log to `prompts/`, updates the
manifest, and leaves the attempt in `awaiting_review` for Faizal.
