import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { hospitalAPI } from '../services/api.js'
import { Card, CardHeader, Badge, Table, Tr, Td, EmptyState } from '../components/UI.jsx'

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    hospitalAPI.getAll()
      .then(r => setHospitals(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalBeds  = hospitals.reduce((s, h) => s + (h.beds || 0), 0)
  const operational = hospitals.filter(h => h.status === 'OPERATIONAL').length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Hospitals',  value: hospitals.length,        color: '#166534', bg: '#dcfce7' },
          { label: 'Operational',      value: operational,              color: '#166534', bg: '#dcfce7' },
          { label: 'Total Beds',       value: totalBeds.toLocaleString(), color: '#1e40af', bg: '#dbeafe' },
        ].map(p => (
          <div key={p.label} style={{ background: p.bg, borderRadius: 10, padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: p.color }}>{loading ? '…' : p.value}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: p.color }}>{p.label}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title="Hospital Network — Tamil Nadu (MySQL)" />
        <Table headers={['Hospital Name','City','Beds','Status','Latitude','Longitude']} loading={loading}
          empty={!loading && hospitals.length === 0 ? <EmptyState icon="🏥" message="No hospitals in database" /> : null}>
          {hospitals.map((h, i) => (
            <Tr key={h.id} delay={i * 0.05}>
              <Td bold>{h.name}</Td>
              <Td style={{ color: '#475569' }}>{h.city}</Td>
              <Td bold style={{ color: '#1e40af' }}>{(h.beds || 0).toLocaleString()}</Td>
              <Td><Badge status={h.status} /></Td>
              <Td mono muted>{Number(h.lat).toFixed(4)}</Td>
              <Td mono muted>{Number(h.lng).toFixed(4)}</Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </motion.div>
  )
}
