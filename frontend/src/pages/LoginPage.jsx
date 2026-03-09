import { useState } from 'react'
import { motion } from 'framer-motion'
import { authAPI } from '../services/api.js'

export default function LoginPage({ onLogin }) {
  const [form,    setForm]    = useState({ username: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.username || !form.password) { setError('Please enter credentials'); return }
    setLoading(true); setError('')
    try {
      const res = await authAPI.login(form.username, form.password)
      localStorage.setItem('sr_token', res.data.access_token)
      localStorage.setItem('sr_user',  JSON.stringify({ username: res.data.username }))
      onLogin({ username: res.data.username })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Check credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7,#bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ position: 'fixed', top: -200, right: -200, width: 500, height: 500, borderRadius: '50%', background: 'rgba(34,197,94,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -150, left: -150, width: 400, height: 400, borderRadius: '50%', background: 'rgba(34,197,94,0.05)', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ background: 'white', borderRadius: 24, padding: '50px 42px', width: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.08)', border: '1px solid #dcfce7' }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            style={{ width: 76, height: 76, borderRadius: 22, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 8px 28px rgba(34,197,94,0.4)', fontSize: 36 }}>
            🚑
          </motion.div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', margin: '0 0 5px', letterSpacing: '-0.03em' }}>SmartRescue</h1>
          <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Emergency Dispatch System v2</p>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          {[['USERNAME', 'username', 'text'], ['PASSWORD', 'password', 'password']].map(([label, key, type]) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
              <input type={type} value={form[key]} onChange={set(key)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder={key === 'username' ? 'harish' : '••••'}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#22c55e'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
          ))}

          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'center', border: '1px solid #fca5a5' }}>
              ⚠️ {error}
            </motion.div>
          )}

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={submit} disabled={loading}
            style={{ background: loading ? '#86efac' : 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 800, fontSize: 15, cursor: loading ? 'default' : 'pointer', marginTop: 6, boxShadow: '0 4px 18px rgba(34,197,94,0.38)', fontFamily: 'inherit', letterSpacing: '0.02em' }}>
            {loading ? 'Authenticating…' : 'Sign In  →'}
          </motion.button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', margin: '22px 0 0' }}>
          Tamil Nadu Emergency Services · MySQL Authenticated
        </p>
      </motion.div>
    </div>
  )
}
