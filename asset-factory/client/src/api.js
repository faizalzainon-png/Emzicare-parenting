async function j(res) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
  return body
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
