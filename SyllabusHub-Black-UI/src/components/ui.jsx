import { useEffect, useRef, useState } from 'react'
import { STATUS } from '../data'
import { iconFor, labelFor, youtubeId } from '../lib'

export const focusRing = 'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-night-800'

function BrandMark() {
  return <svg viewBox="0 0 32 32" className="w-6 h-6" aria-hidden="true">
    <path d="M7 5h9l11 11v10h-6v-7l-7-8H7zM5 22l7-7 4 4-7 7z" fill="currentColor" />
  </svg>
}

export function Button({ variant = 'primary', className = '', loading = false, children, ...props }) {
  const base = `inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none ${focusRing}`
  const styles = {
    primary: 'text-white bg-brand hover:bg-brand-dark shadow-blue',
    secondary: 'text-ink bg-gradient-to-b from-white to-[#DDE5F2] shadow-raise hover:shadow-lift',
    ghost: 'text-ink-soft hover:bg-black/5 hover:text-ink hover:translate-y-0',
    dark: 'text-mist bg-white/10 border border-white/15 hover:bg-white/20',
  }
  return (
    <button className={`${base} ${styles[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? 'Working…' : children}
    </button>
  )
}

export function Badge({ status }) {
  const s = STATUS[status]
  return s && (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${s.badge ?? s.cls}`}>
      <span aria-hidden>{s.icon}</span> {s.label}
    </span>
  )
}

export function ProgressRing({ value, size = 72, label = 'Progress' }) {
  const radius = 37
  const circumference = 2 * Math.PI * radius
  return <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${value} percent`}>
    <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx="50" cy="50" r={radius} fill="none" stroke="#DEDEDA" strokeWidth="6" />
      <circle cx="50" cy="50" r={radius} fill="none" stroke="#111111" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(circumference * value) / 100} ${circumference}`} style={{ transition: 'stroke-dasharray 0.35s ease-out' }} />
    </svg>
    <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-mist">{value}%</span>
  </div>
}

export function Toggle({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
    className={`relative w-12 h-7 rounded-full shrink-0 transition-colors duration-200 ${focusRing} ${checked ? 'bg-brand shadow-blue' : 'bg-white/15 border border-white/20'}`}>
    <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-gradient-to-b from-white to-[#DDE5F2] shadow-raise transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
  </button>
}

export function Slider({ value, min, max, onChange, label, className = '', ticks = false }) {
  const pct = ((value - min) / (max - min)) * 100
  const input = <input type="range" className={`neo-range ${ticks ? '' : className}`} min={min} max={max} value={value} aria-label={label} style={{ '--pct': `${pct}%` }} onChange={(e) => onChange(Number(e.target.value))} />
  return ticks ? <div className={className}>{input}<div className="flex justify-between text-[10px] text-fog mt-1 select-none" aria-hidden><span>{min}</span><span className="text-glow font-medium">{value}</span><span>{max}</span></div></div> : input
}

export function MenuButton({ label, items, className = '' }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef(null)
  const button = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const closeOutside = (event) => { if (!wrap.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', closeOutside)
    requestAnimationFrame(() => wrap.current?.querySelector('[role="menuitem"]')?.focus())
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])
  const move = (direction) => {
    const choices = [...(wrap.current?.querySelectorAll('[role="menuitem"]') ?? [])]
    const active = choices.indexOf(document.activeElement)
    choices[(active + direction + choices.length) % choices.length]?.focus()
  }
  const onKeyDown = (event) => {
    if (event.key === 'Escape') { setOpen(false); button.current?.focus() }
    if (event.key === 'ArrowDown') { event.preventDefault(); move(1) }
    if (event.key === 'ArrowUp') { event.preventDefault(); move(-1) }
  }
  return <div ref={wrap} className={`relative ${className}`} onKeyDown={onKeyDown}>
    <button ref={button} type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}
      className={`inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-lg font-medium text-ink bg-white border-2 border-black transition-colors hover:bg-[#ededeb] ${focusRing}`}>
      <span className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-base leading-none" aria-hidden>+</span>
      {label}<span aria-hidden className={`text-ink-soft transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
    </button>
    {open && <div role="menu" className="frost absolute right-0 mt-2 w-56 p-1.5 z-30">
      {items.map((item) => <button key={item.label} type="button" role="menuitem" onClick={() => { setOpen(false); item.onSelect() }} className={`w-full text-left px-3 py-2 rounded-full text-sm hover:bg-brand-light transition-colors ${focusRing}`}>{item.label}</button>)}
    </div>}
  </div>
}

/* Primary navigation follows the student's real flow: dashboard > course setup > workspace. */
const STEPS = [
  ['dashboard', 'Home'],
  ['select', 'Courses'],
  ['workspace', 'Study workspace'],
]
export function TopBar({ page, user, canGo, onGo, onSignOut }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-black bg-[#f2f2ef] px-3 sm:px-6 py-3">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between gap-3">
          <a href="#top" onClick={(e) => e.preventDefault()} className="flex items-center gap-3 shrink-0" aria-label="Syllabus Hub home">
            <span className="w-10 h-10 rounded-md bg-brand text-white flex items-center justify-center" aria-hidden><BrandMark /></span>
            <span className="leading-tight"><span className="block font-black uppercase tracking-tight text-mist">Syllabus Hub</span><span className="hidden sm:block text-[10px] uppercase tracking-[0.15em] text-fog">Your study workspace</span></span>
          </a>
          {user && (
            <div className="flex items-center gap-2 sm:gap-3 text-sm">
              <button onClick={() => onGo('profile')} aria-label="View profile" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-black/5">
                <span className="grid w-9 h-9 place-items-center bg-white border-2 border-black rounded-md font-bold uppercase" aria-hidden>{user.name.slice(0, 1)}</span>
                <span className="hidden sm:block font-semibold text-mist max-w-40 truncate">{user.name}<span className="block text-[10px] text-ink-soft font-normal">Profile</span></span>
              </button>
              <Button variant="dark" className="!py-2 !px-3 text-xs sm:text-sm !rounded-lg !border-2 !border-black !bg-white !text-black hover:!bg-[#ededeb]" onClick={onSignOut}>Sign out</Button>
            </div>
          )}
        </div>
        {user && <nav aria-label="Primary navigation" className="max-w-4xl mx-auto mt-3 grid grid-cols-4 overflow-hidden rounded-xl border-2 border-black bg-white">
          {STEPS.map(([id, label], i) => {
            const active = id === page
            const enabled = canGo(id)
            return (
              <button
                key={id}
                disabled={!enabled || active}
                aria-label={label}
                title={label}
                onClick={() => onGo(id)}
                aria-current={active ? 'step' : undefined}
                className={`min-w-0 min-h-[52px] flex items-center justify-center sm:justify-start gap-2 sm:gap-3 px-1.5 sm:px-4 text-left transition-colors ${focusRing} ${i < STEPS.length - 1 ? 'border-r-2 border-black' : ''}
                  ${active ? 'bg-black text-white' : enabled ? 'bg-white text-black hover:bg-[#ededeb]' : 'bg-[#e8e8e5] text-[#777772] cursor-not-allowed'}`}
              >
                <span className={`w-7 h-7 shrink-0 grid place-items-center rounded-md border-2 text-xs font-bold ${active ? 'border-white bg-white text-black' : 'border-current'}`}>
                  {['H', 'C', 'S'][i]}
                </span>
                <span className="min-w-0 hidden sm:block"><span className="block text-xs md:text-sm font-bold">{label}</span></span>
                <span className="block sm:hidden text-[10px] font-bold leading-tight">{['Home', 'Courses', 'Study'][i]}</span>
              </button>
            )
          })}
          <button disabled={!user} onClick={() => onGo('profile')} aria-current={page === 'profile' ? 'page' : undefined} className={`min-w-0 min-h-[52px] flex items-center justify-center sm:justify-start gap-2 px-1.5 sm:px-4 text-left border-l-2 border-black text-xs font-bold ${page === 'profile' ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#ededeb]'} ${focusRing}`}><span aria-hidden>◎</span><span className="hidden sm:block">Profile</span></button>
        </nav>}
      </div>
    </header>
  )
}

export function ResourceCard({ r, selected, onSelect, bookmarked, onBookmark }) {
  return (
    <div
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      className={`group frost !rounded-card p-3.5 flex items-center gap-3 cursor-pointer transition-colors duration-150 hover:border-brand/50 ${selected ? 'ring-2 ring-brand' : ''}`}
    >
      <span className="w-10 h-10 shrink-0 rounded-md bg-brand text-white grid place-items-center text-base font-bold" aria-hidden>{iconFor(r.type)}</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{r.title}</h3>
        <p className="text-sm text-ink-soft truncate">
          {r.pending ? 'Checking link…' : r.scope === 'shared' ? `Shared by ${r.source} · source declaration not verified` : `${r.kind} from ${r.source}, checked ${r.checked}`}
        </p>
      </div>
        <Button
        variant="ghost"
        aria-label={bookmarked ? `Remove bookmark from ${r.title}` : `Bookmark ${r.title}`}
        onClick={(e) => { e.stopPropagation(); onBookmark() }}
      >
        {bookmarked ? 'Saved' : 'Save'}
      </Button>
    </div>
  )
}

export function Preview({ r }) {
  if (!r) {
    return <p className="text-sm text-ink-soft">Select a resource to preview it here. Nothing opens in a new window.</p>
  }
  const yt = youtubeId(r.url)
  const downloadNotes = () => {
    const blob = new Blob([r.content], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${r.title.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-')}-text.txt`
    link.click()
    const objectUrl = link.href
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }
  return (
    <div className="space-y-3">
      <p className="font-medium">{r.title}</p>
      {yt ? (
        <div className="aspect-video rounded-card overflow-hidden border border-line bg-black">
          <iframe
            title={r.title}
            src={`https://www.youtube-nocookie.com/embed/${yt}`}
            loading="lazy"
            className="w-full h-full"
            allow="accelerometer; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : r.content ? (
        <div className="rounded-2xl border border-line bg-sky-50 p-3">
          <p className="text-xs text-ink-soft mb-2">Readable note text · extracted for this browser</p>
          <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-relaxed font-sans text-ink">{r.content.slice(0, 12000)}{r.content.length > 12000 ? '\n\n…Preview shortened. Download the extracted text to continue.' : ''}</pre>
          <Button type="button" variant="secondary" className="w-full mt-3" onClick={downloadNotes}>Download extracted text</Button>
        </div>
      ) : (
        <div className="rounded-card border border-line bg-sky-50 p-4 text-sm text-ink-soft">
          {r.url
            ? 'This site may block embedding, so use the button below to open the original.'
            : 'File preview goes here once uploads are connected (show the first PDF pages only).'}
        </div>
      )}
      <dl className="text-sm space-y-1">
        <div className="flex justify-between gap-2"><dt className="text-ink-soft">Type</dt><dd>{labelFor(r.type)}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-ink-soft">Format</dt><dd>{r.kind}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-ink-soft">Added by</dt><dd>{r.source}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-ink-soft">Checked</dt><dd>{r.checked}</dd></div>
      </dl>
      {r.scope === 'shared' && <p className="text-xs rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-2.5">Sharing source: {r.rights?.license ?? 'not recorded'}. This uploader declaration has not been independently verified; ask the owner before reuse.</p>}
      {r.url && (
        <Button variant="secondary" className="w-full" onClick={() => window.open(r.url, '_blank', 'noopener,noreferrer')}>
          Open original source
        </Button>
      )}
    </div>
  )
}
