import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MdArrowOutward, MdPhoneAndroid } from 'react-icons/md'
import Navbar from '../components/Navbar'
import './Home.css'
import { useTranslation } from '../i18n/translations'
import { LuSiren } from "react-icons/lu"
import { LiaSearchLocationSolid } from "react-icons/lia"
import { FaMobileAlt } from "react-icons/fa"
import { GrAnalytics } from "react-icons/gr"
import { FaBuildingColumns } from "react-icons/fa6"
import { FaUnlockAlt } from "react-icons/fa"
import { GiIndiaGate } from "react-icons/gi"
import { AiFillThunderbolt } from "react-icons/ai"
import { LuNotepadText } from "react-icons/lu"
import { FaBuilding } from "react-icons/fa"
import { SiTicktick } from "react-icons/si"
import { PiClockUserFill } from "react-icons/pi"
import { FaCity } from "react-icons/fa"
import { FaMapMarkedAlt } from "react-icons/fa"
import { IoMdAnalytics } from "react-icons/io"
import { BsGlobe2 } from "react-icons/bs"
import { FaRoadCircleCheck } from "react-icons/fa6"
import { FaBell } from "react-icons/fa"
import { FaDroplet } from "react-icons/fa6"
import { MdOutlineCleaningServices } from "react-icons/md"
import { GiDoubleStreetLights } from "react-icons/gi"
import { FaRegFaceLaughBeam } from "react-icons/fa6"
import { FaTrafficLight } from "react-icons/fa"
import { IoCameraSharp } from "react-icons/io5";

import { BsBuildingFillExclamation } from "react-icons/bs"


const FEATURES_DATA = [
  { Icon: FaMapMarkedAlt, key: 'feat1' },
  { Icon: IoMdAnalytics, key: 'feat2' },
  { Icon: FaMobileAlt, key: 'feat3' },
  { Icon: IoCameraSharp, key: 'feat4' },
  { Icon: FaBell, key: 'feat5' },
  { Icon: BsGlobe2, key: 'feat6' },
]

const SHOWCASE = [
  { image: '/images/Roads.jpeg', categoryIcon: FaRoadCircleCheck, category: 'Roads', color: '#f4a261', title: 'Road Potholes', description: 'Dangerous potholes, broken pavements and damaged roads causing accidents and vehicle damage across the city.' },
  { image: '/images/Water.jpeg', categoryIcon: FaDroplet, category: 'Water Supply', color: '#00b4d8', title: 'Pipeline Leaks', description: 'Burst pipelines, low water pressure, contaminated supply and open manholes affecting daily water needs.' },
  { image: '/images/Garbage.jpeg', categoryIcon: MdOutlineCleaningServices, category: 'Sanitation', color: '#06d6a0', title: 'Garbage Overflow', description: 'Overflowing bins, uncollected waste and open dumping sites creating unhygienic conditions in neighbourhoods.' },
  { image: '/images/StreetLight.jpeg', categoryIcon: GiDoubleStreetLights, category: 'Electricity', color: '#ffd166', title: 'Street Lighting', description: 'Non-functional street lights, exposed wiring and power outages leaving roads unsafe and dark at night.' },
  { image: '/images/ParkMaintanance.jpeg', categoryIcon: FaRegFaceLaughBeam, category: 'Parks', color: '#06d6a0', title: 'Park Maintenance', description: 'Broken benches, overgrown grass, damaged play equipment and neglected public green spaces in your area.' },
  { image: '/images/TrafficSignal.jpeg', categoryIcon: FaTrafficLight, category: 'Traffic', color: '#ef233c', title: 'Traffic Signals', description: 'Malfunctioning signals, missing road signs and poor lane markings causing congestion and road accidents.' },
  { image: '/images/IllegalConstruction.jpeg', categoryIcon: BsBuildingFillExclamation, category: 'Construction', color: '#7c3aed', title: 'Illegal Construction', description: 'Unauthorised structures, building material blocking roads and construction without permits endangering public safety.' },
]

const STEPS_DATA = [1, 2, 3, 4]

function animateCount(el, target, duration = 1400) {
  let start = 0
  const step = target / 60
  const timer = setInterval(() => {
    start = Math.min(start + step, target)
    el.textContent = Math.round(start).toLocaleString('en-IN')
    if (start >= target) clearInterval(timer)
  }, duration / 60)
}

export default function Home() {
  const { t } = useTranslation()
  const statsRef = useRef(null)
  const animated = useRef(false)

  const [stats, setStats] = useState({ total: 0, resolved: 0, avgHours: 0, depts: 12 })

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('http://localhost:5000/complaints')
        const data = await res.json()
        const total = data.length
        const resolved = data.filter(c => c.status === 'Resolved').length
        const resolvedWithDates = data.filter(c => c.status === 'Resolved' && c.resolvedDate && c.date)
        const avgHours = resolvedWithDates.length
          ? Math.round(resolvedWithDates.reduce((sum, c) =>
            sum + (new Date(c.resolvedDate) - new Date(c.date)) / (1000 * 3600), 0
          ) / resolvedWithDates.length)
          : 0
        setStats({ total, resolved, avgHours, depts: 12 })
      } catch (err) {
        console.warn('Could not load stats from DB')
      }
    }
    loadStats()
  }, [])

  const STATS_CONFIG = [
    { icon: <LuNotepadText size={30} />, count: stats.total, label: t.complaintsFiled },
    { icon: <SiTicktick size={27} />, count: stats.resolved, label: t.issuesResolved },
    { icon: <PiClockUserFill size={30} />, count: stats.avgHours, label: t.avgHours },
    { icon: <FaBuilding size={25} />, count: stats.depts, label: t.deptConnected },
  ]

  useEffect(() => {
    if (!stats.total) return
    animated.current = false
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !animated.current) {
          animated.current = true
          document.querySelectorAll('[data-count]').forEach(el => {
            animateCount(el, parseInt(el.dataset.count))
          })
          obs.disconnect()
        }
      })
    }, { threshold: 0.3 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [stats])

  return (
    <div className="home">
      <Navbar variant="full" />

      <section className="hero">
        <div className="hero-bg">
          <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
          <div className="hero-city">
            <svg className="city-svg" viewBox="0 0 1400 220" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="120" width="60" height="100" /><rect x="10" y="80" width="40" height="40" />
              <rect x="70" y="90" width="80" height="130" /><rect x="85" y="60" width="50" height="30" />
              <rect x="160" y="70" width="100" height="150" /><rect x="175" y="40" width="70" height="30" />
              <rect x="205" y="20" width="10" height="25" />
              <rect x="270" y="100" width="60" height="120" />
              <rect x="340" y="60" width="120" height="160" /><rect x="355" y="30" width="90" height="30" />
              <rect x="395" y="10" width="12" height="24" />
              <rect x="550" y="50" width="140" height="170" /><rect x="565" y="20" width="110" height="30" />
              <rect x="620" y="5" width="12" height="18" />
              <rect x="700" y="80" width="90" height="140" />
              <rect x="800" y="40" width="130" height="180" /><rect x="815" y="15" width="100" height="25" />
              <rect x="875" y="0" width="12" height="18" />
              <rect x="940" y="100" width="70" height="120" />
              <rect x="1020" y="70" width="100" height="150" />
              <rect x="1130" y="50" width="120" height="170" />
              <rect x="1260" y="90" width="80" height="130" />
              <rect x="1350" y="120" width="50" height="100" />
            </svg>
          </div>
        </div>
        <div className='flex'>
          <h1>{t.yourCity}</h1>
          <div><span className="g1">{t.smarter}</span> <span className="g2">{t.faster}</span></div>
        </div>
        <p className="hero-sub">{t.heroSub}</p>
        <div className="hero-actions">
          <Link to="/submit" className="btn btn-primary"><LuSiren size={18} /> {t.fileBtn}</Link>
          <Link to="/track" className="btn btn-outline"><LiaSearchLocationSolid size={18} /> {t.trackBtn}</Link>
          <Link to="/analytics" className="btn btn-success"><GrAnalytics size={18} /> {t.viewAnalytics}</Link>
        </div>
        <div className="trust-bar">
          <div className="trust-item"><FaBuildingColumns size={18} /> {t.govCertified}</div>
          <div className="trust-item"><FaUnlockAlt size={18} /> {t.otpVerified}</div>
          <div className="trust-item"><MdPhoneAndroid size={18} /> {t.mobileFirst}</div>
          <div className="trust-item"><GiIndiaGate size={18} /> {t.madeForIndia}</div>
          <div className="trust-item"><AiFillThunderbolt size={18} /> {t.realTime}</div>
        </div>
      </section>

      <section className="stats-section" ref={statsRef}>
        <div className="stats-grid">
          {STATS_CONFIG.map(s => (
            <div key={s.label} className="stat-box">
              <span className="stat-icon">{s.icon}</span>
              <div className="stat-num" data-count={s.count}>0</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="portals-section">
        <div className="section-head">
          <span className="section-tag">{t.getStarted}</span>
          <h2>{t.choosePortal}</h2>
          <p>{t.portalSub}</p>
        </div>
        <div className="portals-grid">
          <Link to="/submit" className="portal-card portal-citizen">
            <div className="portal-icon-wrap"><FaCity /></div>
            <div className="portal-tag">{t.citizenPortal}</div>
            <h3>{t.reportIssue}</h3>
            <p>{t.citizenDesc}</p>
            <div className="portal-features">
              {[t.cpFeat1, t.cpFeat2, t.cpFeat3, t.cpFeat4, t.cpFeat5].map(f => (
                <div key={f} className="portal-feat">{f}</div>
              ))}
            </div>
            <div className="portal-arrow"><MdArrowOutward /></div>
          </Link>
          <Link to="/authority" className="portal-card portal-authority">
            <div className="portal-icon-wrap"><FaBuildingColumns /></div>
            <div className="portal-tag">{t.authPortal}</div>
            <h3>{t.manageResolve}</h3>
            <p>{t.authDesc}</p>
            <div className="portal-features">
              {[t.apFeat1, t.apFeat2, t.apFeat3, t.apFeat4, t.apFeat5].map(f => (
                <div key={f} className="portal-feat">{f}</div>
              ))}
            </div>
            <div className="portal-arrow"><MdArrowOutward /></div>
          </Link>
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="section-head">
          <span className="section-tag">{t.platformFeatures}</span>
          <h2>{t.everythingYouNeed}</h2>
        </div>
        <div className="features-grid">
          {FEATURES_DATA.map(({ Icon, key }) => (
            <div key={key} className="feat-card">
              <div className="feat-icon"><Icon size={32} color="var(--accent)" /></div>
              <h3>{t[key + 'Title']}</h3>
              <p>{t[key + 'Desc']}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="showcase-section">
        <div className="section-head">
          <span className="section-tag">{t.realImpact}</span>
          <h2>{t.issuesWeSolve}</h2>
        </div>
        <div className="showcase-slider">
          {SHOWCASE.map(({ image, category, categoryIcon: CategoryIcon, color, title, description }) => (
            <div key={title} className="sc-card">
              <img className="sc-card-img" src={image} alt={title} />
              <div className="sc-card-overlay" />
              <div className="sc-card-content">
                <span className="sc-card-category" style={{ color, background: `${color}22`, borderColor: `${color}55` }}>
                  <CategoryIcon size={13} style={{ flexShrink: 0 }} />
                  <span>{category}</span>
                </span>
                <h3 className="sc-card-title">{title}</h3>
                <p className="sc-card-desc">{description}</p>
                <Link to="/submit" className="sc-card-btn"><LuSiren size={12} /> {t.fileBtn}</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="section-head">
          <span className="section-tag">{t.process}</span>
          <h2>{t.howItWorks}</h2>
          <p>{t.fourSteps}</p>
        </div>
        <div className="steps-grid">
          {STEPS_DATA.map(n => (
            <div key={n} className="step-box">
              <div className="step-num">{n}</div>
              <h4>{t['step' + n + 'Title']}</h4>
              <p>{t['step' + n + 'Desc']}</p>
            </div>
          ))}
        </div>
      </section>

      <footer>
        <div className="footer-links">
          <Link to="/submit">{t.fileComplaint}</Link>
          <Link to="/track">{t.trackStatus2}</Link>
          <Link to="/analytics">{t.analytics}</Link>
          <Link to="/authority">{t.authorityLogin}</Link>
        </div>
      </footer>
    </div>
  )
}
