import { EQ_DNA, GLOBAL_RULES, PLAIN_BG, SCENE_BG } from './eqPreset.js'

const STYLE_BY_TYPE = {
  eq_character: 'Premium soft-rounded 3D-lite children\'s app mascot illustration, smooth matte surfaces, gentle studio lighting, crisp clean edges.',
  environment: 'Premium painterly children\'s app environment illustration, soft warm lighting, gentle color grading, Islamic-inspired serene atmosphere where relevant.',
  floating_object: 'Premium stylized 3D-lite children\'s app illustration of a floating object, soft ambient occlusion, gentle rim light, crisp silhouette.',
  prop: 'Premium stylized 3D-lite children\'s app prop illustration, soft shading, crisp silhouette.',
  avatar: 'Premium soft-rounded children\'s avatar illustration, friendly and age-appropriate, crisp clean edges.'
}

// One request = one asset. Model is locked to gpt_image_2 — no silent fallback.
export const LOCKED_MODEL = 'gpt_image_2'

export function buildPrompt(asset, screen) {
  const parts = []
  parts.push(`${asset.name}: ${asset.purpose}`)
  if (asset.prompt_details) parts.push(asset.prompt_details)
  parts.push(STYLE_BY_TYPE[asset.type] || STYLE_BY_TYPE.prop)
  if (asset.type === 'eq_character') parts.push(EQ_DNA)
  parts.push(asset.remove_background ? PLAIN_BG : SCENE_BG)
  parts.push(GLOBAL_RULES)

  // Classification-driven directives: composition_rule is not documentation
  // only — it is compiled directly into the request so the model can't drift
  // from what the manifest declared this artwork must/must not contain.
  const cr = asset.composition_rule
  if (cr?.must_include?.length) {
    parts.push(`MUST include, explicitly and unmistakably: ${cr.must_include.join('; ')}.`)
  }
  if (cr?.must_not_include?.length) {
    parts.push(`MUST NOT include, under any circumstances: ${cr.must_not_include.join('; ')}.`)
  }
  if (asset.asset_class === 'reusable_asset' && asset.reuse_scope === 'global') {
    parts.push('This is a reusable global asset meant to appear on multiple different screens: keep the composition self-contained and generic to this subject only, with no screen-specific context, layout cues, or one-off details baked in.')
  }
  if (asset.asset_class === 'composite_artwork') {
    parts.push('This is a single screen-specific composite artwork combining several elements into one cohesive scene — render all required elements together in one unified illustration, not as separate objects or a collage.')
  }

  parts.push(`This asset belongs to the "${screen.screen_name}" screen; match the visual style, palette and lighting of the attached screen reference, but render ONLY this single subject as an independent asset. Do not reproduce the whole screen.`)
  return parts.join('\n\n')
}

// Mobile production policy: 4K is never requested for current UI assets.
// reusable_asset (icons, EQ, avatars — small on-screen footprint, reused
// everywhere) -> 1K. composite_artwork (hero/card backgrounds, full-bleed
// but still mobile) -> 2K. 4K is reserved for future marketing assets only,
// which don't go through this factory today.
const FINAL_RESOLUTION_BY_CLASS = { reusable_asset: '1k', composite_artwork: '2k' }

export function buildJobParams(asset, screen, { draft = false } = {}) {
  return {
    model: LOCKED_MODEL,
    prompt: buildPrompt(asset, screen),
    aspect_ratio: asset.aspect_ratio || '1:1',
    resolution: draft ? '1k' : (FINAL_RESOLUTION_BY_CLASS[asset.asset_class] || '2k'),
    quality: draft ? 'low' : 'high'
  }
}
