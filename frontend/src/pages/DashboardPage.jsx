import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { dashboardAPI, dispatchAPI } from '../services/api.js'
import { StatCard, Card, CardHeader, Badge, Spinner, EmptyState } from '../components/UI.jsx'
import LiveMap from '../components/LiveMap.jsx'

export default function DashboardPage({ ambulances, hospitals, incidents, activeRoute }) {
  const [stats,   setStats]   = useState(null)
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  const loadData = async () => {
    setLoading(true)
    try {
      const [sRes, lRes] = await Promise.all([
        dashboardAPI.getStats(),
        dispatchAPI.getAll()
      ])
      setStats(sRes.data)
      setLogs(lRes.data.slice(0, 6))
    } catch (e) {
      console.error('Dashboard load error', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Re-fetch when new dispatches come via WS
  useEffect(() => {
    const handler = () => loadData()
    window.addEventListener('sr:newdispatch', handler)
    return () => window.removeEventListener('sr:newdispatch', handler)
  }, [])

  const statCards = stats ? [
    { label: 'Available Ambulances', value: stats.available,       sub: `${stats.total_ambulances} total fleet`,   icon: '🚑', iconBg: '#dcfce7', delay: 0    },
    { label: 'Active Dispatch',      value: stats.dispatched,      sub: 'Currently on mission',                     icon: '📡', iconBg: '#fee2e2', delay: 0.07 },
    { label: 'Avg Response Time',    value: `${stats.avg_response_min}m`, sub: 'All dispatch records',              icon: '⏱️', iconBg: '#fef3c7', delay: 0.14 },
    { label: 'Total Incidents',      value: stats.total_incidents, sub: `${stats.open_incidents} open now`,         icon: '🚨', iconBg: '#ede9fe', delay: 0.21 },
  ] : []

  const formatTime = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit' })
  }

  const formatResp = (secs) => {
    if (!secs) return '—'
    return secs < 60 ? `${secs}s` : `${Math.round(secs / 60)} min`
  }

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {loading
          ? [0,1,2,3].map(i => <StatCard key={i} loading label="Loading…" value="" sub="" icon="⏳" iconBg="#f1f5f9" delay={i*0.06} />)
          : statCards.map(s => <StatCard key={s.label} {...s} />)
        }
      </div>

      {/* Map */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
        style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 18 }}>
        <CardHeader dot title="Live Dispatch Map — Tamil Nadu (OpenStreetMap)"
          right={
            <div style={{ display: 'flex', gap: 7 }}>
              {[['all','All'],['ambulances','🚑'],['hospitals','🏥'],['incidents','🚨']].map(([v,l]) => (
                <button key={v} onClick={() => setFilter(v)}
                  style={{ padding: '4px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', background: filter===v ? '#22c55e' : 'white', color: filter===v ? 'white' : '#475569', borderColor: filter===v ? '#22c55e' : '#e2e8f0' }}>
                  {l}
                </button>
              ))}
            </div>
          }
        />
        <div style={{ height: 440, padding: 14 }}>
          <LiveMap ambulances={ambulances} hospitals={hospitals} incidents={incidents} activeRoute={activeRoute} />
        </div>
      </motion.div>

      {/* Recent Dispatch Log */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <CardHeader title="Recent Dispatch Activity" right={<span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>From MySQL database</span>} />
        {loading ? (
          <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
        ) : logs.length === 0 ? (
          <EmptyState icon="📋" message="No dispatches yet. Report an emergency to get started." />
        ) : (
          <div style={{ padding: '0 8px' }}>
            {logs.map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 10px', borderBottom: i < logs.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: log.status === 'COMPLETED' ? '#dbeafe' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {log.status === 'COMPLETED' ? '✅' : '🚨'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{log.incident_type || 'Emergency'}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.incident_location} · {log.ambulance_id}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <Badge status={log.status} />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{formatTime(log.dispatched_at)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
