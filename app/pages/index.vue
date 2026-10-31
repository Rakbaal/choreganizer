<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

// Same cache key as the middleware: no second request.
const { data: session } = await authClient.useSession(useFetch)

async function signOut() {
  await authClient.signOut()
  // Refetch the cached session, or the middleware still sees the user and sends /login back here.
  await refreshNuxtData()
  await navigateTo('/login')
}
</script>

<template>
  <UContainer class="flex min-h-dvh flex-col items-center justify-center gap-4 py-12 text-center">
    <h1 class="text-3xl font-bold">
      Bonjour {{ session?.user.name }}
    </h1>
    <UButton
      color="neutral"
      variant="outline"
      @click="signOut"
    >
      Se déconnecter
    </UButton>
  </UContainer>
</template>
