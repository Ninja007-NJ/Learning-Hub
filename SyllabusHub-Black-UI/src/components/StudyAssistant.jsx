import { useEffect, useMemo, useState } from 'react'
import { Button, focusRing } from './ui'

const STOP = new Set(['what','where','when','which','that','this','with','from','have','does','into','about','please','could','would','explain','simple','make','notes','note','summarize','summary','give','tell','the','and','for','are','you','is','was','were','how','why','can','will','should','does','define','describe','show','me','my','your','these','those','their','them','then','than','also','using','used'])

function localAnswer(question, topic, resources, typedNotes) {
  const noteSources = [
    ...(typedNotes.trim() ? [{ title: 'Your typed notes', text: typedNotes, id: null }] : []),
    ...resources.filter((resource) => resource.content?.trim()).map((resource) => ({ title: resource.title, text: resource.content, id: resource.id })),
  ]
  const rights = resources.filter((resource) => resource.scope === 'shared' && resource.rights)
  const q = question.toLowerCase()
  if (/legal|licen[cs]e|copyright|permission|allowed to share/.test(q)) {
    const declarations = rights.map((resource) => `• ${resource.title}: uploader declared “${resource.rights.license}”; source ${resource.rights.source || 'not supplied'}. This declaration is unverified.`)
    return { answer: `I can show the sharing information recorded for this topic, but I can’t decide whether a note is legally valid. Verify the original licence or permission with the owner or your institution.\n${declarations.join('\n') || '• No rights declaration is attached to the readable notes in this topic.'}`, summary: '', sources: [] }
  }
  const terms = [...new Set(q.split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !STOP.has(word)))]
  if (noteSources.length === 0) {
    const links = resources.filter((resource) => resource.url && terms.some((term) => `${resource.title} ${resource.type}`.toLowerCase().includes(term))).slice(0, 3)
    return {
      answer: `I don’t have readable text to answer from for ${topic.title} yet. Add typed notes or a text-based PDF, TXT, or Markdown file. I can’t safely infer an answer from a link title alone.`,
      summary: '', sources: [], links,
    }
  }
  const sentences = noteSources.flatMap((source) => source.text.split(/(?<=[.!?])\s+|\n+/).map((text) => ({ text: text.trim(), title: source.title, id: source.id })).filter((item) => item.text.length > 24))
  const ranked = sentences.map((sentence, index) => {
    const lower = sentence.text.toLowerCase()
    const sentenceTerms = new Set(lower.split(/[^a-z0-9]+/).filter(Boolean))
    const matches = terms.filter((term) => sentenceTerms.has(term))
    const phraseBoost = q.trim().length > 4 && lower.includes(q.trim()) ? 3 : 0
    return { ...sentence, index, matches, score: matches.length + phraseBoost, coverage: terms.length ? matches.length / terms.length : 0 }
  })
  const isSummary = /summar|simple notes|make notes|key points/.test(q)
  const matched = (isSummary ? ranked.filter((item) => item.text.length > 35) : ranked.filter((item) => item.score > 0 && item.coverage >= (terms.length < 2 ? 1 : 0.34) && (terms.length < 2 || item.matches.length >= 2 || item.coverage >= 0.6)))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .filter((item, index, all) => all.findIndex((candidate) => candidate.text === item.text) === index)
    .slice(0, isSummary ? 5 : 3)
  if (matched.length === 0) {
    const links = resources.filter((resource) => resource.url && terms.some((term) => `${resource.title} ${resource.type}`.toLowerCase().includes(term))).slice(0, 3)
    return { answer: `I couldn’t verify an answer in the readable notes for ${topic.title}. Try a key phrase from your material, or open one of the related resources below.`, summary: '', sources: [], links }
  }
  const bullets = matched.map((item) => `• ${item.text}`)
  const summary = matched.map((item) => `• ${item.text}`).join('\n')
  const sources = [...new Map(matched.map((item) => [item.id ?? item.title, { id: item.id, title: item.title }])).values()]
  return { answer: `${isSummary ? 'Key points found' : 'Answer from your materials'} · ${topic.title}\n\n${bullets.join('\n')}\n\nThese are excerpts selected from your materials, not independently fact-checked.`, summary: isSummary ? summary : '', sources, links: [] }
}

export default function StudyAssistant({ topic, resources, typedNotes, onAddNote, onOpenResource }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([{ role: 'assistant', text: `Ask a question about ${topic.title}. I’ll look through this topic’s readable notes and show the source passages I used.`, sources: [], links: [] }])
  const [summary, setSummary] = useState('')
  const [aiReady, setAiReady] = useState(false)
  const [checkingAi, setCheckingAi] = useState(true)
  const [loading, setLoading] = useState(false)
  const readableCount = useMemo(() => resources.filter((resource) => resource.content?.trim()).length + Number(!!typedNotes.trim()), [resources, typedNotes])

  useEffect(() => {
    let active = true
    fetch('/api/study-chat/config').then((response) => response.ok ? response.json() : null).then((config) => {
      if (active) setAiReady(Boolean(config?.enabled))
    }).catch(() => { if (active) setAiReady(false) }).finally(() => { if (active) setCheckingAi(false) })
    return () => { active = false }
  }, [])

  const ask = async (value = question) => {
    const q = value.trim()
    if (!q || loading) return
    setMessages((current) => [...current, { role: 'user', text: q }])
    setQuestion('')
    setSummary('')
    if (!aiReady) {
      const result = localAnswer(q, topic, resources, typedNotes)
      setMessages((current) => [...current, { role: 'assistant', text: `${result.answer}\n\nAI answers are not connected yet. Add a Gemini key on the server to enable generated, source-cited answers.`, sources: result.sources, links: result.links }])
      setSummary(result.summary)
      return
    }
    const sources = []
    if (typedNotes.trim()) sources.push({ id: null, title: 'Your typed notes', text: typedNotes.trim().slice(0, 5000) })
    let remaining = 18000 - sources.reduce((sum, source) => sum + source.text.length, 0)
    for (const resource of resources.filter((item) => item.content?.trim()).slice(0, 7)) {
      if (remaining <= 0) break
      const text = resource.content.trim().slice(0, Math.min(5000, remaining))
      sources.push({ id: resource.id, title: resource.title, text })
      remaining -= text.length
    }
    if (!sources.length) {
      setMessages((current) => [...current, { role: 'assistant', text: `There are no readable notes for ${topic.title} yet. Add typed notes or upload a text-based study file; I can’t answer from a link title alone.`, sources: [], links: [] }])
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/study-chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: q, topic: topic.title, sources }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'The AI assistant is unavailable.')
      setMessages((current) => [...current, { role: 'assistant', text: `${result.answer}\n\nGenerated by Gemini from the readable materials supplied for this question; check important details against the original sources.`, sources: result.sources || [], links: [] }])
    } catch (error) {
      const local = localAnswer(q, topic, resources, typedNotes)
      setMessages((current) => [...current, { role: 'assistant', text: `${error.message}\n\nLocal note search: ${local.answer}`, sources: local.sources, links: local.links }])
      setSummary(local.summary)
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex items-start justify-between gap-2 mb-3"><div><h2 className="font-semibold text-sm text-mist">Study assistant</h2><p className="text-xs text-fog mt-0.5">{readableCount} readable note source{readableCount === 1 ? '' : 's'} · {topic.title}</p></div><span className="text-[10px] rounded-lg bg-[#ededeb] border border-black px-2 py-1 whitespace-nowrap">{checkingAi ? 'Connecting…' : aiReady ? 'Gemini · free tier' : 'Local search'}</span></div>
      <p className="text-[11px] leading-relaxed text-fog glass rounded-xl p-2.5 mb-3">{aiReady ? 'When you ask, only readable notes selected for this topic and your question are sent to Gemini. Free-tier content may be used by Google to improve its products; quotas and billing depend on your Google project. Avoid private or sensitive information, and check answers against their source notes.' : 'Searches readable notes on this device. Your notes are not sent while local search is active. Add GEMINI_API_KEY to the server .env file to enable Gemini answers.'}</p>
      <p className="text-[10px] leading-relaxed text-fog/80 mb-2">Demo privacy: sign-in is not account security. Anyone with access to this browser profile may see its saved study data.</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button disabled={loading || checkingAi} onClick={() => ask(`Summarize these notes into simple notes about ${topic.title}`)} className={`px-2.5 py-1.5 rounded-lg bg-brand text-white text-xs disabled:opacity-50 ${focusRing}`}>Make simple notes</button>
        <button disabled={loading || checkingAi} onClick={() => ask(`What are the key ideas about ${topic.title}?`)} className={`px-2.5 py-1.5 rounded-lg bg-white/10 text-mist text-xs hover:bg-white/20 disabled:opacity-50 ${focusRing}`}>Find key ideas</button>
      </div>
      <div className="flex-1 min-h-32 overflow-y-auto space-y-2.5 pr-1" aria-live="polite">
        {messages.map((message, index) => <div key={index} className={`max-w-[95%] rounded-xl p-3 text-xs leading-relaxed whitespace-pre-wrap ${message.role === 'user' ? 'ml-auto bg-brand text-white rounded-br-md' : 'glass text-mist rounded-bl-md'}`}>
          {message.text}
          {message.sources?.length > 0 && <div className="mt-2 pt-2 border-t border-black/20 flex flex-wrap gap-1.5"><span className="w-full text-[10px] font-bold uppercase tracking-wide">Sources used</span>{message.sources.map((source) => source.id == null ? <span key={source.label || source.title} className="rounded-md border border-black px-2 py-1 text-[10px]">{source.label ? `[${source.label}] ` : ''}{source.title}</span> : <button key={source.id} type="button" onClick={() => onOpenResource(source.id)} className={`rounded-md border border-black bg-white px-2 py-1 text-[10px] hover:bg-[#ededeb] ${focusRing}`}>{source.label ? `[${source.label}] ` : ''}{source.title} · Preview</button>)}</div>}
          {message.links?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{message.links.map((resource) => <button key={resource.id} type="button" onClick={() => onOpenResource(resource.id)} className={`rounded-md border border-black bg-white px-2 py-1 text-[10px] hover:bg-[#ededeb] ${focusRing}`}>Open {resource.title}</button>)}</div>}
        </div>)}
        {loading && <div className="glass rounded-xl p-3 text-xs text-mist" role="status">Gemini is checking the selected materials…</div>}
        {summary && <div className="frost p-3"><p className="text-xs font-semibold mb-2">Extracted note draft</p><pre className="text-xs text-ink-soft whitespace-pre-wrap font-sans leading-relaxed">{summary}</pre><Button variant="secondary" className="!px-3 !py-1.5 text-xs mt-2" onClick={() => { onAddNote(summary); setSummary('') }}>Add to my typed notes</Button></div>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask() }} className="mt-3 flex items-end gap-2 glass rounded-2xl p-2">
        <label htmlFor="study-question" className="sr-only">Ask about your study materials</label><textarea id="study-question" rows="2" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }} placeholder="Ask a question about this topic…" disabled={loading} className={`flex-1 min-w-0 resize-none rounded-xl bg-frost text-ink placeholder:text-ink-soft/70 text-sm outline-none px-3 py-2 ${focusRing}`} />
        <Button type="submit" aria-label="Ask study assistant" disabled={!question.trim() || loading} className="!px-3 !py-2">{loading ? '…' : 'Ask'}</Button>
      </form>
    </div>
  )
}
