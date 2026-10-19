/* Backup, restore and clear for ONE demo profile. Data lives only in this browser's localStorage. */
const enc = (email) => encodeURIComponent(String(email).trim().toLowerCase())
const mine = (email, key) => key === `hub2.profile.${enc(email)}` || key === `hub2.toolkit.${enc(email)}` || key.startsWith(`hub2.board.${enc(email)}.`)

export const ownKeys = (email) => {
  const keys = []
  try { for (let i = 0; i < localStorage.length; i += 1) { const k = localStorage.key(i); if (k && mine(email, k)) keys.push(k) } } catch { /* storage blocked */ }
  return keys
}

export function buildBackup(email) {
  const entries = {}
  ownKeys(email).forEach((k) => { try { entries[k] = JSON.parse(localStorage.getItem(k)) } catch { /* skip unreadable entry */ } })
  return { app: 'syllabus-hub', version: 1, email: String(email).trim().toLowerCase(), createdAt: new Date().toISOString(), entries }
}

export function parseBackup(text, email) {
  let data
  try { data = JSON.parse(text) } catch { throw new Error('That file is not valid JSON.') }
  if (data?.app !== 'syllabus-hub' || data.version !== 1 || typeof data.entries !== 'object' || !data.entries) throw new Error('This is not a Syllabus Hub backup file.')
  if (Object.keys(data.entries).some((k) => !mine(email, k))) throw new Error(`This backup belongs to another profile (${data.email || 'unknown'}). Sign in with that email to restore it.`)
  if (!data.entries[`hub2.profile.${enc(email)}`]) throw new Error('This backup has no profile data.')
  return data
}

/* All-or-nothing: if any write fails (storage full), the previous values are put back. */
export function restoreBackup(data) {
  const email = data.email
  const existing = ownKeys(email)
  const affected = new Set([...existing, ...Object.keys(data.entries)])
  const before = [...affected].map((k) => [k, localStorage.getItem(k)])
  try {
    Object.entries(data.entries).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)))
    existing.filter((k) => !(k in data.entries)).forEach((k) => localStorage.removeItem(k))
  }
  catch (error) {
    before.forEach(([k, v]) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* best effort */ } })
    throw new Error('Could not restore: browser storage is full or blocked. Nothing was changed.')
  }
}

export const clearOwn = (email) => ownKeys(email).forEach((k) => localStorage.removeItem(k))
export const usageBytes = (email) => ownKeys(email).reduce((n, k) => n + (localStorage.getItem(k) ?? '').length * 2, 0)
export const formatBytes = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`)
