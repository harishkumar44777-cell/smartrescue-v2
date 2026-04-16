import { useState } from 'react'
import { motion } from 'framer-motion'
import { incidentAPI, geocode, reverseGeocode } from '../services/api.js'
import { Field, Input, Select, Textarea, Btn, Card } from '../components/UI.jsx'

const TYPES = [
  'Cardiac Arrest','Road Accident','Stroke','Breathing Difficulty',
  'Fall Injury','Burns','Poisoning','Obstetric Emergency',
  'Seizure','Drowning','Animal Bite','Unknown Emergency'
]
const PRIORITIES = ['CRITICAL','HIGH','MEDIUM','LOW']

export default function ReportEmergencyPage({ onDispatch }) {
  const [form, setForm] = useState({ type: '', location: '', priority: 'HIGH', patients: 1, description: '' })
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [locating, setLocating] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const valid = form.type && form.location

  const detectLocation = () => {
    setLocating(true)
    setError('')
    navigator.geolocation?.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const res = await reverseGeocode(lat, lng)
          setForm(f => ({ ...f, location: res.display, lat, lng }))
        } catch (e) {
          setForm(f => ({ ...f, location: `${lat}, ${lng}`, lat, lng }))
        }
        setLocating(false)
      },
      () => {
        // Fallback: Bannari Amman Institute of Technology, Sathyamangalam
        setForm(f => ({ ...f, location: 'Bannari Amman Institute of Technology, Sathyamangalam', lat: 11.5074, lng: 77.2096 }))
        setLocating(false)
      },
      { timeout: 8000 }
    )
  }
  const handleSubmit = async () => {
    if (!valid) return
    setLoading(true); setError('')

    try {
      // Try to geocode the location to get real coordinates
      let lat = null, lng = null
      try {
        if (form.lat && form.lng) {
          lat = form.lat; lng = form.lng
        } else {
          const geo = await geocode(form.location + ', Tamil Nadu, India')
          lat = geo.lat; lng = geo.lng
        }
      } catch {
        console.warn('Geocode failed, storing without coordinates')
      }

      const payload = { ...form, lat, lng, patients: Number(form.patients) }
      const res = await incidentAPI.report(payload)
      setResult(res.data)
      onDispatch?.(res.data)
      window.dispatchEvent(new Event('sr:newdispatch'))
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to report emergency. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setForm({ type: '', location: '', priority: 'HIGH', patients: 1, description: '', lat: null, lng: null })
    setError('')
  }

  if (result) {
    const { incident, dispatch } = result
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: 540, margin: '40px auto' }}>
        <Card style={{ padding: 40, textAlign: 'center' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
            style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 38 }}>
            ✅
          </motion.div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#166534', marginBottom: 8 }}>
            {dispatch ? 'Ambulance Dispatched!' : 'Emergency Recorded'}
          </h2>
          <p style={{ color: '#475569', fontSize: 13, marginBottom: 24 }}>
            {dispatch ? 'Nearest available ambulance assigned. Help is on the way.' : 'Incident recorded. No ambulances available right now.'}
          </p>

          {/* Incident details */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 18px', textAlign: 'left', marginBottom: dispatch ? 12 : 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Incident #{incident.id}</div>
            {[['Type', incident.type], ['Location', incident.location], ['Priority', incident.priority], ['Patients', incident.patients]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#94a3b8', fontWeight: 500 }}>{k}</span>
                <span style={{ color: '#1e293b', fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Dispatch details */}
          {dispatch && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 12, padding: '14px 18px', textAlign: 'left', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dispatch #{dispatch.id}</div>
              {[
                ['Ambulance', dispatch.ambulance_id],
                ['Driver', dispatch.ambulance_driver],
                ['Distance', `${dispatch.distance_km} km`],
                ['ETA', `~${Math.round(dispatch.response_time / 60)} min`],
                ['Hospital', dispatch.hospital_name || 'Nearest available'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, borderBottom: '1px solid rgba(134,239,172,0.4)' }}>
                  <span style={{ color: '#166534', fontWeight: 500 }}>{k}</span>
                  <span style={{ color: '#14532d', fontWeight: 700 }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          )}

          <Btn size="lg" onClick={reset} style={{ margin: '0 auto' }}>Report Another Emergency</Btn>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 620 }}>
      <Card style={{ padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🚨</div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>Report Emergency</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Incident stored in MySQL · Nearest ambulance auto-dispatched</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <Field label="Emergency Type" required>
            <Select value={form.type} onChange={set('type')}>
              <option value="">Select emergency type…</option>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>

          <Field label="Location / Address" required>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input value={form.location} onChange={set('location')}
                placeholder="e.g. Anna Salai, Chennai or Sathyamangalam" style={{ flex: 1 }} />
              <button 
                type="button"
                onClick={detectLocation} 
                disabled={locating}
                style={{
                  padding: '0 12px',
                  background: 'rgba(255,255,255,0.97)',
                  border: '1.5px solid #22c55e',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: locating ? 'not-allowed' : 'pointer',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  boxShadow: '0 2px 8px rgba(34,197,94,0.2)'
                }}
              >
                {locating ? '⏳' : '📍'} {locating ? 'Locating…' : 'Detect'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>💡 Location will be geocoded and shown on map</div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Priority">
              <Select value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="Number of Patients">
              <Input type="number" min="1" max="50" value={form.patients} onChange={set('patients')} />
            </Field>
          </div>

          <Field label="Description">
            <Textarea value={form.description} onChange={set('description')}
              placeholder="Additional details about the emergency…" />
          </Field>

          {form.priority === 'CRITICAL' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠️ CRITICAL — Nearest ambulance will be immediately dispatched
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#991b1b' }}>
              ❌ {error}
            </motion.div>
          )}

          <Btn size="lg" onClick={handleSubmit} disabled={!valid || loading} style={{ marginTop: 4 }}>
            {loading ? '⏳ Dispatching…' : '🚑 Dispatch Ambulance'}
          </Btn>
        </div>
      </Card>
    </motion.div>
  )
}
