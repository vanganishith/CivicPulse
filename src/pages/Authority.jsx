import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import Navbar from '../components/Navbar';
import {
  MdOutlineAdminPanelSettings, MdLogout, MdMap,
  MdTableChart, MdBarChart, MdDashboard,
  MdPhone, MdClose, MdSave, MdPerson,
  MdLightMode, MdDarkMode
} from 'react-icons/md'
import { getAllComplaints, saveComplaint, getDepartment, STATUS_CLASS, getTheme, setTheme } from '../data/data'
import { useTranslation } from '../i18n/translations'
import { ToastContainer, toast } from 'react-toastify'
import './Authority.css'

/* ─── Login Screen ─── */
function LoginScreen({ onLogin }) {
  const { t } = useTranslation()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [showPassword, setShowPassword] = useState(false);
  function attempt() {
    if (user === 'admin' && pass === 'admin123') { onLogin(); setErr('') }
    else setErr('Invalid credentials. Use admin / admin123')
  }
  const togglePassword = () => {
    setShowPassword(prev => !prev);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-icon"><MdOutlineAdminPanelSettings size={48} color="var(--purple)" /></div>
        <h2>{t.authorityPortal}</h2>
        <p>{t.signInManage}</p>
        <div className="login-field">
          <label>{t.username}</label>
          <input type="text" placeholder={t.enterUsername} value={user} onChange={e => setUser(e.target.value)} />
        </div>
        <div className="login-field">
          <label>{t.password}</label>
          <div className='placefield'>

            <input type={showPassword ? "text" : "password"} placeholder={t.enterPassword} value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && attempt()} />
            {showPassword ? (
              <MdVisibilityOff
                className="toggle-icon"
                onClick={togglePassword}
                size={20}
              />
            ) : (
              <MdVisibility
                className="toggle-icon"
                onClick={togglePassword}
                size={20}
              />
            )}
          </div>
        </div>
        {err && <p className="login-err">{err}</p>}
        <button className="btn btn-purple btn-full" onClick={attempt}>
          <MdOutlineAdminPanelSettings size={16} /> {t.signIn}
        </button>
        <Link to="/" style={{ display: 'block', marginTop: '1rem', fontSize: '.8rem', color: 'var(--muted)', textDecoration: 'none', textAlign: 'center' }}>{t.backToHome}</Link>
      </div>
    </div>
  )
}

/* ─── Status / Priority badges ─── */
function SBadge({ s }) {
  return <span className={`status-badge ${STATUS_CLASS[s] || ''}`}>{s}</span>
}
function PBadge({ p }) {
  return <><span className={`priority-dot p-${p || 'medium'}`} />{p || '—'}</>
}

/* ─── Detail Modal ─── */
function DetailModal({ complaint, onClose, onSave }) {
  const { t } = useTranslation()
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const [status, setStatus] = useState(complaint.status)
  const [officer, setOfficer] = useState(complaint.officer || '')
  const [officerPhone, setOfficerPhone] = useState(complaint.officerPhone || '')
  const [note, setNote] = useState('')
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiReason, setAiReason] = useState('')
  const [aiSuggested, setAiSuggested] = useState(false)

  // Auto-fetch AI officer when modal opens and no officer assigned yet
  useEffect(() => {
    if (complaint.officer) return
    async function fetchAI() {
      setAiLoading(true)
      try {
        const res = await fetch('http://civicpulse-yus3.onrender.com/ai/assign-officer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title:       complaint.title,
            description: complaint.description,
            category:    complaint.category,
            area:        complaint.area,
            priority:    complaint.priority,
            department:  complaint.department || getDepartment(complaint.category),
          })
        })
        const data = await res.json()
        if (data.success) {
          setOfficer(data.officer)
          setOfficerPhone(data.officerPhone)
          setAiReason(data.reason)
          setAiSuggested(true)
        }
      } catch (err) {
        console.warn('AI suggestion failed:', err)
      } finally {
        setAiLoading(false)
      }
    }
    fetchAI()
  }, [])

  useEffect(() => {
    const L = window.L
    if (!L) return
    const lat = parseFloat(complaint.lat), lng = parseFloat(complaint.lng)
    if (isNaN(lat) || isNaN(lng)) return
    setTimeout(() => {
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null }
      leafletMap.current = L.map(mapRef.current).setView([lat, lng], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(leafletMap.current)
      L.marker([lat, lng]).addTo(leafletMap.current).bindPopup(complaint.title).openPopup()
      leafletMap.current.invalidateSize()
    }, 200)
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null } }
  }, [])

  function save() {
    onSave(complaint.id, { status, officer, officerPhone, note: note || `Status updated to "${status}"` })
  }

  return (
    <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Complaint Details <span className="modal-id">{complaint.id}</span></h3>
          <button className="close-btn" onClick={onClose}><MdClose size={20} /></button>
        </div>

        {/* Status & Category */}
        <div className="detail-section">
          <h4>{t.statusCategory}</h4>
          <div className="detail-row">
            <div className="detail-item"><label>Status</label><p><SBadge s={complaint.status} /></p></div>
            <div className="detail-item"><label>Category</label><p>{complaint.category}</p></div>
            <div className="detail-item"><label>Priority</label><p style={{ textTransform: 'capitalize' }}><span className={`priority-dot p-${complaint.priority || 'medium'}`} />{complaint.priority || '—'}</p></div>
            <div className="detail-item"><label>Department</label><p>{complaint.department || getDepartment(complaint.category)}</p></div>
          </div>
        </div>

        {/* Citizen Info */}
        <div className="detail-section">
          <h4>Citizen Info</h4>
          <div className="detail-row">
            <div className="detail-item"><label>Name</label><p><MdPerson size={14} /> {complaint.name || '—'}</p></div>
            <div className="detail-item">
              <label>Phone</label>
              <p>{complaint.phone || '—'}</p>
              {complaint.phone && (
                <a href={`tel:${complaint.phone}`} className="call-btn" style={{ marginTop: '.4rem' }}>
                  <MdPhone size={14} /> Call Citizen
                </a>
              )}
            </div>
            <div className="detail-item"><label>Area</label><p>{complaint.area || '—'}</p></div>
            <div className="detail-item"><label>Landmark</label><p>{complaint.landmark || '—'}</p></div>
            <div className="detail-item" style={{ gridColumn: '1/-1' }}><label>Filed On</label><p>{complaint.date ? new Date(complaint.date).toLocaleString('en-IN') : '—'}</p></div>
          </div>
        </div>

        {/* Description */}
        <div className="detail-section">
          <h4>{t.description2}</h4>
          <div className="desc-box">{complaint.description || '—'}</div>
        </div>

        {/* Location */}
        <div className="detail-section">
          <h4>Location</h4>
          {complaint.lat && complaint.lng
            ? <><div id="modal-map" ref={mapRef} /><p className="modal-map-hint">📌 ({parseFloat(complaint.lat).toFixed(4)}, {parseFloat(complaint.lng).toFixed(4)})</p></>
            : <p className="modal-map-hint">No location pinned.</p>}
        </div>

        {/* Photos */}
        <div className="detail-section">
          <h4>{t.photosSubmitted}</h4>
          {complaint.photos?.length > 0
            ? <div className="modal-photos">
              {complaint.photos.map((src, i) => (
                <img key={i} className="modal-photo" src={src} alt="evidence"
                  onClick={() => setLightboxSrc(src)}
                  title="Click to view full size"
                />
              ))}
            </div>
            : <p className="no-photos">No photos submitted.</p>}
        </div>

        {/* Lightbox */}
        {lightboxSrc && (
          <div className="lightbox-overlay show" onClick={() => setLightboxSrc(null)}>
            <button className="lightbox-close" onClick={() => setLightboxSrc(null)}>✕</button>
            <img src={lightboxSrc} alt="full size" />
          </div>
        )}

        <div className="update-form">
          <h4>{t.updateComplaint}</h4>
          <div className="form-group">
            <label>{t.updateStatus}</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              {['Pending', 'In Progress', 'Resolved', 'Rejected'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {/* AI Officer Assignment Box */}
          <div className="ai-officer-box">
            {aiLoading ? (
              <div className="ai-loading">
                <div className="ai-spinner"/> 🤖 AI is selecting best officer…
              </div>
            ) : officer ? (
              <div className="ai-result">
                <div className="ai-result-header">
                  {aiSuggested ? '🤖 AI Assigned Officer' : '👤 Assigned Officer'}
                </div>
                <div className="ai-officer-name">{officer}</div>
                <div className="ai-officer-phone">{officerPhone}</div>
                {aiReason && <div className="ai-reason">💡 {aiReason}</div>}
              </div>
            ) : (
              <div className="ai-loading">No officer available for this department</div>
            )}
          </div>
          <div className="form-group">
            <label>{t.updateNote}</label>
            <textarea rows={3} placeholder={t.addNote} value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline btn-sm" onClick={onClose}><MdClose size={14} /> Cancel</button>
            <button className="btn btn-success btn-sm" onClick={save} disabled={aiLoading}><MdSave size={14} /> {t.saveUpdate}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Dashboard ─── */
function Dashboard({ onLogout }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState('overview')
  const [complaints, setComplaints] = useState([])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [selected, setSelected] = useState(null)
  const [theme, setThemeState] = useState(getTheme)
  const mapRef = useRef(null)
  const authMap = useRef(null)

  useEffect(() => { getAllComplaints().then(setComplaints) }, [])

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    progress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    high: complaints.filter(c => c.priority === 'high').length,
  }

  const filtered = complaints.filter(c =>
    (!filterStatus || c.status === filterStatus) &&
    (!filterPriority || c.priority === filterPriority)
  )

  function toggleThemeLocal() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next); setThemeState(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  function initMap() {
    const L = window.L
    if (!L || !mapRef.current) return
    if (authMap.current) { authMap.current.invalidateSize(); return }
    authMap.current = L.map(mapRef.current).setView([17.4065, 78.4772], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(authMap.current)
    const colors = { 'Pending': '#f4a261', 'In Progress': '#00b4d8', 'Resolved': '#06d6a0', 'Rejected': '#ef233c' }
    complaints.forEach(c => {
      const lat = parseFloat(c.lat), lng = parseFloat(c.lng)
      if (isNaN(lat) || isNaN(lng)) return
      L.circleMarker([lat, lng], { radius: c.priority === 'high' ? 12 : 8, fillColor: colors[c.status] || '#888', color: '#fff', weight: 1.5, fillOpacity: .85 })
        .addTo(authMap.current)
        .bindPopup(`<strong>${c.title}</strong><br/>${c.category}<br/>👤 ${c.name || '?'}<br/>📞 ${c.phone || 'N/A'}<br/>${c.status}`)
    })
    setTimeout(() => authMap.current?.invalidateSize(), 250)
  }

  useEffect(() => {
    if (tab === 'map') setTimeout(initMap, 300)
  }, [tab, complaints])

  function switchTab(t) {
    setTab(t)
    if (t === 'analytics') { window.location.href = '/analytics' }
  }

  async function handleSave(id, update) {
    const base = complaints.find(c => c.id === id)

    // Use officer from update (which came from AI in the modal)
    const finalOfficer      = update.officer      || base.officer      || ''
    const finalOfficerPhone = update.officerPhone || base.officerPhone || ''

    const entry = {
      ...base,
      ...update,
      officer:      finalOfficer,
      officerPhone: finalOfficerPhone,
      resolvedDate: update.status === 'Resolved' && !base.resolvedDate
        ? new Date().toISOString()
        : base.resolvedDate
    }
    if (!entry.updates) entry.updates = []
    entry.updates.push({
      status: update.status,
      time:   new Date().toISOString(),
      note:   update.note || `Status updated to "${update.status}"`,
      done:   true
    })

    await saveComplaint(id, entry)

    // Send SMS notification to citizen
    if (['In Progress', 'Resolved', 'Rejected'].includes(update.status) && base.phone) {
      try {
        await fetch('http://civicpulse-yus3.onrender.com/notify/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone:       base.phone,
            complaintId: id,
            status:      update.status,
            title:       base.title,
            officer:     finalOfficer,
          })
        })
      } catch (err) {
        console.warn('SMS notification failed:', err)
      }
    }

    getAllComplaints().then(setComplaints)
    setSelected(null)
    toast.success(
      `Complaint ${id} updated to "${update.status}"${finalOfficer ? ` — Officer: ${finalOfficer}` : ''}`,
      { autoClose: 4000 }
    )
  }

  const TABS = [
    { key: 'overview', label: 'Overview', Icon: MdDashboard },
    { key: 'complaints', label: 'All Complaints', Icon: MdTableChart },
    { key: 'map', label: 'Map View', Icon: MdMap },
    { key: 'analytics', label: 'Analytics', Icon: MdBarChart },
  ]

  return (
    <div className="app show">
      <Navbar/>

      <div className="tab-nav">
        {TABS.map(({ key, label, Icon }) => (
          <div key={key} className={`tab${tab === key ? ' active' : ''}`} onClick={() => switchTab(key)}>
            <Icon size={15} /> {label}
          </div>
        ))}
      </div>

      <div className="main">
        {/* Stats Row */}
        <div className="stats-row">
          {[
            { cls: 's1', label: 'Total', num: stats.total, sub: 'All complaints' },
            { cls: 's2', label: 'Pending', num: stats.pending, sub: 'Awaiting action' },
            { cls: 's3', label: 'In Progress', num: stats.progress, sub: 'Being resolved' },
            { cls: 's4', label: 'Resolved', num: stats.resolved, sub: 'Successfully closed' },
            { cls: 's5', label: t.highPriority, num: stats.high, sub: t.highPrioritySub },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.cls}`}>
              <div className="s-label">{s.label}</div>
              <div className="s-num">{s.num}</div>
              <div className="s-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div>
            <div className="table-header">
              <h2>{t.recentComps}</h2>
              <Link to="/analytics" className="btn btn-primary btn-sm"><MdBarChart size={14} /> Full Analytics →</Link>
            </div>
            <div className="table-wrap"><table>
              <thead><tr><th>{t.thId}</th><th>{t.thTitle}</th><th>{t.thCategory}</th><th>{t.thArea}</th><th>{t.thPriority}</th><th>{t.thStatus}</th><th>{t.thAction}</th></tr></thead>
              <tbody>
                {complaints.slice(0, 6).map(c => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '.76rem', color: 'var(--muted)' }}>{c.id}</td>
                    <td style={{ fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                    <td>{c.category}</td><td>{c.area}</td>
                    <td><PBadge p={c.priority} /></td>
                    <td><SBadge s={c.status} /></td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => setSelected(c)}>{t.viewBtn}</button></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}

        {/* ALL COMPLAINTS TAB */}
        {tab === 'complaints' && (
          <div>
            <div className="table-header">
              <h2>{t.allComps}</h2>
              <div className="filter-row">
                <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">{t.allStatuses}</option>
                  {['Pending', 'In Progress', 'Resolved', 'Rejected'].map(s => <option key={s}>{s}</option>)}
                </select>
                <select className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                  <option value="">{t.allPriorities}</option>
                  {['high', 'medium', 'low'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="table-wrap"><table>
              <thead><tr><th>{t.thId}</th><th>{t.thName}</th><th>{t.thPhone}</th><th>{t.thTitle}</th><th>{t.thCategory}</th><th>{t.thArea}</th><th>{t.thPriority}</th><th>{t.thStatus}</th><th>{t.thDate}</th><th>{t.thAction}</th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '.76rem', color: 'var(--muted)' }}>{c.id}</td>
                    <td style={{ fontWeight: 500 }}>{c.name || '—'}</td>
                    <td>{c.phone ? <a href={`tel:${c.phone}`} className="call-link"><MdPhone size={12} /> {c.phone}</a> : '—'}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                    <td>{c.category}</td><td>{c.area}</td>
                    <td><PBadge p={c.priority} /></td>
                    <td><SBadge s={c.status} /></td>
                    <td style={{ color: 'var(--muted)', fontSize: '.78rem' }}>{new Date(c.date).toLocaleDateString('en-IN')}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => setSelected(c)}>✏️ Manage</button></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}

        {/* MAP TAB */}
        {tab === 'map' && (
          <div>
            <div className="table-header"><h2>🗺️ Complaint Map</h2></div>
            <div id="authority-map" ref={mapRef} />
            <div className="map-legend">
              {[['#f4a261', 'Pending'], ['#00b4d8', 'In Progress'], ['#06d6a0', 'Resolved'], ['#ef233c', 'Rejected']].map(([c, l]) => (
                <div key={l} className="legend-item">
                  <div className="legend-dot" style={{ background: c }} />{l}
                </div>
              ))}
              <span style={{ color: 'var(--muted)', fontSize: '.76rem' }}>· Larger = High priority</span>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <DetailModal
          complaint={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

/* ─── Page Export ─── */
export default function Authority() {
  const [loggedIn, setLoggedIn] = useState(false)

  return (
    <div className="authority-page">
      <ToastContainer position="top-right" autoClose={4000} />
      {!loggedIn
        ? <LoginScreen onLogin={() => setLoggedIn(true)} />
        : <Dashboard onLogout={() => setLoggedIn(false)} />
      }
    </div>
  )
}
