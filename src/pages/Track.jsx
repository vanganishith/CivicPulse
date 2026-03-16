import React, { useState } from 'react'
import { MdSearch, MdPhone } from 'react-icons/md'
import Navbar from '../components/Navbar'
import { getAllComplaints, getDepartment, STATUS_CLASS } from '../data/data'
import { useTranslation } from '../i18n/translations'
import './Track.css'
import { FaMapPin } from "react-icons/fa6";



export default function Track() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)

  async function track(id) {
    const inputId = (id || query).trim().toUpperCase()
    setResult(null); setNotFound(false)
    if (!inputId) return
    setLoading(true)
    try {
      const all = await getAllComplaints()
      const found = all.find(x => x.id.toUpperCase() === inputId)
      if (!found) { setNotFound(true) } else { setResult(found) }
    } catch (err) {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const prog = result
    ? result.status === 'Rejected' || result.status === 'Resolved' ? 100
      : result.progress || (result.status === 'In Progress' ? 60 : 20)
    : 0

  return (
    <div className="track-page">
      <Navbar variant="back" />
      <div className="page-wrapper">
        <div className="page-header">
          <h1><FaMapPin size={40} /> {t.trackYourComp}</h1>
          <p>{t.trackSub}</p>
        </div>

        <div className="search-box">
          <input
            className="search-input"
            type="text"
            placeholder="Enter Complaint ID e.g. CP-2026-1234"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && track()}
          />
          <button className="btn btn-primary" onClick={() => track()} disabled={loading}>
            <MdSearch size={18} /> {loading ? t.searching : t.trackBtn2}
          </button>
        </div>

        {result && (
          <div className="complaint-card show">
            <div className="card-header">
              <div className="complaint-meta">
                <h2>{result.title}</h2>
                <div className="meta-row">
                  <span className="meta-item">🆔 {result.id}</span>
                  <span className="meta-item">📅 {new Date(result.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="meta-item">📍 {result.area}</span>
                </div>
              </div>
              <span className={`status-badge ${STATUS_CLASS[result.status] || ''}`}>{result.status}</span>
            </div>

            <div className="card-body">
              <div className="progress-bar-wrap">
                <label><span>{t.resolutionProg}</span><span>{prog}%</span></label>
                <div className="progress-bar">
                  <div className={`progress-fill${result.status === 'Rejected' ? ' rejected-fill' : ''}`} style={{ width: `${prog}%` }} />
                </div>
              </div>

              <div className="info-grid">
                <div className="info-item"><label>{t.category2}</label><p>{result.category}</p></div>
                <div className="info-item">
                  <label>{t.priority}</label>
                  <p className={`priority-${result.priority || 'medium'}`}>
                    {result.priority === 'low' ? '🟢 Low' : result.priority === 'high' ? '🔴 High / Urgent' : '🟡 Medium'}
                  </p>
                </div>
                <div className="info-item"><label>{t.department}</label><p>{result.department || getDepartment(result.category)}</p></div>
                {result.status !== 'Rejected' && (
                  <div className="info-item">
                    <label>{t.assignedOfficer}</label>
                    <p>{result.officer || t.notAssigned}</p>
                    {result.officer && result.officerPhone && (
                      <a href={`tel:${result.officerPhone}`} className="call-link" style={{ marginTop: '.4rem' }}>
                        <MdPhone size={14} /> Call Officer ({result.officerPhone})
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="timeline-label">📋 {t.statusTimeline}</div>
              <div className="timeline">
                {(result.updates || [{ status: 'Received', time: result.date, note: 'Complaint registered.', done: true }]).map((u, i) => {
                  const cls = u.rejected ? 'rejected' : u.done ? 'done' : u.active ? 'active' : ''
                  return (
                    <div key={i} className={`timeline-item ${cls}`}>
                      <div className="timeline-dot" />
                      <div className="timeline-status">{u.rejected ? '❌' : u.done ? '✅' : u.active ? '🔄' : '⏳'} {u.status}</div>
                      <div className="timeline-note">{u.note}</div>
                      {u.time && <div className="timeline-time">{new Date(u.time).toLocaleString('en-IN')}</div>}
                    </div>
                  )
                })}
              </div>

              {result.photos?.length > 0 && (
                <div className="photos-section">
                  <h4>📷 {t.submittedPhotos}</h4>
                  <div className="photo-thumbs">
                    {result.photos.map((src, i) => <img key={i} className="photo-thumb" src={src} alt="evidence" />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {notFound && (
          <div className="not-found show">
            <div className="icon">🔍</div>
            <h3>{t.notFound}</h3>
            <p>{t.notFoundSub}</p>
          </div>
        )}
      </div>
    </div>
  )
}
