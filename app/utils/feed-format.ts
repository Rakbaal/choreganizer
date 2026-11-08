// Every Intl call takes the apartment's timeZone: the server renders in UTC and the phone hydrates in its own zone.

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// The calendar day in that timezone, « 2026-11-07 »: groups the feed, and sorts like the dates it names.
export function dayKey(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
}

// « Aujourd'hui », « Hier », « Samedi 7 novembre », with the year when it isn't the current one there. A log up to
// 5 minutes ahead past midnight still reads « Aujourd'hui ».
export function dayHeader(iso: string, timeZone: string, now: Date = new Date()): string {
  const day = dayKey(iso, timeZone)
  const today = dayKey(now.toISOString(), timeZone)
  const gap = Math.round((Date.parse(today) - Date.parse(day)) / 86_400_000)
  if (gap <= 0) return 'Aujourd\'hui'
  if (gap === 1) return 'Hier'
  const sameYear = day.slice(0, 4) === today.slice(0, 4)
  return capitalize(new Intl.DateTimeFormat('fr-BE', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(!sameYear && { year: 'numeric' }),
  }).format(new Date(iso)))
}

// « 19:40 ».
export function timeOfDay(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('fr-BE', { timeZone, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}
