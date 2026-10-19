import { useMemo, useState } from 'react'
import { STATUS } from '../data'
import { SECTIONS, labelFor } from '../lib'
import { Button, focusRing, ProgressRing } from './ui'

const WEIGHT = { covered: 1, partial: 0.5, review: 0.25, missing: 0 }
const BAR = { covered: 'bg-lite-covered', partial: 'bg-lite-partial', review: 'bg-lite-review', missing: 'bg-lite-missing' }

export default function InsightsCard({ subject, topics, resources, onOpenTopic }) {
  const [open, setOpen] = useState(false)
  const { pct, counts, byType, next } = useMemo(() => {
    const pct = topics.length ? Math.round(topics.reduce((sum, t) => sum + (WEIGHT[t.status] ?? 0), 0) / topics.length * 100) : 0
    const counts = Object.keys(STATUS).map((key) => ({ key, count: topics.filter((t) => t.status === key).length }))
    const byType = SECTIONS.map((section) => ({ ...section, count: resources.filter((r) => r.type === section.id).length }))
    const next = topics.map((topic) => ({ topic, count: resources.filter((r) => r.topic === topic.id).length }))
      .sort((a, b) => (WEIGHT[a.topic.status] ?? 0) - (WEIGHT[b.topic.status] ?? 0) || a.count - b.count).slice(0, 3)
    return { pct, counts, byType, next }
  }, [topics, resources])

  return (
    <section className="glass glow-edge rounded-[26px] overflow-hidden" aria-label="Your learning insights">
      <div className="flex items-center gap-3 p-3 sm:px-4">
        <ProgressRing value={pct} size={54} label="Estimated coverage" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-mist">Your progress <span className="text-fog font-normal">· {subject.title}</span></p>
          <p className="text-xs text-fog">Estimated syllabus coverage across {topics.length} topics</p>
        </div>
        <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs text-mist hover:bg-white/10 ${focusRing}`}>
          {open ? 'Hide details' : 'View details'} <span aria-hidden>{open ? '⌃' : '⌄'}</span>
        </button>
      </div>
      {open && <div className="border-t border-white/10 px-4 py-4 grid gap-5 md:grid-cols-[1fr_1fr_1.3fr]">
        <div>
          <h3 className="text-xs font-semibold text-mist mb-2">Topic coverage</h3>
          <div className="space-y-2">{counts.map(({ key, count }) => <div key={key} className="flex items-center gap-2 text-xs">
            <span className={`w-28 shrink-0 text-fog`}><span className={STATUS[key].dotDark}>{STATUS[key].icon}</span> {STATUS[key].label.replace(' (estimate)', '')}</span>
            <span className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden"><span className={`block h-full rounded-full ${BAR[key]}`} style={{ width: `${topics.length ? count / topics.length * 100 : 0}%` }} /></span>
            <span className="w-5 text-right text-fog">{count}</span>
          </div>)}</div>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-mist mb-2">Resource mix</h3>
          <div className="flex flex-wrap gap-1.5">{byType.map((section) => <span key={section.id} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-mist">{section.icon} {labelFor(section.id)} <span className="text-fog">{section.count}</span></span>)}</div>
          <p className="text-[11px] text-fog mt-2">Resources saved across your selected topics.</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-mist mb-2">Study next</h3>
          {next.length ? <ul className="space-y-1.5">{next.map(({ topic, count }) => <li key={topic.id} className="flex items-center gap-2">
            <span className={`shrink-0 ${STATUS[topic.status].dotDark}`} aria-hidden>{STATUS[topic.status].icon}</span>
            <span className="flex-1 min-w-0 truncate text-sm text-mist">{topic.title} <span className="text-xs text-fog">· {count} resource{count === 1 ? '' : 's'}</span></span>
            <Button type="button" variant="dark" className="!px-3 !py-1 text-xs" onClick={() => onOpenTopic(topic.id)}>Open</Button>
          </li>)}</ul> : <p className="text-sm text-fog">Choose topics to see a study path.</p>}
        </div>
        <p className="text-[11px] text-fog md:col-span-3">Coverage is an estimate based on syllabus labels and sample metadata. It does not measure mastery, verify resource quality, or confirm exam readiness.</p>
      </div>}
    </section>
  )
}
