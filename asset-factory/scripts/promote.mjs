#!/usr/bin/env node
// Run only after every generated asset shows generation.status === 'approved'
// in the manifest (set by clicking Approve in the factory UI — nothing to
// edit by hand). Optimizes each approved asset for mobile production (resize,
// compress, PNG for transparency / WebP for opaque), regenerates
// figma-handoff.md, and zips the whole screen package. Refuses to run if
// anything is unapproved, rejected, or blocked.
//
// CLI usage: node promote.mjs <screen-slug>
// Also exported as runPromote(slug) for the server's /promote endpoint.

import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ASSET_FACTORY_ROOT = path.resolve(HERE, '..')
const SCREENS_DIR = path.join(ASSET_FACTORY_ROOT, 'screens')
const MAX_ATTEMPTS = 3 // must match server/src/index.js's stop-loss cap

export async function runPromote(slug) {
  const dir = path.join(SCREENS_DIR, slug)
  const manifestPath = path.join(dir, 'screen-manifest.json')
  if (!fs.existsSync(manifestPath)) throw new Error(`No manifest at ${manifestPath}`)
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  const blocking = []
  for (const asset of manifest.generated_assets) {
    const status = asset.generation?.status
    const attempts = asset.generation?.attempts?.length || 0
    if (status !== 'approved') {
      const remaining = Math.max(0, MAX_ATTEMPTS - attempts)
      blocking.push(`${asset.id}: status is "${status || 'pending'}" (${attempts}/${MAX_ATTEMPTS} attempts used, ${remaining} stop-loss attempt${remaining === 1 ? '' : 's'} remaining) — approve or reject it in the factory UI first`)
    }
  }
  if (blocking.length) {
    const err = new Error(`Not promoting — not every asset is approved yet:\n  ${blocking.join('\n  ')}`)
    err.blocking = blocking
    throw err
  }

  console.log(`All assets approved for "${slug}". Optimizing for mobile production...\n`)

  const { generateFigmaHandoff } = await import(path.join(ASSET_FACTORY_ROOT, 'server/src/figmaHandoff.js'))
  const { optimizeForProduction } = await import(path.join(ASSET_FACTORY_ROOT, 'server/src/optimize.js'))

  let manifestChanged = false
  const results = []
  for (const asset of manifest.generated_assets) {
    const stagedFile = asset.generation.approved_file
    const stagedPath = path.join(dir, stagedFile || '')
    if (!stagedFile || !fs.existsSync(stagedPath)) {
      throw new Error(`${asset.id} is marked approved but its file is missing: ${stagedFile}`)
    }

    const destNoExt = path.join(dir, 'assets', asset.id)
    const report = await optimizeForProduction(stagedPath, destNoExt, {
      transparent: !!asset.remove_background,
      assetClass: asset.asset_class
    })

    // If the format changed (png -> webp for opaque assets), drop the old
    // staging file so exactly one canonical production file remains, and
    // correct the existing approved_file pointer to match (value update
    // only — no new manifest field).
    const newRelFile = `assets/${report.filename}`
    if (newRelFile !== stagedFile) {
      if (fs.existsSync(stagedPath)) fs.unlinkSync(stagedPath)
      asset.generation.approved_file = newRelFile
      manifestChanged = true
    }

    results.push({
      id: asset.id,
      filename: report.filename,
      format: report.format,
      width: report.width,
      height: report.height,
      sizeKB: report.sizeKB,
      result: report.result
    })
    const flag = report.result === 'PASS' ? '✓ PASS' : '⚠ REVIEW'
    console.log(`  ${asset.id}: ${report.filename}  ${report.width}x${report.height}  ${report.sizeKB}KB  ${flag}`)
  }

  if (manifestChanged) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  }

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

  console.log('\n=== Production assets ===')
  console.log('  asset                          format  dimensions      size      status')
  for (const r of results) {
    console.log(`  ${r.id.padEnd(30)} ${r.format.padEnd(6)}  ${`${r.width}x${r.height}`.padEnd(14)}  ${`${r.sizeKB}KB`.padEnd(8)}  ${r.result}`)
  }
  const needsReview = results.filter(r => r.result === 'REVIEW')
  if (needsReview.length) {
    console.log(`\n${needsReview.length} asset(s) above the 50KB budget (warning only, not blocking): ${needsReview.map(r => r.id).join(', ')}`)
  }
  console.log(`\nParent Dashboard pilot complete. Do not proceed to another screen, Figma, or Base44 until Faizal confirms.`)

  return { zipPath, results }
}

const isMain = path.resolve(process.argv[1] || '') === path.resolve(fileURLToPath(import.meta.url))
if (isMain) {
  const slug = process.argv[2]
  if (!slug) { console.error('Usage: node promote.mjs <screen-slug>'); process.exit(1) }
  runPromote(slug).catch(e => { console.error(e.message); process.exit(1) })
}
