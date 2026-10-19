const DAY_MS = 24 * 60 * 60 * 1000

const validDateKey = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(String(iso)) && !Number.isNaN(Date.parse(`${iso}T00:00:00Z`)) && new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) === iso
const localDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function daysUntil(iso, now = new Date()) {
  if (!validDateKey(iso)) return null
  const base = new Date(`${localDateKey(now)}T00:00:00Z`).getTime()
  const target = new Date(`${iso}T00:00:00Z`).getTime()
  return Math.round((target - base) / DAY_MS)
}

export function formatDaysUntil(days) {
  if (!Number.isInteger(days)) return 'Choose a valid date'
  if (days < 0) return `${-days} day${days === -1 ? '' : 's'} overdue`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}
