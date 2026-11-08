<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { timezoneSchema } from '#shared/schemas/apartments'

const schema = z.strictObject({ timezone: timezoneSchema })
type TimezoneInput = z.infer<typeof schema>

const { apartment } = useApartment()
const toast = useToast()
const timezones = Intl.supportedValuesOf('timeZone')
const state = reactive({ timezone: apartment.value?.timezone ?? 'Europe/Brussels' })
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<TimezoneInput>) {
  if (!apartment.value) return
  loading.value = true
  try {
    await $fetch(`/api/apartments/${apartment.value.id}`, { method: 'PATCH', body: event.data })
    await refreshNuxtData('apartments')
    toast.add({ title: 'Fuseau horaire enregistré.' })
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="text-lg font-semibold">
      Fuseau horaire
    </h2>
    <UForm
      :schema="schema"
      :state="state"
      class="flex flex-col gap-4"
      @submit="onSubmit"
    >
      <UFormField
        label="Fuseau horaire"
        name="timezone"
      >
        <USelectMenu
          v-model="state.timezone"
          :items="timezones"
          :search-input="{ placeholder: 'Rechercher…' }"
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        class="self-start"
        :loading="loading"
      >
        Enregistrer
      </UButton>
    </UForm>
  </section>
</template>
