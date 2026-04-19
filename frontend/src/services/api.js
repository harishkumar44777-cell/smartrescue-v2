import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('sr_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sr_token')
      localStorage.removeItem('sr_user')
      window.location.reload()
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  login: (username, password) => api.post('/login', { username, password }),
}

export const ambulanceAPI = {
  getAll:         ()               => api.get('/ambulances'),
  create:         (data)           => api.post('/ambulances', data),
  updateLocation: (vid, lat, lng)  => api.patch(`/ambulances/${vid}/location`, { lat, lng }),
  delete:         (vid)            => api.delete(`/ambulances/${vid}`),
}

export const hospitalAPI = {
  getAll: () => api.get('/hospitals'),
  create: (data) => api.post('/hospitals', data),
}

export const incidentAPI = {
  getAll:  ()     => api.get('/incidents'),
  report:  (data) => api.post('/incidents', data),
}

export const dispatchAPI = {
  getAll:       () => api.get('/dispatch-logs'),
  updateStatus: (id, status) => api.patch(`/dispatch-logs/${id}/status?status=${status}`),
}

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
}

// Geocoding via Nominatim (OpenStreetMap) — free, no API key needed
export const geocode = async (query) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=IN`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  const data = await res.json()
  if (data.length === 0) throw new Error('Location not found')
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name }
}

export const reverseGeocode = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  const data = await res.json()
  if (data.error) throw new Error('Location not found')
  return { display: data.display_name, address: data.address }
}

// WebSocket factory
export const createWS = (onMessage, onOpen, onClose) => {
  let wsUrl = ''
  if (import.meta.env.VITE_API_URL) {
    const url = new URL(import.meta.env.VITE_API_URL)
    const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:'
    wsUrl = `${wsProto}//${url.host}/ws/live`
  } else {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host  = window.location.hostname
    wsUrl = `${proto}://${host}:8000/ws/live`
  }

  const ws = new WebSocket(wsUrl)
  ws.onopen    = onOpen  || (() => console.log('WS connected'))
  ws.onclose   = onClose || (() => console.log('WS disconnected'))
  ws.onerror   = (e) => console.warn('WS error', e)
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)) } catch {}
  }
  return ws
}

export default api
