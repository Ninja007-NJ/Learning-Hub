import { useEffect, useMemo, useState } from 'react'
import { CURRICULUM, SEED_RESOURCES } from './data'
import { load, save } from './lib'
import { TopBar, Button } from './components/ui'
import LoginPage from './pages/LoginPage'
import SelectPage from './pages/SelectPage'
import ResourcesPage from './pages/ResourcesPage'
import StudyArea from './pages/StudyArea'

const freshProfile = () => ({ sel: null, page: 'dashboard', topicId: null, workspaceView: 'resources', resources: SEED_RESOURCES, bookmarks: [], notes: {} })
const profileKey = (user) => `hub2.profile.${encodeURIComponent(user.email.trim().toLowerCase())}`
const migrateProfile = (saved) => ({
  ...freshProfile(),
  ...saved,
  page: saved?.page === 'profile' ? 'profile' : 'dashboard',
  workspaceView: saved?.workspaceView ?? (saved?.page === 'study' ? 'study' : 'resources'),
  resources: (saved?.resources ?? SEED_RESOURCES).map((resource) => resource.id === 3 && /dQw4w9WgXcQ/.test(resource.url ?? '')
    ? SEED_RESOURCES.find((seed) => seed.id === 3)
    : resource),
})

function Dashboard({ user, subject, topics, resources, notes, topicId, onOpen, onSetup }) {
  const current = topics.find((topic) => topic.id === topicId) ?? topics[0]
  const noteCount = Object.values(notes).filter((note) => note?.trim()).length
  const countFor = (topic) => resources.filter((item) => item.topic === topic.id).length
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
          <div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => onOpen('study')}>Continue on study board</Button><Button variant="secondary" onClick={() => onOpen('resources')}>Open topic materials</Button></div>
        </div>
        <div className="syllabus-card frost p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-ink-soft font-bold">Your syllabus</p><h2 className="text-xl font-bold mt-1">{subject.title}</h2></div><button className="text-sm underline" onClick={onSetup}>Edit</button></div>
          <ul className="mt-4 divide-y divide-black/10">{topics.slice(0, 4).map((topic) => <li key={topic.id}><button onClick={() => onOpen('resources', topic.id)} className="w-full py-3 flex justify-between gap-3 text-left hover:bg-black/[.03] rounded-lg px-2"><span>{topic.title}</span><span className="text-sm text-ink-soft">{countFor(topic)} {countFor(topic) === 1 ? 'material' : 'materials'} →</span></button></li>)}</ul>
          {topics.length > 4 && <p className="text-xs text-ink-soft mt-2">+ {topics.length - 4} more topics</p>}
        </div>
      </section>
      <p className="text-xs text-ink-soft px-1">Demo data is saved in this browser. Sign-in and shared class materials are not yet backed by private student accounts.</p>
    </> : <section className="frost p-8 text-center"><div className="text-4xl" aria-hidden>▤</div><h2 className="text-2xl font-bold mt-3">Set up your learning space</h2><p className="text-ink-soft max-w-xl mx-auto mt-2">Choose your course and syllabus topics first. You can change them any time, and you can start with the sample curriculum.</p><Button className="mt-5" onClick={onSetup}>Choose course and topics</Button></section>}
  </main>
}

function Profile({ user, topics, resources, notes, onSave, onBack }) {
  const [name, setName] = useState(user.name)
  const [message, setMessage] = useState('')
  const saveName = (event) => { event.preventDefault(); onSave({ ...user, name: name.trim() || user.name }); setMessage('Profile updated on this device.') }
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ profile: user, topics, resources, notes }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'syllabus-hub-study-data.json'; link.click(); URL.revokeObjectURL(url)
    setMessage('Your study data export has downloaded.')
  }
  return <main className="max-w-3xl mx-auto p-4 sm:p-8 space-y-5">
    <button className="text-sm underline" onClick={onBack}>← Back to dashboard</button>
    <section className="glass rounded-[28px] p-6 sm:p-8"><p className="text-xs uppercase tracking-wider font-bold text-ink-soft">Account and privacy</p><h1 className="text-3xl font-black mt-2">Your profile</h1><p className="text-ink-soft mt-2">Manage your demo profile and take a copy of your study data.</p></section>
    <form onSubmit={saveName} className="frost p-6 space-y-4"><label className="block text-sm font-medium">Display name<input className="block mt-1 w-full rounded-xl border border-black/20 px-4 py-3" value={name} onChange={(e) => setName(e.target.value)} /></label><label className="block text-sm font-medium">Email address<input className="block mt-1 w-full rounded-xl border border-black/20 px-4 py-3 bg-[#f5f5f2]" value={user.email} readOnly /></label><Button type="submit">Save profile</Button></form>
    <section className="frost p-6"><h2 className="font-bold text-lg">Your data</h2><p className="text-sm text-ink-soft mt-2">This demo stores profile, typed notes, and whiteboard strokes in this browser. It does not yet provide secure accounts or cross-device sync.</p><Button variant="secondary" className="mt-4" onClick={exportData}>Download my study data</Button></section>
    {message && <p role="status" aria-live="polite" className="text-sm">{message}</p>}
  </main>
}

export default function App() {
  const [user, setUser] = useState(() => load('hub2.user', null))
  const [profile, setProfile] = useState(() => {
    const savedUser = load('hub2.user', null)
    return savedUser ? migrateProfile(load(profileKey(savedUser), freshProfile())) : freshProfile()
  })
  const [sharedResources, setSharedResources] = useState(() => load('hub2.shared.resources', []))
  const [saveState, setSaveState] = useState('saved')
  const { sel, page, topicId, resources, bookmarks, notes, workspaceView = 'resources' } = profile
  const patchProfile = (patch) => setProfile((p) => ({ ...p, ...patch }))
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
  useEffect(() => { save('hub2.shared.resources', sharedResources) }, [sharedResources])

  const subject = useMemo(() => {
    if (!sel) return null
    const course = CURRICULUM.find((c) => c.id === sel.courseId)
    return course?.semesters[sel.semester]?.find((s) => s.id === sel.subjectId) ?? null
  }, [sel])
  const topics = useMemo(() => subject ? subject.modules.flatMap((m) => m.topics.filter((t) => sel.topicIds.includes(t.id)).map((t) => ({ ...t, module: m.title }))) : [], [subject, sel])
  const activeTopicId = topics.some((t) => t.id === topicId) ? topicId : topics[0]?.id
  const canGo = (p) => p === 'login' ? !user : !!user && (p === 'dashboard' || p === 'profile' || p === 'select' || (p === 'workspace' && topics.length > 0))
  const effectivePage = canGo(page) ? page : user ? 'dashboard' : 'login'
  const go = (p) => { if (canGo(p)) { patchProfile({ page: p }); window.scrollTo({ top: 0 }) } }
  const toggleBookmark = (id) => patchProfile({ bookmarks: bookmarks.includes(id) ? bookmarks.filter((x) => x !== id) : [...bookmarks, id] })
  const signOut = () => { setUser(null); patchProfile({ page: 'login' }) }
  const login = (nextUser) => {
    const normalized = { ...nextUser, email: nextUser.email.trim().toLowerCase() }
    setProfile(migrateProfile(load(profileKey(normalized), freshProfile())))
    setProfile((p) => ({ ...p, page: 'dashboard' }))
    setUser(normalized)
  }
  const openWorkspace = (view = 'resources', id = activeTopicId) => { patchProfile({ topicId: id, workspaceView: view, page: 'workspace' }); window.scrollTo({ top: 0 }) }
  const setResources = (value) => setProfile((p) => ({ ...p, resources: typeof value === 'function' ? value(p.resources) : value }))

  return <div className="min-h-screen">
    <TopBar page={effectivePage} user={user} canGo={canGo} onGo={go} onSignOut={signOut} />
    {effectivePage === 'login' && <LoginPage onLogin={login} />}
    {effectivePage === 'dashboard' && user && <Dashboard user={user} subject={subject} topics={topics} resources={[...resources, ...sharedResources]} notes={notes} topicId={activeTopicId} onOpen={openWorkspace} onSetup={() => go('select')} />}
    {effectivePage === 'select' && user && <SelectPage user={user} initial={sel} onDone={(s) => { patchProfile({ sel: s, topicId: s.topicIds[0], workspaceView: 'resources', page: 'dashboard' }); window.scrollTo({ top: 0 }) }} />}
    {effectivePage === 'profile' && user && <Profile user={user} topics={topics} resources={[...resources, ...sharedResources]} notes={notes} onSave={setUser} onBack={() => go('dashboard')} />}
    {effectivePage === 'workspace' && subject && <>
      <div className="sticky top-[120px] z-30 bg-[#efefed] border-b border-black/15 px-4 sm:px-8 py-2 flex items-center gap-3"><button className="text-sm underline" onClick={() => go('dashboard')}>← Dashboard</button><span className="text-sm text-ink-soft truncate">{subject.title}</span><div className="flex-1"/><div className="inline-flex p-1 rounded-xl border border-black bg-white" role="tablist" aria-label="Topic workspace"><button role="tab" aria-selected={workspaceView === 'resources'} onClick={() => patchProfile({ workspaceView: 'resources' })} className={`px-3 py-1.5 rounded-lg text-sm ${workspaceView === 'resources' ? 'bg-black text-white' : ''}`}>Materials</button><button role="tab" aria-selected={workspaceView === 'study'} onClick={() => patchProfile({ workspaceView: 'study' })} className={`px-3 py-1.5 rounded-lg text-sm ${workspaceView === 'study' ? 'bg-black text-white' : ''}`}>Study space</button></div></div>
      {workspaceView === 'resources' ? <ResourcesPage subject={subject} userName={user.name} topics={topics} topicId={activeTopicId} setTopicId={(id) => patchProfile({ topicId: id })} resources={[...resources, ...sharedResources]} setResources={setResources} onShareNotes={(items) => setSharedResources((current) => [...items, ...current])} bookmarks={bookmarks} toggleBookmark={toggleBookmark} notes={notes} onStudy={(id) => openWorkspace('study', id)} onChangeSelection={() => go('select')} />
        : <StudyArea userId={user.email} userName={user.name} topics={topics} topicId={activeTopicId} setTopicId={(id) => patchProfile({ topicId: id })} resources={[...resources, ...sharedResources]} notes={notes} setNotes={(v) => setProfile((p) => ({ ...p, notes: typeof v === 'function' ? v(p.notes) : v }))} saveState={saveState} onBack={() => patchProfile({ workspaceView: 'resources' })} />}
    </>}
  </div>
}
