export function getPeruDayRange(): { start: Date; end: Date } {
  const now = new Date()
  const offset = -5
  const local = new Date(now.getTime() + offset * 3600000)
  const start = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()))
  const end = new Date(start.getTime() + 86400000)
  return { start, end }
}
