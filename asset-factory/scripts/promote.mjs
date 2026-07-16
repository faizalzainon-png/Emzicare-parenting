#!/usr/bin/env node
// Run only after every generated asset shows generation.status === 'approved'
// in the manifest (set by clicking Approve in the factory UI — nothing to
// edit by hand). Regenerates figma-handoff.md and zips the whole screen
// package. Refuses to run if anything is unapproved, rejected, or blocked.
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

  console.log(`All assets approved for "${slug}". Promoting...\n`)

  const { generateFigmaHandoff } = await import(path.join(ASSET_FACTORY_ROOT, 'server/src/figmaHandoff.js'))

  const results = []
  for (const asset of manifest.generated_assets) {
    // approved_file was already set by the UI's Approve action; this just
    // confirms the file genuinely exists before packaging.
    const file = asset.generation.approved_file
    if (!file || !fs.existsSync(path.join(dir, file))) {
      throw new Error(`${asset.id} is marked approved but its file is missing: ${file}`)
    }
    results.push({ id: asset.id, file: path.join(dir, file), dimensions: asset.generation.actual_dimensions })
    console.log(`  confirmed: ${asset.id} -> ${file}  (${asset.generation.actual_dimensions?.width}x${asset.generation.actual_dimensions?.height})`)
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

  console.log('\n=== Final approved files ===')
  for (const r of results) console.log(`  ${r.id}: ${r.file}  (${r.dimensions?.width}x${r.dimensions?.height})`)
  console.log(`\nParent Dashboard pilot complete. Do not proceed to another screen, Figma, or Base44 until Faizal confirms.`)

  return { zipPath, results }
}

const isMain = path.resolve(process.argv[1] || '') === path.resolve(fileURLToPath(import.meta.url))
if (isMain) {
  const slug = process.argv[2]
  if (!slug) { console.error('Usage: node promote.mjs <screen-slug>'); process.exit(1) }
  runPromote(slug).catch(e => { console.error(e.message); process.exit(1) })
}
