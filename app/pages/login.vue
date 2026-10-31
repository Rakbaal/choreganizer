<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { signInSchema, type SignInInput } from '#shared/schemas/auth'
import { authClient } from '~/lib/auth-client'

const route = useRoute()
const state = reactive({ email: '', password: '' })
const loading = ref(false)
const errorMessage = ref<string>()

async function onSubmit(event: FormSubmitEvent<SignInInput>) {
  loading.value = true
  errorMessage.value = undefined
  const { error } = await authClient.signIn.email(event.data)
  loading.value = false
  if (error) {
    errorMessage.value = authErrorMessage(error)
    return
  }
  // The middleware reads the cached session: refetch it first, or it still sees the signed-out one.
  await refreshNuxtData()
  await navigateTo(safeRedirect(route.query.redirect))
}
</script>

<template>
  <UContainer class="flex min-h-dvh max-w-sm flex-col justify-center gap-6 py-12">
    <h1 class="text-2xl font-bold">
      Connexion
    </h1>
    <UForm
      :schema="signInSchema"
      :state="state"
      class="flex flex-col gap-4"
      @submit="onSubmit"
    >
      <UFormField
        label="E-mail"
        name="email"
      >
        <UInput
          v-model="state.email"
          type="email"
          autocomplete="email"
          autofocus
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Mot de passe"
        name="password"
      >
        <UInput
          v-model="state.password"
          type="password"
          autocomplete="current-password"
          class="w-full"
        />
      </UFormField>
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="subtle"
        :title="errorMessage"
      />
      <UButton
        type="submit"
        block
        :loading="loading"
      >
        Se connecter
      </UButton>
    </UForm>
    <p class="text-center text-sm text-muted">
      Pas encore de compte ?
      <ULink
        :to="{ path: '/signup', query: { redirect: route.query.redirect } }"
        class="text-primary"
      >
        Créer un compte
      </ULink>
    </p>
  </UContainer>
</template>
