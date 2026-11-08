<script setup lang="ts">
const { apartment } = useApartment()
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-2xl font-bold">
        Tâches
      </h1>
      <UButton :to="`/a/${apartment?.id}/tasks/new`">
        Nouvelle tâche
      </UButton>
    </div>
    <TasksTaskList />
  </div>
</template>
