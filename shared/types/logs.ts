export type LogEntry = {
  id: string
  doneAt: string
  note: string | null
  by: { id: string, name: string }
  task: { id: string, name: string, archived: boolean }
  // By room position. [] means « Tout l'appartement ».
  rooms: { id: string, name: string, archived: boolean }[]
}

export type LogPage = {
  items: LogEntry[]
  // null: this is the last page.
  nextCursor: string | null
  // Everyone who logged in the apartment, by name, removed members included: the person filter's list.
  people: { id: string, name: string }[]
}
