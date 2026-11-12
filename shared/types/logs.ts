import type { RoomScope } from './tasks'

export type LogEntry = {
  id: string
  doneAt: string
  note: string | null
  by: { id: string, name: string }
  // roomScope is the task's current one: it tells what rooms: [] means.
  task: { id: string, name: string, archived: boolean, roomScope: RoomScope }
  // By room position. [] means « Tout l'appartement », or no room for a 'none' task (Tasks with no room).
  rooms: { id: string, name: string, archived: boolean }[]
}

export type LogPage = {
  items: LogEntry[]
  // null: this is the last page.
  nextCursor: string | null
  // Everyone who logged in the apartment, by name, removed members included: the person filter's list.
  people: { id: string, name: string }[]
}
