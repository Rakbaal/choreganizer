<script setup lang="ts">
const { apartment } = useApartment()
</script>

<template>
  <div class="flex flex-col items-center gap-2 py-12">
    <p class="text-muted">
      Aucune tâche pour l'instant.
    </p>
    <ULink
      :to="`/a/${apartment?.id}/settings`"
      class="text-primary"
    >
      Ajouter des pièces
    </ULink>
  </div>
</template>
