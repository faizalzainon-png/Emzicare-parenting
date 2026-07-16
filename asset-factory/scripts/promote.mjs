#!/usr/bin/env node
// Run only after every asset in review-decision.json is "approve". Copies the
// approved file for each asset into assets/, updates the manifest, regenerates
// figma-handoff.md, and zips the whole screen package.
//
// Usage: node promote.mjs <screen-slug>

import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ASSET_FACTORY_ROOT = path.resolve(HERE, '..')
const SCREENS_DIR = path.join(ASSET_FACTORY_ROOT, 'screens')
const { generateFigmaHandoff } = await import(path.join(ASSET_FACTORY_ROOT, 'server/src/figmaHandoff.js'))

const slug = process.argv[2]
if (!slug) { console.error('Usage: node promote.mjs <screen-slug>'); process.exit(1) }
const dir = path.join(SCREENS_DIR, slug)
const manifestPath = path.join(dir, 'screen-manifest.json')
const decisionPath = path.join(dir, 'review-decision.json')

if (!fs.existsSync(manifestPath)) { console.error(`No manifest at ${manifestPath}`); process.exit(1) }
if (!fs.existsSync(decisionPath)) {
  console.error(`No ${decisionPath}. Run review-sheet.mjs first and fill in the decision file.`)
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const decisions = JSON.parse(fs.readFileSync(decisionPath, 'utf8'))

const pending = Object.entries(decisions).filter(([, v]) => v !== 'approve' && v !== 'reject')
if (pending.length) {
  console.error(`These assets still have a "pending" decision — inspect the review sheet first: ${pending.map(p => p[0]).join(', ')}`)
  process.exit(1)
}
const rejected = Object.entries(decisions).filter(([, v]) => v === 'reject')
if (rejected.length) {
  console.error(`Not promoting — these assets are marked "reject": ${rejected.map(r => r[0]).join(', ')}`)
  console.error('Per the stop-loss rule: regenerate only the rejected asset(s), preserving the approved composition. Do not reinterpret creatively.')
  process.exit(1)
}

console.log(`All assets approved for "${slug}". Promoting...\n`)

const results = []
for (const asset of manifest.generated_assets) {
  if (decisions[asset.id] !== 'approve') continue
  const attempts = asset.generation?.attempts || []
  const att = [...attempts].reverse().find(a => a.raw_url)
  if (!att) { console.error(`No completed attempt for ${asset.id}, skipping`); continue }

  const sourceRel = asset.remove_background
    ? `raw/${asset.id}-attempt-${att.attempt}-cutout.png`
    : `raw/${asset.id}-attempt-${att.attempt}.png`
  const sourcePath = path.join(dir, sourceRel)
  if (!fs.existsSync(sourcePath)) {
    console.error(`Expected file missing: ${sourcePath}. Run review-sheet.mjs to download it first.`)
    process.exit(1)
  }
  if (asset.remove_background && sourceRel.endsWith('-cutout.png') === false) {
    console.error(`${asset.id} requires a background-removed cutout but none exists. Not promoting.`)
    process.exit(1)
  }

  const destRel = `assets/${asset.id}.png`
  fs.copyFileSync(sourcePath, path.join(dir, destRel))

  asset.generation.status = 'approved'
  asset.generation.approved_file = destRel
  asset.generation.approved_attempt = att.attempt
  asset.generation.approved_at = new Date().toISOString()

  results.push({ id: asset.id, file: path.join(dir, destRel), dimensions: att.actual_dimensions })
  console.log(`  approved: ${asset.id} -> ${destRel}  (${att.actual_dimensions?.width}x${att.actual_dimensions?.height})`)
}

manifest.status = 'approved'
manifest.visual_approval = { approved_at: new Date().toISOString(), decisions }
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

generateFigmaHandoff(slug, manifest)
console.log(`\nfigma-handoff.md regenerated.`)

const zipPath = path.join(ASSET_FACTORY_ROOT, `${slug}-package.zip`)
await new Promise((resolve, reject) => {
  const output = fs.createWriteStream(zipPath)
  const archive = archiver('zip', { zlib: { level: 9 } })
  output.on('close', resolve)
  archive.on('error', reject)
  archive.pipe(output)
  archive.directory(dir, slug)
  archive.finalize()
})
console.log(`Package zipped to: ${zipPath}`)

console.log('\n=== Final approved files ===')
for (const r of results) {
  console.log(`  ${r.id}: ${r.file}  (${r.dimensions?.width}x${r.dimensions?.height})`)
}
console.log(`\nParent Dashboard pilot complete. Do not proceed to another screen, Figma, or Base44 until Faizal confirms.`)
