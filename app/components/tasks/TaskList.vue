<script setup lang="ts">
import { moveArrayElement, useSortable } from '@vueuse/integrations/useSortable'

const appConfig = useAppConfig()
const toast = useToast()
const { apartment } = useApartment()
// Same key as Home and the edit page, which finds its task in this list.
const { data: tasks, refresh } = await useFetch(() => `/api/apartments/${apartment.value?.id}/tasks`, { key: `tasks:${apartment.value?.id}` })

// Sortable needs a mutable array.
const active = ref<Task[]>([])
watch(tasks, (list) => {
  active.value = (list ?? []).filter(task => !task.archivedAt)
}, { immediate: true })
const archived = computed(() => tasks.value?.filter(task => task.archivedAt) ?? [])

function roomsLabel(task: Task) {
  if (task.roomScope === 'all') return 'Partout'
  if (task.roomScope === 'none') return 'Aucune pièce'
  return task.rooms.map(room => room.name).join(', ')
}

function showError(error: unknown) {
  toast.add({ title: apiErrorMessage(error), color: 'error' })
}

function updateTask(task: Task, body: Record<string, unknown>) {
  return $fetch(`/api/tasks/${task.id}`, { method: 'PATCH', body })
}

const list = useTemplateRef<HTMLElement>('list')
// watchElement: the list sits under a v-if, so Sortable has to start again when it appears.
useSortable(list, active, {
  handle: '[data-handle]',
  animation: 150,
  watchElement: true,
  async onUpdate(event) {
    const task = active.value[event.oldIndex!]
    // Puts the DOM back where Vue expects it, then moves the array.
    moveArrayElement(active, event.oldIndex!, event.newIndex!, event)
    if (!task) return
    try {
      await updateTask(task, { position: event.newIndex })
    }
    catch (error) {
      showError(error)
    }
    // On an error too: puts the order back.
    await refresh()
  },
})

async function restore(task: Task) {
  try {
    await updateTask(task, { archived: false })
    await refresh()
  }
  catch (error) {
    showError(error)
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p
      v-if="!active.length"
      class="text-muted"
    >
      Aucune tâche. Créez la première.
    </p>
    <!-- Rows keyed by id, never by index: that keeps Sortable's DOM and Vue's in sync. -->
    <ul
      v-else
      ref="list"
      class="flex flex-col divide-y divide-default"
    >
      <li
        v-for="task in active"
        :key="task.id"
        class="flex items-center gap-1"
      >
        <!-- touch-none on the handle only: a touch there drags the row, a swipe on the name scrolls the page. Outside the
             link, so pressing it never opens the task. -->
        <UButton
          data-handle
          variant="ghost"
          color="neutral"
          :icon="appConfig.ui.icons.drag"
          aria-label="Déplacer"
          class="cursor-grab touch-none"
        />
        <NuxtLink
          :to="`/a/${apartment?.id}/tasks/${task.id}`"
          class="flex min-w-0 flex-1 flex-col gap-0.5 py-3"
        >
          <span class="font-medium">{{ task.name }}</span>
          <span class="text-sm text-muted">
            {{ frequencyLabel(task.frequency) }} ·
            <span
              v-if="task.roomScope === 'some' && !task.rooms.length"
              class="text-warning"
            >Aucune pièce active</span>
            <template v-else>{{ roomsLabel(task) }}</template>
          </span>
        </NuxtLink>
      </li>
    </ul>
    <UCollapsible v-if="archived.length">
      <UButton
        variant="ghost"
        color="neutral"
        :trailing-icon="appConfig.ui.icons.chevronDown"
      >
        Tâches archivées ({{ archived.length }})
      </UButton>
      <template #content>
        <ul class="flex flex-col gap-1 pt-1">
          <li
            v-for="task in archived"
            :key="task.id"
            class="flex items-center justify-between gap-2 pl-3"
          >
            <span class="min-w-0 truncate text-muted">{{ task.name }}</span>
            <UButton
              variant="ghost"
              color="neutral"
              @click="restore(task)"
            >
              Restaurer
            </UButton>
          </li>
        </ul>
      </template>
    </UCollapsible>
  </div>
</template>
