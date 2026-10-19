/* Progress from the student's own ratings. Replaces the fixed 'covered / missing' labels in data.js. */
export const LEVEL_LABELS = ['Not rated', 'Shaky', 'Okay', 'Confident']
const STATUS_FOR = ['missing', 'review', 'partial', 'covered']
const LEVEL_FOR = { 'not started': 0, 'not rated': 0, shaky: 1, okay: 2, confident: 3 }

export const levelOf = (topic, conf) => {
  const value = conf?.[topic.id] ?? 0
  return Math.max(0, Math.min(3, Number.isFinite(Number(value)) ? Number(value) : (LEVEL_FOR[String(value).toLowerCase()] ?? 0)))
}
export const liveStatus = (topic, conf) => STATUS_FOR[levelOf(topic, conf)]
export const withLiveStatus = (topics, conf) => topics.map((t) => ({ ...t, status: liveStatus(t, conf) }))
export const selfRatedPercent = (topics, conf) => (topics.length ? Math.round((topics.reduce((s, t) => s + levelOf(t, conf), 0) / (topics.length * 3)) * 100) : 0)
export const evidenceFor = (topic, { notes, resources, cards }) => ({
  notes: (notes?.[topic.id] ?? '').trim() ? 1 : 0,
  resources: resources.filter((r) => r.topic === topic.id).length,
  cards: (cards ?? []).filter((c) => c.topicId === topic.id).length,
})
