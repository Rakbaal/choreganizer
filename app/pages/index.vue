<script setup lang="ts">
const { data: apartments } = await useFetch('/api/apartments', { key: 'apartments' })
const lastApartment = useCookie<string | null>('last_apartment')

const active = apartments.value?.filter(a => !a.archivedAt) ?? []
// The cookie only picks among the user's own active apartments.
const target = active.find(a => a.id === lastApartment.value) ?? active[0]
await navigateTo(target ? `/a/${target.id}` : '/onboarding', { replace: true })
</script>

<template>
  <div />
</template>
