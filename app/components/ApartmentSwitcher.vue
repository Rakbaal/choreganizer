<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const appConfig = useAppConfig()
const { data: apartments } = useNuxtData<Apartment[]>('apartments')
const { apartment: current } = useApartment()

const items = computed(() => {
  const list = apartments.value ?? []
  const toItem = (apartment: Apartment): DropdownMenuItem => ({
    label: apartment.name,
    to: `/a/${apartment.id}`,
    active: apartment.id === current.value?.id,
  })
  const active = list.filter(a => !a.archivedAt).map(toItem)
  const archived = list.filter(a => a.archivedAt).map(a => ({ ...toItem(a), class: 'text-muted' }))

  const groups: DropdownMenuItem[][] = []
  if (active.length) groups.push(active)
  if (archived.length) groups.push([{ label: 'Archivés', type: 'label' }, ...archived])
  groups.push(
    [
      { label: 'Nouvel appartement', to: '/onboarding' },
      { label: 'Réglages', to: `/a/${current.value?.id}/settings` },
    ],
    [{ label: 'Se déconnecter', onSelect: signOut }],
  )
  return groups
})
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'start' }"
  >
    <UButton
      :label="current?.name"
      color="neutral"
      variant="ghost"
      :trailing-icon="appConfig.ui.icons.chevronDown"
      class="min-w-0 font-semibold"
    />
  </UDropdownMenu>
</template>
