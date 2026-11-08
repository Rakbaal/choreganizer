<script setup lang="ts">
import { fr } from '@nuxt/ui/locale'

// At the bottom, under the thumb, and above the bottom bar where there is one (--toast-bottom, main.css).
const toaster = { position: 'bottom-center' as const, ui: { viewport: 'bottom-(--toast-bottom)' } }
</script>

<template>
  <UApp
    :locale="fr"
    :toaster="toaster"
  >
    <NuxtPage />
  </UApp>
</template>
