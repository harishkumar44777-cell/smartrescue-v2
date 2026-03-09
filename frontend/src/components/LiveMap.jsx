import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { geocode } from '../services/api.js'
import { COLORS } from './UI.jsx'

// Leaflet is loaded via CDN in index.html; import here for bundler awareness
let L = null
if (typeof window !== 'undefined') {
  import('leaflet').then(m => { L = m.default })
}

// ── Custom marker SVGs ────────────────────────────────────────────────────────
const makeAmbIcon = (status) => {
  const c = COLORS[status] || COLORS.AVAILABLE
  return `
    <div style="position:relative;width:36px;height:36px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${c.dot};opacity:0.25;animation:pulse-ring 1.4s ease-out infinite;"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:${c.bg};border:2px solid ${c.dot};display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.2);">🚑</div>
    </div>`
}

const makeHospIcon = () => `
  <div style="width:32px;height:32px;border-radius:50%;background:#dbeafe;border:2px solid #3b82f6;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">🏥</div>`

const makeIncIcon = () => `
  <div style="width:32px;height:32px;border-radius:50%;background:#fee2e2;border:2px solid #ef4444;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">🚨</div>`

const makeUserIcon = () => `
  <div style="width:28px;height:28px;border-radius:50%;background:#22c55e;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 2px 10px rgba(34,197,94,0.5);">📍</div>`

export default function LiveMap({ ambulances = [], hospitals = [], incidents = [], activeRoute = null }) {
  const mapRef      = useRef(null)
  const leafletRef  = useRef(null)
  const ambMarkersRef  = useRef({})
  const hospMarkersRef = useRef([])
  const incMarkersRef  = useRef([])
  const routeLayerRef  = useRef(null)
  const userMarkerRef  = useRef(null)
  const searchMarkerRef = useRef(null)

  const [toast,      setToast]      = useState(null)
  const [searchText, setSearchText] = useState('')
  const [searching,  setSearching]  = useState(false)
  const [locating,   setLocating]   = useState(false)
  const [filter,     setFilter]     = useState('all')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Init map once ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (leafletRef.current || !mapRef.current) return

    const initMap = async () => {
      const Lx = (await import('leaflet')).default
      L = Lx

      // Fix default marker icon paths broken by Vite
      delete Lx.Icon.Default.prototype._getIconUrl
      Lx.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = Lx.map(mapRef.current, {
        center: [11.1271, 78.6569],
        zoom: 7,
        zoomControl: true,
      })

      // OpenStreetMap tiles
      Lx.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      leafletRef.current = map
    }

    initMap()

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove()
        leafletRef.current = null
        ambMarkersRef.current  = {}
        hospMarkersRef.current = []
        incMarkersRef.current  = []
        routeLayerRef.current  = null
        userMarkerRef.current  = null
        searchMarkerRef.current = null
      }
    }
  }, [])

  // ── Helper: create DivIcon ───────────────────────────────────────────────────
  const divIcon = (html, size = [36, 36]) => {
    if (!L) return null
    return L.divIcon({ html, className: '', iconSize: size, iconAnchor: [size[0] / 2, size[1] / 2] })
  }

  // ── Sync ambulance markers ───────────────────────────────────────────────────
  useEffect(() => {
    const map = leafletRef.current
    if (!map || !L) return

    const show = filter === 'all' || filter === 'ambulances'

    ambulances.forEach(a => {
      const key = a.vehicle_id
      const pos = [a.lat, a.lng]
      const icon = divIcon(makeAmbIcon(a.status))
      if (!icon) return

      if (ambMarkersRef.current[key]) {
        // Animate to new position
        ambMarkersRef.current[key].setLatLng(pos)
        ambMarkersRef.current[key].setIcon(icon)
        show ? ambMarkersRef.current[key].addTo(map) : map.removeLayer(ambMarkersRef.current[key])
      } else {
        const m = L.marker(pos, { icon })
          .bindPopup(`
            <div style="font-family:system-ui;min-width:160px;">
              <div style="font-weight:800;font-size:14px;color:#1e293b;margin-bottom:6px;">🚑 ${a.vehicle_id}</div>
              <div style="font-size:12px;color:#475569;">Driver: ${a.driver}</div>
              <div style="font-size:12px;color:#475569;">Area: ${a.area}</div>
              <div style="font-size:12px;margin-top:4px;"><span style="background:${COLORS[a.status]?.bg};color:${COLORS[a.status]?.text};padding:2px 8px;border-radius:10px;font-weight:700;">${a.status}</span></div>
            </div>`)
        if (show) m.addTo(map)
        ambMarkersRef.current[key] = m
      }
    })
  }, [ambulances, filter])

  // ── Sync hospital markers ────────────────────────────────────────────────────
  useEffect(() => {
    const map = leafletRef.current
    if (!map || !L) return
    hospMarkersRef.current.forEach(m => map.removeLayer(m))
    hospMarkersRef.current = []

    if (filter !== 'all' && filter !== 'hospitals') return

    const icon = divIcon(makeHospIcon(), [32, 32])
    if (!icon) return

    hospitals.forEach(h => {
      const m = L.marker([h.lat, h.lng], { icon })
        .bindPopup(`
          <div style="font-family:system-ui;min-width:160px;">
            <div style="font-weight:800;font-size:14px;color:#1e293b;margin-bottom:6px;">🏥 ${h.name}</div>
            <div style="font-size:12px;color:#475569;">City: ${h.city}</div>
            <div style="font-size:12px;color:#475569;">Beds: ${h.beds.toLocaleString()}</div>
            <div style="font-size:12px;margin-top:4px;"><span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:10px;font-weight:700;">${h.status}</span></div>
          </div>`)
        .addTo(map)
      hospMarkersRef.current.push(m)
    })
  }, [hospitals, filter])

  // ── Sync incident markers ────────────────────────────────────────────────────
  useEffect(() => {
    const map = leafletRef.current
    if (!map || !L) return
    incMarkersRef.current.forEach(m => map.removeLayer(m))
    incMarkersRef.current = []

    if (filter !== 'all' && filter !== 'incidents') return

    const icon = divIcon(makeIncIcon(), [32, 32])
    if (!icon) return

    incidents.filter(i => i.lat && i.lng).forEach(inc => {
      const m = L.marker([inc.lat, inc.lng], { icon })
        .bindPopup(`
          <div style="font-family:system-ui;min-width:160px;">
            <div style="font-weight:800;font-size:14px;color:#1e293b;margin-bottom:6px;">🚨 ${inc.type}</div>
            <div style="font-size:12px;color:#475569;">${inc.location}</div>
            <div style="font-size:12px;color:#475569;">Priority: ${inc.priority}</div>
            <div style="font-size:12px;color:#475569;">Patients: ${inc.patients}</div>
          </div>`)
        .addTo(map)
      incMarkersRef.current.push(m)
    })
  }, [incidents, filter])

  // ── Draw route when activeRoute changes ──────────────────────────────────────
  useEffect(() => {
    const map = leafletRef.current
    if (!map || !L) return

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current)
      routeLayerRef.current = null
    }

    if (!activeRoute) return

    const { ambLat, ambLng, incLat, incLng, hospLat, hospLng } = activeRoute
    if (!ambLat || !incLat) return

    const points = [[ambLat, ambLng], [incLat, incLng]]
    if (hospLat) points.push([hospLat, hospLng])

    const polyline = L.polyline(points, {
      color: '#22c55e',
      weight: 4,
      opacity: 0.85,
      dashArray: '10, 6',
    }).addTo(map)

    routeLayerRef.current = polyline
    map.fitBounds(polyline.getBounds(), { padding: [40, 40] })
  }, [activeRoute])

  // ── GPS detect location ───────────────────────────────────────────────────────
  const detectLocation = () => {
    setLocating(true)
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        placeUserMarker(lat, lng, 'Your GPS Location')
        setLocating(false)
      },
      () => {
        // Fallback: Bannari Amman Institute of Technology, Sathyamangalam
        placeUserMarker(11.5074, 77.2096, 'Bannari Amman Institute of Technology, Sathyamangalam')
        setLocating(false)
      },
      { timeout: 8000 }
    )
  }

  const placeUserMarker = (lat, lng, label) => {
    const map = leafletRef.current
    if (!map || !L) return
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current)
    const icon = divIcon(makeUserIcon(), [28, 28])
    userMarkerRef.current = L.marker([lat, lng], { icon })
      .bindPopup(`<div style="font-family:system-ui;font-size:13px;font-weight:600;">📍 ${label}</div>`)
      .addTo(map)
      .openPopup()
    map.setView([lat, lng], 14, { animate: true })
    showToast(`📍 ${label}`)
  }

  // ── Location search ──────────────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchText.trim()) return
    setSearching(true)
    try {
      const { lat, lng, display } = await geocode(searchText + ', Tamil Nadu, India')
      const map = leafletRef.current
      if (!map || !L) return
      if (searchMarkerRef.current) map.removeLayer(searchMarkerRef.current)
      const icon = L.divIcon({
        html: `<div style="width:28px;height:28px;border-radius:50%;background:#7c3aed;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 10px rgba(124,58,237,0.5);">🔍</div>`,
        className: '', iconSize: [28, 28], iconAnchor: [14, 14]
      })
      searchMarkerRef.current = L.marker([lat, lng], { icon })
        .bindPopup(`<div style="font-family:system-ui;font-size:12px;max-width:220px;">${display}</div>`)
        .addTo(map)
        .openPopup()
      map.setView([lat, lng], 13, { animate: true })
      showToast(`🔍 Found: ${searchText}`)
    } catch {
      showToast('Location not found. Try a different query.', 'error')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
      {/* Map container */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Top Controls Bar */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 1000, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 0, flex: 1, maxWidth: 320, minWidth: 200 }}>
          <input value={searchText} onChange={e => setSearchText(e.target.value)}
            placeholder="Search location in Tamil Nadu…"
            style={{ flex: 1, padding: '7px 12px', borderRadius: '8px 0 0 8px', border: '1.5px solid #e2e8f0', fontSize: 12, outline: 'none', fontFamily: 'inherit', borderRight: 'none', background: 'rgba(255,255,255,0.97)' }} />
          <button type="submit" disabled={searching}
            style={{ padding: '7px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '0 8px 8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {searching ? '…' : '🔍'}
          </button>
        </form>

        {/* GPS button */}
        <button onClick={detectLocation} disabled={locating}
          style={{ padding: '7px 13px', background: 'rgba(255,255,255,0.97)', border: '1.5px solid #22c55e', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#166534', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 8px rgba(34,197,94,0.2)' }}>
          {locating ? '⏳' : '📍'} {locating ? 'Locating…' : 'Detect My Location'}
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ position: 'absolute', top: 56, left: 12, zIndex: 1000, display: 'flex', gap: 6 }}>
        {[['all','All'],['ambulances','🚑'],['hospitals','🏥'],['incidents','🚨']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: '1.5px solid', cursor: 'pointer', transition: 'all 0.15s',
              background: filter === v ? '#22c55e' : 'rgba(255,255,255,0.95)',
              color:      filter === v ? 'white'   : '#475569',
              borderColor: filter === v ? '#22c55e' : '#e2e8f0' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 28, right: 12, zIndex: 1000, background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', border: '1px solid #e2e8f0', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        {[['#22c55e','Available'],['#ef4444','Dispatched'],['#f59e0b','En Route'],['#3b82f6','Hospital'],['#7c3aed','Search']].map(([c,l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontWeight: 500 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />{l}
          </span>
        ))}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1001,
              background: toast.type === 'error' ? '#991b1b' : '#166534',
              color: 'white', borderRadius: 10, padding: '9px 18px', fontSize: 12, fontWeight: 600,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', maxWidth: '90%' }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
