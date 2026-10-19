/*
  Neon themes. Each theme sets the accent ("glow") and the primary button colour ("brand"),
  as space-separated RGB so Tailwind can still apply opacity (bg-glow/20, ring-brand/40...).
  Primary buttons use white text, so each brand colour is dark enough for readable contrast.
*/
export const THEMES = {
  cyan: { name: 'Neon Cyan', vars: { '--glow': '34 211 238', '--brand': '58 99 221', '--brand-hi': '70 110 227', '--brand-dark': '46 82 192', '--brand-light': '230 238 255', '--tint': '150 175 215' } },
  magenta: { name: 'Neon Magenta', vars: { '--glow': '255 79 216', '--brand': '181 32 127', '--brand-hi': '192 42 138', '--brand-dark': '153 24 107', '--brand-light': '255 232 246', '--tint': '205 150 200' } },
  lime: { name: 'Neon Lime', vars: { '--glow': '163 255 60', '--brand': '22 108 49', '--brand-hi': '29 132 57', '--brand-dark': '15 85 36', '--brand-light': '232 250 226', '--tint': '150 205 150' } },
  violet: { name: 'Neon Violet', vars: { '--glow': '178 107 255', '--brand': '109 59 232', '--brand-hi': '122 75 235', '--brand-dark': '86 41 199', '--brand-light': '240 232 255', '--tint': '175 155 235' } },
}

// Pixel robot look: cream paper, navy ink. "brand" is the button colour (dark ink text sits on it); "glow" is the teal accent.
export const PIXEL = {
  orange: { name: 'Orange', vars: { '--glow': '26 107 107', '--brand': '243 117 5', '--brand-hi': '255 140 40', '--brand-dark': '154 68 0', '--brand-light': '255 226 190', '--tint': '251 232 206' } },
  mint: { name: 'Mint', vars: { '--glow': '20 90 120', '--brand': '52 168 110', '--brand-hi': '80 200 140', '--brand-dark': '14 92 56', '--brand-light': '214 245 226', '--tint': '251 232 206' } },
}

// People who ask their system for reduced motion start with effects off
export const defaultSettings = () => ({
  look: 'pixel',      // 'pixel' (robot / terminal) or 'neon' (glass and glow)
  theme: 'cyan',      // neon colour
  pixel: 'orange',    // pixel colour
  intensity: 100,
  textScale: 'regular',
  readableFont: false,
  effects: !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),
})

export function applyTheme({ look, theme, pixel, intensity, effects, textScale = 'regular', readableFont = false }) {
  const root = document.documentElement
  const isPixel = look === 'pixel'
  const t = isPixel ? (PIXEL[pixel] ?? PIXEL.orange) : (THEMES[theme] ?? THEMES.cyan)
  Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v))
  root.style.setProperty('--glow-i', isPixel ? '0' : String(intensity / 100))
  root.dataset.style = isPixel ? 'pixel' : 'neon'
  root.dataset.effects = effects ? 'on' : 'off'
  root.dataset.textSize = textScale === 'large' ? 'large' : 'regular'
  root.dataset.readableFont = readableFont ? 'on' : 'off'
}
