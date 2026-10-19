import { useMemo, useState } from 'react'
import { CURRICULUM } from '../data'
import { Button, focusRing } from '../components/ui'

export default function SelectPage({ user, initial, onDone }) {
  const [courseId, setCourseId] = useState(initial?.courseId ?? CURRICULUM[0].id)
  const [semester, setSemester] = useState(() => {
    const initialCourse = CURRICULUM.find((item) => item.id === (initial?.courseId ?? CURRICULUM[0].id)) ?? CURRICULUM[0]
    const initialSemester = Number(initial?.semester)
    const options = Object.keys(initialCourse.semesters).map(Number).sort((a, b) => a - b)
    return options.includes(initialSemester) ? initialSemester : options[0]
  })
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? null)
  const [topicIds, setTopicIds] = useState(initial?.topicIds ?? [])

  const course = CURRICULUM.find((c) => c.id === courseId)
  const availableSemesters = course.scheme
    ? [1, 2, 3, 4, 5, 6, 7, 8]
    : Object.keys(course.semesters).map(Number).sort((a, b) => a - b)
  const subjects = course.semesters[semester] ?? []
  const subject = subjects.find((s) => s.id === subjectId) ?? null
  const allIds = useMemo(() => subject?.modules.flatMap((m) => m.topics.map((t) => t.id)) ?? [], [subject])
  const progress = allIds.length ? Math.round((topicIds.length / allIds.length) * 100) : 0

  const resetBelow = () => { setSubjectId(null); setTopicIds([]) }
  const pickSubject = (s) => {
    setSubjectId(s.id)
    setTopicIds(s.modules.flatMap((m) => m.topics.map((t) => t.id)))   // everything ticked: fastest start
  }
  const toggle = (id) => setTopicIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  const toggleModule = (m) => {
    const ids = m.topics.map((t) => t.id)
    const all = ids.every((id) => topicIds.includes(id))
    setTopicIds((cur) => (all ? cur.filter((x) => !ids.includes(x)) : [...new Set([...cur, ...ids])]))
  }

  const field = `w-full border border-white/70 rounded-full px-4 py-2.5 bg-frost text-ink shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] ${focusRing}`

  return (
    <main id="top" className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 glass glow-edge rounded-[26px] p-5 sm:p-7">
        <div><p className="text-sm font-semibold text-glow">Course setup <span className="text-fog font-normal">· You can change this later</span></p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-mist">What are you studying, {user.name.split(' ')[0]}?</h1>
          <p className="mt-1 text-fog">Choose your engineering branch and semester to see its subjects and syllabus topics.</p></div>
        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-white text-brand shadow-sm items-center justify-center text-xl" aria-hidden>⌘</div>
      </div>

      {/* 1. Class */}
      <section className="frost p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4"><span className="w-8 h-8 rounded-xl bg-brand-light text-brand font-bold grid place-items-center">1</span><div><h2 className="font-semibold">Your course</h2><p className="text-xs text-ink-soft">Select your degree branch and semester.</p></div></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm font-medium">Degree / branch
            <select className={`${field} mt-1`} value={courseId} onChange={(e) => { const nextId = e.target.value; const next = CURRICULUM.find((item) => item.id === nextId); setCourseId(nextId); setSemester(Number(Object.keys(next.semesters).sort((a, b) => Number(a) - Number(b))[0])); resetBelow() }}>
              {CURRICULUM.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Semester
            <select className={`${field} mt-1`} value={semester} onChange={(e) => { setSemester(Number(e.target.value)); resetBelow() }}>
              {availableSemesters.map((n) => <option key={n} value={n}>Semester {n}</option>)}
            </select>
          </label>
        </div>
        {course.scheme && <div className="mt-4 border-2 border-black bg-[#fffaf2] p-3 text-sm">
          <p className="font-semibold">{course.scheme} · {course.name.replace('B.Tech · ', '')}</p>
          <p className="mt-1 text-ink-soft">{course.sourceNote} Topic outlines are study-planning previews; confirm your exact admitted-batch syllabus with your college.</p>
        </div>}
      </section>

      {/* 2. Subject */}
      <section className="frost p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4"><span className="w-8 h-8 rounded-xl bg-brand-light text-brand font-bold grid place-items-center">2</span><div><h2 className="font-semibold">Your subject</h2><p className="text-xs text-ink-soft">Choose the syllabus you want to work with.</p></div></div>
        {subjects.length === 0 ? (
          <div className="border border-dashed border-line rounded-card p-5 text-sm text-ink-soft">
            {course.scheme
              ? `The in-app ${course.scheme} catalog for ${course.name.replace('B.Tech · ', '')} currently has subject lists for Semesters 3 and 4. Semester ${semester} is not loaded yet.`
              : `No syllabus is loaded for ${course.name}, semester ${semester} yet. Pick another semester, or ask your class representative to add this syllabus.`}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => pickSubject(s)}
                aria-pressed={s.id === subjectId}
              className={`relative text-left border rounded-2xl p-4 transition duration-150 hover:border-brand hover:shadow-md ${focusRing} ${s.id === subjectId ? 'border-brand bg-brand-light ring-2 ring-brand/10' : 'border-line bg-white'}`}
              >
                <span className="absolute right-4 top-4 w-6 h-6 rounded-full border border-line bg-white grid place-items-center text-brand" aria-hidden>{s.id === subjectId ? '✓' : '＋'}</span>
                <span className="block text-2xl mb-3" aria-hidden>▤</span>
                <p className="font-semibold pr-8">{s.title}</p>
                <p className="text-sm text-ink-soft mt-1">{s.category && <><span className="font-semibold text-ink">{s.category}</span><span className="px-1">·</span></>}{s.credits != null && <><span>{s.credits} credits</span><span className="px-1">·</span></>}{s.modules.length} {s.modules.length === 1 ? 'topic group' : 'modules'} <span className="px-1">·</span> {s.modules.reduce((n, m) => n + m.topics.length, 0)} topics</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 3. Topics */}
      {subject && (
      <section className="frost p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-xl bg-brand-light text-brand font-bold grid place-items-center">3</span><div><h2 className="font-semibold">Pick your syllabus topics</h2><p className="text-xs text-ink-soft">Everything starts selected. Uncheck topics to leave them out.</p></div></div>
            <Button variant="ghost" className="!py-1 text-sm" onClick={() => setTopicIds(topicIds.length === allIds.length ? [] : allIds)}>
              {topicIds.length === allIds.length ? 'Clear all' : 'Select all'}
            </Button>
          </div>
          <div className="space-y-3">
            {subject.modules.map((m) => {
              const ids = m.topics.map((t) => t.id)
              const every = ids.every((id) => topicIds.includes(id))
              return (
                <div key={m.id} className="rounded-2xl border border-line/80 p-3 sm:p-4">
                  <label className="flex items-center gap-2 font-semibold text-sm mb-2 cursor-pointer">
                    <input type="checkbox" checked={every} onChange={() => toggleModule(m)} className="accent-brand w-4 h-4" />
                    {m.title}
                  </label>
                  <ul className="ml-2 sm:ml-6 grid sm:grid-cols-2 gap-1">
                    {m.topics.map((t) => (
                      <li key={t.id}>
                        <label className="flex items-center gap-2 px-2 py-1.5 rounded-btn hover:bg-brand-light cursor-pointer">
                          <input type="checkbox" checked={topicIds.includes(t.id)} onChange={() => toggle(t.id)} className="accent-brand w-4 h-4" />
                          <span className="flex-1">{t.title}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
          <div className="mt-5 flex items-center gap-3"><div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-brand to-[#72a0ff] transition-all" style={{ width: `${progress}%` }} /></div><p className="text-xs text-ink-soft whitespace-nowrap">{topicIds.length} of {allIds.length} topics selected</p></div>
          <p className="text-xs text-ink-soft mt-3">Select the syllabus topics you want to study. Your own confidence ratings are added after you save the course.</p>
        </section>
      )}

      <div className="sticky bottom-3 flex items-center justify-between gap-3 rounded-[24px] border border-white/15 bg-night-900/85 backdrop-blur-xl p-3 sm:px-5 shadow-card text-mist">
        <span className="text-sm text-ink-soft"><strong className="text-ink">{topicIds.length}</strong> topic{topicIds.length === 1 ? '' : 's'} selected</span>
        <Button disabled={!subject || topicIds.length === 0} onClick={() => onDone({ courseId, semester, subjectId, topicIds })}>
          Save course and open dashboard <span aria-hidden>→</span>
        </Button>
      </div>
    </main>
  )
}
