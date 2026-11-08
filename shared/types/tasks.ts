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
  // The task's latest log by done_at (a log dated in the past counts from that date), whatever its rooms. null: never
  // done.
  lastLog: { doneAt: string, by: { id: string, name: string } } | null
  position: number
  archivedAt: string | null
}
