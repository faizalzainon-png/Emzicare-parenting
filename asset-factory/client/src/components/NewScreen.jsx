import React, { useState } from 'react'
import { api } from '../api.js'

export default function NewScreen({ onDone, onError }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('dashboard')
  const [master, setMaster] = useState(null)
  const [refs, setRefs] = useState([])
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!name) return onError('Screen name is required')
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('screen_name', name)
      fd.append('category', category)
      if (master) fd.append('master', master)
      for (const f of refs) fd.append('references', f)
      const m = await api.createScreen(fd)
      onDone(m.slug)
    } catch (e2) {
      onError(e2.message)
      onDone(null)
    } finally { setBusy(false) }
  }

  return (
    <main>
      <h2>Import approved screen</h2>
      <form onSubmit={submit} className="form">
        <label>Screen name <input value={name} onChange={e => setName(e.target.value)} placeholder="Parent Dashboard" /></label>
        <label>Category
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option>dashboard</option><option>onboarding</option><option>activity</option>
            <option>report</option><option>settings</option><option>other</option>
          </select>
        </label>
        <label>Master screen image (approved concept — used as style/composition reference only, never cropped)
          <input type="file" accept="image/*" onChange={e => setMaster(e.target.files[0])} />
        </label>
        <label>Supporting references (EQ Master Reference, environment style references)
          <input type="file" accept="image/*" multiple onChange={e => setRefs([...e.target.files])} />
        </label>
        <div className="row">
          <button disabled={busy} type="submit">{busy ? 'Importing…' : 'Import screen'}</button>
          <button type="button" className="ghost" onClick={() => onDone(null)}>Cancel</button>
        </div>
      </form>
    </main>
  )
}
