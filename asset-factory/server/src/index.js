import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import archiver from 'archiver'
import {
  SCREENS_DIR, slugify, screenDir, ensureScreenDirs,
  readManifest, writeManifest, listScreens, readJobs, writeJobs
} from './store.js'
import { buildJobParams, LOCKED_MODEL } from './promptBuilder.js'
import { generateFigmaHandoff } from './figmaHandoff.js'

const PORT = process.env.PORT || 5178
const MAX_ATTEMPTS = 3 // stop-loss: park the asset after 3 attempts

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))
app.use('/files', express.static(SCREENS_DIR))

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 40 * 1024 * 1024 } })

const bad = (res, code, error) => res.status(code).json({ error })

// ---------- screens ----------

app.get('/api/health', (_req, res) => res.json({ ok: true, model: LOCKED_MODEL }))

app.get('/api/screens', (_req, res) => res.json(listScreens()))

app.post('/api/screens', upload.fields([
  { name: 'master', maxCount: 1 },
  { name: 'references', maxCount: 10 }
]), (req, res) => {
  const { screen_name, category } = req.body
  if (!screen_name) return bad(res, 400, 'screen_name is required')
  const slug = slugify(screen_name)
  if (readManifest(slug)) return bad(res, 409, `screen "${slug}" already exists`)
  const dir = ensureScreenDirs(slug)

  const master = req.files?.master?.[0]
  if (master) fs.writeFileSync(path.join(dir, 'master-reference.png'), master.buffer)
  for (const f of req.files?.references || []) {
    fs.writeFileSync(path.join(dir, 'references', path.basename(f.originalname)), f.buffer)
  }

  const manifest = writeManifest(slug, {
    screen_name, slug,
    category: category || 'uncategorized',
    source_reference: 'master-reference.png',
    status: 'draft', // draft -> awaiting_approval -> approved
    approved_by: null, approved_at: null,
    decomposition_rule: 'Generate only visual assets that cannot reasonably be built as native React/Figma UI.',
    native_ui: [],
    generated_assets: [],
    created_at: new Date().toISOString()
  })
  res.json(manifest)
})

app.get('/api/screens/:slug', (req, res) => {
  const m = readManifest(req.params.slug)
  if (!m) return bad(res, 404, 'not found')
  const dir = screenDir(req.params.slug)
  res.json({
    manifest: m,
    has_master_reference: fs.existsSync(path.join(dir, 'master-reference.png')),
    references: fs.existsSync(path.join(dir, 'references')) ? fs.readdirSync(path.join(dir, 'references')) : [],
    jobs: readJobs().filter(j => j.slug === req.params.slug)
  })
})

// Upload/replace master reference or supporting/EQ/style references after creation.
app.post('/api/screens/:slug/references', upload.fields([
  { name: 'master', maxCount: 1 },
  { name: 'references', maxCount: 10 }
]), (req, res) => {
  const m = readManifest(req.params.slug)
  if (!m) return bad(res, 404, 'not found')
  const dir = ensureScreenDirs(req.params.slug)
  const master = req.files?.master?.[0]
  if (master) fs.writeFileSync(path.join(dir, 'master-reference.png'), master.buffer)
  for (const f of req.files?.references || []) {
    fs.writeFileSync(path.join(dir, 'references', path.basename(f.originalname)), f.buffer)
  }
  res.json({ ok: true })
})

// Manifest edit: allowed until approved (approve again after edits).
app.put('/api/screens/:slug/manifest', (req, res) => {
  const existing = readManifest(req.params.slug)
  if (!existing) return bad(res, 404, 'not found')
  const next = req.body
  if (!next || next.slug !== existing.slug) return bad(res, 400, 'manifest slug mismatch')
  // Editing a manifest always drops it back to awaiting_approval — never silently keep approval.
  next.status = next.status === 'draft' ? 'draft' : 'awaiting_approval'
  next.approved_by = null
  next.approved_at = null
  res.json(writeManifest(req.params.slug, next))
})

// Human approval gate. Nothing generates without this.
app.post('/api/screens/:slug/approve', (req, res) => {
  const m = readManifest(req.params.slug)
  if (!m) return bad(res, 404, 'not found')
  const dir = screenDir(req.params.slug)
  if (!fs.existsSync(path.join(dir, 'master-reference.png'))) {
    return bad(res, 409, 'Cannot approve: master-reference.png has not been uploaded. Never continue without required references.')
  }
  const missing = requiredReferenceGaps(m, dir)
  if (missing.length) {
    return bad(res, 409, `Cannot approve: required reference files missing: ${missing.join(', ')}`)
  }
  if (!(m.generated_assets || []).length) return bad(res, 409, 'Cannot approve an empty manifest')
  m.status = 'approved'
  m.approved_by = req.body?.approved_by || 'Faizal'
  m.approved_at = new Date().toISOString()
  writeManifest(req.params.slug, m)
  generateFigmaHandoff(req.params.slug, m)
  res.json(m)
})

function requiredReferenceGaps(manifest, dir) {
  const gaps = []
  for (const a of manifest.generated_assets || []) {
    for (const ref of a.references || []) {
      if (ref === 'master-reference.png') continue
      if (!fs.existsSync(path.join(dir, 'references', ref))) gaps.push(`${a.id}: ${ref}`)
    }
  }
  return gaps
}

// ---------- generation jobs (worker-bridge queue) ----------

// Queue one generation attempt for one asset. One request = one asset, always.
app.post('/api/screens/:slug/assets/:assetId/generate', (req, res) => {
  const slug = req.params.slug
  const m = readManifest(slug)
  if (!m) return bad(res, 404, 'screen not found')
  if (m.status !== 'approved') return bad(res, 409, 'Manifest is not approved. Faizal must approve the manifest before any generation.')
  const asset = (m.generated_assets || []).find(a => a.id === req.params.assetId)
  if (!asset) return bad(res, 404, 'asset not found in manifest')

  const dir = screenDir(slug)
  const refFiles = ['master-reference.png', ...(asset.references || [])]
    .filter((v, i, arr) => arr.indexOf(v) === i)
  for (const ref of refFiles) {
    const p = ref === 'master-reference.png' ? path.join(dir, ref) : path.join(dir, 'references', ref)
    if (!fs.existsSync(p)) return bad(res, 409, `Required reference "${ref}" is missing. Never continue without required references.`)
  }

  asset.generation = asset.generation || { status: 'pending', attempts: [], approved_file: null }
  const attempts = asset.generation.attempts.length
  if (attempts >= MAX_ATTEMPTS && !req.body?.force) {
    return bad(res, 409, `Stop-loss: ${attempts} attempts already made for this asset. Park it or pass force:true after a deliberate human decision.`)
  }

  const draft = !!req.body?.draft
  const params = buildJobParams(asset, m, { draft })
  const attemptNo = attempts + 1
  const job = {
    id: `${slug}--${asset.id}--a${attemptNo}--${Date.now()}`,
    slug, asset_id: asset.id, attempt: attemptNo, draft,
    status: 'queued', // queued -> claimed -> submitted -> completed/failed
    params,
    // Worker must upload these local files to Higgsfield (media_upload) and attach them.
    reference_files: refFiles.map(ref => ({
      name: ref,
      local_path: ref === 'master-reference.png' ? path.join(dir, ref) : path.join(dir, 'references', ref),
      url: `/files/${slug}/${ref === 'master-reference.png' ? ref : 'references/' + ref}`
    })),
    remove_background: !!asset.remove_background,
    created_at: new Date().toISOString()
  }
  const jobs = readJobs()
  jobs.push(job)
  writeJobs(jobs)

  // Record the full prompt + request before anything runs.
  fs.writeFileSync(
    path.join(dir, 'prompts', `${asset.id}-attempt-${attemptNo}.json`),
    JSON.stringify({ job_id: job.id, requested_at: job.created_at, draft, params, reference_files: refFiles, remove_background: job.remove_background }, null, 2)
  )

  asset.generation.status = 'queued'
  writeManifest(slug, m)
  res.json(job)
})

app.get('/api/jobs', (_req, res) => res.json(readJobs()))

// ----- worker protocol (used by a local Claude Code session with Higgsfield MCP) -----

app.get('/api/worker/next', (_req, res) => {
  const jobs = readJobs()
  const job = jobs.find(j => j.status === 'queued')
  if (!job) return res.json({ job: null })
  job.status = 'claimed'
  job.claimed_at = new Date().toISOString()
  writeJobs(jobs)
  res.json({
    job,
    instructions: [
      `Model is LOCKED to ${LOCKED_MODEL}. If Higgsfield does not accept ${LOCKED_MODEL}, FAIL the job — never substitute another model.`,
      'Upload each reference_files entry via media_upload (presigned PUT of local_path) + media_confirm, then attach as medias role "image".',
      'Run generate_image with get_cost:true first and report the cost in /submitted.',
      'Then submit for real, poll job_display until completed, and POST /api/worker/:id/complete with raw_url, min_url, width, height.',
      'If remove_background is true, also call remove_background with the completed generation job_id and include rmbg_url in /complete.'
    ]
  })
})

app.post('/api/worker/:jobId/submitted', (req, res) => {
  const jobs = readJobs()
  const job = jobs.find(j => j.id === req.params.jobId)
  if (!job) return bad(res, 404, 'job not found')
  Object.assign(job, {
    status: 'submitted',
    hf_job_id: req.body.hf_job_id,
    cost_credits: req.body.cost_credits ?? null,
    submitted_at: new Date().toISOString()
  })
  writeJobs(jobs)
  res.json(job)
})

app.post('/api/worker/:jobId/failed', (req, res) => {
  const jobs = readJobs()
  const job = jobs.find(j => j.id === req.params.jobId)
  if (!job) return bad(res, 404, 'job not found')
  job.status = 'failed'
  job.failure_reason = req.body?.reason || 'unspecified'
  job.failed_at = new Date().toISOString()
  writeJobs(jobs)
  const m = readManifest(job.slug)
  const asset = m?.generated_assets?.find(a => a.id === job.asset_id)
  if (asset) {
    asset.generation.attempts.push({ attempt: job.attempt, job_id: job.id, hf_job_id: job.hf_job_id || null, status: 'failed', reason: job.failure_reason })
    asset.generation.status = 'failed'
    writeManifest(job.slug, m)
  }
  res.json(job)
})

async function download(url, dest) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`download failed ${r.status} for ${url}`)
  await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(dest))
}

app.post('/api/worker/:jobId/complete', async (req, res) => {
  const jobs = readJobs()
  const job = jobs.find(j => j.id === req.params.jobId)
  if (!job) return bad(res, 404, 'job not found')
  const { hf_job_id, raw_url, min_url, width, height, rmbg_url, rmbg_job_id, cost_credits } = req.body
  if (!raw_url) return bad(res, 400, 'raw_url required')
  const dir = screenDir(job.slug)
  const base = `${job.asset_id}-attempt-${job.attempt}`
  try {
    await download(raw_url, path.join(dir, 'raw', `${base}.png`))
    if (min_url) await download(min_url, path.join(dir, 'previews', `${base}.webp`)).catch(() => {})
    if (rmbg_url) await download(rmbg_url, path.join(dir, 'raw', `${base}-cutout.png`))
  } catch (e) {
    return bad(res, 502, `Could not download output: ${e.message}. Run this server on a normally networked machine.`)
  }
  Object.assign(job, {
    status: 'completed',
    hf_job_id: hf_job_id || job.hf_job_id,
    rmbg_job_id: rmbg_job_id || null,
    raw_url, min_url: min_url || null, rmbg_url: rmbg_url || null,
    actual_dimensions: { width: width ?? null, height: height ?? null },
    cost_credits: cost_credits ?? job.cost_credits ?? null,
    completed_at: new Date().toISOString()
  })
  writeJobs(jobs)

  const m = readManifest(job.slug)
  const asset = m.generated_assets.find(a => a.id === job.asset_id)
  asset.generation.attempts.push({
    attempt: job.attempt, job_id: job.id, hf_job_id: job.hf_job_id,
    draft: job.draft, status: 'awaiting_review',
    raw_file: `raw/${base}.png`,
    cutout_file: rmbg_url ? `raw/${base}-cutout.png` : null,
    actual_dimensions: job.actual_dimensions,
    cost_credits: job.cost_credits,
    completed_at: job.completed_at
  })
  asset.generation.status = 'awaiting_review'
  asset.generation.actual_dimensions = job.actual_dimensions
  writeManifest(job.slug, m)
  res.json(job)
})

// ---------- human review of an attempt ----------

app.post('/api/screens/:slug/assets/:assetId/review', (req, res) => {
  const { decision, attempt } = req.body // decision: approve | reject
  const m = readManifest(req.params.slug)
  if (!m) return bad(res, 404, 'not found')
  const asset = m.generated_assets.find(a => a.id === req.params.assetId)
  if (!asset) return bad(res, 404, 'asset not found')
  const att = asset.generation?.attempts?.find(a => a.attempt === attempt)
  if (!att) return bad(res, 404, 'attempt not found')
  if (!['approve', 'reject'].includes(decision)) return bad(res, 400, 'decision must be approve|reject')

  const dir = screenDir(req.params.slug)
  if (decision === 'approve') {
    const src = asset.remove_background ? att.cutout_file : att.raw_file
    if (!src || !fs.existsSync(path.join(dir, src))) {
      return bad(res, 409, asset.remove_background
        ? 'This asset requires a background-removed cutout, and none exists for this attempt.'
        : 'Raw file missing for this attempt.')
    }
    const finalFile = `assets/${asset.id}.png`
    fs.copyFileSync(path.join(dir, src), path.join(dir, finalFile))
    att.status = 'approved'
    asset.generation.status = 'approved'
    asset.generation.approved_file = finalFile
    asset.generation.approved_attempt = attempt
    asset.generation.approved_at = new Date().toISOString()
  } else {
    att.status = 'rejected'
    att.rejection_note = req.body?.note || null
    asset.generation.status = 'rejected'
  }
  writeManifest(req.params.slug, m)
  generateFigmaHandoff(req.params.slug, m)
  res.json(m)
})

// ---------- handoff + export ----------

app.post('/api/screens/:slug/handoff', (req, res) => {
  const m = readManifest(req.params.slug)
  if (!m) return bad(res, 404, 'not found')
  res.json({ markdown: generateFigmaHandoff(req.params.slug, m) })
})

app.get('/api/screens/:slug/export', (req, res) => {
  const m = readManifest(req.params.slug)
  if (!m) return bad(res, 404, 'not found')
  const dir = screenDir(req.params.slug)
  generateFigmaHandoff(req.params.slug, m)
  res.attachment(`${req.params.slug}-package.zip`)
  const archive = archiver('zip', { zlib: { level: 9 } })
  archive.pipe(res)
  archive.directory(dir, req.params.slug)
  archive.finalize()
})

app.listen(PORT, () => console.log(`EQrel Screen-to-Asset Factory API on http://localhost:${PORT}`))
