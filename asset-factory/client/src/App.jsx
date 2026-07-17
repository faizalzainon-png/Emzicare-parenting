import React, { useEffect, useState } from 'react'
import { api } from './api.js'
import NewScreen from './components/NewScreen.jsx'
import ScreenDetail from './components/ScreenDetail.jsx'

export default function App() {
  const [screens, setScreens] = useState([])
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  const refresh = () => api.listScreens().then(setScreens).catch(e => setError(e.message))
  useEffect(() => { refresh() }, [])

  // ?screen=<slug> deep-links straight to that screen's review page.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('screen')
    if (slug) setSelected(slug)
  }, [])

  return (
    <div className="app">
      <header>
        <h1>EQrel Screen-to-Asset Factory</h1>
        <p className="tag">Approved screen concept → individual production illustration assets. Model locked to <code>gpt_image_2</code>. Nothing generates without Faizal's approval.</p>
      </header>
      {error && (
        <div className="error-overlay" onClick={() => setError(null)}>
          <div className="error-dialog" onClick={e => e.stopPropagation()}>
            <h3>⚠ Action failed</h3>
            <p>{error}</p>
            <button onClick={() => setError(null)}>Close</button>
          </div>
        </div>
      )}
      {!selected && !creating && (
        <main>
          <div className="row space">
            <h2>Screens</h2>
            <button onClick={() => setCreating(true)}>+ Import screen</button>
          </div>
          {screens.length === 0 && <p className="muted">No screens yet. Import an approved screen concept to begin.</p>}
          <ul className="screen-list">
            {screens.map(s => (
              <li key={s.slug} onClick={() => setSelected(s.slug)}>
                <strong>{s.screen_name}</strong>
                <span className={`badge status-${s.status}`}>{s.status}</span>
                <span className="muted">{s.category} · {s.assets} generated assets · {s.has_master_reference ? 'master ✓' : '⚠ master reference missing'}</span>
              </li>
            ))}
          </ul>
        </main>
      )}
      {creating && <NewScreen onDone={slug => { setCreating(false); refresh(); if (slug) setSelected(slug) }} onError={setError} />}
      {selected && <ScreenDetail slug={selected} onBack={() => { setSelected(null); refresh() }} onError={setError} />}
    </div>
  )
}
