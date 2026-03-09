import { motion } from 'framer-motion'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',       icon: '🏠' },
  { id: 'emergency',  label: 'Report Emergency', icon: '🚨' },
  { id: 'ambulances', label: 'Ambulances',        icon: '🚑' },
  { id: 'hospitals',  label: 'Hospitals',         icon: '🏥' },
  { id: 'dispatch',   label: 'Dispatch Log',      icon: '📋' },
  { id: 'settings',   label: 'Settings',          icon: '⚙️'  },
]

export default function Sidebar({ active, setActive, onLogout, user }) {
  return (
    <aside style={{
      width: 260, minHeight: '100vh', background: 'white',
      borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 200,
      boxShadow: '2px 0 20px rgba(0,0,0,0.05)'
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg,#22c55e,#15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 14px rgba(34,197,94,0.35)', flexShrink: 0 }}>🚑</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.03em' }}>SmartRescue</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Dispatch System v2</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {NAV.map(item => {
          const isActive = active === item.id
          return (
            <motion.button key={item.id} onClick={() => setActive(item.id)}
              whileHover={{ x: 3 }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10, border: 'none',
                cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                background: isActive ? '#dcfce7' : 'transparent',
                color: isActive ? '#166534' : '#64748b',
                transition: 'background 0.15s'
              }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: isActive ? '#bbf7d0' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {item.icon}
              </div>
              <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
              {isActive && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />}
            </motion.button>
          )
        })}
      </nav>

      {/* Operator */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#22c55e,#15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
            {(user?.username || 'H')[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', textTransform: 'capitalize' }}>{user?.username || 'Harish'}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Dispatcher · Online</div>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', marginLeft: 'auto', flexShrink: 0 }} />
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onLogout}
          style={{ width: '100%', background: '#dcfce7', color: '#166534', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          ← Sign Out
        </motion.button>
      </div>
    </aside>
  )
}
