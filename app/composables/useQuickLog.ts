import type { LogInput } from '#shared/schemas/logs'
import type { authClient } from '~/lib/auth-client'

type Session = typeof authClient.$Infer.Session
type Line = Task['lastLog']

// One tap: its request, the line the button showed before it, and its toast.
type Entry = {
  taskId: string
  apartmentId: string
  body: LogInput
  previous: Line
  by: { id: string, name: string }
  promise: Promise<LogEntry | null>
  toastId: string | number
  undone: boolean
}

// Client only: entries start on a tap. The latest tap of a task owns its line; an earlier one settling never
// overwrites it.
const latest = new Map<string, Entry>()

// Optimistic logging: the button shows the log at once, the request runs behind it, « Annuler » deletes the log as
// soon as it exists, a failure puts the line back.
export function useQuickLog() {
  const toast = useToast()
  const editor = useLogEditor()
  const { apartment } = useApartment()
  const { data: session } = useNuxtData<Session | null>('auth-session')
  // The line shown while a log or an Undo is in flight, by task id; absent: the task's own lastLog.
  const lines = useState<Record<string, Line>>('quick-log', () => ({}))

  function setLine(taskId: string, line: Line) {
    lines.value = { ...lines.value, [taskId]: line }
  }

  function clearLine(entry: Entry) {
    if (latest.get(entry.taskId) !== entry) return
    lines.value = Object.fromEntries(Object.entries(lines.value).filter(([taskId]) => taskId !== entry.taskId))
  }

  function lastLog(task: Task): Line {
    return Object.hasOwn(lines.value, task.id) ? lines.value[task.id] ?? null : task.lastLog
  }

  function refreshTasks(apartmentId: string) {
    return refreshNuxtData(`tasks:${apartmentId}`)
  }

  function log(task: Task, roomIds: string[]) {
    const apartmentId = apartment.value?.id
    const user = session.value?.user
    if (!apartmentId || !user) return
    // The tap time, kept by « Réessayer ».
    const body = { taskId: task.id, roomIds, doneAt: new Date().toISOString() }
    send(task, apartmentId, body, lastLog(task), { id: user.id, name: user.name })
  }

  function send(task: Task, apartmentId: string, body: LogInput, previous: Line, by: Entry['by']) {
    const entry = { taskId: task.id, apartmentId, body, previous, by, undone: false } as Entry
    latest.set(task.id, entry)
    setLine(task.id, { doneAt: body.doneAt, by })
    entry.toastId = toast.add({
      title: `${task.name} · noté`,
      duration: 8000,
      actions: [
        { label: 'Annuler', color: 'neutral', variant: 'outline', onClick: () => undoEntry(entry) },
        { label: 'Modifier', color: 'neutral', variant: 'outline', onClick: () => editEntry(entry) },
      ],
    }).id
    entry.promise = post(task, entry)
  }

  // This tap's own log, once its POST has the id (Log in the past: log now, then change « Quand »). A failed POST
  // already shows its error toast.
  async function editEntry(entry: Entry) {
    const created = await entry.promise
    if (created && !entry.undone) editor.open(created)
  }

  async function post(task: Task, entry: Entry): Promise<LogEntry | null> {
    let created: LogEntry
    try {
      created = await $fetch<LogEntry>(`/api/apartments/${entry.apartmentId}/logs`, { method: 'POST', body: entry.body })
    }
    catch (error) {
      if (!entry.undone) fail(task, entry, error)
      return null
    }
    if (!entry.undone) {
      await refreshTasks(entry.apartmentId)
      clearLine(entry)
    }
    return created
  }

  async function fail(task: Task, entry: Entry, error: unknown) {
    toast.remove(entry.toastId)
    if (latest.get(entry.taskId) === entry) setLine(entry.taskId, entry.previous)
    const status = (error as { statusCode?: number }).statusCode
    const title = 'L\'entrée n\'a pas été enregistrée.'
    if (status && status >= 400 && status < 500) {
      // A refusal (the task was archived meanwhile…): retrying would fail again.
      toast.add({ title, description: apiErrorMessage(error), color: 'error' })
      await refreshTasks(entry.apartmentId)
      clearLine(entry)
      return
    }
    // Offline or a server error: stays open until retried or closed.
    toast.add({
      title,
      color: 'error',
      duration: 0,
      actions: [{
        label: 'Réessayer',
        color: 'neutral',
        variant: 'outline',
        onClick: () => send(task, entry.apartmentId, entry.body, entry.previous, entry.by),
      }],
    })
  }

  async function undoEntry(entry: Entry) {
    if (entry.undone) return
    entry.undone = true
    if (latest.get(entry.taskId) === entry) setLine(entry.taskId, entry.previous)
    toast.remove(entry.toastId)
    toast.add({ title: 'Annulé.' })
    const created = await entry.promise
    if (created) {
      try {
        await $fetch(`/api/logs/${created.id}`, { method: 'DELETE' })
      }
      catch (error) {
        toast.add({ title: apiErrorMessage(error), color: 'error' })
      }
    }
    await refreshTasks(entry.apartmentId)
    clearLine(entry)
  }

  function undo(task: Task) {
    const entry = latest.get(task.id)
    if (entry) return undoEntry(entry)
  }

  // For « Modifier » (step 4): the log the latest tap of that task created, null when its request failed.
  function created(task: Task): Promise<LogEntry | null> | undefined {
    return latest.get(task.id)?.promise
  }

  return { lastLog, log, undo, created }
}
