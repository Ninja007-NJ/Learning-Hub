import { useEffect, useMemo, useState } from 'react'
import { CURRICULUM, KTU_SEED_RESOURCES, SEED_RESOURCES } from './data'
import { load, save } from './lib'
import { TopBar, Button, Ticker } from './components/ui'
import ThemePanel from './components/ThemePanel'
import { applyTheme, defaultSettings } from './theme'
import LoginPage from './pages/LoginPage'
import SelectPage from './pages/SelectPage'
import ResourcesPage from './pages/ResourcesPage'
import StudyArea from './pages/StudyArea'
import StudyToolkit from './components/StudyToolkit'
import StudyAddons from './components/StudyAddons'
import SmartNotes from './components/SmartNotes'
import Deadlines from './components/Deadlines'
import BackupPanel from './components/BackupPanel'
import { liveStatus } from './lib/progress'
import PrivacySupportPanel from './components/PrivacySupportPanel'
import OnboardingTour from './components/OnboardingTour'

const freshProfile = () => ({
  sel: null, page: 'dashboard', topicId: null, workspaceView: 'resources', resources: [...SEED_RESOURCES, ...KTU_SEED_RESOURCES],
  sharedResources: [], bookmarks: [], notes: {}, confidence: {}, weeklyGoal: 3, practiceCards: [],
  deadlines: [],
  smartNotes: { packs: {}, cards: [], plan: { exam: '', hrs: 3 } },
  pilotMetricsEnabled: false,
  pilot: { studySessions: [], resourceViews: 0, firstFindSeconds: [], assistantFeedback: { helpful: 0, notHelpful: 0 }, uploadMatches: { suggested: 0, accepted: 0, corrected: 0 }, feedback: [] },
})
const profileKey = (user) => `hub2.profile.${encodeURIComponent(user.email.trim().toLowerCase())}`
const tourKey = (user) => `hub2.onboarding.${encodeURIComponent(user.email.trim().toLowerCase())}`
const legacySeedIds = new Set([...Array.from({ length: 11 }, (_, i) => String(i + 1)), ...Array.from({ length: 7 }, (_, i) => `ktu-${i + 1}`), 'ktu-seed-os-seg', 'ktu-seed-os-sched', 'ktu-seed-db-joins', 'ktu-seed-ds-linked-list'])
const migrateProfile = (saved) => ({
  ...freshProfile(),
  ...saved,
  pilot: { ...freshProfile().pilot, ...(saved?.pilot ?? {}), assistantFeedback: { helpful: 0, notHelpful: 0, ...(saved?.pilot?.assistantFeedback ?? {}) }, uploadMatches: { suggested: 0, accepted: 0, corrected: 0, ...(saved?.pilot?.uploadMatches ?? {}) }, ...(saved?.pilotMetricsEnabled === true ? {} : { studySessions: [], resourceViews: 0, firstFindSeconds: [], assistantFeedback: { helpful: 0, notHelpful: 0 }, uploadMatches: { suggested: 0, accepted: 0, corrected: 0 } }) },
  practiceCards: Array.isArray(saved?.practiceCards) ? saved.practiceCards : [],
  smartNotes: { packs: {}, cards: [], plan: { exam: '', hrs: 3 }, ...(saved?.smartNotes ?? {}), packs: saved?.smartNotes?.packs && typeof saved.smartNotes.packs === 'object' ? saved.smartNotes.packs : {}, cards: Array.isArray(saved?.smartNotes?.cards) ? saved.smartNotes.cards : [], plan: { exam: '', hrs: 3, ...(saved?.smartNotes?.plan ?? {}) } },
  sharedResources: Array.isArray(saved?.sharedResources) ? saved.sharedResources : [],
  confidence: saved?.confidence && typeof saved.confidence === 'object' ? saved.confidence : {},
  deadlines: Array.isArray(saved?.deadlines) ? saved.deadlines : [],
  page: saved?.page === 'profile' ? 'profile' : 'dashboard',
  workspaceView: saved?.workspaceView ?? (saved?.page === 'study' ? 'study' : 'resources'),
  resources: (saved?.resources ?? [...SEED_RESOURCES, ...KTU_SEED_RESOURCES]).filter((resource) => !legacySeedIds.has(String(resource.id))),
})

const mergeKtuSeeds = (resources) => {
  const existing = new Set(resources.map((resource) => String(resource.id)))
  return [...resources, ...[...SEED_RESOURCES, ...KTU_SEED_RESOURCES].filter((resource) => !existing.has(String(resource.id)))]
}
const hydrateProfile = (saved, user, { migrateLegacyLibrary = false } = {}) => {
  const profile = migrateProfile(saved ?? freshProfile())
  const legacyToolkit = load(`hub2.toolkit.${encodeURIComponent(user.email.trim().toLowerCase())}`, {})
  profile.confidence = { ...(legacyToolkit?.confidence ?? {}), ...(profile.confidence ?? {}) }
  if (migrateLegacyLibrary && !Array.isArray(saved?.sharedResources)) profile.sharedResources = load('hub2.shared.resources', [])
  profile.resources = mergeKtuSeeds(profile.resources)
  return profile
}

function Dashboard({ user, subject, topics, resources, notes, confidence, cards, onConfidenceChange, topicId, pilot, pilotMetricsEnabled, onPilotMetricsChange, weeklyGoal, onSetWeeklyGoal, onPilotFeedback, onOpen, onSetup, onImportPack }) {
  const [pilotRating, setPilotRating] = useState('')
  const [pilotNote, setPilotNote] = useState('')
  const [feedbackSaved, setFeedbackSaved] = useState(false)
  const current = topics.find((topic) => topic.id === topicId) ?? topics[0]
  const noteCount = Object.values(notes).filter((note) => note?.trim()).length
  const countFor = (topic) => resources.filter((item) => item.topic === topic.id).length
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000
  const sessionsThisWeek = (pilot?.studySessions ?? []).filter((date) => new Date(date).getTime() >= weekStart).length
  const findTimes = pilot?.firstFindSeconds ?? []
  const averageFind = findTimes.length ? Math.round(findTimes.reduce((sum, seconds) => sum + seconds, 0) / findTimes.length) : null
  const matchStats = pilot?.uploadMatches ?? { suggested: 0, accepted: 0, corrected: 0 }
  const matchAccuracy = matchStats.suggested ? Math.round(matchStats.accepted / matchStats.suggested * 100) : null
  const feedback = pilot?.assistantFeedback ?? { helpful: 0, notHelpful: 0 }
  const feedbackCount = feedback.helpful + feedback.notHelpful
  return <main className="dashboard-page max-w-6xl mx-auto p-4 sm:p-7 lg:p-10 space-y-6">
    <section className="dashboard-hero glass rounded-[28px] p-6 sm:p-9 flex flex-wrap items-end justify-between gap-5">
      <div><p className="text-xs uppercase tracking-[.16em] font-bold text-ink-soft">Your learning space <span className="hero-spark">✳</span></p>
        <h1 className="text-3xl sm:text-5xl font-black mt-2">Welcome back, {user.name.split(' ')[0]}.</h1>
        <p className="text-ink-soft mt-2">Pick up where you left off or set up a course to start learning.</p></div>
      <Button onClick={onSetup}>{subject ? 'Manage courses' : 'Set up your first course'} <span aria-hidden>→</span></Button>
    </section>
    {subject ? <>
      <section className="dashboard-metrics grid sm:grid-cols-3 gap-3" aria-label="Learning summary">
        {[['Current course', subject.title, '01'], ['Topics in your plan', `${topics.length} ${topics.length === 1 ? 'topic' : 'topics'}`, '02'], ['Personal notes', `${noteCount} ${noteCount === 1 ? 'topic' : 'topics'} with notes`, '03']].map(([label, value, number]) => <div key={label} className="dashboard-metric frost p-5"><span className="metric-number">{number}</span><p className="text-sm text-ink-soft">{label}</p><p className="font-bold text-xl mt-2">{value}</p></div>)}
      </section>
      <section className="grid lg:grid-cols-[1.2fr_.8fr] gap-5">
        <div className="continue-card frost p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-ink-soft font-bold">Continue studying</p><h2 className="text-2xl font-bold mt-1">{current?.title ?? 'Choose a topic'}</h2><p className="text-sm text-ink-soft mt-1">{subject.title} · Your saved notes and materials are ready.</p></div><span className="rounded-full bg-[#ededeb] px-3 py-1 text-xs">Current topic</span></div>
          <div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => onOpen('study')}>Continue on study board</Button><Button variant="secondary" onClick={() => onOpen('resources')}>Open topic materials</Button><Button variant="secondary" onClick={() => onOpen('smart')}>Smart notes</Button><Button variant="secondary" onClick={() => onOpen('deadlines')}>Deadlines</Button></div>
        </div>
        <div className="syllabus-card frost p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-ink-soft font-bold">Your syllabus</p><h2 className="text-xl font-bold mt-1">{subject.title}</h2></div><button className="text-sm underline" onClick={onSetup}>Edit</button></div>
          <ul className="mt-4 divide-y divide-black/10">{topics.slice(0, 4).map((topic) => <li key={topic.id}><button onClick={() => onOpen('resources', topic.id)} className="w-full py-3 flex justify-between gap-3 text-left hover:bg-black/[.03] rounded-lg px-2"><span>{topic.title}</span><span className="text-sm text-ink-soft">{countFor(topic)} {countFor(topic) === 1 ? 'material' : 'materials'} →</span></button></li>)}</ul>
          {topics.length > 4 && <p className="text-xs text-ink-soft mt-2">+ {topics.length - 4} more topics</p>}
        </div>
      </section>
      <StudyToolkit email={user.email} topics={topics} notes={notes} resources={resources} confidence={confidence} onConfidenceChange={onConfidenceChange} />
      <StudyAddons key={user.email} email={user.email} userName={user.name} subject={subject} topics={topics} resources={resources} notes={notes} practiceCards={cards} onImportPack={onImportPack} />
      <section className="frost p-5 sm:p-7" aria-labelledby="pilot-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs uppercase tracking-wider text-ink-soft font-bold">Pilot workspace</p><h2 id="pilot-title" className="text-xl font-bold mt-1">A small goal, measured honestly</h2><p className="text-sm text-ink-soft mt-1">Optional local measurements help evaluate the workflow; they are not sent to a research server.</p></div>
          <label className="text-sm font-medium">Weekly study goal<select value={weeklyGoal ?? 3} onChange={(e) => onSetWeeklyGoal(Number(e.target.value))} className="block mt-1 border-2 border-black bg-white px-3 py-2"><option value={1}>1 session</option><option value={3}>3 sessions</option><option value={5}>5 sessions</option></select></label>
        </div>
        <label className="flex items-start gap-2 text-sm mt-4"><input type="checkbox" checked={pilotMetricsEnabled} onChange={(e) => onPilotMetricsChange(e.target.checked)} className="mt-1 accent-black" />Collect optional pilot measures on this browser (board opens, resource find time, topic suggestion choices and assistant ratings). You can turn this off any time in this dashboard.</label>
        {pilotMetricsEnabled ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {[[`${sessionsThisWeek}/${weeklyGoal ?? 3}`, 'study sessions this week'], [averageFind == null ? 'Not yet' : `${averageFind}s`, 'average time to first resource'], [matchAccuracy == null ? 'Not yet' : `${matchAccuracy}%`, 'upload topic suggestions kept'], [feedbackCount ? `${Math.round(feedback.helpful / feedbackCount * 100)}%` : 'Not yet', 'assistant answers rated helpful']].map(([value, label]) => <div key={label} className="rounded-xl border-2 border-black/15 bg-white/70 p-3"><p className="font-bold text-lg">{value}</p><p className="text-xs text-ink-soft">{label}</p></div>)}
        </div> : <p className="text-xs text-ink-soft mt-3">Pilot measurements are off. Use the manual task observations in the project runbook unless a student opts in here.</p>}
        {pilotMetricsEnabled && <p className="text-xs text-ink-soft mt-3">Measurements are saved in this browser profile only. Collect consent before using them in a report.</p>}
      </section>
      <form className="frost p-5 sm:p-7" onSubmit={(event) => { event.preventDefault(); if (!pilotRating) return; onPilotFeedback?.({ rating: pilotRating, note: pilotNote.trim(), createdAt: new Date().toISOString() }); setPilotNote(''); setPilotRating(''); setFeedbackSaved(true); window.setTimeout(() => setFeedbackSaved(false), 3500) }}>
        <div className="grid sm:grid-cols-[.8fr_1.2fr_auto] gap-3 items-end"><label className="text-sm font-medium">How did this study flow feel?<select required value={pilotRating} onChange={(e) => setPilotRating(e.target.value)} className="block mt-1 w-full border-2 border-black bg-white px-3 py-2"><option value="">Choose one</option><option value="good">Clear and easy</option><option value="okay">Mostly okay</option><option value="stuck">I got stuck</option></select></label><label className="text-sm font-medium">What should improve?<input value={pilotNote} onChange={(e) => setPilotNote(e.target.value)} className="block mt-1 w-full border-2 border-black bg-white px-3 py-2" maxLength={300} placeholder="Optional: tell us where you hesitated" /></label><Button type="submit" disabled={!pilotRating}>Save feedback</Button></div>
        <p role="status" className="text-xs text-ink-soft mt-2">{feedbackSaved ? 'Feedback saved on this device.' : `${pilot?.feedback?.length ?? 0} local feedback entries · not sent to a research server`}</p>
      </form>
      <p className="text-xs text-ink-soft px-1">Demo data is saved per profile in this browser. Sign-in is not account security; the class library is not shared with classmates until a backend is added.</p>
    </> : <section className="frost p-8 text-center"><div className="text-4xl" aria-hidden>▤</div><h2 className="text-2xl font-bold mt-3">Set up your learning space</h2><p className="text-ink-soft max-w-xl mx-auto mt-2">Choose your course and syllabus topics first. You can change them any time, and you can start with the sample curriculum.</p><Button className="mt-5" onClick={onSetup}>Choose course and topics</Button></section>}
  </main>
}

function Profile({ user, topics, resources, notes, profile, pilot, weeklyGoal, practiceCards, onSave, onBack, onRestoredProfile, onCleared, onStartTour }) {
  const [name, setName] = useState(user.name)
  const [message, setMessage] = useState('')
  const saveName = (event) => { event.preventDefault(); onSave({ ...user, name: name.trim() || user.name }); setMessage('Profile updated on this device.') }
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ profile: user, topics, resources, sharedResources: profile.sharedResources ?? [], notes, confidence: profile.confidence ?? {}, pilotMetrics: pilot, weeklyGoal, practiceCards, deadlines: profile.deadlines ?? [], smartNotes: profile.smartNotes ?? {} }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'syllabus-hub-study-data.json'; link.click(); URL.revokeObjectURL(url)
    setMessage('Your study data export has downloaded.')
  }
  return <main className="max-w-3xl mx-auto p-4 sm:p-8 space-y-5">
    <button className="text-sm underline" onClick={onBack}>← Back to dashboard</button>
    <section className="glass rounded-[28px] p-6 sm:p-8"><p className="text-xs uppercase tracking-wider font-bold text-ink-soft">Account and privacy</p><h1 className="text-3xl font-black mt-2">Your profile</h1><p className="text-ink-soft mt-2">Manage your demo profile and take a copy of your study data.</p></section>
    <form onSubmit={saveName} className="frost p-6 space-y-4"><label className="block text-sm font-medium">Display name<input className="block mt-1 w-full rounded-xl border border-black/20 px-4 py-3" value={name} onChange={(e) => setName(e.target.value)} /></label><label className="block text-sm font-medium">Email address<input className="block mt-1 w-full rounded-xl border border-black/20 px-4 py-3 bg-[#f5f5f2]" value={user.email} readOnly /></label><Button type="submit">Save profile</Button></form>
    <section className="frost p-6"><h2 className="font-bold text-lg">Your data</h2><p className="text-sm text-ink-soft mt-2">This demo stores your profile, class library, typed notes, confidence ratings, and whiteboard strokes in this browser. Demo sign-in is not account security; another person using this browser profile may be able to access local data.</p><Button variant="secondary" className="mt-4" onClick={exportData}>Download my study data</Button></section>
    <BackupPanel user={user} onRestoredProfile={onRestoredProfile} onCleared={onCleared} />
    <PrivacySupportPanel />
    <section className="frost p-6"><h2 className="font-bold text-lg">Getting started</h2><p className="text-sm text-ink-soft mt-1">Replay the short walkthrough of course setup, materials, study tools and privacy controls.</p><Button variant="secondary" className="mt-3" onClick={onStartTour}>Replay walkthrough</Button></section>
    {message && <p role="status" aria-live="polite" className="text-sm">{message}</p>}
  </main>
}

export default function App() {
  const [themeSettings, setThemeSettings] = useState(() => ({ ...defaultSettings(), ...load('hub2.look', {}) }))
  const [user, setUser] = useState(() => load('hub2.user', null))
  const [tourOpen, setTourOpen] = useState(() => { const existing = load('hub2.user', null); return Boolean(existing && !load(tourKey(existing), false)) })
  const [tourReplay, setTourReplay] = useState(false)
  const [profile, setProfile] = useState(() => {
    const savedUser = load('hub2.user', null)
    if (!savedUser) return freshProfile()
    return hydrateProfile(load(profileKey(savedUser), null), savedUser, { migrateLegacyLibrary: true })
  })
  const [saveState, setSaveState] = useState('saved')
  const { sel, page, topicId, resources, bookmarks, notes, workspaceView = 'resources' } = profile
  const patchProfile = (patch) => setProfile((p) => ({ ...p, ...(typeof patch === 'function' ? patch(p) : patch) }))
  useEffect(() => { save('hub2.user', user) }, [user])
  useEffect(() => {
    if (!user) return
    setSaveState('saving')
    const key = profileKey(user)
    const timer = window.setTimeout(() => setSaveState(save(key, profile) ? 'saved' : 'error'), 350)
    const flush = () => save(key, profile)
    window.addEventListener('pagehide', flush)
    return () => { window.clearTimeout(timer); window.removeEventListener('pagehide', flush) }
  }, [profile, user])
  useEffect(() => { applyTheme(themeSettings); save('hub2.look', themeSettings) }, [themeSettings])

  const subject = useMemo(() => {
    if (!sel) return null
    const course = CURRICULUM.find((c) => c.id === sel.courseId)
    return course?.semesters[sel.semester]?.find((s) => s.id === sel.subjectId) ?? null
  }, [sel])
  const topics = useMemo(() => subject ? subject.modules.flatMap((m) => m.topics.filter((t) => sel.topicIds.includes(t.id)).map((t) => ({ ...t, module: m.title, status: liveStatus(t, profile.confidence) }))) : [], [subject, sel, profile.confidence])
  const activeTopicId = topics.some((t) => t.id === topicId) ? topicId : topics[0]?.id
  const canGo = (p) => p === 'login' ? !user : !!user && (p === 'dashboard' || p === 'profile' || p === 'select' || (p === 'workspace' && topics.length > 0))
  const effectivePage = canGo(page) ? page : user ? 'dashboard' : 'login'
  const go = (p) => { if (canGo(p)) { patchProfile({ page: p }); window.scrollTo({ top: 0 }) } }
  const toggleBookmark = (id) => patchProfile({ bookmarks: bookmarks.includes(id) ? bookmarks.filter((x) => x !== id) : [...bookmarks, id] })
  const signOut = () => { setUser(null); setTourOpen(false); patchProfile({ page: 'login' }) }
  const login = (nextUser) => {
    const normalized = { ...nextUser, email: nextUser.email.trim().toLowerCase() }
    const nextProfile = hydrateProfile(load(profileKey(normalized), null), normalized, { migrateLegacyLibrary: user?.email?.trim().toLowerCase() === normalized.email })
    setProfile(nextProfile)
    setProfile((p) => ({ ...p, page: 'dashboard' }))
    setUser(normalized)
    setTourReplay(false)
    setTourOpen(!load(tourKey(normalized), false))
  }
  const openWorkspace = (view = 'resources', id = activeTopicId) => {
    patchProfile((p) => ({ ...p, topicId: id, workspaceView: view, page: 'workspace', ...(view === 'study' && p.pilotMetricsEnabled ? { pilot: { ...p.pilot, studySessions: [...p.pilot.studySessions, new Date().toISOString()].slice(-200) } } : {}) }))
    window.scrollTo({ top: 0 })
  }
  const setResources = (value) => setProfile((p) => ({ ...p, resources: typeof value === 'function' ? value(p.resources) : value }))
  const saveAssistantPractice = (card) => {
    const id = `practice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const topicTitle = topics.find((t) => t.id === activeTopicId)?.title ?? 'Study topic'
    const createdAt = new Date().toISOString()
    patchProfile((p) => ({ practiceCards: [...(p.practiceCards ?? []), { ...card, id, topicId: activeTopicId, createdAt, status: 'new' }] }))
    const key = `hub2.toolkit.${encodeURIComponent(user.email.trim().toLowerCase())}`
    const toolkit = load(key, {})
    save(key, { ...toolkit, cards: [...(toolkit.cards ?? []), { id, question: card.question, answer: card.answer, topic: topicTitle, sources: card.sources ?? [], interval: 0, dueAt: createdAt, reviews: 0 }] })
  }
  const setSmartField = (field) => (value) => patchProfile((p) => ({ ...p, smartNotes: { ...p.smartNotes, [field]: typeof value === 'function' ? value(p.smartNotes?.[field]) : value } }))
  const confidenceValues = { 'not started': 0, shaky: 1, okay: 2, confident: 3 }
  const confidenceLabels = ['not started', 'shaky', 'okay', 'confident']
  const smartConfidence = Object.fromEntries(topics.map((t) => [t.id, confidenceValues[profile.confidence?.[t.id] ?? 'not started'] ?? 0]))
  const setSmartConfidence = (update) => patchProfile((p) => {
    const current = Object.fromEntries(topics.map((t) => [t.id, confidenceValues[p.confidence?.[t.id] ?? 'not started'] ?? 0]))
    const next = typeof update === 'function' ? update(current) : update
    return { ...p, confidence: { ...p.confidence, ...Object.fromEntries(Object.entries(next).map(([id, value]) => [id, confidenceLabels[Math.max(0, Math.min(3, Number(value) || 0))]])) } }
  })

  return <div className="min-h-screen">
    <TopBar page={effectivePage} user={user} canGo={canGo} onGo={go} onSignOut={signOut} themeControl={<ThemePanel settings={themeSettings} onChange={setThemeSettings} />} />
    {user && <Ticker />}
    {effectivePage === 'login' && <LoginPage onLogin={login} />}
    {effectivePage === 'dashboard' && user && <Dashboard user={user} subject={subject} topics={topics} resources={[...resources, ...(profile.sharedResources ?? [])]} notes={notes} confidence={profile.confidence ?? {}} cards={profile.practiceCards ?? []} onConfidenceChange={(confidence) => patchProfile({ confidence })} topicId={activeTopicId} pilot={profile.pilot} pilotMetricsEnabled={Boolean(profile.pilotMetricsEnabled)} onPilotMetricsChange={(enabled) => patchProfile((p) => ({ ...p, pilotMetricsEnabled: enabled, ...(!enabled ? { pilot: { ...p.pilot, studySessions: [], resourceViews: 0, firstFindSeconds: [], assistantFeedback: { helpful: 0, notHelpful: 0 }, uploadMatches: { suggested: 0, accepted: 0, corrected: 0 } } } : {}) }))} weeklyGoal={profile.weeklyGoal} onSetWeeklyGoal={(weeklyGoal) => patchProfile({ weeklyGoal })} onPilotFeedback={(entry) => patchProfile((p) => ({ ...p, pilot: { ...p.pilot, feedback: [...(p.pilot.feedback ?? []), entry].slice(-100) } }))} onOpen={openWorkspace} onSetup={() => go('select')} onImportPack={(pack) => patchProfile((p) => ({ resources: [...pack.resources, ...p.resources], notes: { ...p.notes, [pack.topicId]: `${p.notes[pack.topicId]?.trim() ? `${p.notes[pack.topicId].trim()}\n\n` : ''}${pack.notes}` }, practiceCards: [...(p.practiceCards ?? []), ...pack.flashcards.map((card) => ({ ...card, id: `pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, topicId: pack.topicId, createdAt: new Date().toISOString(), status: 'new', importedUnverified: true }))] }))} />}
    {effectivePage === 'select' && user && <SelectPage user={user} initial={sel} onDone={(s) => { patchProfile({ sel: s, topicId: s.topicIds[0], workspaceView: 'resources', page: 'dashboard' }); window.scrollTo({ top: 0 }) }} />}
    {effectivePage === 'profile' && user && <Profile user={user} topics={topics} resources={resources} notes={notes} profile={profile} pilot={profile.pilot} weeklyGoal={profile.weeklyGoal} practiceCards={profile.practiceCards ?? []} onSave={setUser} onBack={() => go('dashboard')} onStartTour={() => { setTourReplay(true); setTourOpen(true) }} onRestoredProfile={(restored) => setProfile(migrateProfile(restored))} onCleared={() => setProfile(freshProfile())} />}
    {effectivePage === 'workspace' && subject && <>
      <div className="workspace-tabs sticky z-30 bg-[#efefed] border-b border-black/15 px-4 sm:px-8 py-2 flex items-center gap-3" style={{ top: 'var(--hub-header-height, 0px)' }}><button className="text-sm underline shrink-0" onClick={() => go('dashboard')}>← Dashboard</button><span className="text-sm text-ink-soft truncate hidden sm:block">{subject.title}</span><div className="flex-1"/><div className="inline-flex p-1 rounded-xl border border-black bg-white overflow-x-auto shrink-0" role="tablist" aria-label="Topic workspace"><button role="tab" aria-selected={workspaceView === 'resources'} onClick={() => patchProfile({ workspaceView: 'resources' })} className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${workspaceView === 'resources' ? 'bg-black text-white' : ''}`}>Materials</button><button role="tab" aria-selected={workspaceView === 'study'} onClick={() => patchProfile({ workspaceView: 'study' })} className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${workspaceView === 'study' ? 'bg-black text-white' : ''}`}>Study space</button><button role="tab" aria-selected={workspaceView === 'smart'} onClick={() => patchProfile({ workspaceView: 'smart' })} className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${workspaceView === 'smart' ? 'bg-black text-white' : ''}`}>Smart notes</button><button role="tab" aria-selected={workspaceView === 'deadlines'} onClick={() => patchProfile({ workspaceView: 'deadlines' })} className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${workspaceView === 'deadlines' ? 'bg-black text-white' : ''}`}>Deadlines</button></div></div>
      {workspaceView === 'resources' ? <ResourcesPage subject={subject} userName={user.name} topics={topics} topicId={activeTopicId} setTopicId={(id) => patchProfile({ topicId: id })} resources={[...resources, ...(profile.sharedResources ?? [])]} setResources={setResources} onShareNotes={(items) => patchProfile((p) => ({ sharedResources: [...items, ...(p.sharedResources ?? [])] }))} onReviewResource={(id, reviewStatus) => patchProfile((p) => ({ sharedResources: (p.sharedResources ?? []).map((item) => item.id === id ? { ...item, rights: { ...item.rights, reviewStatus, reviewedAt: new Date().toISOString(), reviewNote: reviewStatus === 'approved' ? 'Locally approved in demo; not legal validation.' : '' }, ...(reviewStatus === 'approved' ? { kind: 'Shared class note', scope: 'shared' } : {}) } : item) }))} bookmarks={bookmarks} toggleBookmark={toggleBookmark} notes={notes} confidence={profile.confidence ?? {}} cards={profile.practiceCards ?? []} onStudy={(id) => openWorkspace('study', id)} onChangeSelection={() => go('select')}
        onResourceViewed={(seconds, first) => profile.pilotMetricsEnabled && patchProfile((p) => ({ ...p, pilot: { ...p.pilot, resourceViews: p.pilot.resourceViews + 1, firstFindSeconds: first ? [...p.pilot.firstFindSeconds, seconds].slice(-100) : p.pilot.firstFindSeconds } }))}
        onTopicSuggestionReview={(suggested, accepted, corrected) => profile.pilotMetricsEnabled && patchProfile((p) => ({ ...p, pilot: { ...p.pilot, uploadMatches: { suggested: p.pilot.uploadMatches.suggested + suggested, accepted: p.pilot.uploadMatches.accepted + accepted, corrected: p.pilot.uploadMatches.corrected + corrected } } }))} />
        : workspaceView === 'smart' ? <SmartNotes subject={subject} topics={topics} resources={[...resources, ...(profile.sharedResources ?? [])].filter((r) => !r.rights?.reviewStatus || r.rights.reviewStatus === 'approved')} notes={notes} packs={profile.smartNotes?.packs ?? {}} setPacks={setSmartField('packs')} cards={profile.smartNotes?.cards ?? []} setCards={setSmartField('cards')} conf={smartConfidence} setConf={setSmartConfidence} plan={profile.smartNotes?.plan ?? { exam: '', hrs: 3 }} setPlan={setSmartField('plan')} onOpenTopic={(id) => openWorkspace('resources', id)} />
        : workspaceView === 'deadlines' ? <Deadlines subject={subject} topics={topics} deadlines={profile.deadlines ?? []} setDeadlines={(value) => patchProfile((p) => ({ deadlines: typeof value === 'function' ? value(p.deadlines ?? []) : value }))} onOpenTopic={(id) => openWorkspace('resources', id)} />
        : <StudyArea userId={user.email} userName={user.name} topics={topics} topicId={activeTopicId} setTopicId={(id) => patchProfile({ topicId: id })} resources={[...resources, ...(profile.sharedResources ?? [])]} notes={notes} setNotes={(v) => setProfile((p) => ({ ...p, notes: typeof v === 'function' ? v(p.notes) : v }))} saveState={saveState}
          practiceCards={(profile.practiceCards ?? []).filter((card) => card.topicId === activeTopicId)}
          onSavePractice={saveAssistantPractice}
          onReviewPractice={(id, status) => patchProfile({ practiceCards: (profile.practiceCards ?? []).map((card) => card.id === id ? { ...card, status, reviewedAt: new Date().toISOString() } : card) })}
          onAssistantFeedback={(rating) => profile.pilotMetricsEnabled && patchProfile((p) => ({ ...p, pilot: { ...p.pilot, assistantFeedback: { ...p.pilot.assistantFeedback, [rating]: p.pilot.assistantFeedback[rating] + 1 } } }))}
          onRetrySave={() => setProfile((p) => ({ ...p }))}
          onBack={() => patchProfile({ workspaceView: 'resources' })} />}
    </>}
    {tourOpen && user && <OnboardingTour onReplay={tourReplay} onClose={() => { save(tourKey(user), true); setTourOpen(false); setTourReplay(false) }} />}
  </div>
}
