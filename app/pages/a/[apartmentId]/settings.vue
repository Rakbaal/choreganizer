<script setup lang="ts">
const { isOwner } = useApartment()
</script>

<template>
  <div class="flex flex-col gap-8">
    <h1 class="text-2xl font-bold">
      Réglages
    </h1>
    <SettingsApartmentName />
    <SettingsRoomList />
    <SettingsArchiveApartment v-if="isOwner" />
  </div>
</template>
