import { useEffect, useMemo, useState } from 'react'
import { Button, focusRing } from './ui'
import { scheduleReview } from '../lib/smartReview'

const DAY = 86400000
const LEVELS = ['Not started', 'Shaky', 'Okay', 'Confident']
const SW = new Set('that this with from have which their there when where will been are and the for was were into than then them they your also such can may not but its has had how why what'.split(' '))
const wordsOf = (text) => new Set((String(text ?? '').toLowerCase().match(/[a-z][a-z0-9]{3,}/g) ?? []).filter((w) => !SW.has(w)))
const linesOf = (text) => String(text ?? '').split('\n').map((l) => l.trim()).filter(Boolean)
const field = `w-full border border-line rounded-xl px-3 py-2 bg-white text-sm ${focusRing}`

export default function SmartNotes({ subject, topics, resources, notes, packs, setPacks, cards, setCards, conf, setConf, plan, setPlan, onOpenTopic }) {
  const [view, setView] = useState('prepare')
  const [aiReady, setAiReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [skip, setSkip] = useState({})
  const [cmp, setCmp] = useState([0, 1])
  const [flip, setFlip] = useState(false)
  const [form, setForm] = useState({ q: '', a: '', topicId: topics[0]?.id ?? '' })

  useEffect(() => {
    let active = true
    fetch('/api/study-chat/config').then((r) => (r.ok ? r.json() : null)).then((c) => { if (active) setAiReady(Boolean(c?.enabled)) })
      .catch(() => { if (active) setAiReady(false) }).finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [])

  const topicIds = useMemo(() => new Set(topics.map((t) => t.id)), [topics])
  const sources = useMemo(() => [
    ...topics.filter((t) => (notes[t.id] ?? '').trim()).map((t) => ({ id: `typed:${t.id}`, topicId: t.id, title: `Your notes: ${t.title}`, text: notes[t.id].trim() })),
    ...resources.filter((r) => topicIds.has(r.topic) && r.content?.trim()).map((r) => ({ id: r.id, topicId: r.topic, title: r.title, text: r.content.trim() })),
  ], [topics, notes, resources, topicIds])
  const chosen = sources.filter((s) => !skip[s.id])
  const hash = chosen.map((s) => `${s.id}:${s.text.length}`).join('|')
  const pack = packs?.[subject.id]
  const titlesOf = (labels) => (labels ?? []).map((l) => pack?.sources?.find((s) => s.label === l)).filter(Boolean)
  const SrcNote = ({ labels }) => { const list = titlesOf(labels); return list.length ? <span className="block text-xs text-ink-soft">Source: {list.map((s) => s.title).join(', ')}</span> : null }
  const topicTitle = (id) => topics.find((t) => t.id === id)?.title ?? 'Topic'
  const mine = cards.filter((c) => topicIds.has(c.topicId))
  const due = mine.filter((c) => c.due <= Date.now())
  const current = due[0]

  const prepare = async () => {
    if (!chosen.length || busy) return
    setBusy(true); setError(''); setFlash('')
    try {
      const response = await fetch('/api/smart-notes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject: subject.title, topics: topics.map(({ id, title }) => ({ id, title })), sources: chosen }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'The assistant could not prepare notes.')
      setPacks((current) => ({ ...current, [subject.id]: { ...result.pack, sources: result.sources, hash, at: Date.now() } }))
      setFlash('Study notes prepared. Every item lists the source it came from.')
    } catch (e) { setError(e.message || 'Could not prepare notes. Try again.') } finally { setBusy(false) }
  }

  const makeCards = () => {
    if (!pack) return
    const have = new Set(cards.map((c) => `${c.topicId}|${c.q}`))
    const candidates = [
      ...(pack.terms ?? []).map((t) => ({ q: t.term, a: t.meaning, topicId: t.topicId, src: t.src })),
      ...(pack.questions ?? []).map((t) => ({ q: t.q, a: t.a, topicId: t.topicId, src: t.src })),
    ].filter((c) => c.q && c.a && topicIds.has(c.topicId) && !have.has(`${c.topicId}|${c.q}`))
    setCards((list) => [...list, ...candidates.map((c) => ({ id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, q: c.q, a: c.a, topicId: c.topicId, sourceTitles: titlesOf(c.src).map((s) => s.title), box: 0, due: Date.now() }))])
    setFlash(candidates.length ? `${candidates.length} flashcards added.` : 'Those flashcards already exist.')
  }

  const grade = (card, g) => {
    setCards((list) => list.map((c) => (c.id === card.id ? scheduleReview(c, g) : c)))
    setFlip(false)
  }

  const addCard = (e) => {
    e.preventDefault()
    if (!form.q.trim() || !form.a.trim() || !form.topicId) { setError('Enter a question, an answer and a topic.'); return }
    setError('')
    setCards((list) => [...list, { id: `card-${Date.now()}`, q: form.q.trim(), a: form.a.trim(), topicId: form.topicId, sourceTitles: ['Written by you'], box: 0, due: Date.now() }])
    setForm((f) => ({ ...f, q: '', a: '' })); setFlash('Flashcard added.')
  }

  const daysLeft = plan.exam ? Math.ceil((new Date(`${plan.exam}T00:00:00`) - new Date(new Date().toDateString())) / DAY) : null
  const weight = (t) => 3 - (conf[t.id] ?? 0) + 0.5
  const weightSum = topics.reduce((sum, t) => sum + weight(t), 0)
  const minutesFor = (t) => (daysLeft > 0 ? Math.round((weight(t) / weightSum) * daysLeft * plan.hrs * 60) : null)
  const ordered = [...topics].sort((a, b) => (conf[a.id] ?? 0) - (conf[b.id] ?? 0))
  const a = topics[cmp[0]] ?? topics[0]
  const b = topics[cmp[1]] ?? topics[1] ?? topics[0]
  const wa = wordsOf(notes[a.id]); const wb = wordsOf(notes[b.id])
  const both = [...wa].filter((w) => wb.has(w)); const onlyA = [...wa].filter((w) => !wb.has(w)); const onlyB = [...wb].filter((w) => !wa.has(w))
  const chips = (list, cls = '') => list.length ? list.slice(0, 16).map((w) => <span key={w} className={`inline-block text-xs border border-line rounded-full px-2 py-0.5 mr-1 mb-1 ${cls}`}>{w}</span>) : <span className="text-xs text-ink-soft">none</span>
  const tabs = [['prepare', 'Prepare'], ['compare', 'Compare'], ['cards', `Flashcards${due.length ? ` (${due.length} due)` : ''}`], ['sheet', 'Revision sheet']]

  return (
    <main id="top" className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
      <section className="glass rounded-[26px] p-5 sm:p-7">
        <p className="text-xs font-semibold text-ink-soft">Study Toolkit · {subject.title}</p>
        <h1 className="text-2xl sm:text-3xl font-black mt-1">Smart notes</h1>
        <p className="text-sm text-ink-soft mt-1">Turn your own notes into a summary, key terms, comparisons, flashcards and a revision sheet. Everything is saved in this browser for this demo profile only. Demo sign-in is not account security and nothing syncs to other devices.</p>
      </section>
      <div role="tablist" aria-label="Smart notes" className="inline-flex flex-wrap gap-1 p-1 border-2 border-black bg-white">
        {tabs.map(([id, label]) => <button key={id} role="tab" aria-selected={view === id} onClick={() => { setView(id); setError(''); setFlash('') }} className={`px-3 py-1.5 text-sm ${focusRing} ${view === id ? 'bg-black text-white' : ''}`}>{label}</button>)}
      </div>
      <p className="text-sm min-h-5" role="status" aria-live="polite">{flash}</p>
      {error && <p className="text-sm text-status-danger" role="alert">{error}</p>}

      {view === 'prepare' && <section className="frost p-5 space-y-4">
        <h2 className="font-bold text-lg">Choose what to prepare from</h2>
        {sources.length === 0 ? <p className="text-sm text-ink-soft">No readable notes yet. Type notes in the Study space or upload a text-based PDF, TXT or Markdown file in Materials, then come back.</p> : <ul className="space-y-1">
          {sources.map((s) => <li key={s.id}><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!skip[s.id]} onChange={() => setSkip((m) => ({ ...m, [s.id]: !m[s.id] }))} className="accent-brand w-4 h-4" /><span className="flex-1 truncate">{s.title}</span><span className="text-xs text-ink-soft">{s.text.length} characters</span></label></li>)}
        </ul>}
        <p className="text-xs text-ink-soft">{aiReady ? 'When you tap Prepare, only the ticked sources are sent to Gemini through your server. Avoid private or sensitive text. Results only include items that point to a source, but check them against your notes.' : checking ? 'Checking the assistant…' : 'The AI assistant is not connected (add GEMINI_API_KEY to the server .env). Compare, flashcards and the revision sheet work without it.'}</p>
        <Button onClick={prepare} loading={busy} disabled={!aiReady || chosen.length === 0}>{pack ? 'Prepare again' : 'Prepare my study notes'}</Button>
        {pack && pack.hash !== hash && <p className="text-sm rounded-xl border border-amber-200 bg-amber-50 p-3">Your sources changed since this was prepared. Prepare again to refresh it.</p>}
        {pack && <div className="space-y-5 pt-2 border-t border-line">
          {pack.summary?.length > 0 && <div><h3 className="font-bold">Summary</h3><ul className="list-disc ml-5 mt-1 space-y-1 text-sm">{pack.summary.map((x, i) => <li key={i}>{x.text}<SrcNote labels={x.src} /></li>)}</ul></div>}
          {pack.terms?.length > 0 && <div><h3 className="font-bold">Key terms</h3><dl className="mt-1 text-sm space-y-2">{pack.terms.map((x, i) => <div key={i}><dt className="font-semibold">{x.term}</dt><dd>{x.meaning}<SrcNote labels={x.src} /></dd></div>)}</dl></div>}
          {pack.compare?.map((c, i) => <div key={i}><h3 className="font-bold">{c.title || 'Comparison'}</h3><div className="overflow-x-auto mt-1"><table className="w-full text-sm border-collapse"><thead><tr><th className="border border-line p-2 text-left">Aspect</th><th className="border border-line p-2 text-left">{c.a}</th><th className="border border-line p-2 text-left">{c.b}</th></tr></thead><tbody>{c.rows.map((r, j) => <tr key={j}><td className="border border-line p-2 align-top">{r.aspect}</td><td className="border border-line p-2 align-top">{r.a}</td><td className="border border-line p-2 align-top">{r.b}</td></tr>)}</tbody></table></div><SrcNote labels={c.src} /></div>)}
          {pack.questions?.length > 0 && <div><h3 className="font-bold">Likely questions</h3>{pack.questions.map((x, i) => <details key={i} className="mt-1 text-sm"><summary className={`cursor-pointer ${focusRing}`}>{x.q}</summary><p className="mt-1">{x.a}</p><SrcNote labels={x.src} /></details>)}</div>}
          {pack.pitfalls?.length > 0 && <div><h3 className="font-bold">Easy to mix up</h3><ul className="list-disc ml-5 mt-1 space-y-1 text-sm">{pack.pitfalls.map((x, i) => <li key={i}>{x.text}<SrcNote labels={x.src} /></li>)}</ul></div>}
          {!pack.summary?.length && !pack.terms?.length && !pack.questions?.length && <p className="text-sm text-ink-soft">Your sources were too thin to prepare anything reliable. Add more detail to your notes and try again.</p>}
          <Button variant="secondary" onClick={makeCards}>Make flashcards from this</Button>
        </div>}
      </section>}

      {view === 'compare' && <section className="frost p-5 space-y-4">
        <h2 className="font-bold text-lg">Compare two topics</h2>
        <div className="grid sm:grid-cols-2 gap-3">{[0, 1].map((k) => <label key={k} className="text-sm font-medium">Topic {k ? 'B' : 'A'}<select className={`${field} mt-1`} value={cmp[k]} onChange={(e) => setCmp((c) => c.map((v, i) => (i === k ? Number(e.target.value) : v)))}>{topics.map((t, i) => <option key={t.id} value={i}>{t.title}</option>)}</select></label>)}</div>
        {!(notes[a.id] ?? '').trim() || !(notes[b.id] ?? '').trim() ? <p className="text-sm text-ink-soft">Add typed notes to both topics in the Study space to compare them.</p> : <>
          <div><p className="text-sm font-semibold">In both</p>{chips(both)}</div>
          <div className="grid sm:grid-cols-2 gap-3"><div><p className="text-sm font-semibold">Only in {a.title}</p>{chips(onlyA)}</div><div><p className="text-sm font-semibold">Only in {b.title}</p>{chips(onlyB)}</div></div>
          <div className="grid sm:grid-cols-2 gap-4">{[a, b].map((t) => <div key={t.id}><h3 className="font-bold">{t.title}</h3><ul className="list-disc ml-5 mt-1 text-sm space-y-1">{linesOf(notes[t.id]).map((l, i) => <li key={i}>{l}</li>)}</ul></div>)}</div>
          <p className="text-xs text-ink-soft">This counts words in your notes. It does not judge whether they are correct.</p></>}
      </section>}

      {view === 'cards' && <div className="grid lg:grid-cols-2 gap-5">
        <section className="frost p-5 space-y-3">
          <h2 className="font-bold text-lg">Review</h2>
          {current ? <>
            <p className="text-xs text-ink-soft">{topicTitle(current.topicId)} · box {current.box + 1} of 4 · {due.length} due</p>
            <button onClick={() => setFlip((f) => !f)} aria-label={flip ? 'Show question' : 'Show answer'} className={`w-full min-h-40 border-2 border-black bg-white p-6 text-center text-lg font-semibold ${focusRing}`}>{flip ? current.a : current.q}</button>
            {flip && <><p className="text-xs text-ink-soft">Source: {(current.sourceTitles ?? []).join(', ') || 'not recorded'}</p>
              <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => grade(current, 0)}>Again · 1 day</Button><Button onClick={() => grade(current, 1)}>Good</Button><Button variant="secondary" onClick={() => grade(current, 2)}>Easy</Button></div></>}
          </> : <p className="text-sm text-ink-soft">{mine.length ? 'Nothing due right now. Cards come back after 1, 2, 4 or 8 days.' : 'No flashcards yet. Prepare study notes and tap “Make flashcards”, or add one here.'}</p>}
        </section>
        <form onSubmit={addCard} className="frost p-5 space-y-3">
          <h2 className="font-bold text-lg">Add a flashcard</h2>
          <label className="block text-sm font-medium">Topic<select className={`${field} mt-1`} value={form.topicId} onChange={(e) => setForm((f) => ({ ...f, topicId: e.target.value }))}>{topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
          <label className="block text-sm font-medium">Question or term<input className={`${field} mt-1`} value={form.q} onChange={(e) => setForm((f) => ({ ...f, q: e.target.value }))} /></label>
          <label className="block text-sm font-medium">Answer<textarea rows="3" className={`${field} mt-1`} value={form.a} onChange={(e) => setForm((f) => ({ ...f, a: e.target.value }))} /></label>
          <Button type="submit">Add flashcard</Button>
          <p className="text-xs text-ink-soft">{mine.length} saved for this subject, in this browser only.</p>
        </form>
      </div>}

      {view === 'sheet' && <section className="frost p-5 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
          <div><h2 className="font-bold text-lg">Revision sheet</h2><p className="text-sm text-ink-soft">Shakiest topics first, using your own ratings, notes and linked sources.</p></div>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="text-sm font-medium">Exam date<input type="date" className={`${field} mt-1`} value={plan.exam} onChange={(e) => setPlan((p) => ({ ...p, exam: e.target.value }))} /></label>
            <label className="text-sm font-medium">Hours a day<input type="number" min="1" max="14" step="0.5" className={`${field} mt-1 w-24`} value={plan.hrs} onChange={(e) => setPlan((p) => ({ ...p, hrs: Math.max(1, Number(e.target.value) || 3) }))} /></label>
            <Button variant="secondary" onClick={() => window.print()}>Print or save as PDF</Button>
          </div>
        </div>
        <p className="text-xs text-ink-soft">{daysLeft === null ? 'Add an exam date to see suggested time per topic.' : daysLeft < 0 ? 'That exam date has passed.' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left. Time is split by your own ratings. It is a planning suggestion, not an official or predicted result.`}</p>
        {ordered.map((t) => {
          const lines = linesOf(notes[t.id])
          const items = [...(pack?.terms ?? []), ...(pack?.questions ?? [])].filter((x) => x.topicId === t.id)
          const mins = minutesFor(t)
          return <article key={t.id} className="border-t border-line pt-4">
            <div className="flex flex-wrap items-center gap-3"><h3 className="font-bold flex-1 min-w-48">{t.title}</h3>
              {mins !== null && <span className="text-sm">{mins >= 60 ? `${(mins / 60).toFixed(1)} h` : `${mins} min`}</span>}
              <label className="text-sm print:hidden"><span className="sr-only">Confidence for {t.title}</span><select className={field} value={conf[t.id] ?? 0} onChange={(e) => setConf((c) => ({ ...c, [t.id]: Number(e.target.value) }))}>{LEVELS.map((l, i) => <option key={l} value={i}>{l}</option>)}</select></label>
              <button className={`text-sm underline print:hidden ${focusRing}`} onClick={() => onOpenTopic(t.id)}>Open materials</button></div>
            {lines.length ? <ul className="list-disc ml-5 mt-2 text-sm space-y-1">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul> : <p className="text-sm text-ink-soft mt-2">No notes yet for this topic.</p>}
            {items.length > 0 && <div className="mt-2 text-sm space-y-1">{items.map((x, i) => <p key={i}><b>{x.term ?? x.q}</b>: {x.meaning ?? x.a}<SrcNote labels={x.src} /></p>)}</div>}
            {resources.filter((r) => r.topic === t.id).length > 0 && <p className="text-xs text-ink-soft mt-2">Materials: {resources.filter((r) => r.topic === t.id).map((r) => r.title).join(' · ')}</p>}
          </article>
        })}
      </section>}
    </main>
  )
}
