<script setup lang="ts">
import type { TaskInput } from '#shared/schemas/tasks'

const toast = useToast()
const { apartment } = useApartment()
const pending = ref(false)

// No success toast: the list shows the new task.
async function create(data: TaskInput) {
  if (!apartment.value || pending.value) return
  pending.value = true
  try {
    await $fetch(`/api/apartments/${apartment.value.id}/tasks`, { method: 'POST', body: data })
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
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">
      Nouvelle tâche
    </h1>
    <TasksTaskForm
      :pending="pending"
      @submit="create"
    />
  </div>
</template>
