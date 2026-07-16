import fs from 'fs'
import path from 'path'
import { screenDir } from './store.js'

export function generateFigmaHandoff(slug, manifest) {
  const lines = []
  lines.push(`# Figma Handoff — ${manifest.screen_name}`)
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push(`Source reference: \`${manifest.source_reference || 'master-reference.png'}\` (composition/style reference ONLY)`)
  lines.push('')
  lines.push('## ⚠️ Rules for whoever builds this screen')
  lines.push('')
  lines.push('- **Do NOT flatten the master screenshot into the design.** It is a reference, never a production layer.')
  lines.push('- **Do NOT crop anything out of the master screenshot.** Every illustration below exists as its own high-resolution file in `assets/`.')
  lines.push('- All text, buttons, cards, rings, navigation and backgrounds listed under "Native UI" must be built as real Figma/React components, never as images.')
  lines.push('- Rebuild the approved composition exactly — do not redesign it.')
  lines.push('')
  lines.push('## Native UI components (build in Figma/React, never generate as images)')
  lines.push('')
  for (const n of manifest.native_ui || []) {
    lines.push(`- **${n.name}** — ${n.notes || ''}`)
  }
  lines.push('')
  lines.push('## Generated illustration assets')
  lines.push('')
  for (const a of manifest.generated_assets || []) {
    const file = a.generation?.approved_file || `assets/${a.id}.png (pending approval)`
    lines.push(`### ${a.name}`)
    lines.push('')
    lines.push(`| Field | Value |`)
    lines.push(`|---|---|`)
    lines.push(`| Asset file | \`${file}\` |`)
    lines.push(`| Asset class | ${a.asset_class || '—'} |`)
    lines.push(`| Reuse scope | ${a.reuse_scope || '—'}${a.reuse_scope === 'global' ? ' — do NOT duplicate-generate for other screens, reuse this file' : ''} |`)
    lines.push(`| Must include | ${(a.composition_rule?.must_include || []).join('; ') || '—'} |`)
    lines.push(`| Must NOT include | ${(a.composition_rule?.must_not_include || []).join('; ') || '—'} |`)
    lines.push(`| Native UI overlay | ${a.composition_rule?.native_overlay || '—'} |`)
    lines.push(`| Intended UI section | ${a.placement?.section || '—'} |`)
    lines.push(`| Placement notes | ${a.placement?.description || '—'} |`)
    lines.push(`| Recommended rendered width | ${a.recommended_dimensions?.width ? a.recommended_dimensions.width + 'px (design scale)' : '—'} |`)
    lines.push(`| Alignment | ${a.alignment || '—'} |`)
    lines.push(`| Anchor point | ${a.anchor || '—'} |`)
    lines.push(`| Crop / object-fit | ${a.object_fit || (a.remove_background ? 'contain (transparent PNG, never crop the subject)' : 'cover (full-bleed scene, safe to crop edges)')} |`)
    lines.push(`| Z-index / layer order | ${a.layer_order ?? '—'} |`)
    lines.push(`| Responsive behaviour | ${a.responsive || '—'} |`)
    lines.push(`| Transparent background | ${a.remove_background ? 'yes — usable alpha required' : 'no — retains its own background'} |`)
    lines.push(`| Native components built around it | ${(a.native_neighbors || []).join(', ') || '—'} |`)
    if (a.generation?.actual_dimensions) {
      lines.push(`| Actual source resolution | ${a.generation.actual_dimensions.width}×${a.generation.actual_dimensions.height} |`)
    }
    lines.push('')
  }
  const md = lines.join('\n')
  fs.writeFileSync(path.join(screenDir(slug), 'figma-handoff.md'), md)
  return md
}
