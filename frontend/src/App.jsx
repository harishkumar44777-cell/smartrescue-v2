import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ambulanceAPI, hospitalAPI, incidentAPI, createWS } from './services/api.js'

import LoginPage           from './pages/LoginPage.jsx'
import DashboardPage       from './pages/DashboardPage.jsx'
import ReportEmergencyPage from './pages/ReportEmergencyPage.jsx'
import AmbulancesPage      from './pages/AmbulancesPage.jsx'
import HospitalsPage       from './pages/HospitalsPage.jsx'
import DispatchLogPage     from './pages/DispatchLogPage.jsx'
import SettingsPage        from './pages/SettingsPage.jsx'
import Sidebar             from './components/Sidebar.jsx'
import Header              from './components/Header.jsx'

const TITLES = {
  dashboard:  'Operations Center',
  emergency:  'Report Emergency',
  ambulances: 'Fleet Management',
  hospitals:  'Hospital Network',
  dispatch:   'Dispatch Log',
  settings:   'System Settings',
}

export default function App() {
  const [user,        setUser]        = useState(() => { try { return JSON.parse(localStorage.getItem('sr_user')) } catch { return null } })
  const [activePage,  setActivePage]  = useState('dashboard')
  const [ambulances,  setAmbulances]  = useState([])
  const [hospitals,   setHospitals]   = useState([])
  const [incidents,   setIncidents]   = useState([])
  const [activeRoute, setActiveRoute] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [toast,       setToast]       = useState(null)
  const wsRef = useRef(null)

  const loggedIn = !!user

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  // Load all map data from real API
  const loadMapData = useCallback(async () => {
    try {
      const [aRes, hRes, iRes] = await Promise.all([
        ambulanceAPI.getAll(),
        hospitalAPI.getAll(),
        incidentAPI.getAll(),
      ])
      setAmbulances(aRes.data)
      setHospitals(hRes.data)
      setIncidents(iRes.data)
    } catch (e) {
      console.error('Map data load error:', e)
    }
  }, [])

  useEffect(() => {
    if (!loggedIn) return
    loadMapData()
  }, [loggedIn, loadMapData])

  // WebSocket for real-time updates
  useEffect(() => {
    if (!loggedIn) return

    const connect = () => {
      wsRef.current = createWS(
        // onMessage
        (msg) => {
          const { type, data } = msg

          if (type === 'GPS_UPDATE') {
            setAmbulances(prev => {
              const map = {}
              data.ambulances.forEach(u => { map[u.vehicle_id] = u })
              return prev.map(a => map[a.vehicle_id]
                ? { ...a, lat: map[a.vehicle_id].lat, lng: map[a.vehicle_id].lng, status: map[a.vehicle_id].status }
                : a)
            })
            window.dispatchEvent(new Event('sr:gpsupdate'))
          }

          if (type === 'NEW_DISPATCH') {
            showToast(`🚑 Dispatch #${data.id} — ${data.incident_type} → ${data.ambulance_id}`)
            loadMapData()
            window.dispatchEvent(new Event('sr:newdispatch'))
          }

          if (type === 'STATUS_UPDATE') {
            loadMapData()
            window.dispatchEvent(new Event('sr:statusupdate'))
          }
        },
        // onOpen
        () => setWsConnected(true),
        // onClose
        () => {
          setWsConnected(false)
          // Reconnect after 4s
          setTimeout(connect, 4000)
        }
      )
    }

    connect()

    return () => { wsRef.current?.close() }
  }, [loggedIn])

  const handleLogin = (userData) => setUser(userData)

  const handleLogout = () => {
    wsRef.current?.close()
    localStorage.removeItem('sr_token')
    localStorage.removeItem('sr_user')
    setUser(null)
    setAmbulances([]); setHospitals([]); setIncidents([])
  }

  const handleDispatch = (result) => {
    // When emergency is reported, update active route on map
    const d = result?.dispatch
    if (d) {
      setActiveRoute({
        ambLat:  d.ambulance_lat,  ambLng: d.ambulance_lng,
        incLat:  d.incident_lat,   incLng: d.incident_lng,
        hospLat: d.hospital_lat,   hospLng: d.hospital_lng,
      })
      setActivePage('dashboard')
      showToast(`🚑 ${d.ambulance_id} dispatched! ETA ~${Math.round((d.response_time || 0) / 60)} min`)
    }
    loadMapData()
  }

  const handleViewRoute = (route) => {
    setActiveRoute(route)
    setActivePage('dashboard')
  }

  if (!loggedIn) return <LoginPage onLogin={handleLogin} />

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <Sidebar active={activePage} setActive={setActivePage} onLogout={handleLogout} user={user} />

      <div style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header wsConnected={wsConnected} />

        <main style={{ flex: 1, padding: '22px 24px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 21, fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>
              {TITLES[activePage]}
            </h1>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0', fontWeight: 500 }}>{today}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activePage}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
              {activePage === 'dashboard'  && <DashboardPage ambulances={ambulances} hospitals={hospitals} incidents={incidents} activeRoute={activeRoute} />}
              {activePage === 'emergency'  && <ReportEmergencyPage onDispatch={handleDispatch} />}
              {activePage === 'ambulances' && <AmbulancesPage />}
              {activePage === 'hospitals'  && <HospitalsPage />}
              {activePage === 'dispatch'   && <DispatchLogPage onViewRoute={handleViewRoute} />}
              {activePage === 'settings'   && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60, x: '-50%' }}
            animate={{ opacity: 1, y: 0,  x: '-50%' }}
            exit={{ opacity: 0, y: 60,    x: '-50%' }}
            style={{ position: 'fixed', bottom: 28, left: '50%', background: '#166534', color: 'white', padding: '12px 22px', borderRadius: 14, fontSize: 13, fontWeight: 700, zIndex: 9999, boxShadow: '0 8px 28px rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
            {toast}
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14, marginLeft: 4 }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
