#!/usr/bin/env node
// One command for the whole Parent Dashboard review step:
//   1. download + validate + build the review sheet (review-sheet.mjs)
//   2. open the review sheet image
//   3. start the factory server + client if not already running
//   4. open the browser straight to the Parent Dashboard review page
//
// Usage: node review-dashboard.mjs   (screen is fixed to parent-dashboard —
// per instruction, this pilot does not expand to other screens.)

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { runReviewSheet } from './review-sheet.mjs'

const SLUG = 'parent-dashboard'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ASSET_FACTORY_ROOT = path.resolve(HERE, '..')
const SERVER_URL = 'http://localhost:5178'
const CLIENT_URL = 'http://localhost:5173'

function openPath(target) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  try {
    const child = spawn(cmd, process.platform === 'win32' ? ['', target] : [target], { shell: process.platform === 'win32', stdio: 'ignore', detached: true })
    child.unref()
    return true
  } catch {
    return false
  }
}

async function isUp(url) {
  try { const r = await fetch(url); return r.ok || r.status < 500 } catch { return false }
}

async function waitUntilUp(url, timeoutMs = 20000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await isUp(url)) return true
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

function spawnDetached(cmd, args, cwd, label) {
  console.log(`Starting ${label}...`)
  const child = spawn(cmd, args, { cwd, detached: true, stdio: 'ignore' })
  child.unref()
}

async function main() {
  console.log(`=== Step 1-4: review sheet for "${SLUG}" ===\n`)
  const { sheetPath, orientationBlocked } = await runReviewSheet(SLUG)

  console.log(`\n=== Opening the review sheet ===`)
  const opened = openPath(sheetPath)
  console.log(opened ? `  Opened: ${sheetPath}` : `  Could not auto-open. Open this file manually: ${sheetPath}`)

  console.log(`\n=== Step 5: factory UI on the Parent Dashboard review page ===`)
  if (await isUp(`${SERVER_URL}/api/health`)) {
    console.log(`  Server already running at ${SERVER_URL}`)
  } else {
    spawnDetached('npm', ['run', 'start', '--workspace', 'server'], ASSET_FACTORY_ROOT, 'factory server')
    const up = await waitUntilUp(`${SERVER_URL}/api/health`)
    console.log(up ? `  Server up at ${SERVER_URL}` : `  Server did not respond in time — check it manually with: npm run server`)
  }

  if (await isUp(CLIENT_URL)) {
    console.log(`  Client already running at ${CLIENT_URL}`)
  } else {
    spawnDetached('npm', ['run', 'dev', '--workspace', 'client'], ASSET_FACTORY_ROOT, 'factory UI (Vite)')
    const up = await waitUntilUp(CLIENT_URL, 30000)
    console.log(up ? `  Client up at ${CLIENT_URL}` : `  Client did not respond in time — check it manually with: npm run client`)
  }

  const reviewUrl = `${CLIENT_URL}/?screen=${SLUG}`
  openPath(reviewUrl)

  console.log(`\n=== Ready ===`)
  console.log(`Open (or check the tab that just opened): ${reviewUrl}`)
  if (orientationBlocked.length) {
    console.log(`\n⚠ Orientation check BLOCKED approval for: ${orientationBlocked.map(b => b.id).join(', ')}`)
    console.log(`  These need "Queue Final Regeneration" in the UI before they can be approved.`)
  }
  console.log(`\nApprove or reject each asset with the buttons in the UI. Once all three show`)
  console.log(`"approved", click "Promote Approved Assets" there — nothing to edit by hand.`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
