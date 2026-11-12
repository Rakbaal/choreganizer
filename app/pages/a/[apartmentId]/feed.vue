<script setup lang="ts">
type FilterKey = 'userId' | 'taskId' | 'roomId'
type Filters = Partial<Record<FilterKey, string>>

// Reka's Select refuses '' as a value.
const ALL = 'all'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const appConfig = useAppConfig()
const { apartment } = useApartment()
const apartmentId = computed(() => apartment.value?.id)
const timeZone = computed(() => apartment.value?.timezone ?? 'Europe/Brussels')

// The filters live in the URL, so back and reload keep them.
function queryValue(key: FilterKey): string | undefined {
  const value = route.query[key]
  return typeof value === 'string' && value ? value : undefined
}
const filters = computed<Filters>(() => ({ userId: queryValue('userId'), taskId: queryValue('taskId'), roomId: queryValue('roomId') }))
const hasFilters = computed(() => Object.values(filters.value).some(Boolean))
const feedKey = computed(() => `logs:${apartmentId.value}:${filters.value.userId ?? ''}:${filters.value.taskId ?? ''}:${filters.value.roomId ?? ''}`)

// replace: back leaves the feed instead of walking through each filter change.
function setFilter(key: FilterKey, value: string) {
  router.replace({ query: { ...route.query, [key]: value === ALL ? undefined : value } })
}

const { data: page, status, error, refresh } = await useFetch(() => `/api/apartments/${apartmentId.value}/logs`, {
  key: feedKey,
  query: filters,
})
// The lists the Home and Tasks screens already fetch, archived ones included.
const { data: tasks } = await useFetch(() => `/api/apartments/${apartmentId.value}/tasks`, { key: `tasks:${apartmentId.value}` })
const { data: rooms } = await useFetch(() => `/api/apartments/${apartmentId.value}/rooms`)

function isNewer(a: LogEntry, b: LogEntry): boolean {
  return a.doneAt === b.doneAt ? a.id > b.id : a.doneAt > b.doneAt
}
function byNewest(a: LogEntry, b: LogEntry): number {
  return isNewer(a, b) ? -1 : 1
}

// Page 1 from useFetch, then the pages « Voir plus » appended. Once more pages are loaded, refreshing page 1 keeps the
// older ones under it, so coming back to the tab doesn't fold the list.
const items = ref<LogEntry[]>(page.value?.items ?? [])
const cursor = ref<string | null>(page.value?.nextCursor ?? null)
const extended = ref(false)
watch(feedKey, () => {
  extended.value = false
}, { flush: 'sync' })
watch(page, (fresh) => {
  const first = fresh?.items ?? []
  const tail = first.at(-1)
  if (!extended.value || !tail) {
    items.value = first
    cursor.value = fresh?.nextCursor ?? null
    return
  }
  const ids = new Set(first.map(entry => entry.id))
  items.value = [...first, ...items.value.filter(entry => !ids.has(entry.id) && isNewer(tail, entry))]
})

// A save or delete from the sheet shows at once, wherever the row is; then page 1 refetches around it.
const editor = useLogEditor()
editor.onChange((change) => {
  items.value = change.type === 'delete'
    ? items.value.filter(entry => entry.id !== change.id)
    : items.value.map(entry => (entry.id === change.entry.id ? change.entry : entry)).sort(byNewest)
  refresh()
})

const loadingMore = ref(false)
async function loadMore() {
  if (!cursor.value) return
  const key = feedKey.value
  loadingMore.value = true
  try {
    const next = await $fetch<LogPage>(`/api/apartments/${apartmentId.value}/logs`, { query: { ...filters.value, cursor: cursor.value } })
    // The filters changed meanwhile: that page belongs to another list.
    if (key !== feedKey.value) return
    const ids = new Set(items.value.map(entry => entry.id))
    items.value = [...items.value, ...next.items.filter(entry => !ids.has(entry.id))].sort(byNewest)
    cursor.value = next.nextCursor
    extended.value = true
  }
  catch (fetchError) {
    toast.add({ title: apiErrorMessage(fetchError), color: 'error' })
  }
  finally {
    loadingMore.value = false
  }
}

// One now per render, in useState, as on Home: server and client agree on « Aujourd'hui ».
const now = useState('feed-now', () => Date.now())
if (import.meta.client && !useNuxtApp().isHydrating) now.value = Date.now()

useRefreshOnFocus(() => {
  now.value = Date.now()
  refresh()
})

const groups = computed(() => {
  const list: { key: string, header: string, entries: LogEntry[] }[] = []
  for (const entry of items.value) {
    const key = dayKey(entry.doneAt, timeZone.value)
    let group = list.at(-1)
    if (group?.key !== key) {
      group = { key, header: dayHeader(entry.doneAt, timeZone.value, new Date(now.value)), entries: [] }
      list.push(group)
    }
    group.entries.push(entry)
  }
  return list
})

const muted = (archived: boolean) => (archived ? 'text-muted' : undefined)
const personItems = computed(() => [
  { label: 'Tout le monde', value: ALL },
  ...(page.value?.people ?? []).map(person => ({ label: person.name, value: person.id })),
])
const taskItems = computed(() => [
  { label: 'Toutes les tâches', value: ALL },
  ...(tasks.value ?? []).map(task => ({ label: task.name, value: task.id, class: muted(!!task.archivedAt) })),
])
const roomItems = computed(() => [
  { label: 'Toutes les pièces', value: ALL },
  ...(rooms.value ?? []).map(room => ({ label: room.name, value: room.id, class: muted(!!room.archivedAt) })),
])
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">
      Historique
    </h1>
    <!-- Wraps on a phone: three fixed columns would cut « Toutes les tâches ». -->
    <div class="flex flex-wrap gap-2">
      <USelect
        :model-value="filters.userId ?? ALL"
        :items="personItems"
        aria-label="Personne"
        @update:model-value="(value: string) => setFilter('userId', value)"
      />
      <USelect
        :model-value="filters.taskId ?? ALL"
        :items="taskItems"
        aria-label="Tâche"
        @update:model-value="(value: string) => setFilter('taskId', value)"
      />
      <USelect
        :model-value="filters.roomId ?? ALL"
        :items="roomItems"
        aria-label="Pièce"
        @update:model-value="(value: string) => setFilter('roomId', value)"
      />
    </div>

    <p
      v-if="error"
      class="py-12 text-center text-muted"
    >
      {{ apiErrorMessage(error) }}
    </p>
    <div
      v-else-if="!items.length && status === 'pending'"
      class="flex justify-center py-12"
    >
      <UIcon
        :name="appConfig.ui.icons.loading"
        class="size-6 animate-spin text-muted"
      />
    </div>
    <p
      v-else-if="!items.length"
      class="py-12 text-center text-muted"
    >
      {{ hasFilters ? 'Aucune entrée pour ces filtres.' : 'Rien pour l\'instant. Les tâches faites apparaîtront ici.' }}
    </p>

    <section
      v-for="group in groups"
      :key="group.key"
      class="flex flex-col gap-1"
    >
      <h2 class="text-sm font-semibold text-muted">
        {{ group.header }}
      </h2>
      <ul class="flex flex-col divide-y divide-default">
        <li
          v-for="entry in group.entries"
          :key="entry.id"
        >
          <button
            type="button"
            class="w-full py-3 text-left"
            @click="editor.open(entry)"
          >
            <p>
              {{ entry.by.name }} · <span :class="muted(entry.task.archived)">{{ entry.task.name }}</span> ·
              <template v-if="entry.rooms.length">
                <template
                  v-for="(room, index) in entry.rooms"
                  :key="room.id"
                >
                  <span :class="muted(room.archived)">{{ room.name }}</span>{{ index < entry.rooms.length - 1 ? ', ' : '' }}
                </template>
                ·
              </template>
              <!-- No room segment at all for a task with no room (Tasks with no room). -->
              <template v-else-if="entry.task.roomScope !== 'none'">
                Tout l'appartement ·
              </template>
              {{ timeOfDay(entry.doneAt, timeZone) }}
            </p>
            <p
              v-if="entry.note"
              class="text-sm text-muted"
            >
              {{ entry.note }}
            </p>
          </button>
        </li>
      </ul>
    </section>

    <UButton
      v-if="cursor && items.length"
      color="neutral"
      variant="outline"
      class="self-center"
      :loading="loadingMore"
      @click="loadMore"
    >
      Voir plus
    </UButton>
  </div>
</template>
