<script setup lang="ts">
import type { TaskInput } from '#shared/schemas/tasks'

const route = useRoute()
const toast = useToast()
const { apartment } = useApartment()
// The task comes from the list, under its key: no request of its own.
const { data: tasks } = await useFetch(() => `/api/apartments/${apartment.value?.id}/tasks`, { key: `tasks:${apartment.value?.id}` })
const task = computed(() => tasks.value?.find(t => t.id === route.params.taskId))
// One for the three requests, so a double tap sends one.
const pending = ref(false)

// No toast: the list shows the change.
async function update(body: TaskInput | { archived: boolean }) {
  if (!apartment.value || !task.value || pending.value) return
  pending.value = true
  try {
    await $fetch(`/api/tasks/${task.value.id}`, { method: 'PATCH', body })
    // The list reuses this page's cached data under the same key instead of fetching again.
    await refreshNuxtData(`tasks:${apartment.value.id}`)
    await navigateTo(`/a/${apartment.value.id}/tasks`)
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div
    v-if="!task"
    class="flex flex-col items-center gap-2 py-12"
  >
    <p class="text-muted">
      Tâche introuvable.
    </p>
    <ULink
      :to="`/a/${apartment?.id}/tasks`"
      class="text-primary"
    >
      Retour aux tâches
    </ULink>
  </div>
  <div
    v-else
    class="flex flex-col gap-6"
  >
    <h1 class="text-2xl font-bold">
      Modifier la tâche
    </h1>
    <TasksTaskForm
      :key="task.id"
      :task="task"
      :pending="pending"
      @submit="update"
    />
    <!-- An archived task is reachable by URL only: it can still be edited, and restored. -->
    <UButton
      color="neutral"
      variant="ghost"
      class="self-start"
      :disabled="pending"
      @click="update({ archived: !task.archivedAt })"
    >
      {{ task.archivedAt ? 'Restaurer la tâche' : 'Archiver la tâche' }}
    </UButton>
  </div>
</template>
