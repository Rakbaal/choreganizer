<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createApartmentSchema, type ApartmentNameInput } from '#shared/schemas/apartments'

const { apartment } = useApartment()
const toast = useToast()
const state = reactive({ name: apartment.value?.name ?? '' })
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<ApartmentNameInput>) {
  if (!apartment.value) return
  loading.value = true
  try {
    await $fetch(`/api/apartments/${apartment.value.id}`, { method: 'PATCH', body: event.data })
    await refreshNuxtData('apartments')
    toast.add({ title: 'Nom enregistré.' })
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
      Nom
    </h2>
    <UForm
      :schema="createApartmentSchema"
      :state="state"
      class="flex flex-col gap-4"
      @submit="onSubmit"
    >
      <UFormField
        label="Nom de l'appartement"
        name="name"
      >
        <UInput
          v-model="state.name"
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
