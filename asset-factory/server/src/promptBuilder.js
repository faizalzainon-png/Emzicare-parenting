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
  parts.push(`This asset belongs to the "${screen.screen_name}" screen; match the visual style, palette and lighting of the attached screen reference, but render ONLY this single subject as an independent asset. Do not reproduce the whole screen.`)
  return parts.join('\n\n')
}

export function buildJobParams(asset, screen, { draft = false } = {}) {
  return {
    model: LOCKED_MODEL,
    prompt: buildPrompt(asset, screen),
    aspect_ratio: asset.aspect_ratio || '1:1',
    resolution: draft ? '1k' : '4k',
    quality: draft ? 'low' : 'high'
  }
}
