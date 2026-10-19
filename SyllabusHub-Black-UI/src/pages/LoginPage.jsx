import { useState } from 'react'
import { Button, focusRing } from '../components/ui'

export default function LoginPage({ onLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const fillDemo = () => { setName('Demo Student'); setEmail('student@example.test'); setPassword('demo-pass'); setError('') }

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Enter your name.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    if (password.length < 6) return setError('Use a password with at least 6 characters.')
    // Demo only: the password is never stored. Replace with your real auth call (Supabase, JWT...).
    onLogin({ name: name.trim(), email: email.trim() })
  }

  const input = `w-full rounded-full bg-frost text-ink px-4 py-3 border border-white/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] placeholder:text-ink-soft/70 ${focusRing}`

  return (
    <main id="top" className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 sm:p-8">
      <div className="grid md:grid-cols-[.95fr_1.05fr] glass glow-edge rounded-[30px] max-w-5xl w-full overflow-hidden">
        <div className="login-hero relative bg-[#111111] text-white p-8 sm:p-12 flex flex-col justify-between min-h-64 overflow-hidden">
          <div className="hero-orbit" aria-hidden="true"><span>SH</span><i /><b /></div>
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide"><span className="w-2 h-2 rounded-full bg-lime-300" /> A calmer way to study</span>
            <h1 className="mt-8 text-4xl sm:text-5xl font-semibold leading-[1.04] max-w-md">Your whole course. One clear space.</h1>
            <p className="mt-4 max-w-md text-white/75 leading-relaxed">Find the right material, understand the topic, and make your own notes without losing your place.</p>
          </div>
          <div className="relative mt-10 grid grid-cols-3 gap-2 text-xs sm:text-sm">
            {['Choose topics', 'Find materials', 'Make your notes'].map((item, i) => <div key={item} className="rounded-xl border border-white/15 bg-white/10 p-3"><span className="block text-white/60 mb-1">0{i + 1}</span>{item}</div>)}
          </div>
        </div>
        <form onSubmit={submit} className="frost !rounded-none !border-0 p-6 sm:p-10 lg:p-12 space-y-5" noValidate>
          <div>
            <p className="text-xs font-semibold text-brand">Welcome</p>
            <h2 className="text-2xl font-semibold mt-1">Sign in to your study space</h2>
            <p className="text-sm text-ink-soft mt-1">Enter your demo details to continue.</p>
          </div>
          <label className="block text-sm font-medium">Name
            <input className={`${input} mt-1.5`} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </label>
          <label className="block text-sm font-medium">Email
            <input className={`${input} mt-1.5`} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
          </label>
          <label className="block text-sm font-medium">Password
            <input className={`${input} mt-1.5`} type="password" name="demo-password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" readOnly onFocus={(e) => e.currentTarget.removeAttribute('readonly')} />
          </label>
          {error && <p className="text-sm text-status-danger" role="alert">{error}</p>}
          <Button type="submit" className="w-full !py-3">Continue to your classes <span aria-hidden>→</span></Button>
          <div className="rounded-2xl border border-brand/15 bg-brand-light/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-semibold text-ink">Just exploring?</p><p className="mt-1 text-xs text-ink-soft">Fill in the sample demo details with one click.</p></div>
              <button type="button" onClick={fillDemo} className={`text-sm font-semibold text-brand hover:underline ${focusRing}`}>Use demo account</button>
            </div>
          </div>
          <p className="text-xs text-ink-soft leading-relaxed">Demo only: nothing is sent to a server. Your name and email stay in this browser; your password is not saved.</p>
        </form>
      </div>
    </main>
  )
}
