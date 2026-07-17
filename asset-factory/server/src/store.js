import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// asset-factory/ is the home for all tool state: screens/ packages + data/ queue.
export const BASE = process.env.ASSET_FACTORY_HOME ||
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const SCREENS_DIR = path.join(BASE, 'screens')
export const DATA_DIR = path.join(BASE, 'data')
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json')

for (const d of [SCREENS_DIR, DATA_DIR]) fs.mkdirSync(d, { recursive: true })

export function slugify(name) {
  return String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function screenDir(slug) {
  const dir = path.join(SCREENS_DIR, slug)
  if (!dir.startsWith(SCREENS_DIR)) throw new Error('bad slug')
  return dir
}

export function ensureScreenDirs(slug) {
  const dir = screenDir(slug)
  for (const sub of ['assets', 'raw', 'prompts', 'previews', 'references']) {
    fs.mkdirSync(path.join(dir, sub), { recursive: true })
  }
  return dir
}

export function manifestPath(slug) {
  return path.join(screenDir(slug), 'screen-manifest.json')
}

export function readManifest(slug) {
  const p = manifestPath(slug)
  if (!fs.existsSync(p)) return null
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

export function writeManifest(slug, manifest) {
  manifest.updated_at = new Date().toISOString()
  fs.writeFileSync(manifestPath(slug), JSON.stringify(manifest, null, 2))
  return manifest
}

export function listScreens() {
  if (!fs.existsSync(SCREENS_DIR)) return []
  return fs.readdirSync(SCREENS_DIR)
    .filter(f => fs.existsSync(manifestPath(f)))
    .map(slug => {
      const m = readManifest(slug)
      return {
        slug,
        screen_name: m.screen_name,
        category: m.category,
        status: m.status,
        assets: (m.generated_assets || []).length,
        has_master_reference: fs.existsSync(path.join(screenDir(slug), 'master-reference.png'))
      }
    })
}

export function readJobs() {
  if (!fs.existsSync(JOBS_FILE)) return []
  return JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'))
}

export function writeJobs(jobs) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2))
}
