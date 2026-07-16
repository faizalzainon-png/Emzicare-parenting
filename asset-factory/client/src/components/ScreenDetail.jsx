import React, { useEffect, useState, useCallback } from 'react'
import { api } from '../api.js'

export default function ScreenDetail({ slug, onBack, onError }) {
  const [data, setData] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draftJson, setDraftJson] = useState('')
  const [promoting, setPromoting] = useState(false)
  const [promoteResult, setPromoteResult] = useState(null)

  const load = useCallback(() => api.getScreen(slug).then(setData).catch(e => onError(e.message)), [slug, onError])
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t) }, [load])

  if (!data) return <main><p>Loading…</p></main>
  const m = data.manifest
  const call = (fn) => fn().then(load).catch(e => onError(e.message))

  const assets = m.generated_assets || []
  const allApproved = assets.length > 0 && assets.every(a => a.generation?.status === 'approved')

  const runPromote = () => {
    setPromoting(true)
    setPromoteResult(null)
    api.promote(slug).then(result => { setPromoteResult(result); load() }).finally(() => setPromoting(false))
  }

  const uploadMore = (e, isMaster) => {
    const fd = new FormData()
    if (isMaster) fd.append('master', e.target.files[0])
    else for (const f of e.target.files) fd.append('references', f)
    call(() => api.uploadReferences(slug, fd))
  }

  return (
    <main>
      <div className="row space">
        <button className="ghost" onClick={onBack}>← Screens</button>
        <span className={`badge status-${m.status}`}>{m.status}</span>
      </div>
      <h2>{m.screen_name}</h2>

      <section>
        <h3>References</h3>
        <div className="ref-row">
          {data.has_master_reference
            ? <figure><img src={`/files/${slug}/master-reference.png`} alt="master" /><figcaption>master-reference.png (reference only — never cropped)</figcaption></figure>
            : <p className="warn">⚠ Master reference not uploaded. Approval is blocked until it is.</p>}
        </div>
        <div className="row">
          <label className="filebtn">Upload master reference<input type="file" accept="image/*" hidden onChange={e => uploadMore(e, true)} /></label>
          <label className="filebtn">Add supporting references<input type="file" accept="image/*" multiple hidden onChange={e => uploadMore(e, false)} /></label>
        </div>
        {data.references.length > 0 && <p className="muted">Supporting: {data.references.join(', ')}</p>}
      </section>

      <section>
        <div className="row space">
          <h3>Screen manifest</h3>
          <div className="row">
            <button className="ghost" onClick={() => { setDraftJson(JSON.stringify(m, null, 2)); setEditing(true) }}>Edit JSON</button>
            {m.status !== 'approved' && <button onClick={() => call(() => api.approve(slug))}>Approve manifest (Faizal)</button>}
          </div>
        </div>
        {editing && (
          <div className="editor">
            <textarea value={draftJson} onChange={e => setDraftJson(e.target.value)} rows={24} />
            <div className="row">
              <button onClick={() => { try { const next = JSON.parse(draftJson); call(() => api.saveManifest(slug, next)); setEditing(false) } catch (e) { onError('Invalid JSON: ' + e.message) } }}>Save (drops approval)</button>
              <button className="ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
        <h4>Native UI (never generated as images)</h4>
        <ul>{(m.native_ui || []).map((n, i) => <li key={i}><strong>{n.name}</strong> — <span className="muted">{n.notes}</span></li>)}</ul>
      </section>

      <section>
        <h3>Generated assets</h3>
        {(m.generated_assets || []).map(a => <AssetCard key={a.id} a={a} slug={slug} manifestStatus={m.status} call={call} />)}
      </section>

      <section>
        <h3>Review sheet</h3>
        <img className="review-sheet" src={`/files/${slug}/previews/review-sheet.png?t=${data.jobs.length}`} alt="review sheet"
          onError={e => { e.target.style.display = 'none' }} />
      </section>

      <section>
        <h3>Package</h3>
        <div className="row">
          <button className="ghost" onClick={() => call(() => api.handoff(slug))}>Regenerate figma-handoff.md</button>
          <a className="btnlink" href={`/api/screens/${slug}/export`}>Export screen package (.zip)</a>
          {allApproved && (
            <button onClick={runPromote} disabled={promoting}>{promoting ? 'Promoting…' : 'Promote Approved Assets'}</button>
          )}
        </div>
        {!allApproved && assets.length > 0 && (
          <p className="muted">Promote unlocks once all {assets.length} generated assets show "approved" below.</p>
        )}
        {promoteResult && (
          promoteResult.ok
            ? <p>✅ Promoted. Package: <code>{promoteResult.zipPath}</code></p>
            : <div className="warn">
                <p>Not promoted:</p>
                <ul>{(promoteResult.blocking || [promoteResult.error]).map((b, i) => <li key={i}>{b}</li>)}</ul>
              </div>
        )}
      </section>

      {data.jobs.length > 0 && (
        <section>
          <h3>Generation jobs</h3>
          <ul className="jobs">
            {data.jobs.map(j => (
              <li key={j.id}>
                <code>{j.asset_id}</code> attempt {j.attempt} {j.draft ? '(draft)' : '(final)'} — <span className={`badge status-${j.status}`}>{j.status}</span>
                {j.cost_credits != null && <span className="muted"> {j.cost_credits} credits</span>}
                {j.failure_reason && <span className="warn"> {j.failure_reason}</span>}
              </li>
            ))}
          </ul>
          <p className="muted">Jobs are executed by a local Claude Code worker session with the Higgsfield MCP connected — see WORKER.md.</p>
        </section>
      )}
    </main>
  )
}

const MAX_ATTEMPTS = 3 // must match server/src/index.js's stop-loss cap

function AssetCard({ a, slug, manifestStatus, call }) {
  const g = a.generation || { status: 'pending', attempts: [] }
  const attemptCount = g.attempts?.length || 0
  const remaining = Math.max(0, MAX_ATTEMPTS - attemptCount)
  const inFlight = ['queued', 'claimed', 'submitted'].includes(g.status)
  const needsRegeneration = ['rejected', 'blocked_orientation', 'failed'].includes(g.status)
  const neverGenerated = attemptCount === 0

  return (
    <div className="asset">
      <div className="row space">
        <strong>{a.name}</strong>
        <span className={`badge status-${g.status || 'pending'}`}>{g.status || 'pending'}</span>
      </div>
      <p className="muted">{a.purpose}</p>
      <p className="muted">type: {a.type} · aspect {a.aspect_ratio} · {a.remove_background ? 'cutout (remove background)' : 'keeps background'} · layer {a.layer_order} · anchor {a.anchor}</p>

      {manifestStatus !== 'approved' && <p className="warn">Generation locked until the manifest is approved.</p>}

      {manifestStatus === 'approved' && g.status !== 'approved' && !inFlight && (
        <div className="row">
          {neverGenerated && <button onClick={() => call(() => api.generate(slug, a.id, { draft: true }))}>Queue draft (1k/low)</button>}
          {neverGenerated && <button onClick={() => call(() => api.generate(slug, a.id, { draft: false }))}>Queue final (4k/high)</button>}
          {needsRegeneration && remaining > 0 && (
            <button onClick={() => call(() => api.generate(slug, a.id, { draft: false }))}>Queue Final Regeneration</button>
          )}
          {needsRegeneration && remaining === 0 && (
            <span className="warn">Stop-loss reached ({attemptCount}/{MAX_ATTEMPTS} attempts) — no attempts remain. Needs a human decision before regenerating again.</span>
          )}
        </div>
      )}
      {manifestStatus === 'approved' && g.status !== 'approved' && !neverGenerated && (
        <p className="muted">{attemptCount}/{MAX_ATTEMPTS} attempts used · {remaining} stop-loss attempt{remaining === 1 ? '' : 's'} remaining</p>
      )}
      {inFlight && <p className="muted">Job {g.status} — waiting on the local Higgsfield worker session (see WORKER.md).</p>}

      {(g.attempts || []).map(att => (
        <div className="attempt" key={att.attempt}>
          <div className="row space">
            <span>Attempt {att.attempt} {att.draft ? '(draft)' : '(final)'} — {att.status}
              {att.actual_dimensions?.width && <span className="muted"> · actual {att.actual_dimensions.width}×{att.actual_dimensions.height}</span>}
            </span>
            {att.status === 'awaiting_review' && (
              <span className="row">
                <button onClick={() => call(() => api.review(slug, a.id, 'approve', att.attempt))}>Approve</button>
                <button className="ghost" onClick={() => call(() => api.review(slug, a.id, 'reject', att.attempt))}>Reject</button>
              </span>
            )}
          </div>
          {att.status === 'blocked_orientation' && (
            <p className="warn">⚠ Orientation check failed — approval is disabled for this attempt: {att.orientation_check?.reason}</p>
          )}
          <div className="ref-row">
            {att.raw_file && <figure><img src={`/files/${slug}/${att.raw_file}`} alt="raw" /><figcaption>raw</figcaption></figure>}
            {att.cutout_file && <figure className="checker"><img src={`/files/${slug}/${att.cutout_file}`} alt="cutout" /><figcaption>cutout (alpha)</figcaption></figure>}
          </div>
        </div>
      ))}
      {g.approved_file && <p>✅ Approved file: <code>{g.approved_file}</code>{g.actual_dimensions?.width ? ` (${g.actual_dimensions.width}×${g.actual_dimensions.height})` : ''}</p>}
    </div>
  )
}
