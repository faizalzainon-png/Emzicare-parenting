// Locked EQ Character DNA. Appended verbatim to every eq_character prompt.
// Never edit per-asset; EQ must never be redesigned or reinterpreted.
export const EQ_DNA = [
  'EQ character exact specification (must match precisely, never redesign or reinterpret):',
  'rounded-square head with softly rounded corners, the top-right Signature Corner noticeably more rounded than the other three;',
  'asymmetric eyes: LEFT eye is an angular chevron shape, RIGHT eye is a simple round dot;',
  'small open smile showing a coral tongue;',
  'cream/off-white torso;',
  'LEFT arm and LEFT leg solid Primary Green #00B894;',
  'RIGHT arm and RIGHT leg solid Golden Yellow #FFB703;',
  'a coral heart #FF5D6E on the torso;',
  'simple rounded limbs with NO fingers, NO clothes, NO shoes;',
  'the head remains the dominant mass of the body;',
  'calm, gentle, friendly presence.'
].join(' ')

// Hard rules appended to EVERY generation prompt regardless of type.
export const GLOBAL_RULES = [
  'Single isolated subject only, one asset per image.',
  'No text, no letters, no numbers, no labels, no captions, no watermark.',
  'No UI elements, no buttons, no cards, no frames, no device mockups.',
  'No collage, no grid, no sprite sheet, no multiple variants side by side.'
].join(' ')

export const PLAIN_BG = 'Subject fully in frame with generous margin on all sides, centered, on a flat plain solid light neutral background with no shadows cast on the background (background will be removed).'

export const SCENE_BG = 'Full-bleed scene composition that reaches every edge of the frame; the background is part of the asset and must be kept.'
