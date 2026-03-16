import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MdBarChart, MdTableChart } from 'react-icons/md'
import Navbar from '../components/Navbar'
import { getAllComplaints, STATUS_CLASS } from '../data/data'
import { useTranslation } from '../i18n/translations'
import './Analytics.css'
import { VscGraph } from "react-icons/vsc";
import { PiBuildingApartmentFill } from "react-icons/pi";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { ImParagraphRight } from "react-icons/im";
import { AiTwotoneThunderbolt } from "react-icons/ai";
import { PiClockCountdown } from "react-icons/pi";
import { LuNotepadText } from "react-icons/lu";
import { GiSandsOfTime } from "react-icons/gi";
import { FiRefreshCcw } from "react-icons/fi";
import { SiTicktick } from "react-icons/si";
import { SiMattermost } from "react-icons/si";

function tc() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark'
  return {
    text: dark ? '#e2eaf4' : '#03111f',
    muted: dark ? '#6b85a0' : '#4a6276',
    grid: dark ? 'rgba(0,180,216,0.08)' : 'rgba(0,119,182,0.08)',
    accent: '#00b4d8', green: '#06d6a0', orange: '#f4a261', red: '#ef233c'
  }
}

export default function Analytics() {
  const { t } = useTranslation()
  const [timeFilter, setTimeFilter] = useState('all')
  const [kpis, setKpis] = useState({})
  const [deptRows, setDeptRows] = useState([])
  const [recentRows, setRecentRows] = useState([])
  const charts = useRef({})

  function destroy(id) { if (charts.current[id]) { charts.current[id].destroy(); delete charts.current[id] } }

  useEffect(() => {
    const Chart = window.Chart
    if (!Chart) return

    async function load() {
      const raw = await getAllComplaints()

      let data = raw
      if (timeFilter !== 'all') {
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - parseInt(timeFilter))
        data = raw.filter(c => new Date(c.date) >= cutoff)
      }

      const total = data.length
      const pending = data.filter(c => c.status === 'Pending').length
      const progress = data.filter(c => c.status === 'In Progress').length
      const resolved = data.filter(c => c.status === 'Resolved').length
      const high = data.filter(c => c.priority === 'high').length
      setKpis({ total, pending, progress, resolved, high, pct: total ? Math.round(resolved / total * 100) : 0 })

      const C = tc()

      // Volume chart
      destroy('volume')
      const days = []; const now = new Date(Date.now())
      for (let i = 13; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); days.push(d.toISOString().split('T')[0]) }
      const vEl = document.getElementById('volumeChart')
      if (vEl) charts.current.volume = new Chart(vEl, {
        type: 'line',
        data: {
          labels: days.map(d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
          datasets: [
            { label: 'Filed', data: days.map(d => data.filter(c => c.date?.startsWith(d)).length), borderColor: C.accent, backgroundColor: 'rgba(0,180,216,.12)', fill: true, tension: .4, pointRadius: 4 },
            { label: t.resolved, data: days.map(d => data.filter(c => c.resolvedDate?.startsWith(d)).length), borderColor: C.green, backgroundColor: 'rgba(6,214,160,.08)', fill: true, tension: .4, pointRadius: 4 },
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: C.text, font: { family: 'Inter', size: 12 } } } }, scales: { x: { ticks: { color: C.muted, font: { size: 10 } }, grid: { color: C.grid } }, y: { ticks: { color: C.muted, font: { size: 10 } }, grid: { color: C.grid }, beginAtZero: true } } }
      })

      // Category donut
      destroy('category')
      const cats = {}; data.forEach(c => { const k = c.category?.replace(/^\S+\s/, '') || 'Other'; cats[k] = (cats[k] || 0) + 1 })
      const catEl = document.getElementById('categoryChart')
      const colors = ['#b9b3b3', '#06d6a0', '#e50e0e', '#0652b0', '#d4d7b9', '#8bd7ec', '#ac8ed3', '#85e87e', '#c9d729']
      if (catEl) charts.current.category = new Chart(catEl, {
        type: 'doughnut',
        data: { labels: Object.keys(cats), datasets: [{ data: Object.values(cats), backgroundColor: colors, borderWidth: 2, borderColor: 'transparent' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: C.text, font: { family: 'Inter', size: 11 }, padding: 12, boxWidth: 14 } } } }
      })

      // Status bar
      destroy('status')
      const sEl = document.getElementById('statusChart')
      if (sEl) charts.current.status = new Chart(sEl, {
        type: 'bar',
        data: { labels: ['Pending', 'In Progress', 'Resolved', 'Rejected'], datasets: [{ data: [pending, progress, resolved, data.filter(c => c.status === 'Rejected').length], backgroundColor: ['rgba(244,162,97,.8)', 'rgba(0,180,216,.8)', 'rgba(6,214,160,.8)', 'rgba(239,35,60,.8)'], borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: C.muted, font: { size: 11 } }, grid: { display: false } }, y: { ticks: { color: C.muted, font: { size: 10 } }, grid: { color: C.grid }, beginAtZero: true } } }
      })

      // Priority donut
      destroy('priority')
      const pEl = document.getElementById('priorityChart')
      if (pEl) charts.current.priority = new Chart(pEl, {
        type: 'doughnut',
        data: { labels: ['Low', 'Medium', 'High'], datasets: [{ data: [data.filter(c => c.priority === 'low').length, data.filter(c => c.priority === 'medium').length, high], backgroundColor: [C.green, C.orange, C.red], borderWidth: 2, borderColor: 'transparent' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: C.text, font: { family: 'Inter', size: 12 }, padding: 12, boxWidth: 14 } } } }
      })

      // Dept speed
      destroy('dept')
      const depts = {}
      data.forEach(c => {
        if (c.status === 'Resolved' && c.resolvedDate && c.date) {
          const h = Math.round((new Date(c.resolvedDate) - new Date(c.date)) / (1000 * 3600))
          const k = c.department?.replace(/ Dept| Board| Wing/g, '') || 'Other'
          if (!depts[k]) depts[k] = []; depts[k].push(h)
        }
      })
      const dLabels = Object.keys(depts)
      const dAvgs = dLabels.map(k => Math.round(depts[k].reduce((a, b) => a + b, 0) / depts[k].length))
      const dEl = document.getElementById('deptChart')
      if (dEl && dLabels.length) charts.current.dept = new Chart(dEl, {
        type: 'bar',
        data: { labels: dLabels, datasets: [{ label: 'Avg Hours', data: dAvgs, backgroundColor: dLabels.map((_, i) => ['rgba(0,180,216,.8)', 'rgba(6,214,160,.8)', 'rgba(124,58,237,.8)', 'rgb(208, 228, 95)'][i % 4]), borderRadius: 6 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: C.muted, font: { size: 10 } }, grid: { color: C.grid }, beginAtZero: true }, y: { ticks: { color: C.muted, font: { size: 10 }, maxRotation: 0 }, grid: { display: false } } } }
      })

      // Dept table
      const deptMap = {}
      data.forEach(c => {
        const k = c.department || 'General'
        if (!deptMap[k]) deptMap[k] = { total: 0, resolved: 0, pending: 0, progress: 0, rejected: 0, hours: [] }
        deptMap[k].total++
        if (c.status === 'Resolved') { deptMap[k].resolved++; if (c.resolvedDate && c.date) deptMap[k].hours.push(Math.round((new Date(c.resolvedDate) - new Date(c.date)) / (1000 * 3600))) }
        if (c.status === 'Pending') deptMap[k].pending++
        if (c.status === 'In Progress') deptMap[k].progress++
        if (c.status === 'Rejected') deptMap[k].rejected++
      })
      setDeptRows(Object.entries(deptMap).map(([k, v]) => ({
        dept: k, ...v,
        pct: v.total ? Math.round(v.resolved / v.total * 100) : 0,
        avgH: v.hours.length ? Math.round(v.hours.reduce((a, b) => a + b, 0) / v.hours.length) : null
      })))
      setRecentRows(raw.slice(0, 10))
    }

    load()
  }, [timeFilter])

  return (
    <div className="analytics-page">
      <Navbar variant="full" />
      <div className="analytics-wrapper">
        <div className="analytics-header">
          <div>
            <h1><MdBarChart size={28} /> {t.analyticsDash}</h1>
            <p>{t.analyticsDesc}</p>
          </div>
          <select className="filter-sel" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
            <option value="all">{t.allTime}</option>
            <option value="7">{t.last7Days}</option>
            <option value="30">{t.last30Days}</option>
          </select>
        </div>

        {/* KPIs */}
        <div className="kpi-row">
          {[
            { cls: 'kpi-total', label: t.totalComplaints, num: kpis.total, sub: t.allTimeLabel, icon: <LuNotepadText /> },
            { cls: 'kpi-pending', label: t.pending, num: kpis.pending, sub: t.awaitingAction, icon: <GiSandsOfTime color='orange' /> },
            { cls: 'kpi-progress', label: t.inProgress, num: kpis.progress, sub: t.beingWorkedOn, icon: <FiRefreshCcw color='blue' /> },
            { cls: 'kpi-resolved', label: t.resolved, num: kpis.resolved, sub: `${kpis.pct}% rate`, icon: <SiTicktick color='green' /> },
            { cls: 'kpi-high', label: t.highPriority, num: kpis.high, sub: t.urgentIssues, icon: <SiMattermost color='red' /> },
          ].map((k) => (
            <div key={k.label} className={`kpi-card ${k.cls}`}>
              <div className="kpi-icon">{k.icon}</div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-num">{k.num ?? '–'}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="charts-row">
          <div className="chart-card wide">
            <div className="chart-title"><VscGraph />{t.compVolume}</div>
            <div className="chart-body"><canvas id="volumeChart" /></div>
          </div>
          <div className="chart-card">
            <div className="chart-title"><BiSolidCategoryAlt />{t.categoryBreak}</div>
            <div className="chart-body"><canvas id="categoryChart" /></div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-title"><PiBuildingApartmentFill />{t.deptSpeed} <span className="chart-sub">({t.avgHrs})</span></div>
            <div className="chart-body"><canvas id="deptChart" /></div>
          </div>
          <div className="chart-card">
            <div className="chart-title"><ImParagraphRight /> {t.statusDist}</div>
            <div className="chart-body"><canvas id="statusChart" /></div>
          </div>
          <div className="chart-card">
            <div className="chart-title"><AiTwotoneThunderbolt /> {t.priorityDist}</div>
            <div className="chart-body"><canvas id="priorityChart" /></div>
          </div>
        </div>

        {/* Dept Table */}
        <div className="dept-table-card">
          <div className="chart-title"><MdTableChart size={18} /> {t.deptPerf}</div>
          <div className="table-wrap"><table>
            <thead><tr><th>{t.thDept}</th><th>{t.thTotal}</th><th>{t.thResolved}</th><th>{t.thPending}</th><th>{t.thInProgress}</th><th>{t.thRejected}</th><th>{t.thAvgHrs}</th><th>{t.thRate}</th></tr></thead>
            <tbody>
              {deptRows.map(r => (
                <tr key={r.dept}>
                  <td style={{ fontWeight: 600 }}>{r.dept}</td>
                  <td>{r.total}</td>
                  <td style={{ color: 'var(--green)' }}>{r.resolved}</td>
                  <td style={{ color: 'var(--orange)' }}>{r.pending}</td>
                  <td style={{ color: 'var(--accent)' }}>{r.progress}</td>
                  <td style={{ color: 'var(--red)' }}>{r.rejected}</td>
                  <td className={r.avgH === null ? '' : r.avgH <= 24 ? 'speed-fast' : r.avgH <= 72 ? 'speed-mid' : 'speed-slow'}>{r.avgH !== null ? `${r.avgH}h` : '–'}</td>
                  <td className={`res-pct ${r.pct >= 70 ? 'pct-good' : r.pct >= 40 ? 'pct-mid' : 'pct-bad'}`}>{r.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>

        {/* Recent */}
        <div className="dept-table-card">
          <div className="chart-title"><PiClockCountdown />{t.recentComplaints}</div>
          <div className="table-wrap"><table>
            <thead><tr><th>{t.thId}</th><th>{t.thTitle}</th><th>{t.thCategory}</th><th>{t.thArea}</th><th>{t.thPriority}</th><th>{t.thStatus}</th><th>{t.thDate}</th></tr></thead>
            <tbody>
              {recentRows.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '.78rem', color: 'var(--muted)' }}>{c.id}</td>
                  <td style={{ fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title || '—'}</td>
                  <td>{c.category || '—'}</td>
                  <td style={{ color: 'var(--muted)' }}>{c.area || '—'}</td>
                  <td><span className={`priority-dot p-${c.priority || 'medium'}`} />{c.priority || '—'}</td>
                  <td><span className={`status-badge ${STATUS_CLASS[c.status] || ''}`}>{c.status}</span></td>
                  <td style={{ color: 'var(--muted)', fontSize: '.8rem' }}>{c.date ? new Date(c.date).toLocaleDateString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  )
}
