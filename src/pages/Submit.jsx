import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MdMyLocation, MdCloudUpload, MdClose, MdContentCopy, MdCheck, MdSend } from 'react-icons/md'
import { FiAlertCircle } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import { getDepartment } from '../data/data'
import './Submit.css'
import { ToastContainer, toast } from 'react-toastify'
import { LuSiren } from "react-icons/lu"
import { LuNotepadText } from "react-icons/lu"
import { useTranslation } from '../i18n/translations'

const CATEGORIES = [
  '🚧 Roads','💧 Water Supply','🗑️ Sanitation','💡 Electricity',
  '🌳 Parks','🐀 Pest Control','🚦 Traffic','🏗️ Construction','📶 Other'
]

function compressImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX = 800
      let w = img.width, h = img.height
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.src = dataUrl
  })
}

export default function Submit() {
  const { t } = useTranslation()
  const mapRef      = useRef(null)
  const leafletMap  = useRef(null)
  const markerRef   = useRef(null)

  const [form, setForm]             = useState({ name:'', phone:'', email:'', title:'', description:'', area:'', landmark:'', lat:'', lng:'' })
  const [category, setCategory]     = useState('')
  const [priority, setPriority]     = useState('medium')
  const [otpSent, setOtpSent]       = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otp, setOtp]               = useState(['','','','','',''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [photos, setPhotos]         = useState([])
  const [photoError, setPhotoError] = useState(false)
  const [geocoding, setGeocoding]   = useState(false)
  const [step, setStep]             = useState(1)
  const [successId, setSuccessId]   = useState(null)
  const [copied, setCopied]         = useState(false)

  // Init Leaflet map
  useEffect(() => {
    if (leafletMap.current) return
    const L = window.L
    if (!L) return
    leafletMap.current = L.map(mapRef.current).setView([17.4065, 78.4772], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap' }).addTo(leafletMap.current)
    leafletMap.current.on('click', e => placePin(e.latlng.lat, e.latlng.lng))
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null } }
  }, [])

  function placePin(lat, lng) {
    const L = window.L
    if (markerRef.current) leafletMap.current.removeLayer(markerRef.current)
    markerRef.current = L.marker([lat, lng]).addTo(leafletMap.current)
    setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }))
    reverseGeocode(lat, lng)
  }

  function reverseGeocode(lat, lng) {
    setGeocoding(true)
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`)
      .then(r => r.json())
      .then(data => {
        const a = data.address || {}
        const suburb = a.suburb || a.neighbourhood || a.quarter || ''
        const city   = a.city || a.town || a.village || a.district || ''
        const road   = a.road || a.street || ''
        const areaStr = [suburb, city].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0,3).join(',') || ''
        const lmStr   = road || a.building || a.amenity || ''
        setForm(f => ({ ...f, area: f.area || areaStr, landmark: f.landmark || lmStr }))
        setGeocoding(false)
      })
      .catch(() => setGeocoding(false))
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords
      leafletMap.current.setView([lat, lng], 16)
      placePin(lat, lng)
    }, () => toast.error('Could not get location. Please pin manually.'))
  }

  useEffect(() => {
    const hasDetails  = form.name && form.title && category && otpVerified
    const hasLocation = form.area
    const hasPhoto    = photos.length > 0
    if (hasDetails && hasLocation && hasPhoto) setStep(4)
    else if (hasDetails && hasLocation) setStep(3)
    else if (hasDetails) setStep(2)
    else setStep(1)
  }, [form, category, otpVerified, photos])

  /* ── OTP: Send via Twilio Verify ── */
  async function sendOTP() {
    if (!form.phone || form.phone.replace(/\D/g,'').length < 10) {
      toast.error('Enter a valid 10-digit mobile number')
      return
    }
    setOtpLoading(true)
    try {
      const res  = await fetch('http://localhost:5000/otp/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone: form.phone })
      })
      const data = await res.json()
      if (data.success) {
        setOtpSent(true)
        setOtp(['','','','','',''])
        toast.success(`OTP sent to ${form.phone}! Check your SMS.`, { autoClose: 6000 })
      } else {
        toast.error(data.error || 'Failed to send OTP. Try again.')
      }
    } catch (err) {
      toast.error('Cannot reach server. Is backend running on port 5000?')
    } finally {
      setOtpLoading(false)
    }
  }

  /* ── OTP: Verify via Twilio Verify ── */
  async function verifyOTP() {
    setOtpLoading(true)
    try {
      const res  = await fetch('http://localhost:5000/otp/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone: form.phone, otp: otp.join('') })
      })
      const data = await res.json()
      if (data.verified) {
        setOtpVerified(true); setOtpSent(false)
        toast.success('Mobile number verified!')
      } else {
        toast.error(data.error || 'Incorrect OTP. Please try again.')
        setOtp(['','','','','',''])
        document.querySelectorAll('.otp-digit')[0]?.focus()
      }
    } catch (err) {
      toast.error('Cannot reach server. Is backend running on port 5000?')
    } finally {
      setOtpLoading(false)
    }
  }

  function handleOtpChange(val, idx) {
    const d = val.replace(/\D/g,'').slice(-1)
    const next = [...otp]; next[idx] = d; setOtp(next)
    if (d && idx < 5) document.querySelectorAll('.otp-digit')[idx+1]?.focus()
  }
  function handleOtpKey(e, idx) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) document.querySelectorAll('.otp-digit')[idx-1]?.focus()
  }

  function handlePhoto(e) {
    const files = Array.from(e.target.files).slice(0, 4 - photos.length)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = async ev => {
        const compressed = await compressImage(ev.target.result)
        setPhotos(p => p.length < 4 ? [...p, compressed] : p)
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
    setPhotoError(false)
  }
  function removePhoto(idx) { setPhotos(p => p.filter((_, i) => i !== idx)) }

  function copyId() {
    navigator.clipboard?.writeText(successId).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  async function handleSubmit() {
    // Check if user pinned location on map
    if (!form.lat || !form.lng) {
      toast.error('Please pin your location on the map first')
      return
    }

    // Check duplicate complaint — same category + same location
    // Skip duplicate check for "Other" category since it covers misc issues
    const isOther = category.includes('Other')
    if (!isOther) {
      try {
        const all = await fetch('http://localhost:5000/complaints').then(r => r.json())
        const duplicate = all.find(c =>
          c.category === category &&
          Math.abs(parseFloat(c.lat) - parseFloat(form.lat)) < 0.001 &&
          Math.abs(parseFloat(c.lng) - parseFloat(form.lng)) < 0.001 &&
          c.status !== 'Resolved' &&
          c.status !== 'Rejected'
        )
        if (duplicate) {
          toast.warn(
            `A "${category}" complaint already exists nearby (${duplicate.id}). Please check Track page before submitting again.`,
            { autoClose: 7000 }
          )
          return
        }
      } catch (err) {
        console.warn('Duplicate check failed, continuing...')
      }
    }

    if (!form.name || !form.title || !form.area || !form.description || !category) {
      toast.error('Please fill all required fields')
      return
    }
    if (!otpVerified) {
      toast.error('Please verify your mobile number first')
      return
    }
    if (photos.length === 0) {
      setPhotoError(true)
      return
    }

    const id = 'CP-2026-' + Math.floor(1000 + Math.random()*9000)
    const complaintData = {
      id, ...form,
      category,
      department: getDepartment(category),
      priority,
      photos,
      status:      'Pending',
      officer:     '',
      officerPhone:'',
      date:        new Date().toISOString(),
      updates: [{
        status: 'Received',
        time:   new Date().toISOString(),
        note:   'Complaint registered successfully.',
        done:   true
      }]
    }

    try {
      const res = await fetch('http://localhost:5000/complaints', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(complaintData)
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        toast.error(`Server error: ${errData.error || res.status}`)
        return
      }
      const data = await res.json()
      setSuccessId(data.id)
      resetForm()
    } catch (err) {
      console.error('Submit error:', err)
      toast.error('Failed to submit. Is the backend running on port 5000?')
    }
  }

  function resetForm() {
    setForm({ name:'', phone:'', email:'', title:'', description:'', area:'', landmark:'', lat:'', lng:'' })
    setCategory(''); setPriority('medium'); setOtp(['','','','','',''])
    setOtpSent(false); setOtpVerified(false); setPhotos([]); setPhotoError(false)
    if (markerRef.current) { leafletMap.current?.removeLayer(markerRef.current); markerRef.current = null }
  }

  const inp = (id) => ({ value: form[id], onChange: e => setForm(f => ({ ...f, [id]: e.target.value })) })

  return (
    <div className="submit-page">
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar variant="back" />
      <div className="page-wrapper">
        <div className="page-header">
          <h1><LuSiren /> {t.fileComplaintH}</h1>
          <p>{t.fileComplaintSub}</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          {[t.stepDetails, t.stepLocation, t.stepEvidence, t.stepSubmit].map((lbl, i) => {
            const n   = i + 1
            const cls = n < step ? 'done' : n === step ? 'active' : 'inactive'
            return (
              <div key={lbl} className={`step-item ${cls}`}>
                <div className="step-circle">{n < step ? '✓' : n}</div>
                <div className="step-label">{lbl}</div>
              </div>
            )
          })}
        </div>

        {/* Basic Info */}
        <div className="form-card">
          <h2><LuNotepadText /> {t.basicInfo}</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>{t.fullName} <span className="req">*</span></label>
              <input type="text" placeholder="Your full name" {...inp('name')} />
            </div>
            <div className="form-group">
              <label>{t.mobileNumber} <span className="req">*</span></label>
              <div className="otp-row">
                <input type="tel" placeholder="+91 9999999999" maxLength={13} {...inp('phone')} readOnly={otpVerified} />
                {!otpVerified && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={sendOTP} disabled={otpLoading}>
                    <MdSend size={14}/> {otpLoading ? t.sendingOtp : t.sendOtp}
                  </button>
                )}
              </div>
              {otpSent && !otpVerified && (
                <div className="otp-box show">
                  <p className="otp-hint">{t.enterOtp}</p>
                  <div className="otp-inputs">
                    {otp.map((d, i) => (
                      <input key={i} className="otp-digit" maxLength={1} value={d}
                        onChange={e => handleOtpChange(e.target.value, i)}
                        onKeyDown={e => handleOtpKey(e, i)} />
                    ))}
                  </div>
                  <button type="button" className="btn btn-primary btn-sm btn-full" onClick={verifyOTP} disabled={otpLoading}>
                    <MdCheck size={14}/> {otpLoading ? t.verifyingOtp : t.verifyOtp}
                  </button>
                </div>
              )}
              {otpVerified && <div className="otp-verified show"><MdCheck size={16}/> {t.mobileVerified}</div>}
            </div>
            <div className="form-group">
              <label>{t.emailAddress}</label>
              <input type="email" placeholder="you@example.com" {...inp('email')} />
            </div>
            <div className="form-group">
              <label>{t.complaintTitle} <span className="req">*</span></label>
              <input type="text" placeholder="e.g. Broken road near school" {...inp('title')} />
            </div>
            <div className="form-group full">
              <label>{t.category} <span className="req">*</span></label>
              <div className="category-pills">
                {CATEGORIES.map(c => (
                  <button key={c} type="button" className={`pill${category===c?' selected':''}`} onClick={() => setCategory(c)}>{c}</button>
                ))}
              </div>
            </div>
            <div className="form-group full">
              <label>{t.description} <span className="req">*</span></label>
              <textarea placeholder="Describe the issue in detail…" rows={4} {...inp('description')} />
            </div>
            <div className="form-group full">
              <label>{t.priorityLevel}</label>
              <div className="priority-row">
                {['low','medium','high'].map(p => (
                  <button key={p} type="button" className={`priority-btn ${p}${priority===p?' selected':''}`} onClick={() => setPriority(p)}>
                    {p==='low'?`🟢 ${t.low}`:p==='medium'?`🟡 ${t.medium}`:`🔴 ${t.highUrgent}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="form-card">
          <h2>📍 {t.locationDetails}</h2>
          <div id="complaint-map" ref={mapRef} />
          <p className="map-hint">📌 {t.clickMap}</p>
          {geocoding && <div className="geocode-loading show"><div className="geocode-spinner"/><span>{t.fetchingAddr}</span></div>}
          <div className="location-fields">
            <div className="form-group"><label>{t.latitude}</label><input readOnly placeholder={t.autoFilled} value={form.lat} onChange={()=>{}} /></div>
            <div className="form-group"><label>{t.longitude}</label><input readOnly placeholder={t.autoFilled} value={form.lng} onChange={()=>{}} /></div>
            <div className="form-group"><label>{t.areaLocality} <span className="req">*</span></label><input placeholder={t.autoFilledOr} {...inp('area')} /></div>
            <div className="form-group"><label>{t.landmark}</label><input placeholder={t.autoFilledOr} {...inp('landmark')} /></div>
          </div>
          <button type="button" className="btn btn-outline btn-sm" style={{marginTop:'1rem'}} onClick={getCurrentLocation}>
            <MdMyLocation size={15}/> {t.useMyLocation}
          </button>
        </div>

        {/* Photos */}
        <div className="form-card">
          <h2>📷 {t.photoEvidence} <span style={{color:'var(--red)',fontSize:'.78rem',fontWeight:500}}>({t.required})</span></h2>
          <label className={`photo-upload${photoError?' error':''}`}>
            <input type="file" accept="image/*" multiple onChange={handlePhoto} style={{display:'none'}} />
            <div className="upload-icon"><MdCloudUpload size={40} color="var(--accent)"/></div>
            <p><span>{t.clickUpload}</span> {t.dragDrop}</p>
            <p style={{fontSize:'.76rem',marginTop:'.3rem'}}>{t.photoLimit}</p>
            <p className="photo-req-note"><FiAlertCircle size={13}/> {t.photoMandatory}</p>
          </label>
          {photoError && <p className="photo-error-msg show">❌ Please upload at least one photo.</p>}
          <div className="photo-previews">
            {photos.map((src, i) => (
              <div key={i} className="photo-item">
                <img src={src} alt="preview" />
                <button className="photo-remove" onClick={() => removePhoto(i)}><MdClose size={10}/></button>
              </div>
            ))}
          </div>
        </div>

        <div className="submit-row">
          <Link to="/" className="btn btn-outline">{t.cancel}</Link>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>🚀 {t.submitComplaint}</button>
        </div>
      </div>

      {/* Success Modal */}
      {successId && (
        <div className="modal-overlay show">
          <div className="modal">
            <button
              className="modal-close-btn"
              onClick={() => setSuccessId(null)}
              title="Close"
            >
              <MdClose size={20}/>
            </button>
            <div className="success-icon">✅</div>
            <h3>{t.complaintFiled}</h3>
            <p>{t.registeredSucc}</p>
            <div className="complaint-id-wrap">
              <div className="complaint-id">{successId}</div>
              <button className={`copy-btn${copied?' copied':''}`} onClick={copyId}>
                {copied ? <><MdCheck size={13}/> {t.copied}</> : <><MdContentCopy size={13}/> {t.copy}</>}
              </button>
            </div>
            <p style={{fontSize:'.82rem'}}>{t.useThisId}</p>
            <div className="modal-actions">
              <Link to="/track" className="btn btn-success btn-sm">📍 {t.trackStatus}</Link>
              <button className="btn btn-outline btn-sm" onClick={() => setSuccessId(null)}>{t.fileAnother}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
