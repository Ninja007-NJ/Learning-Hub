/* Safe localStorage helpers (never crash if storage is blocked) */
export const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
export const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

export const SECTIONS = [
  { id: 'notes', label: 'Notes', icon: '▤' },
  { id: 'videos', label: 'Videos', icon: '▶' },
  { id: 'code', label: 'Code', icon: '</>' },
  { id: 'textbook', label: 'Textbook', icon: '▥' },
  { id: 'pyqs', label: 'Past questions', icon: '?' },
]
export const iconFor = (t) => SECTIONS.find((s) => s.id === t)?.icon ?? '▤'
export const labelFor = (t) => SECTIONS.find((s) => s.id === t)?.label ?? t

export const youtubeId = (url) => {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
    if (u.hostname.endsWith('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v')
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2]
    }
  } catch { /* not a URL */ }
  return null
}
export const guessType = (url) => {
  if (youtubeId(url)) return 'videos'
  if (/github\.com|gitlab\.com/.test(url)) return 'code'
  return 'notes'
}
export const hostOf = (url) => { try { return new URL(url).hostname.replace('www.', '') } catch { return 'link' } }
export const isUrl = (s) => /^https?:\/\/\S+$/i.test(s.trim())

const STOP_WORDS = new Set(['the','and','for','with','from','that','this','notes','note','chapter','module','unit','lecture','study','materials','subject'])
export const suggestTopic = (filename, text, topics, fallbackId) => {
  const searchable = `${filename} ${String(text ?? '').slice(0, 50000)}`.toLowerCase()
  const ranked = topics.map((topic) => {
    const words = `${topic.title} ${topic.module ?? ''}`.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    const score = words.reduce((total, word) => {
      const safe = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const hits = (searchable.match(new RegExp(`\\b${safe}\\b`, 'g')) ?? []).length
      const fileHits = (filename.toLowerCase().match(new RegExp(`\\b${safe}\\b`, 'g')) ?? []).length
      return total + hits + fileHits * 5
    }, 0)
    return { id: topic.id, score }
  }).sort((a, b) => b.score - a.score)
  return ranked[0]?.score > 0 ? ranked[0] : { id: fallbackId ?? topics[0]?.id, score: 0 }
}
