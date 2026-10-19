import { useEffect, useMemo, useState } from 'react'
import { load, save } from '../lib'
import { Button } from './ui'

const emptyState = { examDate: '', hoursLeft: 4, confidence: {}, cards: [], tasks: [], grades: [] }
const keyFor = (email) => `hub2.toolkit.${encodeURIComponent((email ?? 'guest').trim().toLowerCase())}`
const day = 24 * 60 * 60 * 1000
const gradePoints = [10, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 0]

function makeRevisionSheet(topics, notes, resources, confidence, hoursLeft) {
  const score = { 'not started': 0, shaky: 1, okay: 2, confident: 3 }
  const ranked = [...topics].sort((a, b) => (score[confidence[a.id] ?? 'not started']) - (score[confidence[b.id] ?? 'not started']))
  const slots = Math.max(1, Number(hoursLeft) || 1)
  return ranked.slice(0, Math.min(ranked.length, slots)).map((topic, index) => {
    const text = (notes[topic.id] ?? '').trim()
    const topicResources = resources.filter((resource) => resource.topic === topic.id)
    const excerpt = text ? text.split(/\n+/).filter(Boolean).slice(0, 3).join(' ').slice(0, 380) : ''
    return { ...topic, index, excerpt, topicResources, confidence: confidence[topic.id] ?? 'not started' }
  })
}

export default function StudyToolkit({ email, topics, notes = {}, resources = [], confidence = {}, onConfidenceChange }) {
  const [data, setData] = useState(() => ({ ...emptyState, ...load(keyFor(email), {}) }))
  const [tab, setTab] = useState('exam')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [task, setTask] = useState('')
  const [taskDate, setTaskDate] = useState('')
  const [courseName, setCourseName] = useState('')
  const [credits, setCredits] = useState('3')
  const [grade, setGrade] = useState('9')
  const [flashOpen, setFlashOpen] = useState(null)

  useEffect(() => { save(keyFor(email), data) }, [email, data])
  const examDays = data.examDate ? Math.ceil((new Date(`${data.examDate}T23:59:59`).getTime() - Date.now()) / day) : null
  const topicConfidence = { ...(data.confidence ?? {}), ...(confidence ?? {}) }
  const revision = useMemo(() => makeRevisionSheet(topics, notes, resources, topicConfidence, data.hoursLeft), [topics, notes, resources, topicConfidence, data.hoursLeft])
  const dueCards = (data.cards ?? []).filter((card) => !card.dueAt || new Date(card.dueAt).getTime() <= Date.now())
  const sgpa = (data.grades ?? []).length ? (data.grades.reduce((sum, item) => sum + item.credits * item.grade, 0) / data.grades.reduce((sum, item) => sum + item.credits, 0)).toFixed(2) : null
  const patch = (value) => setData((current) => ({ ...current, ...(typeof value === 'function' ? value(current) : value) }))

  const addCard = (event) => {
    event.preventDefault()
    if (!question.trim() || !answer.trim()) return
    patch((current) => ({ cards: [...current.cards, { id: crypto.randomUUID?.() ?? `${Date.now()}`, question: question.trim(), answer: answer.trim(), topic: topics[0]?.title ?? 'My study', interval: 0, dueAt: new Date().toISOString(), reviews: 0 }] }))
    setQuestion(''); setAnswer('')
  }
  const reviewCard = (card, remembered) => {
    const interval = remembered ? Math.min(30, Math.max(1, (card.interval ?? 0) * 2 || 1)) : 0
    patch((current) => ({ cards: current.cards.map((item) => item.id === card.id ? { ...item, interval, dueAt: new Date(Date.now() + (remembered ? interval : 0.02) * day).toISOString(), reviews: (item.reviews ?? 0) + 1 } : item) }))
    setFlashOpen(null)
  }
  const addGrade = (event) => {
    event.preventDefault()
    if (!courseName.trim() || Number(credits) <= 0) return
    patch((current) => ({ grades: [...current.grades, { id: `${Date.now()}`, name: courseName.trim(), credits: Number(credits), grade: Number(grade) }] }))
    setCourseName('')
  }
  const addTask = (event) => {
    event.preventDefault()
    if (!task.trim()) return
    patch((current) => ({ tasks: [...current.tasks, { id: `${Date.now()}`, title: task.trim(), dueDate: taskDate, done: false }] }))
    setTask(''); setTaskDate('')
  }

  const exportCalendar = () => {
    const events = [...(data.examDate ? [{ date: data.examDate, title: `${topics[0]?.module ?? 'Course'} exam` }] : []), ...(data.tasks ?? []).filter((item) => item.dueDate).map((item) => ({ date: item.dueDate, title: item.title }))]
    if (!events.length) return
    const escape = (text) => String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
    const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Syllabus Hub//Study Planner//EN\r\nCALSCALE:GREGORIAN\r\n${events.map((item) => `BEGIN:VEVENT\r\nUID:${Date.now()}-${Math.random().toString(36).slice(2)}@syllabushub\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}\r\nDTSTART;VALUE=DATE:${item.date.replaceAll('-', '')}\r\nSUMMARY:${escape(item.title)}\r\nEND:VEVENT`).join('\r\n')}\r\nEND:VCALENDAR`
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); const link = document.createElement('a'); link.href = url; link.download = 'syllabus-hub-deadlines.ics'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const printRevisionSheet = () => {
    const escape = (text) => String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
    const popup = window.open('', '_blank', 'width=850,height=900')
    if (!popup) return
    popup.opener = null
    const blocks = revision.map((item) => `<article><h2>${item.index + 1}. ${escape(item.title)} <small>· ${escape(item.confidence)}</small></h2><p>${escape(item.excerpt || 'No typed notes saved for this topic yet.')}</p><p class="sources"><b>Linked materials:</b> ${escape(item.topicResources.map((r) => r.title).join(' · ') || 'None linked')}</p></article>`).join('')
    popup.document.write(`<!doctype html><html><head><title>Revision sheet</title><style>body{font:14px Arial,sans-serif;max-width:780px;margin:30px auto;color:#111}h1{border-bottom:2px solid;padding-bottom:10px}h2{font-size:17px;margin:0 0 8px}h2 small{font-size:12px;color:#555;font-weight:normal}article{padding:14px 0;border-bottom:1px solid #bbb;break-inside:avoid}p{line-height:1.5;white-space:pre-wrap}.sources{font-size:12px;color:#444}@page{size:A4;margin:18mm}@media print{body{margin:0}}</style></head><body><h1>${escape(topics[0]?.module ?? 'Course')} · Revision sheet</h1><p>Compiled from your saved notes, confidence ratings, and linked resource titles. Verify details in the original material.</p>${blocks}</body></html>`)
    popup.document.close(); popup.focus(); popup.print()
  }

  const tabs = [['exam', 'Exam prep'], ['cards', `Flashcards · ${dueCards.length}`], ['tasks', 'Deadlines'], ['sgpa', 'SGPA']]
  return <section className="study-toolkit frost p-5 sm:p-7 space-y-5" aria-labelledby="toolkit-heading">
    <div className="flex flex-wrap justify-between items-start gap-3">
      <div><p className="text-xs uppercase tracking-wider text-ink-soft font-bold">Your study toolkit</p><h2 id="toolkit-heading" className="text-2xl font-bold mt-1">Make the next study session count</h2><p className="text-sm text-ink-soft mt-1">Exam planning, recall practice, deadlines and semester-grade estimates in one place.</p></div>
      <span className="text-xs border border-black/20 bg-white px-3 py-1">Saved on this device</span>
    </div>
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Study toolkit">
      {tabs.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`toolkit-tab px-4 py-2 border-2 border-black text-sm font-semibold whitespace-nowrap ${tab === id ? 'bg-black text-white' : 'bg-white hover:bg-[#f1f8dd]'}`}>{label}</button>)}
    </div>

    {tab === 'exam' && <div className="grid lg:grid-cols-[.78fr_1.22fr] gap-5">
      <div className="toolkit-panel p-5 bg-[#f7f5ec] border border-black/15 space-y-4">
        <div><p className="text-xs uppercase tracking-wider text-ink-soft font-bold">Exam countdown</p><div className="flex items-end gap-2 mt-1"><strong className="text-4xl leading-none">{examDays == null ? '—' : Math.max(0, examDays)}</strong><span className="text-sm text-ink-soft mb-1">{examDays == null ? 'set a date' : examDays === 1 ? 'day to exam' : 'days to exam'}</span></div></div>
        <label className="block text-sm font-medium">Exam date<input type="date" value={data.examDate ?? ''} onChange={(e) => patch({ examDate: e.target.value })} className="block w-full mt-1 border-2 border-black bg-white px-3 py-2" /></label>
        <label className="block text-sm font-medium">Hours available to revise<input type="number" min="1" max="24" value={data.hoursLeft ?? 4} onChange={(e) => patch({ hoursLeft: Math.max(1, Math.min(24, Number(e.target.value))) })} className="block w-full mt-1 border-2 border-black bg-white px-3 py-2" /></label>
        <Button onClick={() => setSheetOpen(true)}>Build revision sheet <span aria-hidden>→</span></Button>
        <p className="text-xs text-ink-soft">A planning suggestion from your own confidence ratings and notes, not an exam prediction.</p>
      </div>
      <div className="space-y-2"><div className="flex justify-between items-end"><div><p className="text-xs uppercase tracking-wider text-ink-soft font-bold">Topic confidence</p><p className="text-sm text-ink-soft mt-1">Rate your understanding honestly; weakest topics rise to the top.</p></div><span className="text-xs text-ink-soft">Self-rated</span></div>
        <div className="max-h-64 overflow-auto divide-y divide-black/10 border-y border-black/10">{topics.map((topic) => <div key={topic.id} className="flex items-center justify-between gap-3 py-2.5"><span className="text-sm truncate">{topic.title}</span><select aria-label={`Confidence for ${topic.title}`} value={topicConfidence[topic.id] ?? 'not started'} onChange={(e) => { const next = { ...topicConfidence, [topic.id]: e.target.value }; patch({ confidence: next }); onConfidenceChange?.(next) }} className="border border-black/30 bg-white px-2 py-1 text-xs shrink-0"><option value="not started">Not started</option><option value="shaky">Shaky</option><option value="okay">Okay</option><option value="confident">Confident</option></select></div>)}</div>
      </div>
      {sheetOpen && <div className="lg:col-span-2 border-2 border-black p-5 bg-white"><div className="flex justify-between items-start gap-3"><div><p className="text-xs uppercase tracking-wider text-ink-soft font-bold">Night-before revision sheet</p><h3 className="text-xl font-bold">Your focused review</h3></div><div className="flex gap-3"><button className="underline text-sm" onClick={printRevisionSheet}>Print / Export PDF</button><button className="underline text-sm" onClick={() => setSheetOpen(false)}>Close</button></div></div><div className="grid md:grid-cols-2 gap-3 mt-4">{revision.map((item) => <article key={item.id} className="p-4 bg-[#f7f5ec] border border-black/15"><div className="flex justify-between gap-2"><h4 className="font-bold">{item.index + 1}. {item.title}</h4><span className="text-xs text-ink-soft">{item.confidence}</span></div>{item.excerpt ? <p className="text-sm mt-2">{item.excerpt}</p> : <p className="text-sm text-ink-soft mt-2">No personal notes yet. Review the linked source material for this topic.</p>}<p className="text-xs text-ink-soft mt-3">Sources: {item.topicResources.length ? item.topicResources.map((r) => r.title).join(' · ') : 'No resources linked yet'}</p></article>)}</div><p className="text-xs text-ink-soft mt-3">Generated only from local topic labels, saved notes and linked resource titles. It does not invent or summarize unseen source content.</p></div>}
    </div>}

    {tab === 'cards' && <div className="grid lg:grid-cols-[.85fr_1.15fr] gap-5">
      <form className="toolkit-panel bg-[#f7f5ec] border border-black/15 p-5 space-y-3" onSubmit={addCard}><div><p className="text-xs uppercase tracking-wider text-ink-soft font-bold">Build active recall</p><h3 className="text-lg font-bold mt-1">Add a flashcard</h3></div><label className="block text-sm">Question<textarea value={question} onChange={(e) => setQuestion(e.target.value)} required maxLength={300} rows="2" className="block w-full mt-1 border-2 border-black bg-white p-2" placeholder="What do you want to remember?" /></label><label className="block text-sm">Answer<textarea value={answer} onChange={(e) => setAnswer(e.target.value)} required maxLength={700} rows="3" className="block w-full mt-1 border-2 border-black bg-white p-2" placeholder="Write the answer in your own words…" /></label><Button type="submit">Add card</Button><p className="text-xs text-ink-soft">Cards you create stay tied to this local study profile. Link them to source notes when reviewing.</p></form>
      <div><div className="flex justify-between"><h3 className="font-bold">Due to review</h3><span className="text-xs text-ink-soft">{dueCards.length} due · {data.cards?.length ?? 0} total</span></div>{dueCards.length ? <div className="space-y-3 mt-3">{dueCards.slice(0, 3).map((card) => <article key={card.id} className="border-2 border-black bg-white p-4"><p className="text-xs text-ink-soft">{card.topic}</p><p className="font-bold mt-1">{card.question}</p>{flashOpen === card.id ? <><p className="text-sm mt-3 border-l-2 border-[#f37505] pl-3">{card.answer}</p><div className="flex gap-2 mt-3"><Button variant="secondary" onClick={() => reviewCard(card, false)}>Again soon</Button><Button onClick={() => reviewCard(card, true)}>Remembered</Button></div></> : <button onClick={() => setFlashOpen(card.id)} className="text-sm underline mt-3">Reveal answer</button>}</article>)}</div> : <div className="border border-dashed border-black/25 p-6 text-sm text-ink-soft mt-3">You’re clear for now. Add a question and answer to start a review deck.</div>}</div>
    </div>}

    {tab === 'tasks' && <div className="grid md:grid-cols-[.8fr_1.2fr] gap-5"><form onSubmit={addTask} className="grid sm:grid-cols-[1fr_auto] gap-2 items-end"><label className="text-sm sm:col-span-2">Assignment or test<input value={task} onChange={(e) => setTask(e.target.value)} maxLength={120} className="block w-full mt-1 border-2 border-black bg-white px-3 py-2" placeholder="e.g. DBMS internal test" /></label><label className="text-sm">Due date<input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className="block w-full mt-1 border-2 border-black bg-white px-3 py-2" /></label><Button type="submit">Add deadline</Button></form><div className="space-y-2">{(data.tasks ?? []).length ? data.tasks.map((item) => <div key={item.id} className="flex gap-3 items-center border-b border-black/10 py-2"><input type="checkbox" checked={item.done} onChange={() => patch((current) => ({ tasks: current.tasks.map((taskItem) => taskItem.id === item.id ? { ...taskItem, done: !taskItem.done } : taskItem) }))} aria-label={`Mark ${item.title} complete`} /><span className={`flex-1 text-sm ${item.done ? 'line-through text-ink-soft' : ''}`}>{item.title}{item.dueDate && <span className="block text-xs text-ink-soft">Due {item.dueDate}</span>}</span><button className="text-xs underline" onClick={() => patch((current) => ({ tasks: current.tasks.filter((taskItem) => taskItem.id !== item.id) }))}>Remove</button></div>) : <p className="text-sm text-ink-soft">No deadlines yet. Add an assignment or internal test to keep it beside your study plan.</p>}<Button variant="secondary" onClick={exportCalendar} disabled={!data.examDate && !(data.tasks ?? []).some((item) => item.dueDate)}>Download exam and deadline dates (.ics)</Button></div></div>}

    {tab === 'sgpa' && <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-5"><form onSubmit={addGrade} className="toolkit-panel bg-[#f7f5ec] border border-black/15 p-5 space-y-3"><p className="text-xs uppercase tracking-wider text-ink-soft font-bold">Semester grade estimate</p><h3 className="text-lg font-bold">Add course results</h3><label className="block text-sm">Subject<input value={courseName} onChange={(e) => setCourseName(e.target.value)} className="block w-full mt-1 border-2 border-black bg-white px-3 py-2" placeholder="Course name" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm">Credits<input type="number" min="0.5" step="0.5" value={credits} onChange={(e) => setCredits(e.target.value)} className="block w-full mt-1 border-2 border-black bg-white px-3 py-2" /></label><label className="block text-sm">Grade points<select value={grade} onChange={(e) => setGrade(e.target.value)} className="block w-full mt-1 border-2 border-black bg-white px-3 py-2">{gradePoints.map((point) => <option key={point} value={point}>{point}</option>)}</select></label></div><Button type="submit">Add result</Button></form><div><div className="flex items-baseline gap-3"><span className="text-xs uppercase tracking-wider text-ink-soft font-bold">Estimated SGPA</span><strong className="text-4xl">{sgpa ?? '—'}</strong></div><div className="mt-3 divide-y divide-black/10">{(data.grades ?? []).map((item) => <div key={item.id} className="flex justify-between gap-3 py-2 text-sm"><span>{item.name} <span className="text-ink-soft">· {item.credits} credits</span></span><span className="flex gap-3 items-center">{item.grade}<button className="underline text-xs" onClick={() => patch((current) => ({ grades: current.grades.filter((g) => g.id !== item.id) }))}>Remove</button></span></div>)}</div><p className="text-xs text-ink-soft mt-4">Estimate = Σ(credits × grade points) ÷ Σ(credits). Check the current KTU regulation and verify your official result; this is not an official record.</p></div></div>}
  </section>
}
