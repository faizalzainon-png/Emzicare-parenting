import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

// Mobile display budget: assets over this are flagged REVIEW, not rejected.
export const BUDGET_KB = 50

// Max output width per class — the smallest size that still looks premium at
// actual mobile display size, not the largest the source can offer.
// reusable_asset (icons/EQ/avatars): small on-screen footprint everywhere;
// 512px covers 2-3x density at typical ~150-250pt UI sizes.
// composite_artwork (hero/card backgrounds): full-bleed but still mobile;
// 1080px is the standard "mobile hero" width, covers phones and tablets at
// 2x+ density with no visible loss versus a much larger source.
const MAX_WIDTH_BY_CLASS = { reusable_asset: 512, composite_artwork: 1080 }

async function encodePngUnderBudget(pipeline) {
  // Alpha-safe ladder: lossless recompression first (zero visual change),
  // then a light palette pass only if still over budget. Stops at 128 colors
  // — enough headroom to avoid visible banding/halos on soft alpha edges.
  const attempts = [
    { png: { compressionLevel: 9, effort: 10, adaptiveFiltering: true } },
    { png: { compressionLevel: 9, effort: 10, adaptiveFiltering: true, palette: true, colors: 256, dither: 0 } },
    { png: { compressionLevel: 9, effort: 10, adaptiveFiltering: true, palette: true, colors: 128, dither: 0 } }
  ]
  let buf = null
  for (const { png } of attempts) {
    buf = await pipeline.clone().png(png).toBuffer()
    if (buf.length <= BUDGET_KB * 1024) break
  }
  return buf
}

async function encodeWebpUnderBudget(pipeline, { qualityFloor }) {
  // Quality ladder down to a floor that still reads as premium — composite
  // artwork gets a higher floor (large painterly scenes show compression
  // artifacts sooner) than nothing-to-protect isn't relevant here since this
  // path is opaque-only; floor is passed in per asset class.
  const qualities = [82, 72, 62, qualityFloor].filter((q, i, a) => a.indexOf(q) === i && q >= qualityFloor)
  let buf = null
  for (const quality of qualities) {
    buf = await pipeline.clone().webp({ quality, effort: 6 }).toBuffer()
    if (buf.length <= BUDGET_KB * 1024) break
  }
  return buf
}

/**
 * Produce the final mobile-production file for one approved asset.
 * @param {string} sourcePath - the approved staging PNG (from raw/cutout copy)
 * @param {string} destDirNoExt - destination path without extension, e.g. assets/eq-greeting-companion
 * @param {object} opts - { transparent: bool, assetClass: 'reusable_asset'|'composite_artwork' }
 * @returns {{path:string, format:string, width:number, height:number, sizeKB:number, result:'PASS'|'REVIEW'}}
 */
export async function optimizeForProduction(sourcePath, destDirNoExt, { transparent, assetClass }) {
  const maxWidth = MAX_WIDTH_BY_CLASS[assetClass] || MAX_WIDTH_BY_CLASS.composite_artwork
  const source = sharp(sourcePath, { failOn: 'none' })
  const meta = await source.metadata()
  const targetWidth = Math.min(meta.width, maxWidth)
  // sharp strips EXIF/ICC/other metadata by default unless withMetadata() is
  // called — deliberately never calling it here keeps output metadata-free.
  const resized = source.resize({ width: targetWidth, withoutEnlargement: true })

  let buf, ext
  if (transparent) {
    buf = await encodePngUnderBudget(resized)
    ext = 'png'
  } else {
    // Composite artwork (large scenic illustrations) gets a higher quality
    // floor than a generic opaque asset would, so aggressive compression
    // never introduces visible artifacts purely to hit the number.
    const qualityFloor = assetClass === 'composite_artwork' ? 55 : 45
    buf = await encodeWebpUnderBudget(resized, { qualityFloor })
    ext = 'webp'
  }

  const outPath = `${destDirNoExt}.${ext}`
  fs.writeFileSync(outPath, buf)
  const finalMeta = await sharp(outPath).metadata()
  const sizeKB = Math.round((buf.length / 1024) * 10) / 10

  return {
    filename: path.basename(outPath),
    path: outPath,
    format: ext,
    width: finalMeta.width,
    height: finalMeta.height,
    sizeKB,
    result: sizeKB <= BUDGET_KB ? 'PASS' : 'REVIEW'
  }
}
