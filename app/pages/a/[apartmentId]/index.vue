<script setup lang="ts">
const { apartment } = useApartment()
// Same key as the Tasks list: logging, Undo and coming back to the tab refresh it through refreshNuxtData.
const { data: tasks } = await useFetch(() => `/api/apartments/${apartment.value?.id}/tasks`, { key: `tasks:${apartment.value?.id}` })
const { data: rooms, refresh: refreshRooms } = await useFetch(() => `/api/apartments/${apartment.value?.id}/rooms`)
const quickLog = useQuickLog()

const activeTasks = computed(() => tasks.value?.filter(task => !task.archivedAt) ?? [])
const activeRooms = computed(() => rooms.value?.filter(room => !room.archivedAt) ?? [])
const timeZone = computed(() => apartment.value?.timezone ?? 'Europe/Brussels')

// One now per render, in useState: the client hydrates with the server's, so « À l'instant » can't turn into
// « Il y a 1 min » between the two.
const now = useState('home-now', () => Date.now())
if (import.meta.client && !useNuxtApp().isHydrating) now.value = Date.now()
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 30_000)
})
onBeforeUnmount(() => clearInterval(timer))

useRefreshOnFocus(() => {
  now.value = Date.now()
  refreshNuxtData(`tasks:${apartment.value?.id}`)
  refreshRooms()
})

// Mirrors the server's rule (createLog): every active room for an « all rooms » task, the task's active rooms otherwise.
function eligibleRooms(task: Task) {
  return task.roomScope === 'all' ? activeRooms.value : task.rooms
}

// Its rooms are all archived: fixed from the Tasks screen, and kept visible so it doesn't vanish without a word.
function isDisabled(task: Task) {
  return task.roomScope === 'some' && !task.rooms.length
}

function line(task: Task) {
  const last = quickLog.lastLog(task)
  if (!last) return 'Jamais fait'
  return `${relativeTime(last.doneAt, timeZone.value, new Date(now.value))} · ${last.by.name}`
}

const sheetTask = ref<Task | null>(null)
const sheetOpen = ref(false)

// Against an accidental double tap; logging the same task twice on purpose works a second later.
const lastTap = new Map<string, number>()

function tap(task: Task) {
  const at = Date.now()
  if (at - (lastTap.get(task.id) ?? 0) < 1000) return
  lastTap.set(task.id, at)
  const eligible = eligibleRooms(task)
  if (task.roomScope === 'all' && eligible.length <= 1) return quickLog.log(task, [])
  if (task.roomScope === 'some' && eligible.length === 1) return quickLog.log(task, [eligible[0]!.id])
  sheetTask.value = task
  sheetOpen.value = true
}

function logFromSheet(roomIds: string[]) {
  if (sheetTask.value) quickLog.log(sheetTask.value, roomIds)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      v-if="!activeTasks.length"
      class="flex flex-col items-center gap-2 py-12"
    >
      <p class="text-muted">
        Aucune tâche pour l'instant.
      </p>
      <ULink
        :to="`/a/${apartment?.id}/tasks/new`"
        class="text-primary"
      >
        Ajouter une tâche
      </ULink>
    </div>
    <ul
      v-else
      class="flex flex-col gap-3"
    >
      <li
        v-for="task in activeTasks"
        :key="task.id"
      >
        <UButton
          block
          size="xl"
          color="neutral"
          variant="outline"
          :disabled="isDisabled(task)"
          class="flex-col items-start justify-start gap-0.5 py-4 text-left"
          @click="tap(task)"
        >
          <span class="text-lg font-semibold">{{ task.name }}</span>
          <span
            v-if="isDisabled(task)"
            class="text-sm font-normal text-warning"
          >Aucune pièce active</span>
          <span
            v-else
            class="text-sm font-normal text-muted"
          >{{ line(task) }}</span>
        </UButton>
      </li>
    </ul>
    <div
      v-if="!activeRooms.length"
      class="flex flex-col items-center gap-2"
    >
      <ULink
        :to="`/a/${apartment?.id}/settings`"
        class="text-primary"
      >
        Ajouter des pièces
      </ULink>
    </div>
    <LogsQuickLogSheet
      v-model:open="sheetOpen"
      :task="sheetTask"
      :rooms="sheetTask ? eligibleRooms(sheetTask) : []"
      @log="logFromSheet"
    />
  </div>
</template>
