import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  MdMenu, MdClose,
  MdOutlineTrackChanges, MdBarChart,
  MdOutlineAdminPanelSettings, MdAddCircleOutline,
  MdHome
} from 'react-icons/md'
import { BsMoonStars } from "react-icons/bs"
import { IoSunny } from "react-icons/io5"
import { FaBuildingColumns } from "react-icons/fa6"
import { FaPlus, FaGlobe } from "react-icons/fa"
import { getTheme, setTheme } from '../data/data'
import { LANGUAGES, setLanguage } from '../i18n/translations'
import './Navbar.css'

export default function Navbar({ variant = 'full' }) {
  const [theme, setThemeState] = useState(getTheme)
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const currentLang = localStorage.getItem('cp-lang') || 'en'
  const location = useLocation()
  const menuRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next); setThemeState(next)
  }

  const isActive = (path) => location.pathname === path
  const activeLang = LANGUAGES.find(l => l.code === currentLang)

  return (
    <>
      <nav ref={menuRef}>

        {/* Logo */}
        <Link to="/" className="logo">
          <div className="logo-badge">
            <img src="/images/logo.png" alt="logo" width={30} />
          </div>
          Civic<span className='em'>Pulse</span>
        </Link>

        {/* Desktop nav links — hidden on mobile */}
        {variant === 'full' && (
          <ul className="nav-links">
            <li>
              <a href="#features" onClick={e => {
                e.preventDefault()
                if (location.pathname === '/') {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                } else {
                  window.location.href = '/#features'
                }
              }}>Features</a>
            </li>
            <li><Link to="/track" className={isActive('/track') ? 'active' : ''}>Track Complaint</Link></li>
            <li><Link to="/analytics" className={isActive('/analytics') ? 'active' : ''}>Analytics</Link></li>
          </ul>
        )}

        {/* Right side */}
        <div className="nav-right">

          {/* Language Switcher */}
          <div className="lang-switcher">
            <button
              className="lang-btn"
              onClick={() => { setLangOpen(o => !o); setMenuOpen(false) }}
              title="Change language"
            >
              <FaGlobe size={13} />
              <span>{activeLang?.native || 'EN'}</span>
            </button>
            {langOpen && (
              <div className="lang-dropdown">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    className={`lang-option${currentLang === l.code ? ' active' : ''}`}
                    onClick={() => { setLangOpen(false); setLanguage(l.code) }}
                  >
                    <span className="lang-native">{l.native}</span>
                    <span className="lang-label">{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button className="theme-toggle" onClick={toggle} title="Toggle theme">
            {theme === 'dark' ? <IoSunny size={16} /> : <BsMoonStars size={16} />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>

          {variant === 'full' && (
            <>
              {/* Desktop buttons — hidden on mobile */}
              <Link to="/authority" className="btn btn-outline btn-sm nav-hide-sm">
                <FaBuildingColumns size={15} /> Authority
              </Link>
              <Link to="/submit" className="btn btn-primary btn-sm nav-hide-sm">
                <FaPlus size={15} /> File Complaint
              </Link>

              {/* Hamburger — only on mobile */}
              <button
                className={`hamburger${menuOpen ? ' open' : ''}`}
                onClick={() => { setMenuOpen(o => !o); setLangOpen(false) }}
                aria-label="Toggle menu"
              >
                {menuOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
              </button>
            </>
          )}

          {variant === 'back' && (
            <Link to="/" className="back-btn">← Home</Link>
          )}

          {variant === 'authority' && (
            <Link to="/" className="back-btn">← Home</Link>
          )}
        </div>
      </nav>

      {/* Mobile dropdown — all nav options */}
      {variant === 'full' && (
        <div className={`mobile-nav${menuOpen ? ' open' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <MdHome size={18} /> Home
          </Link>
          <Link to="/submit" onClick={() => setMenuOpen(false)}>
            <MdAddCircleOutline size={18} /> File Complaint
          </Link>
          <Link to="/track" onClick={() => setMenuOpen(false)}>
            <MdOutlineTrackChanges size={18} /> Track Complaint
          </Link>
          <Link to="/analytics" onClick={() => setMenuOpen(false)}>
            <MdBarChart size={18} /> Analytics
          </Link>
          <Link to="/authority" onClick={() => setMenuOpen(false)}>
            <FaBuildingColumns size={15} /> Authority
          </Link>
        </div>
      )}
    </>
  )
}
