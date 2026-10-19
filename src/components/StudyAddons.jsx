import { useEffect, useMemo, useState } from 'react'
import { load, save } from '../lib'

const inputClass = 'w-full border-2 border-black bg-white px-3 py-2 text-sm'
const keyFor = (email) => `hub2.addons.${encodeURIComponent((email ?? 'guest').trim().toLowerCase())}`
const defaultProcesses = 'P1,0,5\nP2,1,3\nP3,2,1'
const defaultReferences = '7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2'

function parseProcesses(raw) {
  const rows = raw.split(/\n+/).map((line) => line.split(',').map((v) => v.trim())).filter((row) => row.length >= 3)
  if (!rows.length) throw new Error('Enter processes as ID, arrival time, burst time, one per line.')
  if (rows.length > 30) throw new Error('Use 30 processes or fewer in one simulation.')
  return rows.map(([id, arrival, burst, priority = '0'], i) => {
    const p = { id: id || `P${i + 1}`, arrival: Number(arrival), burst: Number(burst), priority: Number(priority), remaining: Number(burst) }
    if (![p.arrival, p.burst, p.priority].every(Number.isFinite) || p.arrival < 0 || p.burst <= 0) throw new Error('Arrival must be 0 or more and burst must be greater than 0.')
    return p
  })
}

function schedule(rows, algorithm, quantum) {
  const jobs = rows.map((p) => ({ ...p, remaining: p.burst, finish: 0 }))
  const gantt = []
  let time = 0
  if (algorithm === 'RR') {
    const pending = [...jobs].sort((a, b) => a.arrival - b.arrival)
    const queue = []
    while (pending.length || queue.length) {
      while (pending.length && pending[0].arrival <= time) queue.push(pending.shift())
      if (!queue.length) { time = pending[0].arrival; continue }
      const p = queue.shift(); const start = time; const run = Math.min(quantum, p.remaining)
      time += run; p.remaining -= run; gantt.push({ id: p.id, start, end: time })
      while (pending.length && pending[0].arrival <= time) queue.push(pending.shift())
      if (p.remaining) queue.push(p); else p.finish = time
    }
  } else {
    const todo = [...jobs];
    while (todo.length) {
      const ready = todo.filter((p) => p.arrival <= time)
      if (!ready.length) { time = Math.min(...todo.map((p) => p.arrival)); continue }
      ready.sort((a, b) => algorithm === 'SJF' ? a.burst - b.burst || a.arrival - b.arrival : algorithm === 'Priority' ? a.priority - b.priority || a.arrival - b.arrival : a.arrival - b.arrival)
      const p = ready[0]; const start = time; time += p.burst; p.finish = time; gantt.push({ id: p.id, start, end: time }); todo.splice(todo.indexOf(p), 1)
    }
  }
  return { gantt, rows: jobs.map((p) => ({ ...p, turnaround: p.finish - p.arrival, waiting: p.finish - p.arrival - p.burst })) }
}

function replacePages(raw, framesCount, algorithm) {
  const pages = raw.split(/[\s,]+/).filter(Boolean).map(Number)
  if (!pages.length || pages.some((v) => !Number.isInteger(v) || v < 0)) throw new Error('Enter a comma-separated list of non-negative page numbers.')
  if (!Number.isInteger(framesCount) || framesCount < 1 || framesCount > 8) throw new Error('Choose between 1 and 8 frames.')
  const frames = []; const lastUsed = new Map(); let faults = 0
  const steps = pages.map((page, index) => {
    let hit = frames.includes(page); let evicted = null
    if (!hit) {
      faults += 1
      if (frames.length < framesCount) frames.push(page)
      else {
        let victimIndex = 0
        if (algorithm === 'LRU') {
          const oldest = Math.min(...frames.map((v) => lastUsed.get(v) ?? -1)); victimIndex = frames.findIndex((v) => (lastUsed.get(v) ?? -1) === oldest)
        }
        evicted = frames[victimIndex]; frames[victimIndex] = page
      }
    }
    lastUsed.set(page, index)
    return { page, frames: [...frames], hit, evicted }
  })
  return { steps, faults }
}

function download(name, content, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function makeIcs(events) {
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
  const stamp = (date) => date.replaceAll('-', '')
  const body = events.filter((e) => e.date).map((e) => `BEGIN:VEVENT\r\nUID:${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}@syllabushub\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}\r\nDTSTART;VALUE=DATE:${stamp(e.date)}\r\nSUMMARY:${esc(e.title)}\r\nDESCRIPTION:${esc(e.description ?? 'Personal study planner item; verify official dates.')}\r\nEND:VEVENT`).join('\r\n')
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Syllabus Hub//Study Planner//EN\r\nCALSCALE:GREGORIAN\r\n${body}\r\nEND:VCALENDAR`
}

export default function StudyAddons({ email, userName, subject, topics, resources, notes, practiceCards = [], onImportPack }) {
  const [data, setData] = useState(() => ({ backlog: [], drafts: {}, ...(load(keyFor(email), {}) ?? {}) }))
  const [tab, setTab] = useState('simulators')
  const [simType, setSimType] = useState('cpu')
  const [algorithm, setAlgorithm] = useState('FCFS')
  const [processInput, setProcessInput] = useState(defaultProcesses)
  const [quantum, setQuantum] = useState(2)
  const [references, setReferences] = useState(defaultReferences)
  const [frameCount, setFrameCount] = useState(3)
  const [simulation, setSimulation] = useState(null)
  const [simError, setSimError] = useState('')
  const [packTopic, setPackTopic] = useState(topics[0]?.id ?? '')
  const [packImport, setPackImport] = useState(null)
  const [packMessage, setPackMessage] = useState('')
  const [question, setQuestion] = useState('')
  const [answerType, setAnswerType] = useState('14')
  const [backlogSubject, setBacklogSubject] = useState('')
  const [backlogDate, setBacklogDate] = useState('')
  const [backlogNote, setBacklogNote] = useState('')
  const [doubtTopic, setDoubtTopic] = useState(topics[0]?.id ?? '')
  const [doubtText, setDoubtText] = useState('')
  const [doubtAnswer, setDoubtAnswer] = useState('')
  const [reviewTest, setReviewTest] = useState('')
  const [reviewQuestion, setReviewQuestion] = useState('')
  const [reviewErrorType, setReviewErrorType] = useState('concept gap')
  const [reviewNote, setReviewNote] = useState('')
  const [storageItems, setStorageItems] = useState([])
  const [storageMessage, setStorageMessage] = useState('')
  const [formulaMessage, setFormulaMessage] = useState('')

  const patch = (fn) => setData((current) => typeof fn === 'function' ? fn(current) : { ...current, ...fn })
  useEffect(() => { save(keyFor(email), data) }, [email, data])
  const topic = topics.find((t) => t.id === packTopic) ?? topics[0]
  const draftKey = `${topic?.id}:${answerType}:${question.trim().slice(0, 100)}`
  const topicCards = practiceCards.filter((card) => card.topicId === topic?.id)
  const localCards = (load(`hub2.toolkit.${encodeURIComponent((email ?? '').trim().toLowerCase())}`, {})?.cards ?? []).filter((card) => card.topic === topic?.title)
  const topicResources = resources.filter((item) => item.topic === topic?.id && (!item.rights?.reviewStatus || item.rights.reviewStatus === 'approved'))
  const savedDraft = data.drafts?.[`${topic?.id}:${answerType}`] ?? ''
  const toolkitData = load(`hub2.toolkit.${encodeURIComponent((email ?? '').trim().toLowerCase())}`, {}) ?? {}
  const allEvents = useMemo(() => [...(data.backlog ?? []).map((item) => ({ date: item.date, title: `${item.subject} · ${item.title}`, description: item.note })), ...(toolkitData.tasks ?? []).map((item) => ({ date: item.dueDate, title: item.title, description: 'Study task deadline' })), ...(toolkitData.examDate ? [{ date: toolkitData.examDate, title: `${subject?.title ?? 'Course'} exam` }] : [])], [data.backlog, toolkitData.tasks, toolkitData.examDate, subject])

  const runSimulation = () => {
    try { setSimError(''); setSimulation(simType === 'cpu' ? schedule(parseProcesses(processInput), algorithm, Math.max(1, Number(quantum) || 1)) : replacePages(references, Number(frameCount), algorithm === 'LRU' ? 'LRU' : 'FIFO')) }
    catch (error) { setSimulation(null); setSimError(error.message) }
  }
  const exportPack = () => {
    if (!topic) return
    const payload = { format: 'syllabus-hub-study-pack', version: 1, exportedAt: new Date().toISOString(), author: userName || 'Syllabus Hub learner', subject: subject?.title ?? '', topic: { id: topic.id, title: topic.title, module: topic.module }, verification: 'unverified-importable-student-content', notes: notes[topic.id] ?? '', resources: topicResources.map(({ id, title, kind, type, source, content, url, extractedPages }) => ({ id: String(id), title, kind, type, source, content: String(content ?? '').slice(0, 100000), url, extractedPages })), flashcards: [...topicCards, ...localCards].map(({ question, answer, topic: topicName }) => ({ question, answer, topic: topicName ?? topic.title })) }
    download(`${topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-study-pack.json`, JSON.stringify(payload, null, 2))
    setPackMessage('Study pack downloaded. Share the file yourself; it has not been verified.')
  }
  const readPack = async (file) => {
    setPackMessage(''); setPackImport(null)
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Study packs must be 5 MB or smaller.')
      const parsed = JSON.parse(await file.text())
      if (parsed.format !== 'syllabus-hub-study-pack' || parsed.version !== 1 || !parsed.topic?.title || !Array.isArray(parsed.resources) || !Array.isArray(parsed.flashcards)) throw new Error('This is not a supported Syllabus Hub study pack.')
      setPackImport(parsed)
    } catch (error) { setPackMessage(error.message) }
  }
  const importPack = () => {
    if (!packImport) return
      const target = topics.find((t) => t.id === packTopic)
    if (!target) { setPackMessage('Choose a topic in your syllabus to import into.'); return }
    const safeResources = packImport.resources.slice(0, 100).map((r, i) => ({ id: `import-${Date.now()}-${i}`, topic: target.id, type: ['notes', 'videos', 'code', 'textbook', 'pyqs'].includes(r.type) ? r.type : 'notes', title: String(r.title ?? 'Imported item').slice(0, 200), kind: 'Imported · unverified', scope: 'private', importedUnverified: true, content: String(r.content ?? '').slice(0, 100000), url: /^https?:\/\//i.test(r.url ?? '') ? r.url : '', extractedPages: Array.isArray(r.extractedPages) ? r.extractedPages.slice(0, 300) : [], source: `Pack by ${String(packImport.author ?? 'unknown student').slice(0, 120)}` }))
    onImportPack?.({ topicId: target.id, notes: String(packImport.notes ?? '').slice(0, 100000), resources: safeResources, flashcards: packImport.flashcards.slice(0, 100).map((card) => ({ question: String(card.question ?? '').slice(0, 500), answer: String(card.answer ?? '').slice(0, 2000) })).filter((c) => c.question && c.answer), sourceTopic: packImport.topic.title })
    setPackMessage(`Imported into ${target.title}. This student-created content is unverified; check sources before relying on it.`); setPackImport(null)
  }
  const addBacklog = (event) => {
    event.preventDefault(); if (!backlogSubject.trim()) return
    patch((current) => ({ ...current, backlog: [...current.backlog, { id: `${Date.now()}`, subject: backlogSubject.trim(), title: 'Supplementary exam', date: backlogDate, note: backlogNote.trim(), done: false }] }))
    setBacklogSubject(''); setBacklogDate(''); setBacklogNote('')
  }
  const addDoubt = (event) => {
    event.preventDefault(); if (!doubtText.trim()) return
    patch((current) => ({ ...current, doubts: [{ id: `${Date.now()}`, topicId: doubtTopic, question: doubtText.trim(), answer: '', status: 'unresolved', createdAt: new Date().toISOString() }, ...(current.doubts ?? [])] }))
    setDoubtText('')
  }
  const addMistake = (event) => {
    event.preventDefault(); if (!reviewQuestion.trim()) return
    patch((current) => ({ ...current, testErrors: [{ id: `${Date.now()}`, test: reviewTest.trim() || 'Test review', question: reviewQuestion.trim(), type: reviewErrorType, note: reviewNote.trim(), createdAt: new Date().toISOString() }, ...(current.testErrors ?? [])] }))
    setReviewQuestion(''); setReviewNote('')
  }
  const refreshStorage = () => {
    const emailKey = encodeURIComponent((email ?? '').trim().toLowerCase())
    const keys = [
      { key: `hub2.profile.${emailKey}`, label: 'Profile, notes, resources, ratings and cards' },
      { key: `hub2.toolkit.${emailKey}`, label: 'Exam plan, flashcards, deadlines and grades' },
      { key: `hub2.addons.${emailKey}`, label: 'Doubts, revisions, answer drafts and planning tools' },
      ...Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter((key) => key?.startsWith(`hub2.board.${emailKey}.`)).map((key) => ({ key, label: `Study board · ${key.split('.').at(-1)}` })),
    ].filter(({ key }) => localStorage.getItem(key) !== null)
    setStorageItems(keys.map((item) => ({ ...item, bytes: new Blob([localStorage.getItem(item.key)]).size })))
    setStorageMessage('')
  }
  const deleteStorageItem = (item) => {
    if (!window.confirm(`Delete ${item.label} stored in this browser? This cannot be undone.`)) return
    localStorage.removeItem(item.key)
    setStorageItems((current) => current.filter((entry) => entry.key !== item.key))
    setStorageMessage(`${item.label} deleted from this browser. Reload the app if the current screen still shows old data.`)
  }
  const printFormulaSheet = (lines) => {
    const safe = (text) => String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
    const popup = window.open('', '_blank', 'width=850,height=900')
    if (!popup) { setFormulaMessage('The print window was blocked. Allow pop-ups for this local app, then try again.'); return }
    popup.opener = null
    popup.document.write(`<!doctype html><html><head><title>${safe(topic?.title ?? 'Formula sheet')}</title><style>body{font:14px Arial,sans-serif;max-width:760px;margin:32px auto;color:#111}h1{font-size:24px;border-bottom:2px solid;padding-bottom:8px}li{margin:0 0 12px;line-height:1.5;white-space:pre-wrap}@page{size:A4;margin:18mm} @media print{body{margin:0}}</style></head><body><h1>${safe(topic?.title ?? 'Formula sheet')}</h1><ul>${lines.map((line) => `<li>${safe(line)}</li>`).join('')}</ul></body></html>`)
    popup.document.close(); popup.focus(); popup.print(); setFormulaMessage('Print dialog opened. Choose “Save as PDF” if you want a PDF file.')
  }
  useEffect(() => { if (tab === 'storage') refreshStorage() }, [tab, email])

  const tabs = [['simulators', 'OS simulators'], ['packs', 'Study packs'], ['templates', 'Answer drafts'], ['backlog', 'Backlog tracker'], ['calendar', 'Calendar export'], ['doubts', 'Doubt log'], ['revisions', 'Revision rounds'], ['formulas', 'Formula sheet'], ['mistakes', 'Test error review'], ['storage', 'Stored data']]
  return <section className="frost p-5 sm:p-7 space-y-5" aria-labelledby="addons-title">
    <header><p className="text-xs uppercase tracking-wider text-ink-soft font-bold">Practice and portability</p><h2 id="addons-title" className="text-2xl font-bold mt-1">Study tools that work offline</h2><p className="text-sm text-ink-soft mt-1">Runs in this browser. Simulations teach the method and are not official answer keys.</p></header>
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Additional study tools">{tabs.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`px-3 py-2 border-2 border-black text-sm whitespace-nowrap ${tab === id ? 'bg-black text-white' : 'bg-white'}`}>{label}</button>)}</div>

    {tab === 'simulators' && <div className="space-y-4"><div className="flex flex-wrap gap-2"><button className={`border-2 border-black px-3 py-2 text-sm ${simType === 'cpu' ? 'bg-[#d9f1b7]' : 'bg-white'}`} onClick={() => { setSimType('cpu'); setAlgorithm('FCFS'); setSimulation(null) }}>CPU scheduling</button><button className={`border-2 border-black px-3 py-2 text-sm ${simType === 'pages' ? 'bg-[#d9f1b7]' : 'bg-white'}`} onClick={() => { setSimType('pages'); setAlgorithm('FIFO'); setSimulation(null) }}>Page replacement</button></div>
      {simType === 'cpu' ? <div className="grid lg:grid-cols-2 gap-4"><div className="space-y-3"><label className="block text-sm">Algorithm<select className={`${inputClass} mt-1`} value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}><option value="FCFS">First come, first served</option><option value="SJF">Shortest job first · non-preemptive</option><option value="RR">Round robin</option><option value="Priority">Priority · lower number first, non-preemptive</option></select></label><label className="block text-sm">Processes · ID, arrival, burst, priority (priority optional)<textarea className={`${inputClass} mt-1 font-mono`} rows="5" value={processInput} onChange={(e) => setProcessInput(e.target.value)} /></label>{algorithm === 'RR' && <label className="block text-sm">Time quantum<input className={`${inputClass} mt-1`} type="number" min="1" value={quantum} onChange={(e) => setQuantum(e.target.value)} /></label>}<button onClick={runSimulation} className="border-2 border-black bg-black text-white px-4 py-2 text-sm font-semibold">Run simulation</button>{simError && <p role="alert" className="text-sm text-red-700">{simError}</p>}</div>
        <div className="border-2 border-black bg-white p-4 min-h-48"><h3 className="font-bold">Gantt chart and results</h3>{simulation?.gantt ? <><div className="flex flex-wrap gap-1 mt-4">{simulation.gantt.map((slot, i) => <div key={i} className="min-w-12 border border-black bg-[#e7f3d9] text-center px-2 py-2 text-xs"><b>{slot.id}</b><div>{slot.start}–{slot.end}</div></div>)}</div><div className="mt-4 overflow-auto"><table className="w-full text-xs"><thead><tr><th className="text-left p-1">Process</th><th>Arrival</th><th>Burst</th><th>Wait</th><th>Turnaround</th></tr></thead><tbody>{simulation.rows.map((p) => <tr key={p.id} className="border-t"><td className="p-1">{p.id}</td><td className="text-center">{p.arrival}</td><td className="text-center">{p.burst}</td><td className="text-center">{p.waiting}</td><td className="text-center">{p.turnaround}</td></tr>)}</tbody></table></div></> : <p className="text-sm text-ink-soft mt-3">Enter sample or custom processes, then run the simulator.</p>}</div></div> : <div className="grid lg:grid-cols-2 gap-4"><div className="space-y-3"><label className="block text-sm">Replacement method<select className={`${inputClass} mt-1`} value={algorithm === 'LRU' ? 'LRU' : 'FIFO'} onChange={(e) => setAlgorithm(e.target.value)}><option>FIFO</option><option>LRU</option></select></label><label className="block text-sm">Page reference string<input className={`${inputClass} mt-1 font-mono`} value={references} onChange={(e) => setReferences(e.target.value)} /></label><label className="block text-sm">Frames<input className={`${inputClass} mt-1`} type="number" min="1" max="8" value={frameCount} onChange={(e) => setFrameCount(e.target.value)} /></label><button onClick={runSimulation} className="border-2 border-black bg-black text-white px-4 py-2 text-sm font-semibold">Run stepper</button>{simError && <p role="alert" className="text-sm text-red-700">{simError}</p>}</div><div className="border-2 border-black bg-white p-4"><h3 className="font-bold">Reference-by-reference trace</h3>{simulation?.steps ? <><p className="text-sm mt-1">Page faults: <b>{simulation.faults}</b> / {simulation.steps.length}</p><div className="mt-3 max-h-64 overflow-auto">{simulation.steps.map((step, i) => <div key={i} className="grid grid-cols-[3rem_1fr_4rem] gap-2 border-t py-2 text-xs"><b>{step.page}</b><span>[{step.frames.join(' · ')}]</span><span>{step.hit ? 'Hit' : 'Fault'}</span></div>)}</div></> : <p className="text-sm text-ink-soft mt-3">The step-by-step frame changes will appear here.</p>}</div></div>}
      <p className="text-xs text-ink-soft">Educational simulator only. Confirm conventions (such as tie-breaking and preemption) against your lecturer’s notes.</p></div>}

    {tab === 'packs' && <div className="grid lg:grid-cols-2 gap-6"><div className="space-y-3"><h3 className="font-bold">Export a topic study pack</h3><p className="text-sm text-ink-soft">Includes your typed notes, topic resources, and flashcards in one portable JSON file.</p><label className="block text-sm">Topic<select className={`${inputClass} mt-1`} value={packTopic} onChange={(e) => setPackTopic(e.target.value)}>{topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label><button onClick={exportPack} className="border-2 border-black bg-black text-white px-4 py-2 text-sm font-semibold">Download study pack</button></div><div className="space-y-3 border-l-0 lg:border-l lg:pl-6 border-black/15"><h3 className="font-bold">Preview and import a pack</h3><label className="block border-2 border-dashed border-black/30 p-4 text-sm">Choose a Syllabus Hub pack<input type="file" accept=".json,application/json" className="block mt-2" onChange={(e) => e.target.files?.[0] && readPack(e.target.files[0])} /></label>{packImport && <div className="border-2 border-amber-500 bg-amber-50 p-3 text-sm"><b>{packImport.topic.title}</b><p>By {packImport.author || 'unknown'} · {packImport.resources.length} resources · {packImport.flashcards.length} cards</p><p className="text-xs mt-1">Unverified student content. Import as private notes into:</p><select className={`${inputClass} mt-2`} value={packTopic} onChange={(e) => setPackTopic(e.target.value)}>{topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select><button onClick={importPack} className="mt-2 border-2 border-black bg-black text-white px-3 py-2 text-sm">Import privately</button></div>}{packMessage && <p role="status" className="text-sm text-ink-soft">{packMessage}</p>}</div></div>}

    {tab === 'templates' && <div className="grid lg:grid-cols-2 gap-5"><div className="space-y-3"><h3 className="font-bold">Draft an exam answer</h3><label className="block text-sm">Past question<textarea className={`${inputClass} mt-1`} rows="2" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Paste or type the question" /></label><label className="block text-sm">Answer length<select className={`${inputClass} mt-1`} value={answerType} onChange={(e) => setAnswerType(e.target.value)}><option value="3">3-mark outline</option><option value="14">14-mark outline</option></select></label><p className="border-l-4 border-[#f37505] bg-white p-3 text-sm">{answerType === '3' ? 'Define the key term → state 2–3 core points → add a small example or diagram if useful.' : 'Introduction and definition → labeled diagram / assumptions → explain each step or subheading → worked example → advantages, limits, or comparison → concise conclusion.'}</p><p className="text-xs text-ink-soft">A structure to help you write your own answer. It does not generate or verify an answer key.</p></div><div><label className="block text-sm font-semibold">Your draft<textarea className={`${inputClass} mt-1 h-64`} value={data.drafts?.[draftKey] ?? ''} onChange={(e) => patch((current) => ({ ...current, drafts: { ...current.drafts, [draftKey]: e.target.value } }))} placeholder="Write your answer here…" /></label><p className="mt-2 text-xs text-ink-soft">Autosaved on this device · {topic?.title}</p></div></div>}

    {tab === 'backlog' && <div className="grid lg:grid-cols-2 gap-5"><form onSubmit={addBacklog} className="space-y-3"><h3 className="font-bold">Plan a supplementary subject</h3><label className="block text-sm">Subject to clear<input className={`${inputClass} mt-1`} required value={backlogSubject} onChange={(e) => setBacklogSubject(e.target.value)} placeholder="e.g. Engineering Mathematics" /></label><label className="block text-sm">Supplementary exam date<input className={`${inputClass} mt-1`} type="date" value={backlogDate} onChange={(e) => setBacklogDate(e.target.value)} /></label><label className="block text-sm">Plan or note<input className={`${inputClass} mt-1`} value={backlogNote} onChange={(e) => setBacklogNote(e.target.value)} placeholder="Topics to revisit, registration reminder…" /></label><button className="border-2 border-black bg-black text-white px-4 py-2 text-sm">Add to backlog plan</button></form><div><h3 className="font-bold">Subjects to clear · {data.backlog?.length ?? 0}</h3>{data.backlog?.length ? data.backlog.map((item) => <article key={item.id} className="border-b border-black/15 py-3 flex gap-3 items-start"><input type="checkbox" checked={item.done} onChange={() => patch((current) => ({ ...current, backlog: current.backlog.map((b) => b.id === item.id ? { ...b, done: !b.done } : b) }))} aria-label={`Mark ${item.subject} done`} /><div className="flex-1"><p className={`font-semibold ${item.done ? 'line-through' : ''}`}>{item.subject}</p><p className="text-xs text-ink-soft">{item.title}{item.date ? ` · ${item.date}` : ''}</p>{item.note && <p className="text-sm mt-1">{item.note}</p>}</div><button className="text-xs underline" onClick={() => patch((current) => ({ ...current, backlog: current.backlog.filter((b) => b.id !== item.id) }))}>Remove</button></article>) : <p className="text-sm text-ink-soft mt-3">Add any supplementary subjects and dates you want to plan around.</p>}</div></div>}

    {tab === 'calendar' && <div className="max-w-2xl space-y-4"><h3 className="font-bold">Export dates to your calendar</h3><p className="text-sm text-ink-soft">Create an .ics file for supplementary exams and your main exam date. Add calendar dates here; verify official exam schedules before relying on reminders.</p><label className="block text-sm">Main subject exam date<input className={`${inputClass} mt-1`} type="date" value={data.examDate ?? ''} onChange={(e) => patch({ examDate: e.target.value })} /></label><p className="text-sm">{allEvents.filter((e) => e.date).length} dated event(s) ready to export</p><button disabled={!allEvents.some((e) => e.date)} onClick={() => download('syllabus-hub-study-dates.ics', makeIcs(allEvents), 'text/calendar')} className="border-2 border-black bg-black text-white disabled:opacity-40 px-4 py-2 text-sm font-semibold">Download .ics calendar</button><p className="text-xs text-ink-soft">Calendar file is generated locally and is not synced to your calendar automatically.</p></div>}

    {tab === 'doubts' && <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-5"><form onSubmit={addDoubt} className="space-y-3"><h3 className="font-bold">Capture a doubt to take to class</h3><label className="block text-sm">Topic<select className={`${inputClass} mt-1`} value={doubtTopic} onChange={(e) => setDoubtTopic(e.target.value)}>{topics.map((t) => <option value={t.id} key={t.id}>{t.title}</option>)}</select></label><label className="block text-sm">What are you unsure about?<textarea required className={`${inputClass} mt-1`} rows="4" value={doubtText} onChange={(e) => setDoubtText(e.target.value)} placeholder="Describe the step or idea that is unclear…" /></label><button className="border-2 border-black bg-black text-white px-4 py-2 text-sm">Add doubt</button></form><div><div className="flex justify-between items-center"><h3 className="font-bold">Your doubts</h3><span className="text-xs text-ink-soft">{(data.doubts ?? []).filter((d) => d.status !== 'resolved').length} unresolved</span></div>{(data.doubts ?? []).length ? <div className="mt-2 max-h-96 overflow-auto divide-y divide-black/15">{data.doubts.map((doubt) => <article key={doubt.id} className="py-3"><p className="text-xs text-ink-soft">{topics.find((t) => t.id === doubt.topicId)?.title ?? 'Topic'} · {new Date(doubt.createdAt).toLocaleDateString()}</p><p className="font-medium mt-1">{doubt.question}</p><label className="block text-xs mt-2">Answer / resolution<textarea className={`${inputClass} mt-1`} rows="2" value={doubt.answer ?? ''} onChange={(e) => patch((current) => ({ ...current, doubts: current.doubts.map((d) => d.id === doubt.id ? { ...d, answer: e.target.value } : d) }))} placeholder="Add what you learned when it is resolved" /></label><div className="flex gap-2 mt-2"><select className="border border-black/25 px-2 py-1 text-xs" value={doubt.status} onChange={(e) => patch((current) => ({ ...current, doubts: current.doubts.map((d) => d.id === doubt.id ? { ...d, status: e.target.value } : d) }))}><option value="unresolved">Unresolved · take to class</option><option value="asked">Asked</option><option value="resolved">Resolved</option></select><button className="text-xs underline" onClick={() => patch((current) => ({ ...current, doubts: current.doubts.filter((d) => d.id !== doubt.id) }))}>Remove</button></div></article>)}</div> : <p className="text-sm text-ink-soft mt-3">No doubts saved yet.</p>}</div></div>}

    {tab === 'revisions' && <div className="space-y-3"><h3 className="font-bold">Three revision rounds per topic</h3><p className="text-sm text-ink-soft">Tick a round when you actually complete it. This is a record of your activity, not a mastery score.</p><div className="divide-y divide-black/15">{topics.map((t) => { const rounds = data.revisionRounds?.[t.id] ?? [false, false, false]; return <div key={t.id} className="py-3 flex flex-wrap items-center gap-3"><span className="flex-1 min-w-48 font-medium text-sm">{t.title}</span>{['First pass', 'Second pass', 'Final pass'].map((label, i) => <label key={label} className="inline-flex items-center gap-1.5 text-xs"><input type="checkbox" checked={Boolean(rounds[i])} onChange={(e) => patch((current) => ({ ...current, revisionRounds: { ...current.revisionRounds, [t.id]: (current.revisionRounds?.[t.id] ?? [false, false, false]).map((v, index) => index === i ? e.target.checked : v) } }))} />{label}</label>)}</div> })}</div></div>}

    {tab === 'formulas' && <div className="grid lg:grid-cols-2 gap-5"><div><h3 className="font-bold">Build a one-page formula sheet</h3><p className="text-sm text-ink-soft mt-1">Add formulas or definitions as separate lines in My notes. Select the lines to include, then print or save as PDF.</p><label className="block text-sm mt-3">Topic<select className={`${inputClass} mt-1`} value={packTopic} onChange={(e) => setPackTopic(e.target.value)}>{topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label><div className="mt-3 max-h-80 overflow-auto border border-black/20 bg-white p-3 space-y-2">{((notes[topic?.id] ?? '').split(/\n+/).map((line) => line.trim()).filter((line) => line.length > 1 && line.length < 500)).map((line, index, list) => { const selected = data.formulaSelections?.[topic?.id] ?? list.map(() => true); return <label className="flex gap-2 text-sm" key={`${index}-${line}`}><input type="checkbox" checked={selected[index] !== false} onChange={(e) => patch((current) => { const next = [...(current.formulaSelections?.[topic?.id] ?? list.map(() => true))]; next[index] = e.target.checked; return { ...current, formulaSelections: { ...current.formulaSelections, [topic.id]: next } } })} /><span className="whitespace-pre-wrap">{line}</span></label> })}{!(notes[topic?.id] ?? '').trim() && <p className="text-sm text-ink-soft">No typed notes for this topic yet. Add formulas and definitions to My notes in the Study space.</p>}</div></div><div className="border-2 border-black bg-white p-5"><p className="text-xs uppercase tracking-wider text-ink-soft">Print preview · {topic?.title}</p><h3 className="text-xl font-bold mt-1">Formula and definition sheet</h3>{(() => { const lines = (notes[topic?.id] ?? '').split(/\n+/).map((line) => line.trim()).filter((line) => line.length > 1 && line.length < 500); const selected = data.formulaSelections?.[topic?.id] ?? lines.map(() => true); const chosen = lines.filter((_, index) => selected[index] !== false); return <><ul className="list-disc pl-5 mt-4 space-y-2 text-sm">{chosen.map((line, i) => <li key={i} className="whitespace-pre-wrap">{line}</li>)}</ul><button disabled={!chosen.length} className="mt-5 border-2 border-black bg-black text-white disabled:opacity-40 px-4 py-2 text-sm" onClick={() => printFormulaSheet(chosen)}>Print / Save as PDF</button><p className="text-xs text-ink-soft mt-2">Selected {chosen.length} line(s). Very long sheets may continue onto a second page.</p>{formulaMessage && <p role="status" className="text-xs mt-2">{formulaMessage}</p>}</> })()}</div></div>}

    {tab === 'mistakes' && <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-5"><form onSubmit={addMistake} className="space-y-3"><h3 className="font-bold">Review marks you lost</h3><label className="block text-sm">Test name<input className={`${inputClass} mt-1`} value={reviewTest} onChange={(e) => setReviewTest(e.target.value)} placeholder="e.g. OS series test 2" /></label><label className="block text-sm">Question or mistake<textarea required className={`${inputClass} mt-1`} rows="3" value={reviewQuestion} onChange={(e) => setReviewQuestion(e.target.value)} placeholder="What did you miss?" /></label><label className="block text-sm">Main reason<select className={`${inputClass} mt-1`} value={reviewErrorType} onChange={(e) => setReviewErrorType(e.target.value)}><option>concept gap</option><option>careless mistake</option><option>time pressure</option></select></label><label className="block text-sm">What will you try next time?<input className={`${inputClass} mt-1`} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} /></label><button className="border-2 border-black bg-black text-white px-4 py-2 text-sm">Save test review</button></form><div><h3 className="font-bold">Patterns in your saved reviews</h3><div className="grid grid-cols-3 gap-2 mt-3">{['concept gap', 'careless mistake', 'time pressure'].map((type) => <div className="border border-black/20 bg-white p-3" key={type}><b className="text-2xl">{(data.testErrors ?? []).filter((item) => item.type === type).length}</b><p className="text-xs mt-1">{type}</p></div>)}</div>{(data.testErrors ?? []).length ? <div className="mt-3 max-h-72 overflow-auto divide-y divide-black/10">{data.testErrors.map((item) => <article key={item.id} className="py-2"><p className="text-xs text-ink-soft">{item.test} · {item.type} · {new Date(item.createdAt).toLocaleDateString()}</p><p className="text-sm font-medium">{item.question}</p>{item.note && <p className="text-xs mt-1">Next time: {item.note}</p>}</article>)}</div> : <p className="text-sm text-ink-soft mt-3">Your review counts will appear here. They describe your own entries only.</p>}</div></div>}

    {tab === 'storage' && <div className="space-y-3"><div className="flex justify-between gap-3 items-start"><div><h3 className="font-bold">What this browser stores for your profile</h3><p className="text-sm text-ink-soft mt-1">Approximate sizes for local profile data and study boards on this device. Deleting an item is permanent.</p></div><button className="border-2 border-black px-3 py-2 text-sm" onClick={refreshStorage}>Refresh</button></div>{storageItems.length ? <ul className="divide-y divide-black/15">{storageItems.map((item) => <li key={item.key} className="py-3 flex flex-wrap gap-3 items-center"><div className="flex-1"><p className="font-medium text-sm">{item.label}</p><p className="text-xs text-ink-soft">About {(item.bytes / 1024).toFixed(1)} KB</p></div><button className="border border-red-400 text-red-700 px-3 py-1.5 text-xs" onClick={() => deleteStorageItem(item)}>Delete this data</button></li>)}</ul> : <p className="text-sm text-ink-soft">No Syllabus Hub data keys were found for this profile.</p>}{storageMessage && <p role="status" className="text-sm text-ink-soft">{storageMessage}</p>}<p className="text-xs text-ink-soft">This inventory does not include browser cache or OCR language/model files stored by the browser. Study packs downloaded to your Downloads folder are managed separately.</p></div>}
  </section>
}
