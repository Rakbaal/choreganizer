<script setup lang="ts">
const appConfig = useAppConfig()
const { apartment } = useApartment()
const toast = useToast()
const origin = useRequestURL().origin
const open = ref(false)
const url = ref<string>()
const errorMessage = ref<string>()
// Set on mount: the server can't know, and a different first render would break hydration.
const canShare = ref(false)
onMounted(() => {
  canShare.value = 'share' in navigator
})

// Each opening makes a new code: one tap to the link.
watch(open, async (isOpen) => {
  if (!isOpen || !apartment.value) return
  url.value = undefined
  errorMessage.value = undefined
  try {
    const { code } = await $fetch(`/api/apartments/${apartment.value.id}/invites`, { method: 'POST' })
    url.value = `${origin}/join/${code}`
  }
  catch (error) {
    errorMessage.value = apiErrorMessage(error)
  }
})

async function copy() {
  if (!url.value) return
  await navigator.clipboard.writeText(url.value)
  toast.add({ title: 'Lien copié.' })
}

async function share() {
  if (!url.value || !apartment.value) return
  try {
    await navigator.share({ text: `Rejoins « ${apartment.value.name} » sur Choreganizer`, url: url.value })
  }
  catch (error) {
    // Closing the share sheet rejects with an AbortError.
    if (!(error instanceof DOMException && error.name === 'AbortError')) throw error
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Inviter quelqu'un"
  >
    <UButton class="self-start">
      Inviter
    </UButton>
    <template #body>
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="subtle"
        :title="errorMessage"
      />
      <div
        v-else-if="!url"
        class="flex justify-center py-4"
      >
        <UIcon
          :name="appConfig.ui.icons.loading"
          class="size-6 animate-spin text-muted"
        />
      </div>
      <div
        v-else
        class="flex flex-col gap-4"
      >
        <UInput
          :model-value="url"
          readonly
          class="w-full"
        />
        <div class="flex gap-2">
          <UButton
            :icon="appConfig.ui.icons.copy"
            @click="copy"
          >
            Copier
          </UButton>
          <UButton
            v-if="canShare"
            color="neutral"
            variant="outline"
            @click="share"
          >
            Partager
          </UButton>
        </div>
        <p class="text-sm text-muted">
          Valable 7 jours, une seule fois.
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end">
        <UButton
          color="neutral"
          variant="outline"
          @click="open = false"
        >
          Fermer
        </UButton>
      </div>
    </template>
  </UModal>
</template>
