import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Submit from './pages/Submit'
import Track from './pages/Track'
import Authority from './pages/Authority'
import Analytics from './pages/Analytics'
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/submit" element={<Submit />} />
      <Route path="/track" element={<Track />} />
      <Route path="/authority" element={<Authority />} />
      <Route path="/analytics" element={<Analytics />} />
    </Routes>
  )
}
