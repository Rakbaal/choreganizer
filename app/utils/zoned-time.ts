// A datetime-local input holds a wall-clock time with no zone. These read and write it in the apartment's timezone,
// the one the feed displays, whatever zone the phone is in. Intl only: no date library.

const pattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

function parts(ms: number, timeZone: string) {
  const list = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(ms))
  const get = (type: string) => list.find(part => part.type === type)!.value
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') }
}

// The wall clock in that timezone at that instant, read as if it were UTC.
function wallClock(ms: number, timeZone: string): number {
  const p = parts(ms, timeZone)
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
}

// « 2026-11-07T19:40 »: the instant as the apartment's clock showed it, to the minute.
export function toZonedInput(iso: string, timeZone: string): string {
  const p = parts(new Date(iso).getTime(), timeZone)
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

// The instant the apartment's clock showed that time, as an ISO string; '' for a malformed value. Around a DST change,
// Temporal's « compatible » rule: a time that doesn't exist (spring forward) moves forward by the gap, 02:30 → 03:30; a
// time that exists twice (fall back) takes the earlier instant.
export function fromZonedInput(local: string, timeZone: string): string {
  const match = pattern.exec(local)
  if (!match) return ''
  const [, year, month, day, hour, minute, second] = match.map(Number) as number[]
  const wall = Date.UTC(year!, month! - 1, day!, hour!, minute!, second || 0)
  const offset = (ms: number) => wallClock(ms, timeZone) - ms
  // The offsets a day either side: a zone changes at most once in that span.
  const before = wall - offset(wall - 86_400_000)
  const after = wall - offset(wall + 86_400_000)
  const exact = [before, after].filter(ms => wallClock(ms, timeZone) === wall)
  return new Date(exact.length ? Math.min(...exact) : before).toISOString()
}
