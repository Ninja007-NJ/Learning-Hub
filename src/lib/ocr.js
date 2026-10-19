/* Optional OCR for scanned PDFs. Runs in the browser; page images are not uploaded anywhere.
   By default tesseract.js downloads its engine and English language data from a CDN the first time (a network request, no page content).
   To avoid that, self-host the files and pass workerPath, corePath and langPath to createWorker below.
   Works best on printed text. Handwriting is usually unreliable, so always let the student check the result. */
export async function ocrPdf(file, { maxPages = 20, pageNumbers, onProgress, signal, workerUrl } = {}) {
  const [pdfjs, { createWorker }] = await Promise.all([
    import('pdfjs-dist'),
    import('tesseract.js'),
  ])
  if (workerUrl) pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const targets = (pageNumbers?.length ? [...new Set(pageNumbers.map(Number).filter((n) => Number.isInteger(n) && n > 0 && n <= pdf.numPages))] : Array.from({ length: Math.min(pdf.numPages, maxPages) }, (_, i) => i + 1)).slice(0, maxPages)
  const worker = await createWorker('eng')
  const out = []
  try {
    for (const n of targets) {
      if (signal?.aborted) throw new Error('OCR was cancelled.')
      onProgress?.({ page: n, pages: targets.length })
      const page = await pdf.getPage(n)
      const viewport = page.getViewport({ scale: 2 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width; canvas.height = viewport.height
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
      const { data } = await worker.recognize(canvas)
      out.push({ page: n, text: data.text ?? '' })
      canvas.width = 0; canvas.height = 0
    }
  } finally { await worker.terminate() }
  const text = out.map((p) => p.text).join('\n\n').trim()
  if (!text) throw new Error('OCR could not read any text. Try a clearer, printed scan.')
  return { text: text.slice(0, 100000), pageTexts: out, pages: out.length, truncated: !pageNumbers?.length && pdf.numPages > out.length }
}
