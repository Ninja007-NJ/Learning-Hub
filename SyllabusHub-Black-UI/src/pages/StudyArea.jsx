import { useEffect, useReducer, useRef, useState } from 'react'
import { load, save, iconFor } from '../lib'
import { Button, Preview, Slider, Toggle, focusRing } from '../components/ui'
import StudyAssistant from '../components/StudyAssistant'

const W = 2000
const H = 1400
const COLORS = ['#1B2433', '#2F6BF2', '#D64545', '#1E9E6A', '#D98A00', '#7C5CFA']
const PAPER = {
  blank: { label: 'Blank', style: {} },
  grid: { label: 'Grid', style: { backgroundImage: 'linear-gradient(#E3EAF5 1px, transparent 1px), linear-gradient(90deg, #E3EAF5 1px, transparent 1px)', backgroundSize: '32px 32px' } },
  lines: { label: 'Lined', style: { backgroundImage: 'linear-gradient(#E3EAF5 1px, transparent 1px)', backgroundSize: '100% 36px' } },
}
const TOOLS = [
  ['pen', '✎ Pen'],
  ['highlighter', '▰ Highlight'],
  ['eraser', '⌫ Eraser'],
  ['text', 'T Text'],
]

/* Draw one saved stroke or text item onto the canvas */
function paint(ctx, s) {
  ctx.save()
  if (s.type === 'text') {
    ctx.fillStyle = s.color
    ctx.font = `${s.size}px Arial, Helvetica, sans-serif`
    ctx.textBaseline = 'top'
    ctx.fillText(s.text, s.x, s.y)
    ctx.restore()
    return
  }
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = s.color
  ctx.lineWidth = s.size
  if (s.tool === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = s.size * 4 }
  if (s.tool === 'highlighter') { ctx.globalAlpha = 0.3; ctx.lineWidth = s.size * 4 }
  const p = s.points
  ctx.beginPath()
  ctx.moveTo(p[0].x, p[0].y)
  if (p.length === 1) {
    ctx.lineTo(p[0].x + 0.01, p[0].y)
  } else {
    for (let i = 1; i < p.length - 1; i++) {
      ctx.quadraticCurveTo(p[i].x, p[i].y, (p[i].x + p[i + 1].x) / 2, (p[i].y + p[i + 1].y) / 2)
    }
    ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y)
  }
  ctx.stroke()
  ctx.restore()
}

function boardReducer(state, a) {
  switch (a.type) {
    case 'add': return { strokes: [...state.strokes, a.item], redo: [] }
    case 'undo': return state.strokes.length ? { strokes: state.strokes.slice(0, -1), redo: [...state.redo, state.strokes[state.strokes.length - 1]] } : state
    case 'redo': return state.redo.length ? { strokes: [...state.strokes, state.redo[state.redo.length - 1]], redo: state.redo.slice(0, -1) } : state
    case 'clear': return { strokes: [], redo: [] }
    default: return state
  }
}

/* The drawing board. Re-mounted per topic (key=topicId) so every topic has its own page. */
function Board({ userId, topicId, topicTitle }) {
  const key = `hub2.board.${encodeURIComponent(userId.trim().toLowerCase())}.${topicId}`
  const canvasRef = useRef(null)
  const live = useRef(null)
  const textRef = useRef(null)
  const [{ strokes, redo }, dispatch] = useReducer(boardReducer, null, () => ({ strokes: load(key, []), redo: [] }))
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState(COLORS[0])
  const [size, setSize] = useState(3)
  const [paper, setPaper] = useState('grid')
  const [textBox, setTextBox] = useState(null)
  const [boardSaveState, setBoardSaveState] = useState('saved')

  // Repaint whenever the saved strokes change, and save them
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, W, H)
    strokes.forEach((s) => paint(ctx, s))
    setBoardSaveState(save(key, strokes) ? 'saved' : 'error')
  }, [strokes, key])

  const undo = () => dispatch({ type: 'undo' })
  const redoIt = () => dispatch({ type: 'redo' })
  const clearAll = () => { if (window.confirm('Clear this whole page? This cannot be undone.')) dispatch({ type: 'clear' }) }

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault(); e.shiftKey ? redoIt() : undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const point = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }
  }

  const down = (e) => {
    const p = point(e)
    if (tool === 'text') { setTextBox(p); return }
    e.currentTarget.setPointerCapture(e.pointerId)
    const ctx = canvasRef.current.getContext('2d')
    live.current = { tool, color, size, points: [p], snap: ctx.getImageData(0, 0, W, H) }
    paint(ctx, live.current)
  }
  const move = (e) => {
    const l = live.current
    if (!l) return
    l.points.push(point(e))
    const ctx = canvasRef.current.getContext('2d')
    ctx.putImageData(l.snap, 0, 0)
    paint(ctx, l)
  }
  const up = () => {
    const l = live.current
    if (!l) return
    live.current = null
    dispatch({ type: 'add', item: { tool: l.tool, color: l.color, size: l.size, points: l.points } })
  }

  const commitText = () => {
    const box = textBox
    const value = textRef.current?.value ?? ''
    setTextBox(null)
    if (box && value.trim()) {
      dispatch({ type: 'add', item: { type: 'text', text: value, x: box.x, y: box.y, color, size: 14 + size * 3 } })
    }
  }

  const download = () => {
    const out = document.createElement('canvas')
    out.width = W; out.height = H
    const ctx = out.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, W, H)
    ctx.drawImage(canvasRef.current, 0, 0)
    out.toBlob((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${topicTitle.replace(/\s+/g, '-').toLowerCase()}-notes.png`
      a.click()
      URL.revokeObjectURL(a.href)
    })
  }

  return (
    <div className="flex flex-col min-w-0 min-h-[55vh] md:min-h-0 flex-1">
      {/* Toolbar */}
      <div className="study-toolbar bg-night-900/75 backdrop-blur-xl border-b border-white/10 px-3 py-2 flex flex-wrap items-center gap-2" role="toolbar" aria-label="Drawing tools">
        <div className="flex gap-1 rounded-full bg-night-800/90 border border-white/10 px-1.5 py-1 shadow-card">
          {TOOLS.map(([id, label]) => (
            <button key={id} onClick={() => setTool(id)} aria-pressed={tool === id}
              aria-label={label.replace(/^[^ ]+ /, '')} title={label.replace(/^[^ ]+ /, '')}
              className={`px-3 py-1.5 rounded-xl text-sm border transition-colors duration-150 ${focusRing} ${tool === id ? 'bg-brand text-white border-brand' : 'bg-white/10 text-mist border-transparent hover:bg-white/15'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Colour">
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} aria-label={`Colour ${c}`} aria-pressed={color === c}
              style={{ background: c }}
              className={`w-6 h-6 rounded-full border-2 ${focusRing} ${color === c ? 'border-white ring-2 ring-brand' : 'border-white/40 shadow'}`} />
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-fog">
          Size
          <Slider value={size} min={1} max={12} onChange={setSize} label="Pen size" ticks className="w-24" />
        </label>
        <div className="flex gap-1" role="group" aria-label="Paper style">
          {Object.entries(PAPER).map(([id, p]) => <Button key={id} type="button" variant={paper === id ? 'primary' : 'dark'} className="!py-1.5 !px-3 text-xs" aria-pressed={paper === id} onClick={() => setPaper(id)}>{p.label}</Button>)}
        </div>
        <div className="flex-1" />
        <span className={`text-xs ${boardSaveState === 'error' ? 'text-amber-300' : 'text-fog'}`} role="status">{boardSaveState === 'error' ? 'Board could not save · storage full' : 'Board saved on this device'}</span>
        <Button variant="ghost" className="!py-1.5 text-sm" onClick={undo} disabled={!strokes.length}>Undo</Button>
        <Button variant="ghost" className="!py-1.5 text-sm" onClick={redoIt} disabled={!redo.length}>Redo</Button>
        <Button variant="ghost" className="!py-1.5 text-sm" onClick={clearAll} disabled={!strokes.length}>Clear</Button>
        <Button variant="secondary" className="!py-1.5 text-sm" onClick={download}>Download PNG</Button>
      </div>

      {/* Board: large scrollable blank page */}
      <div className="board-stage flex-1 min-h-0 overflow-auto bg-night-900/70 p-3 sm:p-5">
        <div className="relative bg-white rounded-xl shadow-[0_20px_55px_rgba(0,0,0,0.4)] overflow-hidden" style={{ width: W, height: H, ...PAPER[paper].style }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            aria-label={`Drawing board for ${topicTitle}`}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            style={{ width: W, height: H, touchAction: 'none', cursor: tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : 'crosshair' }}
          />
          {textBox && (
            <input
              ref={textRef}
              autoFocus
              aria-label="Type text, press Enter to place it"
              placeholder="Type, then press Enter"
              onKeyDown={(e) => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') setTextBox(null) }}
              onBlur={commitText}
              style={{ position: 'absolute', left: textBox.x, top: textBox.y, color, font: `${14 + size * 3}px Arial, Helvetica, sans-serif`, minWidth: 180 }}
              className="border border-brand rounded-btn px-1 bg-white/90 outline-none"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function StudyArea({ userId, topics, topicId, setTopicId, resources, notes, setNotes, saveState = 'saved', onBack }) {
  const topic = topics.find((t) => t.id === topicId) ?? topics[0]
  const list = resources.filter((r) => r.topic === topic.id)
  const [showRefs, setShowRefs] = useState(true)
  const [showNotes, setShowNotes] = useState(true)
  const [rightTab, setRightTab] = useState('notes')
  const [refId, setRefId] = useState(null)
  const ref = list.find((r) => r.id === refId) ?? null

  return (
    <div id="top" className="h-[calc(100vh-14rem)] min-h-[480px] flex flex-col">
      <div className="study-toolbar bg-night-900/65 backdrop-blur-xl border-b border-white/10 px-3 sm:px-5 py-2.5 flex flex-wrap items-center gap-2 z-10">
        <Button variant="dark" className="!py-1.5 text-sm" onClick={onBack}>← Materials</Button>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-fog">Topic</span>
          <select value={topic.id} onChange={(e) => { setTopicId(e.target.value); setRefId(null) }}
            className={`border border-white/15 rounded-full px-3 py-1.5 bg-white/10 text-mist font-medium max-w-[min(55vw,24rem)] ${focusRing}`}>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </label>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-fog"><span>Resources</span><Toggle checked={showRefs} onChange={setShowRefs} label="Show resources" /></div>
        <div className="flex items-center gap-2 text-xs text-fog"><span>Notes</span><Toggle checked={showNotes} onChange={setShowNotes} label="Show notes" /></div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-auto md:overflow-hidden">
        {showRefs && (
          <aside className="w-full md:w-64 shrink-0 bg-white/5 backdrop-blur-xl border-r border-white/10 p-3 sm:p-4 overflow-y-auto max-h-64 md:max-h-none" aria-label="Resources for this topic">
            <p className="text-xs text-fog font-semibold mb-1">Keep nearby</p>
            <h2 className="font-semibold text-sm mb-3 text-mist">Resources for {topic.title}</h2>
            {list.length === 0 && <p className="text-sm text-fog">None yet. Add some on the resources page.</p>}
            <ul className="space-y-1 mb-3">
              {list.map((r) => (
                <li key={r.id}>
                  <button onClick={() => setRefId(r.id === refId ? null : r.id)} aria-pressed={r.id === refId}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm text-mist truncate hover:bg-white/10 ${focusRing} ${r.id === refId ? 'bg-white/10 font-medium border-l-2 border-brand' : ''}`}>
                    <span aria-hidden>{iconFor(r.type)}</span> {r.title}
                  </button>
                </li>
              ))}
            </ul>
            {ref && <Preview r={ref} />}
          </aside>
        )}

        <Board key={`${userId}:${topic.id}`} userId={userId} topicId={topic.id} topicTitle={topic.title} />

        {showNotes && (
          <aside className="w-full md:w-72 shrink-0 bg-white/5 backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/10 p-3 sm:p-4 flex flex-col min-h-48" aria-label="Typed notes">
            <div role="tablist" aria-label="Study sidebar" className="flex items-center gap-1 rounded-full bg-white/10 p-1 mb-3">
              <button role="tab" aria-selected={rightTab === 'notes'} onClick={() => setRightTab('notes')} className={`flex-1 px-2 py-1.5 rounded-full text-xs font-medium ${rightTab === 'notes' ? 'bg-gradient-to-b from-white to-[#DDE5F2] shadow-raise text-ink' : 'text-fog'} ${focusRing}`}>My notes</button>
              <button role="tab" aria-selected={rightTab === 'assistant'} onClick={() => setRightTab('assistant')} className={`flex-1 px-2 py-1.5 rounded-full text-xs font-medium ${rightTab === 'assistant' ? 'bg-gradient-to-b from-white to-[#DDE5F2] shadow-raise text-ink' : 'text-fog'} ${focusRing}`}>Assistant</button>
            </div>
            {rightTab === 'notes' ? <div role="tabpanel" className="flex flex-col flex-1 min-h-0"><p className="text-xs text-fog mb-2" role="status">{saveState === 'saving' ? 'Saving notes…' : saveState === 'error' ? 'Could not save · browser storage may be full' : 'Saved on this device · demo sign-in is not account security'}</p><textarea
                value={notes[topic.id] ?? ''}
                onChange={(e) => setNotes((n) => ({ ...n, [topic.id]: e.target.value }))}
                placeholder={`Write what you learn about ${topic.title}…`}
                aria-label={`Typed notes on ${topic.title}`}
                className={`flex-1 min-h-32 w-full rounded-card bg-frost text-ink p-3 border border-white/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] resize-none placeholder:text-ink-soft/70 ${focusRing}`}
              /></div> : <div role="tabpanel" className="flex-1 min-h-0"><StudyAssistant key={`${userId}:${topic.id}`} topic={topic} resources={list} typedNotes={notes[topic.id] ?? ''} onOpenResource={(id) => { setRefId(id); setShowRefs(true) }} onAddNote={(summary) => setNotes((current) => ({ ...current, [topic.id]: `${current[topic.id]?.trim() ? `${current[topic.id].trim()}\n\n` : ''}${summary}` }))} /></div>}
          </aside>
        )}
      </div>
    </div>
  )
}
