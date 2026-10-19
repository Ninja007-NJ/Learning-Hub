export const REVIEW_GAPS_DAYS = [1, 2, 4, 8]
const DAY_MS = 24 * 60 * 60 * 1000

export function scheduleReview(card, grade, now = Date.now()) {
  const currentBox = Math.max(0, Math.min(REVIEW_GAPS_DAYS.length - 1, Number(card.box) || 0))
  const box = grade === 0 ? 0 : Math.min(REVIEW_GAPS_DAYS.length - 1, currentBox + (grade === 2 ? 2 : 1))
  return { ...card, box, due: now + REVIEW_GAPS_DAYS[box] * DAY_MS }
}
