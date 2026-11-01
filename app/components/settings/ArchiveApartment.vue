<script setup lang="ts">
const { apartment } = useApartment()
const toast = useToast()
const open = ref(false)
const loading = ref(false)

async function setArchived(archived: boolean) {
  if (!apartment.value) return
  loading.value = true
  try {
    await $fetch(`/api/apartments/${apartment.value.id}`, { method: 'PATCH', body: { archived } })
    await refreshNuxtData('apartments')
    open.value = false
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
  <section
    v-if="apartment"
    class="flex flex-col gap-4"
  >
    <template v-if="apartment.archivedAt">
      <p class="text-muted">
        Cet appartement est archivé.
      </p>
      <!-- No confirm: restoring is reversible. -->
      <UButton
        color="neutral"
        variant="outline"
        class="self-start"
        :loading="loading"
        @click="setArchived(false)"
      >
        Restaurer l'appartement
      </UButton>
    </template>
    <template v-else>
      <h2 class="text-lg font-semibold">
        Archiver l'appartement
      </h2>
      <p class="text-muted">
        Il n'apparaîtra plus à l'ouverture de l'app. Vous pourrez le restaurer ici.
      </p>
      <UModal
        v-model:open="open"
        :title="`Archiver « ${apartment.name} » ?`"
      >
        <UButton
          color="error"
          variant="outline"
          class="self-start"
        >
          Archiver l'appartement
        </UButton>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton
              color="neutral"
              variant="outline"
              @click="open = false"
            >
              Annuler
            </UButton>
            <UButton
              color="error"
              :loading="loading"
              @click="setArchived(true)"
            >
              Archiver
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </section>
</template>
