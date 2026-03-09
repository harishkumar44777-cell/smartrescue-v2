import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { dispatchAPI } from '../services/api.js'
import { Card, CardHeader, Badge, Table, Tr, Td, Btn, Spinner, EmptyState } from '../components/UI.jsx'

export default function DispatchLogPage({ onViewRoute }) {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await dispatchAPI.getAll()
      setLogs(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const h = () => load()
    window.addEventListener('sr:newdispatch', h)
    window.addEventListener('sr:statusupdate', h)
    return () => { window.removeEventListener('sr:newdispatch', h); window.removeEventListener('sr:statusupdate', h) }
  }, [load])

  const markCompleted = async (log) => {
    setUpdating(log.id)
    try {
      await dispatchAPI.updateStatus(log.id, 'COMPLETED')
      window.dispatchEvent(new Event('sr:statusupdate'))
      await load()
    } catch (e) { console.error(e) }
    finally { setUpdating(null) }
  }

  const fmt = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:true }) : '—'
  const fmtResp = (s) => !s ? '—' : s < 60 ? `${s}s` : `${Math.round(s/60)} min`
  const fmtDist = (km) => km ? `${km} km` : '—'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ background: '#dcfce7', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, color: '#166534' }}>
          📋 {logs.length} Total Records
        </div>
        <div style={{ background: '#fee2e2', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, color: '#991b1b' }}>
          🚨 {logs.filter(l => l.status === 'DISPATCHED').length} Active
        </div>
        <div style={{ background: '#dbeafe', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, color: '#1e40af' }}>
          ✅ {logs.filter(l => l.status === 'COMPLETED').length} Completed
        </div>
        <button onClick={load} style={{ marginLeft: 'auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: 9, padding: '7px 13px', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
          🔄 Refresh
        </button>
      </div>

      <Card>
        <CardHeader title="Dispatch Log — All Records from MySQL"
          right={<span style={{ fontSize: 11, color: '#94a3b8' }}>Real-time via WebSocket</span>} />
        <Table
          headers={['ID','Incident Type','Ambulance','Location','Dispatched At','Response Time','Distance','Status','Actions']}
          loading={loading}
          empty={!loading && logs.length === 0 ? <EmptyState icon="📋" message="No dispatch records yet. Report an emergency to create one." /> : null}>
          {logs.map((log, i) => (
            <Tr key={log.id} delay={i * 0.03}>
              <Td mono bold style={{ color: '#22c55e', fontSize: 12 }}>#{log.id}</Td>
              <Td bold style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {log.incident_type || '—'}
              </Td>
              <Td mono style={{ fontSize: 12, color: '#475569' }}>{log.ambulance_id || '—'}</Td>
              <Td style={{ fontSize: 12, color: '#475569', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {log.incident_location || '—'}
              </Td>
              <Td muted style={{ fontSize: 11 }}>{fmt(log.dispatched_at)}</Td>
              <Td bold style={{ color: '#166534' }}>{fmtResp(log.response_time)}</Td>
              <Td muted style={{ fontSize: 12 }}>{fmtDist(log.distance_km)}</Td>
              <Td><Badge status={log.status} /></Td>
              <Td>
                <div style={{ display: 'flex', gap: 5 }}>
                  {log.incident_lat && (
                    <button onClick={() => onViewRoute?.({
                      ambLat: log.ambulance_lat, ambLng: log.ambulance_lng,
                      incLat: log.incident_lat,  incLng: log.incident_lng,
                      hospLat: log.hospital_lat, hospLng: log.hospital_lng,
                    })}
                      style={{ padding: '4px 9px', fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: 7, cursor: 'pointer' }}>
                      🗺 Map
                    </button>
                  )}
                  {log.status === 'DISPATCHED' && (
                    <button onClick={() => markCompleted(log)} disabled={updating === log.id}
                      style={{ padding: '4px 9px', fontSize: 11, fontWeight: 700, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', borderRadius: 7, cursor: 'pointer' }}>
                      {updating === log.id ? '…' : '✅ Done'}
                    </button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </motion.div>
  )
}
