import { useEffect, useMemo, useRef, useState } from 'react'
import MiniSearch from 'minisearch'
import { STATUS } from '../data'
import { SECTIONS, guessType, hostOf, iconFor, isUrl, labelFor } from '../lib'
import { Badge, Button, MenuButton, Preview, ResourceCard, focusRing } from '../components/ui'
import InsightsCard from '../components/InsightsCard'
import NotesUploadDialog from '../components/NotesUploadDialog'

export default function ResourcesPage({
  subject, userName, topics, topicId, setTopicId, resources, setResources, onShareNotes, bookmarks, toggleBookmark,
  notes, onStudy, onChangeSelection,
}) {
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [quick, setQuick] = useState('')
  const [quickType, setQuickType] = useState('auto')
  const [flash, setFlash] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const searchRef = useRef(null)
  const flashTimer = useRef(null)

  const topic = topics.find((t) => t.id === topicId) ?? topics[0]
  const topicIdsSet = useMemo(() => new Set(topics.map((t) => t.id)), [topics])
  const scoped = useMemo(() => resources.filter((r) => topicIdsSet.has(r.topic)), [resources, topicIdsSet])
  const topicResources = scoped.filter((r) => r.topic === topic.id)
  const sharedCount = scoped.filter((r) => r.scope === 'shared').length
  const selected = scoped.find((r) => r.id === selectedId) ?? null

  const showFlash = (msg) => {
    setFlash(msg)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(''), 3000)
  }

  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'Escape') { setQuery(''); searchRef.current?.blur() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Instant client-side search
  const index = useMemo(() => {
    const ms = new MiniSearch({
      fields: ['title', 'topicTitle', 'source', 'typeLabel', 'content'],
      storeFields: ['id'],
      searchOptions: { prefix: true, fuzzy: 0.2, boost: { title: 2 } },
    })
    ms.addAll(scoped.map((r) => ({
      id: r.id, title: r.title, source: r.source, content: r.content ?? '',
      topicTitle: topics.find((t) => t.id === r.topic)?.title ?? '', typeLabel: labelFor(r.type),
    })))
    return ms
  }, [scoped, topics])

  const q = query.trim()
  const hits = useMemo(() => {
    if (!q) return { resources: [], topics: [] }
    const ids = new Set(index.search(q).map((h) => h.id))
    return {
      resources: scoped.filter((r) => ids.has(r.id)),
      topics: topics.filter((t) => t.title.toLowerCase().includes(q.toLowerCase())),
    }
  }, [q, index, scoped, topics])

  const goTo = (tid, rid = null) => { setTopicId(tid); setSelectedId(rid); setQuery(''); window.scrollTo({ top: 0 }) }
  const jump = (id) => document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const copyClassRequest = async () => {
    const request = `Could someone share study resources for ${topic.title}? I am looking for: ${topic.missing.join(', ') || 'additional examples and practice questions'}.`
    try {
      await navigator.clipboard.writeText(request)
      showFlash('A request for your class has been copied. Paste it into your class chat.')
    } catch {
      showFlash('Could not access the clipboard. Add a link here or use Suggest a link.')
    }
  }
  const shareNotes = (items) => {
    onShareNotes(items)
    showFlash(`${items.length} note${items.length === 1 ? '' : 's'} shared in this browser’s class library. Rights information is uploader-declared, not verified.`)
  }

  const saveUploadedNotes = (items, scope) => {
    if (scope === 'class') shareNotes(items)
    else {
      setResources((current) => [...items, ...current])
      showFlash(`${items.length} note${items.length === 1 ? '' : 's'} saved to My Space on this device.`)
    }
  }

  // Quick add: shows instantly (optimistic); details fill in afterwards
  const quickAdd = (e) => {
    e.preventDefault()
    const text = quick.trim()
    if (!text) return
    const url = isUrl(text) ? text : ''
    const type = quickType === 'auto' ? (url ? guessType(url) : 'notes') : quickType
    const id = Date.now()
    setResources((rs) => [{
      id, topic: topic.id, type, title: url ? hostOf(url) : text,
      kind: url ? 'Link' : 'Note', source: 'You', checked: 'just now', url, content: url ? '' : text, pending: !!url,
    }, ...rs])
    setSelectedId(id)
    setQuick('')
    showFlash(`Saved to ${topic.title} in My Space (private)`)
    if (url) setTimeout(() => setResources((rs) => rs.map((r) => (r.id === id ? { ...r, pending: false } : r))), 800)
  }

  const visibleSections = SECTIONS.filter((s) => topicResources.some((r) => r.type === s.id))
  const modules = subject.modules
    .map((m) => ({ ...m, topics: m.topics.filter((t) => topicIdsSet.has(t.id)) }))
    .filter((m) => m.topics.length > 0)

  return (
    <>
    <div id="top" className="grid grid-cols-1 md:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_300px] min-h-[calc(100vh-3.5rem)]">
      {/* Left: your selected topics */}
      <nav className="bg-white/5 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/10 p-4 sm:p-5 max-h-56 overflow-y-auto md:max-h-none md:overflow-visible" aria-label="Syllabus">
        <p className="text-xs font-semibold text-fog mb-2">Your syllabus</p>
        <p className="font-semibold leading-snug text-mist">{subject.title}</p>
        <button onClick={onChangeSelection} className={`text-sm text-glow hover:underline my-3 ${focusRing}`}>Edit class and topics ↗</button>
        {modules.map((m) => (
          <div key={m.id} className="mb-4">
            <p className="text-xs text-fog mb-1.5">{m.title}</p>
            <ul>
              {m.topics.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => goTo(t.id)}
                    aria-current={t.id === topic.id ? 'page' : undefined}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl transition-colors duration-150 hover:bg-white/10 ${focusRing} ${t.id === topic.id ? 'bg-white/10 text-mist font-semibold border-l-2 border-brand' : 'text-mist'}`}
                  >
                    <span className={STATUS[t.status].dotDark} aria-hidden>{STATUS[t.status].icon}</span>
                    <span className="sr-only">{STATUS[t.status].label}:</span>
                    <span className="flex-1">{t.title}</span>
                    <span className="text-xs text-fog">{scoped.filter((r) => r.topic === t.id).length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="border-t border-white/10 pt-4 mt-5 text-sm text-fog space-y-1.5">
          <p className="rounded-lg bg-white/10 px-3 py-2 text-mist"><span className="font-medium">My Space</span> <span className="text-xs text-fog">· private</span></p>
          <p className="px-3 py-2 flex items-center gap-2"><span className="flex-1">Shared class notes</span><span className="rounded-md bg-white/10 px-2 py-0.5 text-xs tabular-nums">{sharedCount}</span></p>
          <p className="px-3 py-2 flex items-center gap-2"><span className="flex-1">Saved</span><span className="rounded-md bg-white/10 px-2 py-0.5 text-xs tabular-nums">{bookmarks.length}</span></p>
        </div>
      </nav>

      {/* Centre: one page with everything for the topic */}
      <main className="p-4 sm:p-6 xl:p-8 min-w-0 max-w-5xl w-full mx-auto">
          <div className="flex items-center justify-between gap-3 mb-4">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-fog">Your course · learning materials</p><h1 className="mt-1 text-3xl sm:text-4xl font-black uppercase leading-none tracking-[-0.06em]">Study library</h1><p className="text-xs text-fog mt-2">{topics.length} selected syllabus topics</p></div>
          <button onClick={() => onStudy(topic.id)} className={`xl:hidden inline-flex items-center gap-2 rounded-lg bg-brand text-white px-4 py-2 text-sm font-medium ${focusRing}`}>Study <span aria-hidden>↗</span></button>
        </div>
        <div className="mb-5">
          <InsightsCard subject={subject} topics={topics} resources={scoped} onOpenTopic={goTo} />
        </div>
        <div className="relative mb-5">
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, notes, videos…  (Ctrl+K)"
            aria-label="Search resources"
            className={`w-full rounded-full bg-frost text-ink px-4 py-3 border border-white/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] placeholder:text-ink-soft/70 ${focusRing}`}
          />
          {q && (
            <div className="frost absolute left-0 right-0 mt-2 max-h-80 overflow-y-auto p-2 z-30">
              {hits.topics.map((t) => (
                <button key={t.id} onClick={() => goTo(t.id)} className={`w-full text-left px-3 py-2 rounded-btn hover:bg-brand-light ${focusRing}`}>
                  <span className={STATUS[t.status].dot} aria-hidden>{STATUS[t.status].icon}</span> Topic: {t.title}
                </button>
              ))}
              {hits.resources.map((r) => (
                <button key={r.id} onClick={() => goTo(r.topic, r.id)} className={`w-full text-left px-3 py-2 rounded-btn hover:bg-brand-light ${focusRing}`}>
                  <span aria-hidden>{iconFor(r.type)}</span> {r.title}
                  <span className="text-sm text-ink-soft"> in {topics.find((t) => t.id === r.topic)?.title}</span>
                </button>
              ))}
              {hits.topics.length + hits.resources.length === 0 && (
                <p className="px-3 py-2 text-sm text-ink-soft">Nothing matches "{query}". Try a topic name or a shorter word.</p>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-fog">{subject.title} <span className="px-1">/</span> {topic.module}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1 mb-4">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-mist">{topic.title}</h2>
          <Badge status={topic.status} />
          <div className="flex-1" />
          <MenuButton label="Add" items={[
            { label: 'Paste a link or note', onSelect: () => document.getElementById('quick-add')?.focus() },
            { label: 'Upload class notes', onSelect: () => setUploadOpen(true) },
            { label: 'Copy a class request', onSelect: copyClassRequest },
          ]} />
          <Button className="hidden xl:inline-flex" onClick={() => onStudy(topic.id)}>Open study area <span aria-hidden>↗</span></Button>
        </div>

          <div className="frost p-4 sm:p-5 mb-4 text-sm">
          {topic.missing.length === 0 ? (
                <p>All required subtopics have supporting resources. <span className="text-ink-soft">This is an estimate, not proof of exam readiness.</span></p>
          ) : (
            <>
              <p><span className="font-medium">Still missing:</span> {topic.missing.join(', ')}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button variant="secondary" className="!py-1.5 text-sm" onClick={() => { setQuery(topic.title.split(' ')[0]); searchRef.current?.focus() }}>Search library</Button>
                <Button variant="secondary" className="!py-1.5 text-sm" onClick={() => document.getElementById('quick-add')?.focus()}>Suggest a link</Button>
                <Button variant="secondary" className="!py-1.5 text-sm" onClick={copyClassRequest}>Copy class request</Button>
              </div>
            </>
          )}
        </div>

        <section aria-label="Free learning platforms" className="mb-5">
          <div className="flex items-end justify-between gap-3 mb-2"><div><p className="text-xs text-glow font-semibold">Free learning links</p><h2 className="font-semibold text-sm mt-0.5 text-mist">Continue learning about {topic.title}</h2></div><span className="text-xs text-fog hidden sm:inline">Opens the provider in a new tab</span></div>
          <div className="grid sm:grid-cols-3 gap-2">
            {[
              { name: 'YouTube', detail: 'Videos for this topic', mark: '▶', href: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${subject.title} ${topic.title} lecture`)}` },
              { name: 'NPTEL', detail: 'Free course lectures', mark: 'N', href: /operating systems/i.test(subject.title) ? 'https://nptel.ac.in/courses/106106144' : 'https://www.nptel.ac.in/yt-courses' },
              { name: 'MIT OpenCourseWare', detail: 'Open course materials', mark: 'M', href: `https://ocw.mit.edu/search/?q=${encodeURIComponent(`${subject.title} ${topic.title}`)}` },
            ].map((platform) => <a key={platform.name} href={platform.href} target="_blank" rel="noopener noreferrer" className={`glass group flex items-center gap-3 p-3 rounded-xl hover:bg-white/15 transition ${focusRing}`}><span className="w-9 h-9 rounded-md bg-brand text-white font-bold grid place-items-center">{platform.mark}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-mist truncate">{platform.name}</span><span className="block text-xs text-fog truncate">{platform.detail}</span></span><span className="text-fog group-hover:text-glow" aria-hidden>↗</span></a>)}
          </div>
          <p className="text-xs text-fog mt-2">Provider links are topic searches or course pages, not endorsements. Check the level and current terms on each site.</p>
        </section>

        <form onSubmit={quickAdd} className="glass flex flex-wrap gap-2 mb-2 rounded-[22px] p-2">
          <input
            id="quick-add"
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder={`Paste a link or type a note for ${topic.title}, then press Enter`}
            aria-label="Quick add resource"
            className={`flex-1 min-w-[200px] rounded-full bg-frost text-ink px-4 py-2 border border-white/70 placeholder:text-ink-soft/70 ${focusRing}`}
          />
          <select value={quickType} onChange={(e) => setQuickType(e.target.value)} aria-label="Resource type"
            className={`border border-white/60 rounded-full px-3 py-2 bg-frost text-ink ${focusRing}`}>
            <option value="auto">Auto type</option>
            {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <Button type="submit" variant="secondary" disabled={!quick.trim()}>+ Add</Button>
          <Button type="button" variant="secondary" onClick={() => setUploadOpen(true)}>↑ Upload notes</Button>
        </form>
        <p className="text-sm min-h-5 mb-2 text-lite-covered" role="status" aria-live="polite">{flash}</p>

        {visibleSections.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4" aria-label="Jump to section">
            {visibleSections.map((s) => (
              <button key={s.id} onClick={() => jump(s.id)}
                className={`glass px-3 py-1 rounded-full text-sm text-mist hover:bg-white/20 transition duration-150 ${focusRing}`}>
                {s.label} ({topicResources.filter((r) => r.type === s.id).length})
              </button>
            ))}
          </div>
        )}

        <div className="space-y-6">
          {visibleSections.map((s) => (
            <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-20">
              <h2 className="font-semibold mb-2 flex items-center gap-2 text-mist">{s.icon} {s.label}<span className="text-xs font-normal text-fog">{topicResources.filter((r) => r.type === s.id).length}</span></h2>
              <div className="space-y-2">
                {topicResources.filter((r) => r.type === s.id).map((r) => (
                  <ResourceCard key={r.id} r={r} selected={selectedId === r.id} onSelect={() => setSelectedId(r.id)}
                    bookmarked={bookmarks.includes(r.id)} onBookmark={() => { const wasSaved = bookmarks.includes(r.id); toggleBookmark(r.id); showFlash(wasSaved ? 'Removed from Saved.' : 'Added to Saved.') }} />
                ))}
              </div>
            </section>
          ))}

          {topicResources.length === 0 && (
            <div className="frost border-dashed p-8 sm:p-12 text-center">
              <span className="inline-grid place-items-center rounded-2xl w-14 h-14 bg-brand-light text-2xl mb-3" aria-hidden>⌕</span>
              <p className="font-semibold">No resources for this topic yet</p>
              <p className="text-sm text-ink-soft mt-1">Add a useful link or a quick note. It will appear here under {topic.title}.</p>
            </div>
          )}

          <section className="frost p-4 sm:p-5 flex items-center gap-3">
            <div className="flex-1">
              <h2 className="font-semibold">Study area for {topic.title}</h2>
              <p className="text-sm text-ink-soft">
                {(notes[topic.id] ?? '').trim() ? 'You have typed notes saved for this topic.' : 'A blank space to draw, write and work. Your resources stay beside you.'}
              </p>
            </div>
            <Button variant="secondary" onClick={() => onStudy(topic.id)}>Open</Button>
          </section>
        </div>
      </main>

      <aside className="md:col-span-2 xl:col-span-1 bg-white/5 backdrop-blur-xl border-t xl:border-t-0 xl:border-l border-white/10 p-4 sm:p-5 xl:sticky xl:top-14 xl:self-start xl:max-h-[calc(100vh-3.5rem)] xl:overflow-y-auto" aria-label="Preview">
        <p className="text-xs font-semibold text-fog mb-2">Resource preview</p>
        {selected ? <Preview r={selected} /> : <div className="min-h-32 rounded-2xl border border-dashed border-white/15 bg-white/5 grid place-items-center text-center p-5"><p className="text-sm text-fog">Choose a resource card to preview it here.</p></div>}
      </aside>
    </div>
    <NotesUploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onSave={saveUploadedNotes} topics={topics} currentTopicId={topic.id} userName={userName} />
    </>
  )
}
