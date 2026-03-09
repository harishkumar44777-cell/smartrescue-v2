import { useState, useEffect } from 'react'

export default function Header({ wsConnected }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', height: 58, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', display: 'inline-block' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#166534', letterSpacing: '0.04em' }}>🚑 READY FOR DISPATCH</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', fontFamily: 'monospace' }}>
          {time.toLocaleTimeString('en-IN', { hour12: true })}
        </span>
        <div style={{ height: 18, width: 1, background: '#e2e8f0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: wsConnected ? '#dcfce7' : '#fee2e2', padding: '5px 11px', borderRadius: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: wsConnected ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: wsConnected ? '#166534' : '#991b1b' }}>
            {wsConnected ? 'Live · Connected' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  )
}
