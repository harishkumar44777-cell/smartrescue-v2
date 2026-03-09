import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ambulanceAPI } from '../services/api.js'
import { Card, CardHeader, Badge, Table, Tr, Td, Spinner, EmptyState } from '../components/UI.jsx'

export default function AmbulancesPage() {
  const [ambulances, setAmbulances] = useState([])
  const [loading,    setLoading]    = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await ambulanceAPI.getAll()
      setAmbulances(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Refresh on GPS updates from WS
  useEffect(() => {
    const handler = () => load()
    window.addEventListener('sr:gpsupdate', handler)
    return () => window.removeEventListener('sr:gpsupdate', handler)
  }, [])

  const available  = ambulances.filter(a => a.status === 'AVAILABLE').length
  const dispatched = ambulances.filter(a => a.status !== 'AVAILABLE').length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Fleet',  value: ambulances.length, color: '#475569', bg: '#f1f5f9' },
          { label: 'Available',    value: available,          color: '#166534', bg: '#dcfce7' },
          { label: 'On Mission',   value: dispatched,         color: '#991b1b', bg: '#fee2e2' },
        ].map(p => (
          <div key={p.label} style={{ background: p.bg, borderRadius: 10, padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: p.color }}>{loading ? '…' : p.value}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: p.color }}>{p.label}</span>
          </div>
        ))}
        <button onClick={load} style={{ marginLeft: 'auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          🔄 Refresh
        </button>
      </div>

      <Card>
        <CardHeader title={`Fleet — ${ambulances.length} Vehicles (MySQL)`}
          right={<span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, background: '#dcfce7', padding: '4px 10px', borderRadius: 20 }}>{available} Available</span>} />
        <Table headers={['Vehicle ID','Driver Name','Area','Status','Latitude','Longitude','Last Updated']} loading={loading}
          empty={!loading && ambulances.length === 0 ? <EmptyState icon="🚑" message="No ambulances found in database" /> : null}>
          {ambulances.map((a, i) => (
            <Tr key={a.id} delay={i * 0.04}>
              <Td mono bold style={{ color: '#22c55e' }}>{a.vehicle_id}</Td>
              <Td bold>{a.driver}</Td>
              <Td style={{ color: '#475569' }}>{a.area}</Td>
              <Td><Badge status={a.status} /></Td>
              <Td mono muted>{Number(a.lat).toFixed(5)}</Td>
              <Td mono muted>{Number(a.lng).toFixed(5)}</Td>
              <Td muted style={{ fontSize: 11 }}>{a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : '—'}</Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </motion.div>
  )
}
