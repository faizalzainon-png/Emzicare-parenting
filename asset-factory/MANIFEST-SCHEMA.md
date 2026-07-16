# Screen Manifest Schema — Visual Classification

Every visual on every screen belongs to exactly one of three classes. This is
enforced at manifest approval (`POST /api/screens/:slug/approve` refuses to
approve a manifest where any asset is missing or misclassified) and is baked
directly into the generation prompt for every asset in `generated_assets` —
not just documentation.

## The three classes

### 1. `native_ui`
Built in React/Figma. **Never generated.** Lives in the manifest's top-level
`native_ui[]` array (unchanged from before this schema — no new required
fields there beyond `name`/`notes`).

Examples: buttons, cards, text, progress rings, navigation layout.

### 2. `reusable_asset`
Generated **once**, reused across **many screens**. Lives in
`generated_assets[]` with `asset_class: "reusable_asset"`.

Examples: EQ mascot poses, reward chest, floating coin, avatars, decorative
objects.

### 3. `composite_artwork`
A **screen-specific** illustration combining multiple visual elements into
one artwork. Lives in `generated_assets[]` with
`asset_class: "composite_artwork"`.

Examples: Hero Landscape, Family Quest Artwork, Empty State Illustration,
Quest Banner.

## Required fields on every `generated_assets[]` entry

```json
{
  "id": "hero-landscape",
  "asset_class": "composite_artwork",
  "reuse_scope": "screen_only",
  "composition_rule": {
    "must_include": [
      "bright blue daytime sky with soft white clouds",
      "distant mosque silhouette with dome and minaret on the right side",
      "green rolling hills"
    ],
    "must_not_include": [
      "any character or mascot",
      "text, letters, or UI elements",
      "a portrait/tall composition — this MUST render wide/landscape"
    ],
    "native_overlay": "Progress rings and header text sit on top of this artwork in the hero band; leave open space for them, do not draw UI-like shapes yourself."
  }
}
```

- **`asset_class`**: `"reusable_asset"` or `"composite_artwork"` (never
  `"native_ui"` here — that class lives only in the top-level array).
- **`reuse_scope`**: `"global"` (this exact file will be reused unchanged on
  other screens — never regenerate a near-duplicate) or `"screen_only"`
  (specific to this one screen).
- **`composition_rule.must_include`**: non-empty array, explicit and
  unambiguous. This is what the prompt builder compiles directly into the
  generation request as "MUST include, explicitly and unmistakably: ...".
- **`composition_rule.must_not_include`**: non-empty array, equally explicit.
  Compiled into the request as "MUST NOT include, under any circumstances: ...".
  This is exactly the kind of explicit exclusion list that would have caught
  the Hero Landscape orientation bug earlier — state the required orientation
  here, don't leave it implicit in `aspect_ratio` alone.
- **`composition_rule.native_overlay`**: describe where native UI (text,
  buttons, rings, etc.) will sit on top of this artwork once composited into
  the screen, or state `"none"` explicitly if nothing overlays it.

## Why this is enforced, not just documented

The Hero Landscape bug (a portrait 2480×3312 output requested as a "hero
background" with no explicit orientation requirement stated anywhere in its
own asset entry) happened because nothing forced a decomposition to be
explicit about what the artwork must contain and how it must be shaped.
`POST /api/screens/:slug/approve` now refuses to approve any manifest missing
these fields, and `must_include`/`must_not_include` are compiled straight into
the Higgsfield prompt — so the discipline this schema describes actually
constrains every future generation request, not just the paperwork around it.

## What does NOT need these fields

- `native_ui[]` entries — unchanged, still just `{name, notes}`.
- Nothing on the current Parent Dashboard pilot was changed to add these
  fields retroactively; this schema applies going forward, to newly
  decomposed screens.
