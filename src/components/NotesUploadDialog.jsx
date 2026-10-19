import { useEffect, useRef, useState } from 'react'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { Button, focusRing } from './ui'
import { suggestTopic } from '../lib'
import { ocrPdf } from '../lib/ocr'

async function readNoteFile(file, { ocr = false, onProgress = () => {} } = {}) {
  if (file.size > 8 * 1024 * 1024) throw new Error('Each file must be smaller than 8 MB.')
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
    if (pdf.numPages > 120) throw new Error('This PDF has more than 120 pages. Split it into smaller topic files first.')
    const pages = []
    const ocrPageLimit = 12
    const needsOcr = []
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      let pageText = content.items.map((item) => item.str ?? '').join(' ').trim()
      let regions = content.items.filter((item) => item.str?.trim()).map((item) => ({ text: item.str.trim(), bbox: { x: item.transform?.[4] ?? 0, y: item.transform?.[5] ?? 0, width: item.width ?? 0, height: item.height ?? 0 }, coordinateSpace: 'pdf' }))
      if (pageText.replace(/\s/g, '').length < 35) {
        needsOcr.push(pageNumber)
        if (!ocr) throw new Error('This PDF appears scanned. Enable “Read scanned PDFs with OCR” and choose the file again.')
        if (needsOcr.length > ocrPageLimit) throw new Error(`This scan needs OCR on more than ${ocrPageLimit} pages. Split it into smaller files.`)
      }
      pages.push({ page: pageNumber, text: pageText, ocr: false, regions })
      onProgress({ status: 'page', page: pageNumber, total: pdf.numPages })
    }
    let ocrPages = 0
    if (needsOcr.length) {
      const scanned = await ocrPdf(file, { maxPages: ocrPageLimit, pageNumbers: needsOcr, workerUrl: pdfWorkerUrl, onProgress: ({ page, pages: total }) => onProgress({ status: 'recognizing text', page, total }) })
      for (const item of scanned.pageTexts) {
        const target = pages[item.page - 1]
        if (target) { target.text = item.text.trim(); target.ocr = true }
      }
      ocrPages = scanned.pages
    }
    const text = pages.map((p) => `Page ${p.page}${p.ocr ? ' · OCR' : ''}\n${p.text}`).join('\n\n').trim()
    if (!text.replace(/Page \d+( · OCR)?/g, '').trim()) throw new Error('No readable text was found. The scan may be handwritten, blurry, or use an unsupported language.')
    return { text: text.slice(0, 100000), pages, ocrPages }
  }
  if (/\.(txt|md|markdown)$/i.test(file.name) || file.type.startsWith('text/')) {
    return { text: (await file.text()).slice(0, 100000), pages: [], ocrPages: 0 }
  }
  throw new Error('Choose a text-based PDF, TXT, or Markdown file.')
}

const normalizedText = (value) => String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim()

export default function NotesUploadDialog({ open, onClose, onSave, topics, currentTopicId, userName, existingResources = [] }) {
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
  const [ocr, setOcr] = useState(false)
  const [progress, setProgress] = useState('')
  const previewUrls = useRef([])

  useEffect(() => { folderInput.current?.setAttribute('webkitdirectory', '') }, [open])
  useEffect(() => {
    if (!open) {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url)); previewUrls.current = []
      setFiles([]); setLicense('own'); setScope('private'); setSource(''); setAttribution(''); setAttested(false); setError(''); setReading(false); setProgress(''); setOcr(false)
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
        setProgress(`Reading ${file.name}…`)
        const extracted = await readNoteFile(file, { ocr, onProgress: (m) => {
          if (m.status === 'recognizing text') setProgress(`OCR page ${m.page} of ${m.total} · ${file.name}`)
          else if (m.status === 'page') setProgress(`Reading page ${m.page} of ${m.total} · ${file.name}`)
        } })
        const { text } = extracted
        if (totalText + text.length > 400000) throw new Error('This selection contains too much text for this browser demo. Upload fewer files.')
        totalText += text.length
        const suggestion = suggestTopic(file.name, text, topics, currentTopicId)
        const normalized = normalizedText(text)
        const duplicate = existingResources.some((item) => item.content && normalizedText(item.content) === normalized) || parsed.some((item) => item.text && normalizedText(item.text) === normalized)
        const previewUrl = file.type === 'application/pdf' ? URL.createObjectURL(file) : ''
        if (previewUrl) previewUrls.current.push(previewUrl)
        parsed.push({ file, fileName: file.name, text, pages: extracted.pages, ocrPages: extracted.ocrPages, previewUrl, topicId: suggestion.score > 0 ? suggestion.id : '', suggestedTopicId: suggestion.score > 0 ? suggestion.id : '', potentialDuplicate: duplicate, confidence: extracted.ocrPages ? `OCR extracted ${extracted.ocrPages} scanned page${extracted.ocrPages === 1 ? '' : 's'} · check the text below` : suggestion.score > 0 ? 'Selectable text extracted · topic suggestion needs review' : 'No confident topic match · choose one below' })
      } catch (e) { parsed.push({ fileName: file.name, error: e.message, topicId: currentTopicId }) }
    }
    setFiles(parsed)
    setReading(false); setProgress('')
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
    const addedAt = new Date().toISOString().slice(0, 10)
    onSave(ready.map((file) => ({
      id: `shared-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      topic: file.topicId,
      type: 'notes',
      title: file.fileName,
      kind: scope === 'class' ? 'Shared class note' : 'Private upload',
      source: userName,
      addedBy: userName,
      addedAt,
      checked: 'text extracted locally · not independently reviewed',
      content: file.text,
      extractedPages: file.pages ?? [],
      scope: scope === 'class' ? 'shared' : 'private',
      suggestedTopicId: file.suggestedTopicId || null,
      potentialDuplicate: Boolean(file.potentialDuplicate),
      ...(scope === 'class' ? { rights: { license, source: source.trim(), attribution: attribution.trim(), uploaderDeclared: true, reviewStatus: 'pending_review', potentialDuplicate: Boolean(file.potentialDuplicate), submittedAt: new Date().toISOString() } } : {}),
    })), scope)
    onClose()
  }

  const field = `w-full border border-line rounded-xl px-3 py-2.5 bg-white text-sm ${focusRing}`
  return (
    <div className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-sm p-3 sm:p-6 grid place-items-center" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="upload-title" className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <form onSubmit={submit}>
          <div className="p-5 sm:p-7 border-b border-line flex items-start justify-between gap-4">
            <div><p className="text-xs uppercase tracking-[.16em] text-brand font-semibold">Course materials</p><h2 id="upload-title" className="text-xl sm:text-2xl font-semibold mt-1">Upload study notes</h2><p className="text-sm text-ink-soft mt-1">Choose where to organize these notes in this browser demo. We’ll extract readable text and suggest a syllabus topic.</p></div>
            <button type="button" onClick={onClose} aria-label="Close upload dialog" className={`w-9 h-9 rounded-full hover:bg-sky-100 text-ink-soft ${focusRing}`}>✕</button>
          </div>
          <div className="p-5 sm:p-7 space-y-5">
            <div className="grid sm:grid-cols-2 gap-3">
              <button type="button" disabled={reading} onClick={() => fileInput.current?.click()} className={`rounded-2xl border border-dashed border-brand/40 bg-brand-light/50 p-4 text-left hover:bg-brand-light disabled:opacity-50 ${focusRing}`}><span className="block font-semibold">Choose note files</span><span className="block text-xs text-ink-soft mt-1">PDF, TXT, or Markdown · up to 8 MB each</span></button>
              <button type="button" disabled={reading} onClick={() => folderInput.current?.click()} className={`rounded-2xl border border-dashed border-line bg-sky-50 p-4 text-left hover:border-brand disabled:opacity-50 ${focusRing}`}><span className="block font-semibold">Choose a folder</span><span className="block text-xs text-ink-soft mt-1">Up to 20 files and 30 MB per batch</span></button>
              <input ref={fileInput} type="file" multiple accept=".pdf,.txt,.md,.markdown" className="hidden" onChange={(e) => { readSelection(e.target.files); e.target.value = '' }} />
              <input ref={folderInput} type="file" multiple accept=".pdf,.txt,.md,.markdown" className="hidden" onChange={(e) => { readSelection(e.target.files); e.target.value = '' }} />
            </div>
            <label className="flex items-start gap-2 text-xs text-ink-soft"><input type="checkbox" checked={ocr} onChange={(e) => setOcr(e.target.checked)} className="mt-0.5 accent-black" />Read scanned PDFs with OCR. Up to 12 scanned pages per PDF; works best on printed text. First use downloads the OCR engine and English language data; page images stay on your device. Review the extracted text for mistakes.</label>
            <fieldset><legend className="text-sm font-semibold mb-2">Save notes to</legend><div className="grid sm:grid-cols-2 gap-3">
              <label className={`rounded-2xl border p-4 cursor-pointer ${scope === 'private' ? 'border-black bg-[#f3f3f0]' : 'border-line'}`}><input type="radio" name="upload-scope" value="private" checked={scope === 'private'} onChange={() => setScope('private')} className="accent-black mr-2"/><span className="font-semibold text-sm">My Space · private</span><span className="block text-xs text-ink-soft mt-1 ml-6">Only stored in this browser demo.</span></label>
              <label className={`rounded-2xl border p-4 cursor-pointer ${scope === 'class' ? 'border-black bg-[#f3f3f0]' : 'border-line'}`}><input type="radio" name="upload-scope" value="class" checked={scope === 'class'} onChange={() => setScope('class')} className="accent-black mr-2"/><span className="font-semibold text-sm">My class library</span><span className="block text-xs text-ink-soft mt-1 ml-6">Visible only to this demo profile on this browser. Backend required for classmates to access.</span></label>
            </div></fieldset>
            {reading && <p className="text-sm text-brand" role="status">{progress || 'Reading files and matching them to syllabus topics…'} OCR runs locally in your browser; no document content is sent to an OCR service.</p>}
            {files.length > 0 && <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file, index) => <div key={`${file.fileName}-${index}`} className="rounded-xl border border-line p-3 flex flex-wrap items-center gap-3"><div className="flex-1 min-w-40"><p className="text-sm font-medium truncate">{file.fileName}</p><p className={`text-xs ${file.error ? 'text-status-danger' : 'text-ink-soft'}`}>{file.error ?? file.confidence}</p>{file.potentialDuplicate && <p className="text-xs text-amber-800 mt-1">Possible exact-text duplicate found. This is a review flag, not a copyright decision.</p>}</div>{!file.error && <select aria-label={`Syllabus topic for ${file.fileName}`} className={`${field} sm:w-56`} value={file.topicId} onChange={(e) => updateFile(index, { topicId: e.target.value })}><option value="">Choose a topic…</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select>}</div>)}
            </div>}
            {files.some((file) => !file.error) && <section className="border-t border-line pt-4 space-y-3" aria-label="Review extracted text">
              <div><h3 className="font-semibold">Check extracted text before saving</h3><p className="text-xs text-ink-soft">OCR can misread formulas, handwriting, or low-quality scans. Edit the text if needed. Page numbers are retained for later source linking.</p></div>
              {files.map((file, index) => !file.error && <div key={`preview-${index}`} className="grid lg:grid-cols-2 gap-3 rounded-2xl border border-line p-3">
                <div className="min-h-52 bg-[#f4f4f1] rounded-xl overflow-hidden grid place-items-center">{file.previewUrl ? <iframe title={`Original PDF preview: ${file.fileName}`} src={file.previewUrl} className="w-full h-72" /> : <p className="text-sm text-ink-soft p-4">Text file · no page preview</p>}</div>
                <label className="text-sm font-medium">Extracted text · {file.fileName}<textarea value={file.text} onChange={(e) => updateFile(index, { text: e.target.value })} rows={12} className={`${field} mt-1 h-72 resize-y font-mono text-xs leading-relaxed`} /></label>
              </div>)}
            </section>}
            {scope === 'class' && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-semibold text-sm">Sharing rights declaration</h3>
              <p className="text-xs leading-relaxed text-ink-soft mt-1">This records what you declare; it does not verify copyright or make a legal decision. The class library is private to this demo profile on this device.</p>
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
          <div className="p-5 sm:px-7 border-t border-line flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" disabled={reading || files.length === 0}>{scope === 'class' ? 'Submit for local review' : 'Save to My Space'}</Button></div>
        </form>
      </section>
    </div>
  )
}
