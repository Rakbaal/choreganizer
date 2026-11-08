export type LogEntry = {
  id: string
  doneAt: string
  note: string | null
  by: { id: string, name: string }
  task: { id: string, name: string, archived: boolean }
  // By room position. [] means « Tout l'appartement ».
  rooms: { id: string, name: string, archived: boolean }[]
}
