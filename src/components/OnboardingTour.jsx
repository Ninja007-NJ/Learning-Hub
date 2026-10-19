import { useEffect, useRef, useState } from 'react'
import { Button, focusRing } from './ui'

const STEPS = [
  ['Choose your syllabus', 'Select your KTU course, semester, subject and the topics you want to work on. The curriculum is a planning aid; confirm it against your college syllabus.'],
  ['Find materials', 'Open a topic to view its resources, preview links, upload your own notes, or request missing class material. Check every source yourself.'],
  ['Study and practise', 'Use the board, typed notes, local search, source-linked assistant, flashcards and revision sheet. Gemini sends selected readable text only after you choose Ask or Prepare.'],
  ['Keep control', 'Use Deadlines to plan study dates, Profile to manage privacy, and Backup and storage to export or clear this browser’s data.'],
]

export default function OnboardingTour({ onClose, onReplay = false }) {
  const [step, setStep] = useState(0)
  const closeRef = useRef(null)
  const dialogRef = useRef(null)
  useEffect(() => { closeRef.current?.focus() }, [])
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { onClose(); return }
      if (event.key !== 'Tab') return
      const controls = [...(dialogRef.current?.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])]
      if (!controls.length) return
      const first = controls[0]; const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const [title, description] = STEPS[step]
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4" role="presentation">
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-description" className="w-full max-w-lg border-2 border-black bg-white p-6 sm:p-8 shadow-[8px_8px_0_#101a25]">
      <div className="flex items-start justify-between gap-3"><p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Getting started · {step + 1} of {STEPS.length}</p><button ref={closeRef} className={`underline text-sm ${focusRing}`} onClick={onClose}>Skip</button></div>
      <div className="mt-4 flex gap-1" aria-hidden>{STEPS.map((item, index) => <span key={item[0]} className={`h-2 flex-1 ${index <= step ? 'bg-brand' : 'bg-black/15'}`} />)}</div>
      <h2 id="tour-title" className="mt-5 text-2xl font-black">{title}</h2><p id="tour-description" className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
      <div className="mt-6 flex justify-between gap-3"><Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</Button><Button onClick={() => step === STEPS.length - 1 ? onClose() : setStep((s) => s + 1)}>{step === STEPS.length - 1 ? (onReplay ? 'Done' : 'Start studying') : 'Next'}</Button></div>
    </section>
  </div>
}
