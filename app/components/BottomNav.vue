<script setup lang="ts">
// Bottom navigation bar: the three screens used every day, one thumb tap away. Settings stay in the switcher.
const route = useRoute()
const { apartment } = useApartment()

const items = computed(() => {
  const base = `/a/${apartment.value?.id}`
  return [
    { label: 'Accueil', icon: 'i-lucide-house', to: base, active: route.path === base },
    { label: 'Historique', icon: 'i-lucide-history', to: `${base}/feed`, active: route.path === `${base}/feed` },
    // Its form pages too.
    { label: 'Tâches', icon: 'i-lucide-list-checks', to: `${base}/tasks`, active: route.path.startsWith(`${base}/tasks`) },
  ]
})
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-default pb-[env(safe-area-inset-bottom)]">
    <ul class="mx-auto flex h-16 max-w-lg">
      <li
        v-for="item in items"
        :key="item.label"
        class="flex-1"
      >
        <NuxtLink
          :to="item.to"
          :aria-current="item.active ? 'page' : undefined"
          class="flex h-full flex-col items-center justify-center gap-1 text-xs font-medium"
          :class="item.active ? 'text-primary' : 'text-muted'"
        >
          <UIcon
            :name="item.icon"
            class="size-6"
          />
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
