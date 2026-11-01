<script setup lang="ts">
await useFetch('/api/apartments', { key: 'apartments' })
const { apartment } = useApartment()
const lastApartment = useCookie<string | null>('last_apartment', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })

// Not in the list covers a malformed id, an apartment you left and someone else's.
async function syncApartment() {
  if (!apartment.value) return navigateTo('/', { replace: true })
  lastApartment.value = apartment.value.id
}

await syncApartment()
// Switching apartments can reuse this page.
watch(() => apartment.value?.id, syncApartment)
</script>

<template>
  <div
    v-if="apartment"
    class="flex min-h-dvh flex-col"
  >
    <header class="flex items-center gap-2 border-b border-default px-2 py-2">
      <ApartmentSwitcher />
      <UBadge
        v-if="apartment.archivedAt"
        color="neutral"
        variant="subtle"
      >
        Archivé
      </UBadge>
    </header>
    <UContainer class="w-full flex-1 py-6">
      <NuxtPage />
    </UContainer>
  </div>
</template>
