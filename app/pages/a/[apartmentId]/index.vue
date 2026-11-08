<script setup lang="ts">
// A placeholder until M3 replaces this page with the task buttons.
const { apartment } = useApartment()
// Same key as the Tasks list.
const { data: tasks } = await useFetch(() => `/api/apartments/${apartment.value?.id}/tasks`, { key: `tasks:${apartment.value?.id}` })
const { data: rooms } = await useFetch(() => `/api/apartments/${apartment.value?.id}/rooms`)
const hasTasks = computed(() => tasks.value?.some(task => !task.archivedAt) ?? false)
const hasRooms = computed(() => rooms.value?.some(room => !room.archivedAt) ?? false)
</script>

<template>
  <div class="flex flex-col items-center gap-2 py-12">
    <template v-if="!hasTasks">
      <p class="text-muted">
        Aucune tâche pour l'instant.
      </p>
      <ULink
        :to="`/a/${apartment?.id}/tasks/new`"
        class="text-primary"
      >
        Ajouter une tâche
      </ULink>
    </template>
    <ULink
      v-else
      :to="`/a/${apartment?.id}/tasks`"
      class="text-primary"
    >
      Gérer les tâches
    </ULink>
    <ULink
      v-if="!hasRooms"
      :to="`/a/${apartment?.id}/settings`"
      class="text-primary"
    >
      Ajouter des pièces
    </ULink>
  </div>
</template>
