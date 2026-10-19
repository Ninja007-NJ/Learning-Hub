import { useState } from 'react'
import { Button, focusRing } from './ui'

const feedbackEmail = import.meta.env.VITE_FEEDBACK_EMAIL?.trim()
const takedownEmail = import.meta.env.VITE_TAKEDOWN_EMAIL?.trim()

function composeMail(address, subject, body) {
  const url = `mailto:${encodeURIComponent(address)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.href = url
}

export default function PrivacySupportPanel() {
  const [feedback, setFeedback] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [notice, setNotice] = useState('')
  const canEmail = Boolean(feedbackEmail)

  const sendFeedback = (event) => {
    event.preventDefault()
    const text = feedback.trim()
    if (!text) return
    if (!feedbackEmail) { document.getElementById('pilot-feedback')?.select(); setNotice('Feedback email is not configured. The message is selected; copy it and give it to the project maintainer.'); return }
    composeMail(feedbackEmail, 'Syllabus Hub pilot feedback', text)
    setNotice('Your email draft is open. It is sent only if you choose Send in your email app.')
  }

  const reportNote = () => {
    if (!takedownEmail) { setNotice('Takedown email is not configured. Ask the project maintainer or course moderator to review the item.'); return }
    composeMail(takedownEmail, `Request to review shared study material${noteTitle.trim() ? `: ${noteTitle.trim()}` : ''}`, `Please review this locally shared study material.\n\nItem title: ${noteTitle.trim() || '[add title]'}\nReason for concern: [describe the issue]\n\nNo document contents have been attached automatically.`)
    setNotice('Your email draft is open. It is sent only if you choose Send in your email app.')
  }

  return <section className="frost p-6 space-y-5" aria-labelledby="privacy-heading">
      <div><h2 id="privacy-heading" className="font-bold text-lg">Privacy, feedback and reporting</h2><p className="text-sm text-ink-soft mt-1">This is a browser-only demo. It is not a private student account or a real class-sharing service.</p></div>
    <div className="grid md:grid-cols-2 gap-4 text-sm">
      <div className="border border-black/15 bg-white/70 p-4"><h3 className="font-semibold">What stays on this device</h3><p className="text-ink-soft mt-1">Your demo profile, selected course, notes, extracted upload text, boards, deadlines, confidence ratings and flashcards are stored in this browser’s local storage. Anyone using the same browser profile may be able to access them. Use Profile → Backup and storage to export or clear them.</p></div>
      <div className="border border-black/15 bg-white/70 p-4"><h3 className="font-semibold">When notes go to Gemini</h3><p className="text-ink-soft mt-1">When you tap Ask with Gemini enabled, the current question and readable notes for that topic are sent from this server to Google. In Smart notes, only the sources you tick are sent when you tap Prepare. Nothing is sent for AI while local search is active. Your API key stays on the server.</p></div>
    </div>
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 space-y-2">
      <h3 className="font-semibold">Gemini data and eligibility notice</h3>
      <p>Under Google’s current Gemini API terms, unpaid API use may let Google use prompts and responses to improve products, and human reviewers may process them. Do not send sensitive, confidential or personal information. If the API project has an active Cloud Billing account, Google says prompts are not used to improve products, but may be logged temporarily for safety and security.</p>
      <p>Google’s current terms also require API users to be at least 18 and say API clients must not be directed to or likely accessed by people under 18. This student app has not established that its audience meets that restriction. Keep Gemini disabled for a real student pilot until the project owner and institution review eligibility and terms.</p>
      <a className={`underline font-medium ${focusRing}`} href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Read Google’s Gemini API terms (opens in a new tab)</a>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <form className="border border-black/15 bg-white/70 p-4 space-y-2" onSubmit={sendFeedback}>
        <h3 className="font-semibold">Send feedback</h3><p className="text-xs text-ink-soft">Opens a draft email; the app does not send it automatically. Don’t include private notes.</p>
        <label className="sr-only" htmlFor="pilot-feedback">Feedback message</label><textarea id="pilot-feedback" rows="3" maxLength={1000} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What was confusing or hard to use?" className="w-full border border-black/25 p-2 text-sm" />
        <Button type="submit" disabled={!feedback.trim()}>Prepare feedback email</Button>
        {!canEmail && <p className="text-xs text-amber-800">Set VITE_FEEDBACK_EMAIL in your local .env before inviting pilot students.</p>}
      </form>
      <div className="border border-black/15 bg-white/70 p-4 space-y-2">
        <h3 className="font-semibold">Request a note takedown</h3><p className="text-xs text-ink-soft">Class-library items are local to this demo profile. This creates an email draft for the project maintainer or course moderator; it does not remove the item or decide a legal claim.</p>
        <label className="sr-only" htmlFor="takedown-title">Title of material to review</label><input id="takedown-title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} maxLength={180} placeholder="Material title (optional)" className="w-full border border-black/25 p-2 text-sm" />
        <Button variant="secondary" type="button" onClick={reportNote}>Prepare takedown email</Button>
        {!takedownEmail && <p className="text-xs text-amber-800">Set VITE_TAKEDOWN_EMAIL in your local .env before inviting pilot students.</p>}
      </div>
    </div>
    <p role="status" aria-live="polite" className="text-xs text-ink-soft">{notice}</p>
  </section>
}
