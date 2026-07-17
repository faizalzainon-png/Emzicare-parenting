// Hard orientation validation, checked against ACTUAL output pixels — never
// the requested params. Shared by the worker-completion endpoint (every future
// generation) and the review-sheet script (one-off download/backfill). Never
// auto-corrects (no rotate/stretch) — only blocks approval and reports why.
export function checkOrientation(requirement, width, height) {
  if (!requirement || !width || !height) return { checked: false, passed: true }
  const ratio = width / height
  if (requirement === 'landscape') {
    const passed = ratio >= 1.15
    return { checked: true, passed, ratio, reason: passed ? null : `requires a wide/landscape composition but the output is ${width}×${height} (ratio ${ratio.toFixed(2)}), which is not genuinely wide. Do not rotate or stretch this to fake a fix — regenerate with the composition actually built wide.` }
  }
  if (requirement === 'portrait') {
    const passed = ratio <= 0.87
    return { checked: true, passed, ratio, reason: passed ? null : `requires a tall/portrait composition but the output is ${width}×${height} (ratio ${ratio.toFixed(2)}), which is not genuinely tall.` }
  }
  if (requirement === 'square') {
    const passed = Math.abs(ratio - 1) <= 0.08
    return { checked: true, passed, ratio, reason: passed ? null : `requires a square composition but the output is ${width}×${height} (ratio ${ratio.toFixed(2)}).` }
  }
  return { checked: false, passed: true }
}
