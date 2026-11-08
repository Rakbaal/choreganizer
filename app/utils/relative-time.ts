const minutes = new Intl.RelativeTimeFormat('fr-BE', { style: 'short' })
const days = new Intl.RelativeTimeFormat('fr-BE', { numeric: 'auto' })

// The calendar day in that timezone, as a UTC midnight, so two of them subtract to whole days.
function dayIn(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(date)
  const get = (type: string) => Number(parts.find(part => part.type === type)!.value)
  return Date.UTC(get('year'), get('month') - 1, get('day'))
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// « À l'instant », « Il y a 20 min », « Aujourd'hui », « Hier », « Il y a 3 jours »: days only, no weeks or months.
// timeZone is explicit (the apartment's): the server renders in UTC and the phone hydrates in its own zone. A date up
// to 5 minutes ahead (a phone clock running fast) reads « À l'instant ».
export function relativeTime(iso: string, timeZone: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const age = now.getTime() - date.getTime()
  if (age < 60_000) return 'À l\'instant'
  if (age < 3_600_000) return capitalize(minutes.format(-Math.floor(age / 60_000), 'minute'))
  const gap = Math.round((dayIn(now, timeZone) - dayIn(date, timeZone)) / 86_400_000)
  if (gap <= 0) return 'Aujourd\'hui'
  return capitalize(days.format(-gap, 'day'))
}
