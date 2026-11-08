const every = { day: 'Chaque jour', week: 'Chaque semaine', month: 'Chaque mois' } as const
const plural = { day: 'jours', week: 'semaines', month: 'mois' } as const

export function frequencyLabel(frequency: Frequency | null): string {
  if (!frequency) return 'Au besoin'
  const { interval, unit } = frequency
  if (interval === 1) return every[unit]
  // « semaine » is feminine: « Toutes les 2 semaines », but « Tous les 2 jours ».
  return `${unit === 'week' ? 'Toutes' : 'Tous'} les ${interval} ${plural[unit]}`
}
