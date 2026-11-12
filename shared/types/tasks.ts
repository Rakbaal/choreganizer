export type Frequency = {
  interval: number
  unit: 'day' | 'week' | 'month'
}

// Tasks with no room: « Partout », « Certaines pièces » or « Aucune pièce ».
export type RoomScope = 'all' | 'some' | 'none'

export type Task = {
  id: string
  name: string
  description: string | null
  // null: « Au besoin ».
  frequency: Frequency | null
  roomScope: RoomScope
  // The task's active rooms by room position, whatever roomScope says. The rooms it can be logged in are every active
  // room of the apartment for 'all', these for 'some', none for 'none'.
  rooms: { id: string, name: string }[]
  // The task's latest log by done_at (a log dated in the past counts from that date), whatever its rooms. null: never
  // done.
  lastLog: { doneAt: string, by: { id: string, name: string } } | null
  position: number
  archivedAt: string | null
}
