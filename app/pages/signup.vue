<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { signUpSchema, type SignUpInput } from '#shared/schemas/auth'
import { authClient } from '~/lib/auth-client'

const route = useRoute()
const state = reactive({ name: '', email: '', password: '' })
const loading = ref(false)
const errorMessage = ref<string>()

async function onSubmit(event: FormSubmitEvent<SignUpInput>) {
  loading.value = true
  errorMessage.value = undefined
  // Signs the new user in too (Better Auth's autoSignIn).
  const { error } = await authClient.signUp.email(event.data)
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
      Créer un compte
    </h1>
    <UForm
      :schema="signUpSchema"
      :state="state"
      class="flex flex-col gap-4"
      @submit="onSubmit"
    >
      <UFormField
        label="Prénom"
        name="name"
      >
        <UInput
          v-model="state.name"
          autocomplete="given-name"
          autofocus
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="E-mail"
        name="email"
      >
        <UInput
          v-model="state.email"
          type="email"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Mot de passe"
        name="password"
        hint="8 caractères minimum"
      >
        <UInput
          v-model="state.password"
          type="password"
          autocomplete="new-password"
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
        Créer mon compte
      </UButton>
    </UForm>
    <p class="text-center text-sm text-muted">
      Déjà un compte ?
      <ULink
        :to="{ path: '/login', query: { redirect: route.query.redirect } }"
        class="text-primary"
      >
        Se connecter
      </ULink>
    </p>
  </UContainer>
</template>
