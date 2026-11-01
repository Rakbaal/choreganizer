<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { createApartmentSchema, type ApartmentNameInput } from '#shared/schemas/apartments'

const { data: apartments } = await useFetch('/api/apartments', { key: 'apartments' })
const hasActive = computed(() => apartments.value?.some(a => !a.archivedAt) ?? false)
const archived = computed(() => apartments.value?.filter(a => a.archivedAt) ?? [])

const state = reactive({ name: '' })
const loading = ref(false)
const errorMessage = ref<string>()

async function onSubmit(event: FormSubmitEvent<ApartmentNameInput>) {
  loading.value = true
  errorMessage.value = undefined
  try {
    const apartment = await $fetch('/api/apartments', { method: 'POST', body: event.data })
    // The shell looks the apartment up in the cached list: refresh it first, or it bounces to /.
    await refreshNuxtData('apartments')
    await navigateTo(`/a/${apartment.id}/settings`)
  }
  catch (error) {
    errorMessage.value = apiErrorMessage(error)
  }
  finally {
    loading.value = false
  }
}

const joinSchema = z.strictObject({ code: z.string().trim().min(1, 'Collez le code ou le lien reçu.') })
const joinState = reactive({ code: '' })

// Takes a bare code or a pasted /join/<code> link: keeps what follows the last /.
function onJoin(event: FormSubmitEvent<z.output<typeof joinSchema>>) {
  const code = event.data.code.replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop() ?? ''
  return navigateTo(`/join/${encodeURIComponent(code)}`)
}
</script>

<template>
  <UContainer class="flex min-h-dvh max-w-sm flex-col justify-center gap-8 py-12">
    <h1 class="text-2xl font-bold">
      Bienvenue
    </h1>
    <section class="flex flex-col gap-4">
      <h2 class="text-lg font-semibold">
        Créer un appartement
      </h2>
      <!-- No validation on blur: the field is autofocused, and tapping an archived apartment's link would show the
           error, shift the link down and miss the tap. -->
      <UForm
        :schema="createApartmentSchema"
        :state="state"
        :validate-on="['input', 'change']"
        class="flex flex-col gap-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Nom de l'appartement"
          name="name"
        >
          <UInput
            v-model="state.name"
            placeholder="Appartement"
            autofocus
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
          Créer
        </UButton>
      </UForm>
    </section>
    <section class="flex flex-col gap-4">
      <h2 class="text-lg font-semibold">
        Rejoindre avec un code
      </h2>
      <!-- No validation on blur either: an error here would shift the links below just the same. -->
      <UForm
        :schema="joinSchema"
        :state="joinState"
        :validate-on="['input', 'change']"
        class="flex flex-col gap-4"
        @submit="onJoin"
      >
        <UFormField
          label="Code ou lien d'invitation"
          name="code"
        >
          <UInput
            v-model="joinState.code"
            autocomplete="off"
            class="w-full"
          />
        </UFormField>
        <UButton
          type="submit"
          block
          color="neutral"
          variant="outline"
        >
          Rejoindre
        </UButton>
      </UForm>
    </section>
    <section
      v-if="archived.length"
      class="flex flex-col gap-2"
    >
      <h2 class="text-lg font-semibold">
        Appartements archivés
      </h2>
      <ul class="flex flex-col gap-1">
        <li
          v-for="apartment in archived"
          :key="apartment.id"
        >
          <ULink
            :to="`/a/${apartment.id}/settings`"
            class="text-muted"
          >
            {{ apartment.name }}
          </ULink>
        </li>
      </ul>
    </section>
    <div class="text-center">
      <ULink
        v-if="hasActive"
        to="/"
        class="text-sm text-muted"
      >
        Retour
      </ULink>
      <UButton
        v-else
        color="neutral"
        variant="outline"
        @click="signOut"
      >
        Se déconnecter
      </UButton>
    </div>
  </UContainer>
</template>
