import { useEffect, useRef, useState } from 'react'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { Button, focusRing } from './ui'
import { suggestTopic } from '../lib'

async function readNoteFile(file) {
  if (file.size > 8 * 1024 * 1024) throw new Error('Each file must be smaller than 8 MB.')
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
    if (pdf.numPages > 120) throw new Error('This PDF has more than 120 pages. Split it into smaller topic files first.')
    const pages = []
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      pages.push(content.items.map((item) => item.str ?? '').join(' '))
    }
    const text = pages.join('\n\n').trim()
    if (!text) throw new Error('No selectable text found. Scanned-image PDF OCR is not available in this prototype.')
    return text.slice(0, 100000)
  }
  if (/\.(txt|md|markdown)$/i.test(file.name) || file.type.startsWith('text/')) {
    return (await file.text()).slice(0, 100000)
  }
  throw new Error('Choose a text-based PDF, TXT, or Markdown file.')
}

export default function NotesUploadDialog({ open, onClose, onSave, topics, currentTopicId, userName }) {
  const fileInput = useRef(null)
  const folderInput = useRef(null)
  const [files, setFiles] = useState([])
  const [license, setLicense] = useState('own')
  const [scope, setScope] = useState('private')
  const [source, setSource] = useState('')
  const [attribution, setAttribution] = useState('')
  const [attested, setAttested] = useState(false)
  const [error, setError] = useState('')
  const [reading, setReading] = useState(false)

  useEffect(() => { folderInput.current?.setAttribute('webkitdirectory', '') }, [open])
  useEffect(() => {
    if (!open) {
      setFiles([]); setLicense('own'); setScope('private'); setSource(''); setAttribution(''); setAttested(false); setError(''); setReading(false)
    }
  }, [open])

  if (!open) return null

  const readSelection = async (selection) => {
    const chosen = [...(selection ?? [])]
    if (!chosen.length) { setError('Select text-based PDF, TXT, or Markdown notes.'); return }
    setReading(true); setError('')
    const parsed = []
    let totalBytes = 0
    let totalText = 0
    for (const file of chosen.slice(0, 20)) {
      totalBytes += file.size
      if (totalBytes > 30 * 1024 * 1024) {
        parsed.push({ fileName: file.name, error: 'This selection is over the 30 MB batch limit.', topicId: currentTopicId })
        continue
      }
      try {
        const text = await readNoteFile(file)
        if (totalText + text.length > 400000) throw new Error('This selection contains too much text for this browser demo. Upload fewer files.')
        totalText += text.length
        const suggestion = suggestTopic(file.name, text, topics, currentTopicId)
        parsed.push({ fileName: file.name, text, topicId: suggestion.score > 0 ? suggestion.id : '', confidence: suggestion.score > 0 ? 'Topic suggested from file name and text · review it below' : 'No confident match · choose a topic below' })
      } catch (e) { parsed.push({ fileName: file.name, error: e.message, topicId: currentTopicId }) }
    }
    setFiles(parsed)
    setReading(false)
    if (chosen.length > 20) setError('Only the first 20 selected files were read in this batch.')
    else if (parsed.some((file) => file.error)) setError('Some files could not be added. Review the reason beside each file.')
  }

  const updateFile = (index, patch) => setFiles((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item))
  const submit = (e) => {
    e.preventDefault()
    if (files.length === 0 || files.every((file) => file.error)) return setError('Choose at least one readable note file.')
    if (scope === 'class' && license !== 'own' && !source.trim()) return setError('Add the original source for third-party material.')
    if (scope === 'class' && !attested) return setError('Confirm that you have permission to share these notes.')
    if (files.some((file) => !file.error && !file.topicId)) return setError('Choose a syllabus topic for every readable note before sharing.')
    const ready = files.filter((file) => !file.error && file.topicId)
    if (!ready.length) return setError('Choose a topic for each readable note.')
    onSave(ready.map((file) => ({
      id: `shared-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      topic: file.topicId,
      type: 'notes',
      title: file.fileName,
      kind: scope === 'class' ? 'Shared class note' : 'Private upload',
      source: userName,
      checked: 'uploaded just now',
      content: file.text,
      scope: scope === 'class' ? 'shared' : 'private',
      ...(scope === 'class' ? { rights: { license, source: source.trim(), attribution: attribution.trim(), uploaderDeclared: true, reviewStatus: 'not-verified' } } : {}),
    })), scope)
    onClose()
  }

  const field = `w-full border border-line rounded-xl px-3 py-2.5 bg-white text-sm ${focusRing}`
  return (
    <div className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-sm p-3 sm:p-6 grid place-items-center" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="upload-title" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <form onSubmit={submit}>
          <div className="p-5 sm:p-7 border-b border-line flex items-start justify-between gap-4">
            <div><p className="text-xs uppercase tracking-[.16em] text-brand font-semibold">Course materials</p><h2 id="upload-title" className="text-xl sm:text-2xl font-semibold mt-1">Upload study notes</h2><p className="text-sm text-ink-soft mt-1">Choose who can access the notes. We’ll extract readable text and suggest a syllabus topic.</p></div>
            <button type="button" onClick={onClose} aria-label="Close upload dialog" className={`w-9 h-9 rounded-full hover:bg-sky-100 text-ink-soft ${focusRing}`}>✕</button>
          </div>
          <div className="p-5 sm:p-7 space-y-5">
            <div className="grid sm:grid-cols-2 gap-3">
              <button type="button" disabled={reading} onClick={() => fileInput.current?.click()} className={`rounded-2xl border border-dashed border-brand/40 bg-brand-light/50 p-4 text-left hover:bg-brand-light disabled:opacity-50 ${focusRing}`}><span className="block font-semibold">Choose note files</span><span className="block text-xs text-ink-soft mt-1">PDF with selectable text, TXT, or Markdown · up to 8 MB each</span></button>
              <button type="button" disabled={reading} onClick={() => folderInput.current?.click()} className={`rounded-2xl border border-dashed border-line bg-sky-50 p-4 text-left hover:border-brand disabled:opacity-50 ${focusRing}`}><span className="block font-semibold">Choose a folder</span><span className="block text-xs text-ink-soft mt-1">Up to 20 files and 30 MB per batch</span></button>
              <input ref={fileInput} type="file" multiple accept=".pdf,.txt,.md,.markdown" className="hidden" onChange={(e) => { readSelection(e.target.files); e.target.value = '' }} />
              <input ref={folderInput} type="file" multiple accept=".pdf,.txt,.md,.markdown" className="hidden" onChange={(e) => { readSelection(e.target.files); e.target.value = '' }} />
            </div>
            <fieldset><legend className="text-sm font-semibold mb-2">Save notes to</legend><div className="grid sm:grid-cols-2 gap-3">
              <label className={`rounded-2xl border p-4 cursor-pointer ${scope === 'private' ? 'border-black bg-[#f3f3f0]' : 'border-line'}`}><input type="radio" name="upload-scope" value="private" checked={scope === 'private'} onChange={() => setScope('private')} className="accent-black mr-2"/><span className="font-semibold text-sm">My Space · private</span><span className="block text-xs text-ink-soft mt-1 ml-6">Only stored in this browser demo.</span></label>
              <label className={`rounded-2xl border p-4 cursor-pointer ${scope === 'class' ? 'border-black bg-[#f3f3f0]' : 'border-line'}`}><input type="radio" name="upload-scope" value="class" checked={scope === 'class'} onChange={() => setScope('class')} className="accent-black mr-2"/><span className="font-semibold text-sm">Submit to class library</span><span className="block text-xs text-ink-soft mt-1 ml-6">Demo only; real class sharing needs a backend.</span></label>
            </div></fieldset>
            {reading && <p className="text-sm text-brand" role="status">Reading files and matching them to syllabus topics…</p>}
            {files.length > 0 && <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file, index) => <div key={`${file.fileName}-${index}`} className="rounded-xl border border-line p-3 flex flex-wrap items-center gap-3"><div className="flex-1 min-w-40"><p className="text-sm font-medium truncate">{file.fileName}</p><p className={`text-xs ${file.error ? 'text-status-danger' : 'text-ink-soft'}`}>{file.error ?? file.confidence}</p></div>{!file.error && <select aria-label={`Syllabus topic for ${file.fileName}`} className={`${field} sm:w-56`} value={file.topicId} onChange={(e) => updateFile(index, { topicId: e.target.value })}><option value="">Choose a topic…</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select>}</div>)}
            </div>}
            {scope === 'class' && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-semibold text-sm">Sharing rights declaration</h3>
              <p className="text-xs leading-relaxed text-ink-soft mt-1">This records what the uploader declares; it does not verify copyright or make a legal decision. Notes are shared in this browser demo only.</p>
              <label className="block text-sm font-medium mt-3">What is your basis for sharing?
                <select className={`${field} mt-1`} value={license} onChange={(e) => setLicense(e.target.value)}><option value="own">These are my original notes</option><option value="open">I’m sharing under an open licence</option><option value="permission">I have permission from the creator</option></select>
              </label>
              {license !== 'own' && <label className="block text-sm font-medium mt-3">Original source or licence URL
                <input className={`${field} mt-1`} value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://…" />
              </label>}
              <label className="block text-sm font-medium mt-3">Creator / attribution (if applicable)
                <input className={`${field} mt-1`} value={attribution} onChange={(e) => setAttribution(e.target.value)} placeholder="Name or organisation" />
              </label>
              <label className="flex items-start gap-2 mt-3 text-xs leading-relaxed text-ink"><input type="checkbox" className="mt-0.5 accent-[#2F6BF2]" checked={attested} onChange={(e) => setAttested(e.target.checked)} />I have checked the source and believe I have the right to share this material with classmates.</label>
            </div>}
            {error && <p className="text-sm text-status-danger" role="alert">{error}</p>}
          </div>
          <div className="p-5 sm:px-7 border-t border-line flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" disabled={reading || files.length === 0}>{scope === 'class' ? 'Submit class notes' : 'Save to My Space'}</Button></div>
        </form>
      </section>
    </div>
  )
}
