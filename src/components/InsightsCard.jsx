import { useMemo, useState } from 'react'
import { SECTIONS, labelFor } from '../lib'
import { Button, focusRing, ProgressRing } from './ui'

const RATING = { 'not started': 0, shaky: 1, okay: 2, confident: 3 }
const RATING_STYLE = { 'not started': 'text-fog', shaky: 'text-amber-600', okay: 'text-sky-700', confident: 'text-emerald-700' }

export default function InsightsCard({ subject, topics, resources, notes = {}, cards = [], confidence = {}, onOpenTopic }) {
  const [open, setOpen] = useState(false)
  const { pct, counts, byType, next, noteCount, cardCount } = useMemo(() => {
    const ratingFor = (topic) => confidence[topic.id] ?? 'not started'
    const pct = topics.length ? Math.round(topics.reduce((sum, topic) => sum + (RATING[ratingFor(topic)] ?? 0), 0) / topics.length / 3 * 100) : 0
    const counts = Object.keys(RATING).map((key) => ({ key, count: topics.filter((topic) => ratingFor(topic) === key).length }))
    const byType = SECTIONS.map((section) => ({ ...section, count: resources.filter((r) => r.type === section.id).length }))
    const next = topics.map((topic) => ({ topic, rating: ratingFor(topic), resourceCount: resources.filter((r) => r.topic === topic.id).length, hasNotes: Boolean(notes[topic.id]?.trim()), cardCount: cards.filter((card) => card.topicId === topic.id).length }))
      .sort((a, b) => (RATING[a.rating] ?? 0) - (RATING[b.rating] ?? 0) || Number(a.hasNotes) - Number(b.hasNotes) || a.resourceCount - b.resourceCount).slice(0, 3)
    const noteCount = topics.filter((topic) => Boolean(notes[topic.id]?.trim())).length
    const cardCount = cards.length
    return { pct, counts, byType, next, noteCount, cardCount }
  }, [topics, resources, notes, cards, confidence])

  return (
    <section className="glass glow-edge ui-terminal rounded-[26px] overflow-hidden" aria-label="Your learning insights">
      <div className="flex items-center gap-3 p-3 sm:px-4">
        <ProgressRing value={pct} size={54} label="Average self-rating" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-mist">Your progress <span className="text-fog font-normal">· {subject.title}</span></p>
          <p className="text-xs text-fog">Average self-rating across {topics.length} topics · not a mastery score</p>
        </div>
        <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs text-mist hover:bg-white/10 ${focusRing}`}>
          {open ? 'Hide details' : 'View details'} <span aria-hidden>{open ? '⌃' : '⌄'}</span>
        </button>
      </div>
      {open && <div className="border-t border-white/10 px-4 py-4 grid gap-5 md:grid-cols-[1fr_1fr_1.3fr]">
        <div>
          <h3 className="text-xs font-semibold text-mist mb-2">Your confidence ratings</h3>
          <div className="space-y-2">{counts.map(({ key, count }) => <div key={key} className="flex items-center gap-2 text-xs">
            <span className={`w-28 shrink-0 ${RATING_STYLE[key]}`}>{key}</span>
            <span className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden"><span className="block h-full rounded-full bg-brand" style={{ width: `${topics.length ? count / topics.length * 100 : 0}%` }} /></span>
            <span className="w-5 text-right text-fog">{count}</span>
          </div>)}</div>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-mist mb-2">Resource mix</h3>
          <div className="flex flex-wrap gap-1.5">{byType.map((section) => <span key={section.id} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-mist">{section.icon} {labelFor(section.id)} <span className="text-fog">{section.count}</span></span>)}</div>
          <p className="text-[11px] text-fog mt-2">{noteCount} topics with personal notes · {resources.length} resources · {cardCount} practice cards.</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-mist mb-2">Study next</h3>
          {next.length ? <ul className="space-y-1.5">{next.map(({ topic, rating, resourceCount, hasNotes, cardCount: topicCards }) => <li key={topic.id} className="flex items-center gap-2">
            <span className={`shrink-0 ${RATING_STYLE[rating]}`} aria-hidden>●</span>
            <span className="flex-1 min-w-0 truncate text-sm text-mist">{topic.title} <span className="text-xs text-fog">· {rating} · {resourceCount} resources · {hasNotes ? 'notes' : 'no notes'} · {topicCards} cards</span></span>
            <Button type="button" variant="dark" className="!px-3 !py-1 text-xs" onClick={() => onOpenTopic(topic.id)}>Open</Button>
          </li>)}</ul> : <p className="text-sm text-fog">Choose topics to see a study path.</p>}
        </div>
        <p className="text-[11px] text-fog md:col-span-3">This summary reflects your own confidence ratings and counts of saved materials. Self-ratings are not verified measures of understanding or exam readiness; resource counts do not confirm quality.</p>
      </div>}
    </section>
  )
}
