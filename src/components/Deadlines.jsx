import { useMemo, useState } from 'react'
import { Button, focusRing } from './ui'
import { daysUntil, formatDaysUntil } from '../lib/deadlineDates'

const KINDS = ['Assignment', 'Series test', 'Lab record', 'Exam', 'Other']
const field = `w-full border border-line rounded-xl px-3 py-2 bg-white text-sm ${focusRing}`
const icsText = (s) => String(s).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, ' ')

function toIcs(items) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Syllabus Hub//Deadlines//EN',
    ...items.flatMap((d) => ['BEGIN:VEVENT', `UID:${d.id}@syllabus-hub`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d.date.replace(/-/g, '')}`, `SUMMARY:${icsText(`${d.kind}: ${d.title}`)}`, 'END:VEVENT']),
    'END:VCALENDAR'].join('\r\n')
}

/* Deadlines are saved in the profile (this browser only). Props: subject, topics, deadlines, setDeadlines, onOpenTopic. */
export default function Deadlines({ subject, topics, deadlines, setDeadlines, onOpenTopic }) {
  const [form, setForm] = useState({ title: '', date: '', kind: 'Assignment', topicId: '' })
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const mine = useMemo(() => deadlines.filter((d) => d.subjectId === subject.id), [deadlines, subject.id])
  const open = mine.filter((d) => !d.done).sort((a, b) => a.date.localeCompare(b.date))
  const done = mine.filter((d) => d.done)
  const soon = open.filter((d) => daysUntil(d.date) <= 7)
  const topicName = (id) => topics.find((t) => t.id === id)?.title

  const add = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('Give the deadline a name.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return setError('Choose a date.')
    setError('')
    setDeadlines((list) => [...list, { id: `dl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, subjectId: subject.id, title: form.title.trim().slice(0, 120), date: form.date, kind: form.kind, topicId: form.topicId || '', done: false }])
    setForm((f) => ({ ...f, title: '' })); setFlash('Deadline added.')
  }
  const toggle = (id) => setDeadlines((list) => list.map((d) => (d.id === id ? { ...d, done: !d.done } : d)))
  const remove = (id) => { if (window.confirm('Delete this deadline?')) setDeadlines((list) => list.filter((d) => d.id !== id)) }
  const exportIcs = () => {
    if (!open.length) return setFlash('Nothing to export yet.')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([toIcs(open)], { type: 'text/calendar;charset=utf-8' }))
    link.download = 'syllabus-hub-deadlines.ics'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000)
    setFlash('Calendar file downloaded. Open it to add the dates to your phone or computer calendar.')
  }

  const Row = ({ d }) => {
    const n = daysUntil(d.date)
    return <li className="flex flex-wrap items-center gap-3 py-2.5 border-t border-line first:border-t-0">
      <input type="checkbox" checked={d.done} onChange={() => toggle(d.id)} aria-label={`Mark ${d.title} ${d.done ? 'not done' : 'done'}`} className="accent-brand w-4 h-4" />
      <div className="flex-1 min-w-40"><p className={`text-sm font-medium ${d.done ? 'line-through text-ink-soft' : ''}`}>{d.title}</p>
        <p className="text-xs text-ink-soft">{d.kind} · {new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}{topicName(d.topicId) ? ` · ${topicName(d.topicId)}` : ''}</p></div>
      {!d.done && <span className={`text-xs border px-2 py-0.5 ${n < 0 ? 'border-status-danger text-status-danger' : n <= 2 ? 'border-black font-semibold' : 'border-line text-ink-soft'}`}>{formatDaysUntil(n)}</span>}
      {d.topicId && <button className={`text-xs underline ${focusRing}`} onClick={() => onOpenTopic(d.topicId)}>Open topic</button>}
      <button className={`text-xs underline text-ink-soft ${focusRing}`} onClick={() => remove(d.id)} aria-label={`Delete ${d.title}`}>Delete</button>
    </li>
  }

  return (
    <main id="top" className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
      <section className="glass rounded-[26px] p-5 sm:p-7">
        <p className="text-xs font-semibold text-ink-soft">Study Toolkit · {subject.title}</p>
        <h1 className="text-2xl sm:text-3xl font-black mt-1">Deadlines</h1>
        <p className="text-sm text-ink-soft mt-1">Track assignments, series tests, lab records and exams. You enter the dates yourself, so check them against your college notices. Saved in this browser only.</p>
      </section>
      <p className="text-sm min-h-5" role="status" aria-live="polite">{flash}</p>
      <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-5">
        <section className="frost p-5 space-y-3">
          <div className="flex items-center justify-between gap-3"><h2 className="font-bold text-lg">Next 7 days</h2><Button variant="secondary" className="!py-1.5 text-sm" onClick={exportIcs}>Export to calendar (.ics)</Button></div>
          {soon.length ? <ul>{soon.map((d) => <Row key={d.id} d={d} />)}</ul> : <p className="text-sm text-ink-soft">{open.length ? 'Nothing due in the next 7 days.' : 'No deadlines yet. Add one on the right.'}</p>}
          {open.length > soon.length && <><h3 className="font-bold pt-2">Later</h3><ul>{open.filter((d) => !soon.includes(d)).map((d) => <Row key={d.id} d={d} />)}</ul></>}
          {done.length > 0 && <details><summary className={`cursor-pointer text-sm ${focusRing}`}>Done ({done.length})</summary><ul>{done.map((d) => <Row key={d.id} d={d} />)}</ul></details>}
        </section>
        <form onSubmit={add} className="frost p-5 space-y-3">
          <h2 className="font-bold text-lg">Add a deadline</h2>
          <label className="block text-sm font-medium">Name<input className={`${field} mt-1`} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Module 2 assignment" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">Date<input type="date" className={`${field} mt-1`} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></label>
            <label className="block text-sm font-medium">Type<select className={`${field} mt-1`} value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></label>
          </div>
          <label className="block text-sm font-medium">Related topic (optional)<select className={`${field} mt-1`} value={form.topicId} onChange={(e) => setForm((f) => ({ ...f, topicId: e.target.value }))}><option value="">None</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
          {error && <p className="text-sm text-status-danger" role="alert">{error}</p>}
          <Button type="submit">Add deadline</Button>
        </form>
      </div>
    </main>
  )
}
