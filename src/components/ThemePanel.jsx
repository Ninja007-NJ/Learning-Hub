import { useEffect, useRef, useState } from 'react'
import { PIXEL, THEMES, defaultSettings } from '../theme'
import { Button, Slider, Toggle, focusRing } from './ui'

export default function ThemePanel({ settings, onChange }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef(null)
  const btn = useRef(null)
  const pixel = settings.look === 'pixel'

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const set = (patch) => onChange({ ...settings, ...patch })
  const choice = (active) => `flex items-center gap-2 px-3 py-2 text-sm text-left rounded-full transition-all duration-200 ${focusRing} ${active ? 'bg-night-700 shadow-neon' : 'bg-white/10 hover:bg-white/20 hover:-translate-y-0.5'}`
  const palette = pixel ? PIXEL : THEMES
  const current = pixel ? settings.pixel : settings.theme

  return (
    <div ref={wrap} className="relative" onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus() } }}>
      <button
        ref={btn} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className={`ui-btn ui-btn-secondary inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-mist bg-white/10 border border-white/15 transition-all duration-200 hover:bg-white/20 hover:-translate-y-0.5 active:scale-[0.97] ${focusRing}`}
      >
        <span className="w-3 h-3 rounded-full bg-brand" aria-hidden />
        <span className="hidden sm:inline">Look</span>
      </button>

      {open && (
        <div role="dialog" aria-label="Look and theme settings" className="absolute right-0 mt-2 w-72 bg-night-800/95 backdrop-blur-xl border border-white/15 rounded-card p-4 shadow-card text-mist z-50 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Look</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => set({ look: 'pixel' })} aria-pressed={pixel} className={choice(pixel)}>🤖 Pixel robot</button>
              <button onClick={() => set({ look: 'neon' })} aria-pressed={!pixel} className={choice(!pixel)}>✨ Neon glass</button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">{pixel ? 'Colour' : 'Neon theme'}</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(palette).map(([id, t]) => (
                <button key={id} onClick={() => set(pixel ? { pixel: id } : { theme: id })} aria-pressed={current === id} className={choice(current === id)}>
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: `rgb(${pixel ? t.vars['--brand'] : t.vars['--glow']})` }} aria-hidden />
                  {t.name.replace('Neon ', '')}
                </button>
              ))}
            </div>
          </div>

          {!pixel && (
            <label className="block text-sm font-medium">Glow intensity
              <Slider label="Glow intensity" min={0} max={150} value={settings.intensity} onChange={(v) => set({ intensity: v })} ticks className="mt-2" />
            </label>
          )}

          <label className="block text-sm font-medium">Text size
            <select value={settings.textScale ?? 'regular'} onChange={(e) => set({ textScale: e.target.value })} className={`block mt-1 w-full rounded-xl border border-white/20 bg-night-700 text-mist px-3 py-2 ${focusRing}`}>
              <option value="regular">Regular</option><option value="large">Larger text</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={Boolean(settings.readableFont)} onChange={(e) => set({ readableFont: e.target.checked })} className="accent-brand" />Readable system font</label>

          <div className="flex items-center gap-3 text-sm">
            <span className="flex-1">
              <span className="font-medium block">Blur, ticker and typing motion</span>
              <span className="text-xs text-fog">Turn off on slow devices.</span>
            </span>
            <Toggle label="Blur, ticker and typing motion" checked={settings.effects} onChange={(v) => set({ effects: v })} />
          </div>

          <Button variant="dark" className="w-full !py-1.5 text-sm" onClick={() => onChange(defaultSettings())}>Reset look</Button>
        </div>
      )}
    </div>
  )
}
