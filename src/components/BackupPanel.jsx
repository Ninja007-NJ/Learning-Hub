import { useRef, useState } from 'react'
import { Button, focusRing } from './ui'
import { buildBackup, clearOwn, formatBytes, parseBackup, restoreBackup, usageBytes } from '../lib/backup'

/* Props: user, onRestoredProfile(profileObject), onCleared().
   App must update its in-memory profile in both callbacks, otherwise its autosave would overwrite the change. */
export default function BackupPanel({ user, onRestoredProfile, onCleared }) {
  const input = useRef(null)
  const [msg, setMsg] = useState({ kind: '', text: '' })
  const [size, setSize] = useState(() => usageBytes(user.email))
  const say = (kind, text) => setMsg({ kind, text })

  const download = () => {
    try {
      const blob = new Blob([JSON.stringify(buildBackup(user.email), null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `syllabus-hub-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      setTimeout(() => URL.revokeObjectURL(link.href), 1000)
      say('ok', 'Backup downloaded. Keep it somewhere safe, it contains your notes and boards.')
    } catch { say('error', 'Could not create the backup.') }
  }

  const restore = async (file) => {
    if (!file) return
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error('That file is too large to be a backup.')
      const data = parseBackup(await file.text(), user.email)
      if (!window.confirm('Restore this backup? It replaces the current notes, boards and settings for this profile on this device.')) return
      restoreBackup(data)
      onRestoredProfile(data.entries[`hub2.profile.${encodeURIComponent(user.email.trim().toLowerCase())}`])
      setSize(usageBytes(user.email))
      say('ok', 'Backup restored.')
    } catch (e) { say('error', e.message) }
  }

  const clearAll = () => {
    if (!window.confirm('Delete all notes, boards, flashcards and deadlines for this profile from this browser? Download a backup first if you want to keep them.')) return
    clearOwn(user.email); onCleared(); setSize(usageBytes(user.email)); say('ok', 'This profile’s data was cleared from this browser.')
  }

  return (
    <section className="frost p-6 space-y-3" aria-label="Backup and storage">
      <h2 className="font-bold text-lg">Backup and storage</h2>
      <p className="text-sm text-ink-soft">Your study data is stored only in this browser, for this demo profile. Clearing browser data, switching browsers or switching devices loses it. Demo sign-in is not account security and there is no cloud sync, so download a backup regularly.</p>
      <p className="text-sm">Stored for this profile: <b>{formatBytes(size)}</b> <span className="text-ink-soft">(browsers allow roughly 5 MB in total)</span></p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={download}>Download backup</Button>
        <Button variant="secondary" onClick={() => input.current?.click()}>Restore from backup</Button>
        <Button variant="ghost" onClick={clearAll}>Clear this profile’s data</Button>
        <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { restore(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      <p role={msg.kind === 'error' ? 'alert' : 'status'} aria-live="polite" className={`text-sm min-h-5 ${msg.kind === 'error' ? 'text-status-danger' : ''} ${focusRing}`}>{msg.text}</p>
    </section>
  )
}
