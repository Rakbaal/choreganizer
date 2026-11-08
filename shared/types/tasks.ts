export type Frequency = {
  interval: number
  unit: 'day' | 'week' | 'month'
}

export type Task = {
  id: string
  name: string
  description: string | null
  // null: « Au besoin ».
  frequency: Frequency | null
  allRooms: boolean
  // The task's active rooms by room position, whatever allRooms says. The rooms it can be logged in are every active
  // room of the apartment when allRooms is set, these otherwise.
  rooms: { id: string, name: string }[]
  position: number
  archivedAt: string | null
}
