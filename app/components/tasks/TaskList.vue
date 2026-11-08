<script setup lang="ts">
const { apartment } = useApartment()
// Same key as Home and step 2's edit page, which finds its task in this list.
const { data: tasks } = await useFetch(() => `/api/apartments/${apartment.value?.id}/tasks`, { key: `tasks:${apartment.value?.id}` })
// Nothing can archive a task yet.
const active = computed(() => tasks.value?.filter(task => !task.archivedAt) ?? [])

function roomsLabel(task: Task) {
  if (task.allRooms) return 'Partout'
  return task.rooms.map(room => room.name).join(', ')
}
</script>

<template>
  <p
    v-if="!active.length"
    class="text-muted"
  >
    Aucune tâche. Créez la première.
  </p>
  <ul
    v-else
    class="flex flex-col divide-y divide-default"
  >
    <li
      v-for="task in active"
      :key="task.id"
      class="flex flex-col gap-0.5 py-3"
    >
      <span class="font-medium">{{ task.name }}</span>
      <span class="text-sm text-muted">
        {{ frequencyLabel(task.frequency) }} ·
        <span
          v-if="!task.allRooms && !task.rooms.length"
          class="text-warning"
        >Aucune pièce active</span>
        <template v-else>{{ roomsLabel(task) }}</template>
      </span>
    </li>
  </ul>
</template>
