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

// Lifts the toasts above the bottom bar (main.css), on apartment pages only.
useHead({ bodyAttrs: { class: 'has-bottom-nav' } })
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
    <!-- Room for the fixed bottom bar: its 4rem, the safe area, then the usual 1.5rem. -->
    <UContainer class="w-full flex-1 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <NuxtPage />
    </UContainer>
    <BottomNav />
  </div>
</template>
