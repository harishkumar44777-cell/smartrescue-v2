import { motion } from 'framer-motion'

export const COLORS = {
  AVAILABLE:   { bg: '#dcfce7', text: '#166534', dot: '#22c55e', border: '#86efac' },
  DISPATCHED:  { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444', border: '#fca5a5' },
  EN_ROUTE:    { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b', border: '#fde68a' },
  COMPLETED:   { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6', border: '#93c5fd' },
  OPERATIONAL: { bg: '#dcfce7', text: '#166534', dot: '#22c55e', border: '#86efac' },
  MAINTENANCE: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b', border: '#fde68a' },
  OPEN:        { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444', border: '#fca5a5' },
  CRITICAL:    { bg: '#fef2f2', text: '#7f1d1d', dot: '#dc2626', border: '#fca5a5' },
  HIGH:        { bg: '#fff7ed', text: '#7c2d12', dot: '#ea580c', border: '#fed7aa' },
  MEDIUM:      { bg: '#fefce8', text: '#713f12', dot: '#ca8a04', border: '#fde047' },
  LOW:         { bg: '#f0fdf4', text: '#14532d', dot: '#16a34a', border: '#86efac' },
}

export const Badge = ({ status, size = 'sm' }) => {
  const c = COLORS[status] || { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' }
  const pad = size === 'lg' ? '5px 14px' : '3px 9px'
  const fs  = size === 'lg' ? 12 : 11
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: fs, fontWeight: 700, padding: pad, borderRadius: 20, letterSpacing: '0.03em', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block', flexShrink: 0 }} />
      {status}
    </span>
  )
}

export const Card = ({ children, style = {}, className = '' }) => (
  <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', ...style }} className={className}>
    {children}
  </div>
)

export const CardHeader = ({ title, right, dot = false }) => (
  <div style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
      {dot && <span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e', display: 'inline-block' }} />}
      {title}
    </span>
    {right}
  </div>
)

export const StatCard = ({ label, value, sub, icon, iconBg, iconColor, delay = 0, loading = false }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    whileHover={{ y: -3, boxShadow: '0 10px 28px rgba(0,0,0,0.09)' }}
    style={{ background: 'white', borderRadius: 14, padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 15, transition: 'box-shadow 0.2s', cursor: 'default' }}>
    <div style={{ width: 50, height: 50, borderRadius: 13, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: loading ? 14 : 26, fontWeight: 800, color: '#1e293b', lineHeight: 1, color: loading ? '#94a3b8' : '#1e293b' }}>
        {loading ? 'Loading…' : value}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginTop: 3 }}>{label}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{sub}</div>
    </div>
  </motion.div>
)

export const Btn = ({ children, onClick, disabled, variant = 'green', size = 'md', style = {} }) => {
  const styles = {
    green:   { bg: disabled ? '#e2e8f0' : '#22c55e', hover: '#16a34a', color: disabled ? '#94a3b8' : 'white' },
    red:     { bg: '#ef4444', hover: '#dc2626', color: 'white' },
    outline: { bg: 'white', hover: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' },
  }
  const s = styles[variant]
  const pad = size === 'sm' ? '6px 12px' : size === 'lg' ? '13px 26px' : '9px 17px'
  const fs  = size === 'sm' ? 12 : size === 'lg' ? 14 : 13
  return (
    <motion.button whileHover={{ scale: disabled ? 1 : 1.02 }} whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick} disabled={disabled}
      style={{ background: s.bg, color: s.color, border: s.border || 'none', borderRadius: 9, padding: pad, fontWeight: 700, fontSize: fs, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', transition: 'background 0.15s', ...style }}>
      {children}
    </motion.button>
  )
}

export const Spinner = ({ size = 20 }) => (
  <div style={{ width: size, height: size, border: `2px solid #e2e8f0`, borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

export const EmptyState = ({ icon = '📭', message = 'No records found' }) => (
  <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
    <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
    <div style={{ fontSize: 14, fontWeight: 500 }}>{message}</div>
  </div>
)

export const Field = ({ label, required, children }) => (
  <div>
    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
      {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
    </label>
    {children}
  </div>
)

const inputStyle = {
  width: '100%', padding: '10px 13px', borderRadius: 9, border: '1.5px solid #e2e8f0',
  fontSize: 13, color: '#1e293b', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', background: 'white', transition: 'border-color 0.15s, box-shadow 0.15s'
}

export const Input = (props) => <input {...props} style={{ ...inputStyle, ...props.style }} />
export const Select = ({ children, ...props }) => <select {...props} style={{ ...inputStyle, cursor: 'pointer', ...props.style }}>{children}</select>
export const Textarea = ({ rows = 3, ...props }) => <textarea rows={rows} {...props} style={{ ...inputStyle, resize: 'vertical', ...props.style }} />

export const Table = ({ headers, children, loading, empty }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#f8fafc' }}>
          {headers.map(h => (
            <th key={h} style={{ padding: '10px 15px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading
          ? <tr><td colSpan={headers.length} style={{ padding: 32, textAlign: 'center' }}><Spinner /></td></tr>
          : children
        }
      </tbody>
    </table>
    {!loading && empty}
  </div>
)

export const Tr = ({ children, delay = 0 }) => (
  <motion.tr initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
    style={{ borderBottom: '1px solid #f8fafc' }}>
    {children}
  </motion.tr>
)

export const Td = ({ children, mono, bold, muted, style = {} }) => (
  <td style={{ padding: '12px 15px', fontSize: 13, fontFamily: mono ? 'monospace' : 'inherit', fontWeight: bold ? 700 : 500, color: muted ? '#94a3b8' : '#1e293b', ...style }}>
    {children}
  </td>
)
