import { useState } from 'react'
import { motion } from 'framer-motion'
import { ambulanceAPI, hospitalAPI } from '../services/api.js'
import { Card, Field, Input, Btn } from '../components/UI.jsx'

function FormCard({ title, emoji, fields, onSave, saving, saved, error }) {
  return (
    <Card style={{ padding: 26 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>{emoji}</span> {title}
      </h3>
      <div style={{ display: 'grid', gap: 14 }}>
        {fields}
        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '9px 13px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid #fca5a5' }}>
            ❌ {error}
          </div>
        )}
        <Btn size="md" onClick={onSave} disabled={saving} style={{ marginTop: 4 }}>
          {saving ? '⏳ Saving…' : saved ? '✓ Saved to MySQL!' : `Add to Database`}
        </Btn>
        {saved && <div style={{ fontSize: 12, color: '#166534', fontWeight: 600, textAlign: 'center' }}>✅ Record created in MySQL</div>}
      </div>
    </Card>
  )
}

export default function SettingsPage() {
  const [amb,  setAmb]  = useState({ vehicle_id: '', driver: '', area: '', lat: '', lng: '' })
  const [hosp, setHosp] = useState({ name: '', city: '', beds: '', lat: '', lng: '' })

  const [savingAmb,  setSavingAmb]  = useState(false)
  const [savedAmb,   setSavedAmb]   = useState(false)
  const [errorAmb,   setErrorAmb]   = useState('')

  const [savingHosp, setSavingHosp] = useState(false)
  const [savedHosp,  setSavedHosp]  = useState(false)
  const [errorHosp,  setErrorHosp]  = useState('')

  const setA = k => e => setAmb(f => ({ ...f, [k]: e.target.value }))
  const setH = k => e => setHosp(f => ({ ...f, [k]: e.target.value }))

  const saveAmb = async () => {
    if (!amb.vehicle_id || !amb.driver) { setErrorAmb('Vehicle ID and Driver are required'); return }
    setSavingAmb(true); setErrorAmb('')
    try {
      await ambulanceAPI.create({
        ...amb,
        lat: parseFloat(amb.lat) || 11.1271,
        lng: parseFloat(amb.lng) || 78.6569
      })
      setSavedAmb(true)
      setAmb({ vehicle_id: '', driver: '', area: '', lat: '', lng: '' })
      setTimeout(() => setSavedAmb(false), 3000)
    } catch (e) {
      setErrorAmb(e.response?.data?.detail || 'Failed to save')
    } finally {
      setSavingAmb(false)
    }
  }

  const saveHosp = async () => {
    if (!hosp.name || !hosp.city) { setErrorHosp('Name and City are required'); return }
    setSavingHosp(true); setErrorHosp('')
    try {
      await hospitalAPI.create({
        ...hosp,
        beds: parseInt(hosp.beds) || 0,
        lat: parseFloat(hosp.lat) || 11.1271,
        lng: parseFloat(hosp.lng) || 78.6569
      })
      setSavedHosp(true)
      setHosp({ name: '', city: '', beds: '', lat: '', lng: '' })
      setTimeout(() => setSavedHosp(false), 3000)
    } catch (e) {
      setErrorHosp(e.response?.data?.detail || 'Failed to save')
    } finally {
      setSavingHosp(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <FormCard title="Add New Ambulance" emoji="🚑"
        saving={savingAmb} saved={savedAmb} error={errorAmb} onSave={saveAmb}
        fields={[
          <Field key="vid"    label="Vehicle ID"   required><Input value={amb.vehicle_id} onChange={setA('vehicle_id')} placeholder="e.g. TN-AMB-009" /></Field>,
          <Field key="driver" label="Driver Name"  required><Input value={amb.driver}     onChange={setA('driver')}     placeholder="Full name" /></Field>,
          <Field key="area"   label="Area / City"          ><Input value={amb.area}       onChange={setA('area')}       placeholder="e.g. Erode" /></Field>,
          <div key="coords" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Latitude" ><Input value={amb.lat} onChange={setA('lat')} placeholder="11.xxxx" /></Field>
            <Field label="Longitude"><Input value={amb.lng} onChange={setA('lng')} placeholder="78.xxxx" /></Field>
          </div>
        ]}
      />
      <FormCard title="Add New Hospital" emoji="🏥"
        saving={savingHosp} saved={savedHosp} error={errorHosp} onSave={saveHosp}
        fields={[
          <Field key="name" label="Hospital Name" required><Input value={hosp.name} onChange={setH('name')} placeholder="Full hospital name" /></Field>,
          <Field key="city" label="City"          required><Input value={hosp.city} onChange={setH('city')} placeholder="City name" /></Field>,
          <Field key="beds" label="Bed Capacity"          ><Input type="number" value={hosp.beds} onChange={setH('beds')} placeholder="e.g. 500" /></Field>,
          <div key="coords" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Latitude" ><Input value={hosp.lat} onChange={setH('lat')} placeholder="11.xxxx" /></Field>
            <Field label="Longitude"><Input value={hosp.lng} onChange={setH('lng')} placeholder="78.xxxx" /></Field>
          </div>
        ]}
      />
    </motion.div>
  )
}
