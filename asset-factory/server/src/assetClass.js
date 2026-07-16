// Canonical three-way visual classification, enforced at manifest approval so
// every future screen is decomposed with this discipline before anything can
// be generated — not just documented as a convention.
//
// 1. native_ui        — built in React/Figma, never generated (buttons, cards,
//                        text, progress rings, nav layout). Lives in the
//                        manifest's top-level `native_ui` array.
// 2. reusable_asset    — generated once, reused across many screens (EQ
//                        mascot, reward chest, floating coin, avatars,
//                        decorative objects). Lives in `generated_assets`.
// 3. composite_artwork — screen-specific illustration combining multiple
//                        visual elements in one artwork (Hero Landscape,
//                        Family Quest Artwork, Empty State Illustration,
//                        Quest Banner). Lives in `generated_assets`.

export const ASSET_CLASSES = ['native_ui', 'reusable_asset', 'composite_artwork']
export const REUSE_SCOPES = ['global', 'screen_only']

// Every entry in generated_assets must declare how it will be produced and
// reused, and exactly what the artwork must/must not contain — this is what
// would have caught the Hero Landscape ambiguity (a "hero background" with no
// explicit must_include/must_not_include list and no declared composition
// intent) before it ever reached generation.
export function validateGeneratedAsset(asset) {
  const errors = []
  const where = `asset "${asset.id || asset.name || '(unnamed)'}"`

  if (!ASSET_CLASSES.includes(asset.asset_class) || asset.asset_class === 'native_ui') {
    errors.push(`${where}: asset_class must be "reusable_asset" or "composite_artwork" (got ${JSON.stringify(asset.asset_class)})`)
  }
  if (!REUSE_SCOPES.includes(asset.reuse_scope)) {
    errors.push(`${where}: reuse_scope must be one of ${REUSE_SCOPES.join(' | ')} (got ${JSON.stringify(asset.reuse_scope)})`)
  }
  const cr = asset.composition_rule
  if (!cr || typeof cr !== 'object') {
    errors.push(`${where}: composition_rule is required (must_include, must_not_include, native_overlay)`)
  } else {
    if (!Array.isArray(cr.must_include) || cr.must_include.length === 0) {
      errors.push(`${where}: composition_rule.must_include must be a non-empty array — state exactly what the artwork must contain`)
    }
    if (!Array.isArray(cr.must_not_include) || cr.must_not_include.length === 0) {
      errors.push(`${where}: composition_rule.must_not_include must be a non-empty array — state exactly what must be excluded`)
    }
    if (cr.native_overlay === undefined) {
      errors.push(`${where}: composition_rule.native_overlay is required — describe where native UI sits on top of this artwork, or explicitly note "none"`)
    }
  }
  // reusable_asset entries meant for global reuse across screens should not
  // carry screen-specific content in must_include — a soft check, not fatal,
  // surfaced as a warning rather than blocking approval.
  const warnings = []
  if (asset.asset_class === 'reusable_asset' && asset.reuse_scope === 'global' && cr?.must_include?.some(s => /dashboard|screen|banner|card/i.test(s))) {
    warnings.push(`${where}: reuse_scope is "global" but must_include mentions screen-specific context — verify this is genuinely reusable elsewhere`)
  }
  return { errors, warnings }
}

export function validateNativeUiEntry(entry) {
  const errors = []
  const where = `native_ui "${entry.name || '(unnamed)'}"`
  if (entry.asset_class !== undefined && entry.asset_class !== 'native_ui') {
    errors.push(`${where}: asset_class must be "native_ui" when present (got ${JSON.stringify(entry.asset_class)})`)
  }
  return { errors }
}
