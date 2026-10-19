import { useState } from 'react'
import { Button, focusRing } from './ui'

export default function PracticePanel({ cards = [], onReview }) {
  const [revealed, setRevealed] = useState({})
  const fresh = cards.filter((card) => card.status !== 'recalled').length

  if (!cards.length) return <section className="frost p-4 text-sm" aria-label="Practice cards">
    <h2 className="font-semibold">Practice cards</h2>
    <p className="text-ink-soft mt-2">Ask the study assistant a question, then save a supported answer as a practice card.</p>
  </section>

  return <section className="space-y-3" aria-label="Practice cards">
    <div className="flex items-center justify-between gap-2"><div><h2 className="font-semibold text-sm text-mist">Practice cards</h2><p className="text-xs text-fog mt-0.5">{fresh} to revisit · saved for this topic</p></div><span className="rounded-md border border-black px-2 py-1 text-xs bg-white">{cards.length}</span></div>
    <ol className="space-y-3">
      {cards.slice().reverse().map((card) => <li key={card.id} className="frost p-3">
        <p className="text-xs text-fog mb-1">{card.status === 'recalled' ? 'Recalled' : card.status === 'again' ? 'Review again' : 'New card'}</p>
        <p className="text-sm font-semibold text-mist">{card.question}</p>
        {revealed[card.id] ? <>
          <p className="text-sm text-ink-soft whitespace-pre-wrap mt-3">{card.answer}</p>
          {card.sources?.length > 0 && <p className="text-[11px] text-fog mt-2">Source: {card.sources.map((source) => source.label ? `[${source.label}] ${source.title}` : source.title).join(', ')}</p>}
          <div className="flex gap-2 mt-3"><Button variant="secondary" className="!py-1.5 text-xs" onClick={() => onReview(card.id, 'again')}>Review again</Button><Button className="!py-1.5 text-xs" onClick={() => onReview(card.id, 'recalled')}>I recalled it</Button></div>
        </> : <button type="button" onClick={() => setRevealed((value) => ({ ...value, [card.id]: true }))} className={`mt-3 text-xs underline text-glow ${focusRing}`}>Reveal answer</button>}
      </li>)}
    </ol>
  </section>
}
