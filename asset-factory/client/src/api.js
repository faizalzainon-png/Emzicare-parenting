async function j(res) {
  const text = await res.text()
  let body
  try { body = text ? JSON.parse(text) : {} } catch { body = null }
  if (!res.ok) {
    // Never swallow: if the server didn't return our own {error} JSON shape
    // (e.g. an uncaught exception rendering an HTML stack trace), surface the
    // raw response body instead of a bare "HTTP 500" so nothing is lost.
    const message = body?.error || (text ? `HTTP ${res.status}: ${text.slice(0, 500)}` : `HTTP ${res.status}`)
    throw new Error(message)
  }
  return body ?? {}
}

export const api = {
  listScreens: () => fetch('/api/screens').then(j),
  getScreen: (slug) => fetch(`/api/screens/${slug}`).then(j),
  createScreen: (formData) => fetch('/api/screens', { method: 'POST', body: formData }).then(j),
  uploadReferences: (slug, formData) => fetch(`/api/screens/${slug}/references`, { method: 'POST', body: formData }).then(j),
  saveManifest: (slug, manifest) => fetch(`/api/screens/${slug}/manifest`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(manifest)
  }).then(j),
  approve: (slug) => fetch(`/api/screens/${slug}/approve`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approved_by: 'Faizal' })
  }).then(j),
  generate: (slug, assetId, opts) => fetch(`/api/screens/${slug}/assets/${assetId}/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts || {})
  }).then(j),
  review: (slug, assetId, decision, attempt, note) => fetch(`/api/screens/${slug}/assets/${assetId}/review`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision, attempt, note })
  }).then(j),
  handoff: (slug) => fetch(`/api/screens/${slug}/handoff`, { method: 'POST' }).then(j),
  // Returns the parsed body even on failure (ok:false + blocking[]) so the UI
  // can show exactly which assets are still unapproved instead of a generic error.
  promote: (slug) => fetch(`/api/screens/${slug}/promote`, { method: 'POST' }).then(r => r.json())
}
