<script setup lang="ts">
const route = useRoute()
const errorMessage = ref<string>()

// Client only: a server-side $fetch wouldn't carry the session cookie, and the accept must run once.
onMounted(async () => {
  try {
    const { apartmentId } = await $fetch<{ apartmentId: string }>(
      `/api/invites/${encodeURIComponent(String(route.params.code))}/accept`,
      { method: 'POST' },
    )
    // The shell looks the apartment up in the cached list: refresh it first, or it bounces to /.
    await refreshNuxtData('apartments')
    // replace: Back doesn't land on /join again.
    await navigateTo(`/a/${apartmentId}`, { replace: true })
  }
  catch (error) {
    errorMessage.value = apiErrorMessage(error)
  }
})
</script>

<template>
  <UContainer class="flex min-h-dvh max-w-sm flex-col justify-center gap-4 py-12">
    <template v-if="errorMessage">
      <UAlert
        color="error"
        variant="subtle"
        :title="errorMessage"
      />
      <ULink
        to="/"
        class="text-center text-sm text-muted"
      >
        Retour à l'accueil
      </ULink>
    </template>
    <p
      v-else
      class="text-center text-muted"
    >
      Connexion à l'appartement…
    </p>
  </UContainer>
</template>
