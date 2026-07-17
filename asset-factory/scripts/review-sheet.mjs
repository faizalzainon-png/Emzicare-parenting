#!/usr/bin/env node
// Downloads a screen's approved-master-reference + latest final/cutout attempts,
// confirms they exist and are readable, validates orientation where required,
// writes the results back into screen-manifest.json (so the existing factory
// UI's Approve/Reject buttons have real local files to act on), and assembles
// one contact-sheet PNG for visual review.
//
// CLI usage: node review-sheet.mjs <screen-slug>
// Also exported as runReviewSheet(slug) for the review:dashboard launcher.

import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ASSET_FACTORY_ROOT = path.resolve(HERE, '..')
const SCREENS_DIR = path.join(ASSET_FACTORY_ROOT, 'screens')
const { checkOrientation } = await import(path.join(ASSET_FACTORY_ROOT, 'server/src/orientation.js'))

async function download(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(dest, buf)
  return dest
}

function latestFinalAttempt(asset) {
  const attempts = asset.generation?.attempts || []
  return [...attempts].reverse().find(a => a.raw_url)
}

async function fileInfo(p) {
  const stat = fs.statSync(p)
  const meta = await sharp(p).metadata()
  return { path: p, bytes: stat.size, width: meta.width, height: meta.height }
}

export async function runReviewSheet(slug) {
  const dir = path.join(SCREENS_DIR, slug)
  const manifestPath = path.join(dir, 'screen-manifest.json')
  if (!fs.existsSync(manifestPath)) throw new Error(`No manifest at ${manifestPath}`)
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  for (const sub of ['raw', 'assets', 'previews', 'references', 'prompts']) {
    fs.mkdirSync(path.join(dir, sub), { recursive: true })
  }

  console.log(`=== Downloading files for "${slug}" ===`)
  const downloaded = []

  const masterUrl = manifest.master_reference_higgsfield_media?.url
  const masterPath = path.join(dir, 'master-reference.png')
  if (masterUrl) {
    await download(masterUrl, masterPath)
    downloaded.push(['master-reference.png', await fileInfo(masterPath)])
    console.log(`  master-reference.png <- ${masterUrl}`)
  } else if (!fs.existsSync(masterPath)) {
    throw new Error('No master_reference_higgsfield_media.url in manifest and no local master-reference.png.')
  }

  const assetFiles = {} // asset.id -> { rawPath, cutoutPath, meta, orientationCheck }
  const orientationBlocked = []

  for (const asset of manifest.generated_assets) {
    const att = latestFinalAttempt(asset)
    if (!att) { console.warn(`  ! no completed attempt found for ${asset.id}, skipping`); continue }

    const rawPath = path.join(dir, 'raw', `${asset.id}-attempt-${att.attempt}.png`)
    await download(att.raw_url, rawPath)
    const rawInfo = await fileInfo(rawPath)
    downloaded.push([`raw/${asset.id}-attempt-${att.attempt}.png`, rawInfo])
    console.log(`  ${path.basename(rawPath)} <- ${att.raw_url}  (${rawInfo.width}x${rawInfo.height})`)

    let cutoutPath = null
    if (att.rmbg_url) {
      cutoutPath = path.join(dir, 'raw', `${asset.id}-attempt-${att.attempt}-cutout.png`)
      await download(att.rmbg_url, cutoutPath)
      const cutInfo = await fileInfo(cutoutPath)
      downloaded.push([`raw/${asset.id}-attempt-${att.attempt}-cutout.png`, cutInfo])
      console.log(`  ${path.basename(cutoutPath)} <- ${att.rmbg_url}  (${cutInfo.width}x${cutInfo.height})`)
    }

    // Hard orientation validation, on the ACTUAL downloaded pixels — not the
    // requested params. Never auto-correct (no rotate/stretch); just block.
    const orientationCheck = checkOrientation(asset.orientation_requirement, rawInfo.width, rawInfo.height)
    if (orientationCheck.checked && !orientationCheck.passed) {
      orientationBlocked.push({ id: asset.id, reason: orientationCheck.reason })
      console.warn(`  ✗ ORIENTATION CHECK FAILED for ${asset.id}: ${orientationCheck.reason}`)
    } else if (orientationCheck.checked) {
      console.log(`  ✓ orientation check passed for ${asset.id} (ratio ${orientationCheck.ratio.toFixed(2)})`)
    }

    // Write the attempt + asset status back into the manifest so the existing
    // Approve/Reject UI has real files to act on — this is the missing link
    // that made manual JSON editing seem necessary before.
    att.raw_file = `raw/${asset.id}-attempt-${att.attempt}.png`
    att.cutout_file = cutoutPath ? `raw/${asset.id}-attempt-${att.attempt}-cutout.png` : (att.cutout_file ?? null)
    att.actual_dimensions = { width: rawInfo.width, height: rawInfo.height }
    att.orientation_check = orientationCheck.checked ? orientationCheck : undefined
    att.status = (orientationCheck.checked && !orientationCheck.passed) ? 'blocked_orientation' : 'awaiting_review'

    asset.generation.status = att.status
    asset.generation.actual_dimensions = att.actual_dimensions

    assetFiles[asset.id] = { rawPath, cutoutPath, attempt: att.attempt, meta: rawInfo }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log('\nManifest updated with downloaded file paths — the factory UI can now Approve/Reject each attempt directly.')

  console.log('\n=== Confirming files exist and are readable ===')
  for (const [label, info] of downloaded) {
    console.log(`  OK  ${label}  ${info.width}x${info.height}  ${(info.bytes / 1024).toFixed(0)} KB`)
  }
  if (orientationBlocked.length) {
    console.log('\n=== ORIENTATION BLOCKED — approval disabled for these assets ===')
    for (const b of orientationBlocked) console.log(`  ${b.id}: ${b.reason}`)
  }

  // ---------- build the contact sheet ----------

  const CELL_W = 480
  const LABEL_H = 34
  const PAD = 20

  function svgLabel(text, width, height = LABEL_H, warn = false) {
    const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    return Buffer.from(`<svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${warn ? '#8a1f2b' : '#1c2b27'}"/>
      <text x="10" y="${height - 11}" font-family="sans-serif" font-size="16" fill="#ffffff">${esc}</text>
    </svg>`)
  }

  async function cellFromFile(filePath, { onDark = false } = {}) {
    const img = sharp(filePath)
    const meta = await img.metadata()
    const scale = CELL_W / meta.width
    const targetH = Math.round(meta.height * scale)
    const resized = await img.resize({ width: CELL_W }).png().toBuffer()
    if (!onDark) return { buf: resized, w: CELL_W, h: targetH }
    const bg = await sharp({ create: { width: CELL_W, height: targetH, channels: 4, background: { r: 0x24, g: 0x24, b: 0x28, alpha: 1 } } })
      .composite([{ input: resized, top: 0, left: 0 }])
      .png().toBuffer()
    return { buf: bg, w: CELL_W, h: targetH }
  }

  async function cropFraction(filePath, { x0, y0, x1, y1 }, targetW = CELL_W) {
    const meta = await sharp(filePath).metadata()
    const left = Math.round(meta.width * x0)
    const top = Math.round(meta.height * y0)
    const width = Math.max(1, Math.round(meta.width * (x1 - x0)))
    const height = Math.max(1, Math.round(meta.height * (y1 - y0)))
    const buf = await sharp(filePath).extract({ left, top, width, height }).resize({ width: targetW }).png().toBuffer()
    const outH = Math.round(height * (targetW / width))
    return { buf, w: targetW, h: outH }
  }

  async function onDarkBuf({ buf, w, h }) {
    const bg = await sharp({ create: { width: w, height: h, channels: 4, background: { r: 0x24, g: 0x24, b: 0x28, alpha: 1 } } })
      .composite([{ input: buf, top: 0, left: 0 }])
      .png().toBuffer()
    return { buf: bg, w, h }
  }

  const rows = []

  const heroBlocked = orientationBlocked.some(b => b.id === 'hero-landscape')
  rows.push([
    { label: 'Master dashboard reference (style/composition source — never a layer)', cell: await cellFromFile(masterPath) },
    assetFiles['hero-landscape'] ? { label: `Hero Landscape — final (keeps background)${heroBlocked ? '  ⚠ ORIENTATION BLOCKED' : ''}`, cell: await cellFromFile(assetFiles['hero-landscape'].rawPath), warn: heroBlocked } : null
  ])

  if (assetFiles['eq-greeting-companion']) {
    const eq = assetFiles['eq-greeting-companion']
    rows.push([
      { label: 'EQ Greeting Companion — final (plain background)', cell: await cellFromFile(eq.rawPath) },
      eq.cutoutPath ? { label: 'EQ Greeting Companion — cutout on DARK (alpha check)', cell: await cellFromFile(eq.cutoutPath, { onDark: true }) } : null
    ])
  }

  if (assetFiles['family-quest-island']) {
    const fq = assetFiles['family-quest-island']
    rows.push([
      { label: 'Family Quest Island — final (plain background)', cell: await cellFromFile(fq.rawPath) },
      fq.cutoutPath ? { label: 'Family Quest Island — cutout on DARK (alpha check)', cell: await cellFromFile(fq.cutoutPath, { onDark: true }) } : null
    ])
  }

  const cropRow = []
  if (assetFiles['eq-greeting-companion']) {
    const eq = assetFiles['eq-greeting-companion']
    cropRow.push({ label: 'EQ final — top-right corner crop (Signature Corner check)', cell: await cropFraction(eq.rawPath, { x0: 0.55, y0: 0, x1: 1, y1: 0.45 }) })
    cropRow.push({ label: 'EQ final — center crop (eyes / mouth / heart)', cell: await cropFraction(eq.rawPath, { x0: 0.3, y0: 0.25, x1: 0.7, y1: 0.65 }) })
    if (eq.cutoutPath) {
      cropRow.push({ label: 'EQ cutout — left-side edge crop on DARK (arm/leg silhouette)', cell: await onDarkBuf(await cropFraction(eq.cutoutPath, { x0: 0, y0: 0.3, x1: 0.35, y1: 0.9 })) })
      cropRow.push({ label: 'EQ cutout — right-side edge crop on DARK (arm/leg silhouette)', cell: await onDarkBuf(await cropFraction(eq.cutoutPath, { x0: 0.65, y0: 0.3, x1: 1, y1: 0.9 })) })
    }
  }
  if (assetFiles['family-quest-island']) {
    const fq = assetFiles['family-quest-island']
    cropRow.push({ label: 'Island final — mosque/flag detail crop', cell: await cropFraction(fq.rawPath, { x0: 0.25, y0: 0.15, x1: 0.85, y1: 0.65 }) })
    if (fq.cutoutPath) {
      cropRow.push({ label: 'Island cutout — underside taper edge on DARK', cell: await onDarkBuf(await cropFraction(fq.cutoutPath, { x0: 0.2, y0: 0.55, x1: 0.8, y1: 1 })) })
    }
  }
  if (assetFiles['hero-landscape']) {
    cropRow.push({ label: 'Hero Landscape — right-third crop (mosque domes check)', cell: await cropFraction(assetFiles['hero-landscape'].rawPath, { x0: 0.6, y0: 0, x1: 1, y1: 1 }, 260) })
  }

  const twoColRows = rows.filter(r => r.some(Boolean))
  const colWidths = [CELL_W, CELL_W]
  const sheetW = PAD + colWidths[0] + PAD + colWidths[1] + PAD

  let cursorY = PAD
  const composites = []

  for (const row of twoColRows) {
    const heights = row.map(cell => cell ? cell.cell.h + LABEL_H : 0)
    const rowH = Math.max(...heights, 1)
    let x = PAD
    for (const cell of row) {
      if (cell) {
        composites.push({ input: svgLabel(cell.label, colWidths[0], LABEL_H, !!cell.warn), left: x, top: cursorY })
        composites.push({ input: cell.cell.buf, left: x, top: cursorY + LABEL_H })
      }
      x += colWidths[0] + PAD
    }
    cursorY += rowH + PAD
  }

  const cropCols = 3
  const cropColW = CELL_W
  let cx = PAD, usedInLine = 0
  let cropRowMaxH = 0
  for (const c of cropRow) {
    const h = c.cell.h + LABEL_H
    composites.push({ input: svgLabel(c.label, cropColW), left: cx, top: cursorY })
    composites.push({ input: c.cell.buf, left: cx, top: cursorY + LABEL_H })
    cropRowMaxH = Math.max(cropRowMaxH, h)
    usedInLine++
    cx += cropColW + PAD
    if (usedInLine === cropCols) {
      cursorY += cropRowMaxH + PAD
      cropRowMaxH = 0
      usedInLine = 0
      cx = PAD
    }
  }
  if (usedInLine > 0) cursorY += cropRowMaxH + PAD

  const sheetH = cursorY + PAD
  const sheetPath = path.join(dir, 'previews', 'review-sheet.png')

  await sharp({ create: { width: sheetW, height: sheetH, channels: 4, background: { r: 0xf6, g: 0xf8, b: 0xf7, alpha: 1 } } })
    .composite(composites)
    .png()
    .toFile(sheetPath)

  console.log(`\nReview sheet written to: ${sheetPath}  (${sheetW}x${sheetH})`)

  // ---------- read-only checklist reference (nothing to edit here) ----------

  const checklistPath = path.join(dir, 'VISUAL-INSPECTION-CHECKLIST.md')
  const checklist = `# Visual Inspection Checklist — ${manifest.screen_name}

Read-only reference — approve/reject each asset directly in the factory UI
(http://localhost:5173/?screen=${slug}), not by editing this file or any JSON.
Use \`previews/review-sheet.png\` plus this checklist while you click.

## 1. Dashboard — EQ Greeting Companion

- [ ] Exact EQ identity preserved (this is unmistakably EQ, not a generic mascot)
- [ ] Signature Corner (top-right) is visibly more rounded than the other 3 corners
- [ ] Left eye is the angular chevron shape
- [ ] Right eye is a simple round dot
- [ ] Torso is cream/off-white
- [ ] Left arm + left leg are solid Primary Green #00B894
- [ ] Right arm + right leg are solid Golden Yellow #FFB703
- [ ] Coral heart #FF5D6E is present on the torso
- [ ] No fingers, no clothes, no shoes
- [ ] Pose matches the approved dashboard (winking, fist raised, other hand holding the lantern)
- [ ] Lantern shape and glow/lighting feel consistent with the dashboard
- [ ] Cutout edges are clean at 100% zoom (no halo, no bitten-off limbs, no stray background pixels)

## 2. Dashboard — Hero Landscape

- [ ] Real orientation is genuinely wide/landscape (checked automatically — blocked in the UI if not)
- [ ] Bright blue-sky daytime mood (not dawn/dusk, not muted)
- [ ] Distant mosque domes/minaret remain visible on the right side
- [ ] Composition supports the approved dashboard hero (open space where the character sits)
- [ ] No text, no letters, no UI artifacts baked into the image
- [ ] No unintended extra objects
- [ ] Crop-safe for a responsive mobile hero band

## 3. Dashboard — Family Quest Floating Island

- [ ] Cream-and-teal domed mosque present on the island
- [ ] Crescent moon on top of the mosque
- [ ] Green flag with a golden heart symbol present
- [ ] Composition is a single isolated island (no separate background scenery)
- [ ] Cutout edges are clean at 100% zoom (underside taper, grass edge, flag pole)
- [ ] Art style matches the approved dashboard

## Next step

Approve or reject each attempt in the UI. Any FAIL/reject → use the "Queue Final
Regeneration" button on that asset only (stop-loss: max 3 attempts total, same
approved composition, no reinterpretation). Once all three show "approved",
click "Promote Approved Assets" in the UI.
`
  fs.writeFileSync(checklistPath, checklist)
  console.log(`Checklist written to:   ${checklistPath}`)

  // No review-decision.json anymore — approval state lives in the manifest,
  // driven entirely by the UI's existing Approve/Reject buttons.
  const stalePath = path.join(dir, 'review-decision.json')
  if (fs.existsSync(stalePath)) fs.unlinkSync(stalePath)

  console.log('\nDone. Nothing was auto-approved. Approve/reject each asset in the factory UI.')
  return { sheetPath, checklistPath, orientationBlocked }
}

const isMain = path.resolve(process.argv[1] || '') === path.resolve(fileURLToPath(import.meta.url))
if (isMain) {
  const slug = process.argv[2]
  if (!slug) { console.error('Usage: node review-sheet.mjs <screen-slug>'); process.exit(1) }
  runReviewSheet(slug).catch(e => { console.error(e.message); process.exit(1) })
}
