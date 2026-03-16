// ── Department Map ──
export const DEPT_MAP = {
  'Roads': 'Roads & Infrastructure Dept',
  'Water Supply': 'Water Supply & Sewerage Board',
  'Sanitation': 'Sanitation & Waste Management Dept',
  'Electricity': 'GHMC Electrical Wing',
  'Parks': 'Parks & Horticulture Dept',
  'Pest Control': 'Public Health & Pest Control Dept',
  'Traffic': 'Traffic Police & Transport Dept',
  'Construction': 'Town Planning & Enforcement Dept',
  'Other': 'General Public Services Dept',
}

export function getDepartment(cat) {
  if (!cat) return 'General Public Services Dept'
  for (const [k, v] of Object.entries(DEPT_MAP)) {
    if (cat.includes(k)) return v
  }
  return 'General Public Services Dept'
}

// ── Status helper ──
export const STATUS_CLASS = {
  'Pending': 'status-pending',
  'In Progress': 'status-progress',
  'Resolved': 'status-resolved',
  'Rejected': 'status-rejected',
}

export const ANALYTICS_SEED = []

export async function getStoredComplaints() {
  const res = await fetch("http://localhost:5000/complaints")
  return await res.json()
}

export async function getAllComplaints() {
  const res = await fetch("http://localhost:5000/complaints");
  return await res.json();
}

export async function createComplaint(data) {
  const res = await fetch("http://localhost:5000/complaints", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return await res.json();
}

export async function saveComplaint(id, update) {
  const res = await fetch(`http://localhost:5000/complaints/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update)
  })
  return await res.json()
}

// ── Theme ──
export function getTheme() { return localStorage.getItem('cp-theme') || 'dark' }
export function setTheme(t) {
  localStorage.setItem('cp-theme', t)
  document.documentElement.setAttribute('data-theme', t)
}
export function initTheme() {
  document.documentElement.setAttribute('data-theme', getTheme())
}
