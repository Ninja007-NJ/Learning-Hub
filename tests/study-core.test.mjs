import test from 'node:test'
import assert from 'node:assert/strict'
import { suggestTopic } from '../src/lib.js'
import { buildBackup, clearOwn, parseBackup, restoreBackup } from '../src/lib/backup.js'
import { daysUntil, formatDaysUntil } from '../src/lib/deadlineDates.js'
import { scheduleReview } from '../src/lib/smartReview.js'

test('topic matching prefers a syllabus-topic match and uses filename weight', () => {
  const topics = [
    { id: 'paging', title: 'Paging', module: 'Memory management' },
    { id: 'scheduling', title: 'CPU scheduling', module: 'Process scheduling' },
  ]
  assert.equal(suggestTopic('week-1.pdf', 'The page table maps virtual pages to frames.', topics, 'paging').id, 'paging')
  assert.equal(suggestTopic('cpu-scheduling.pdf', '', topics, 'paging').id, 'scheduling')
  assert.equal(suggestTopic('unknown.pdf', 'unrelated text', topics, 'paging').score, 0)
})

function storageMock({ failOnceAt } = {}) {
  const map = new Map()
  let writes = 0
  globalThis.localStorage = {
    get length() { return map.size },
    key(index) { return [...map.keys()][index] ?? null },
    getItem(key) { return map.has(key) ? map.get(key) : null },
    setItem(key, value) {
      writes += 1
      if (writes === failOnceAt) throw new Error('storage full')
      map.set(key, String(value))
    },
    removeItem(key) { map.delete(key) },
  }
  return map
}

test('backup restore is profile-scoped, replaces profile keys, and clear preserves other profiles', () => {
  const map = storageMock()
  const email = 'student@example.test'
  const encoded = encodeURIComponent(email)
  localStorage.setItem(`hub2.profile.${encoded}`, JSON.stringify({ notes: { a: 'original' } }))
  localStorage.setItem(`hub2.board.${encoded}.paging`, JSON.stringify([{ x: 1 }]))
  localStorage.setItem('hub2.profile.other%40example.test', '{}')
  const backup = buildBackup(email)
  assert.throws(() => parseBackup(JSON.stringify(backup), 'other@example.test'), /belongs to another profile/)

  localStorage.setItem(`hub2.profile.${encoded}`, JSON.stringify({ notes: { a: 'changed' } }))
  localStorage.setItem(`hub2.board.${encoded}.newer`, '[]')
  restoreBackup(parseBackup(JSON.stringify(backup), email))
  assert.deepEqual(JSON.parse(localStorage.getItem(`hub2.profile.${encoded}`)), { notes: { a: 'original' } })
  assert.equal(localStorage.getItem(`hub2.board.${encoded}.newer`), null)
  clearOwn(email)
  assert.equal(localStorage.getItem(`hub2.profile.${encoded}`), null)
  assert.equal(map.get('hub2.profile.other%40example.test'), '{}')
})

test('backup restore rolls back if storage fails during replacement', () => {
  storageMock({ failOnceAt: 3 })
  const email = 'rollback@example.test'
  const encoded = encodeURIComponent(email)
  localStorage.setItem(`hub2.profile.${encoded}`, JSON.stringify({ old: true }))
  localStorage.setItem(`hub2.board.${encoded}.topic`, JSON.stringify(['old']))
  const entries = {
    [`hub2.profile.${encoded}`]: { new: true },
    [`hub2.board.${encoded}.topic`]: ['new'],
  }
  assert.throws(() => restoreBackup({ email, entries }), /Nothing was changed/)
  assert.deepEqual(JSON.parse(localStorage.getItem(`hub2.profile.${encoded}`)), { old: true })
  assert.deepEqual(JSON.parse(localStorage.getItem(`hub2.board.${encoded}.topic`)), ['old'])
})

test('flashcard reviews schedule Again, Good and Easy at 1, 2 and 4 day intervals', () => {
  const now = Date.UTC(2026, 0, 1)
  const card = { box: 0 }
  assert.equal(scheduleReview(card, 0, now).due - now, 1 * 86400000)
  assert.equal(scheduleReview(card, 1, now).due - now, 2 * 86400000)
  assert.equal(scheduleReview(card, 2, now).due - now, 4 * 86400000)
  assert.equal(scheduleReview({ box: 2 }, 2, now).due - now, 8 * 86400000)
})

test('deadline day labels are calendar based, including same-day and overdue dates', () => {
  const now = new Date(2026, 9, 19, 16, 30)
  assert.equal(daysUntil('2026-10-19', now), 0)
  assert.equal(daysUntil('2026-10-20', now), 1)
  assert.equal(daysUntil('2026-10-16', now), -3)
  assert.equal(formatDaysUntil(0), 'Today')
  assert.equal(formatDaysUntil(-1), '1 day overdue')
  assert.equal(daysUntil('not-a-date', now), null)
})
