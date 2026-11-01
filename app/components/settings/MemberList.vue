<script setup lang="ts">
const toast = useToast()
const { apartment, isOwner } = useApartment()
const { data: session } = await useAuthSession()
const { data: members, refresh } = await useFetch(() => `/api/apartments/${apartment.value?.id}/members`)
const myId = computed(() => session.value?.user.id)

function showError(error: unknown) {
  toast.add({ title: apiErrorMessage(error), color: 'error' })
}

function removeMember(userId: string) {
  return $fetch(`/api/apartments/${apartment.value?.id}/members/${userId}`, { method: 'DELETE' })
}

const toRemove = ref<Member>()
const removeOpen = computed({
  get: () => !!toRemove.value,
  set: (open) => {
    if (!open) toRemove.value = undefined
  },
})
const removing = ref(false)

async function confirmRemove() {
  if (!toRemove.value) return
  removing.value = true
  try {
    await removeMember(toRemove.value.userId)
    toRemove.value = undefined
    await refresh()
  }
  catch (error) {
    showError(error)
  }
  finally {
    removing.value = false
  }
}

// Says what the server's last-owner rule will do.
const leaveMessage = computed(() => {
  const others = members.value?.filter(m => m.userId !== myId.value) ?? []
  if (!others.length) return 'Vous êtes le dernier membre : l\'appartement sera archivé.'
  if (isOwner.value) return `${others[0]!.name} deviendra propriétaire.`
  return 'Vous n\'y aurez plus accès.'
})
const leaveOpen = ref(false)
const leaving = ref(false)

async function leave() {
  if (!myId.value) return
  leaving.value = true
  try {
    await removeMember(myId.value)
    leaveOpen.value = false
    useCookie('last_apartment').value = null
    await refreshNuxtData('apartments')
    await navigateTo('/')
  }
  catch (error) {
    showError(error)
  }
  finally {
    leaving.value = false
  }
}
</script>

<template>
  <section
    v-if="apartment"
    class="flex flex-col gap-4"
  >
    <h2 class="text-lg font-semibold">
      Membres
    </h2>
    <ul class="flex flex-col gap-1">
      <li
        v-for="member in members"
        :key="member.userId"
        class="flex min-h-10 items-center gap-2"
      >
        <span class="min-w-0 truncate">
          {{ member.name }}
          <span
            v-if="member.userId === myId"
            class="text-muted"
          >(vous)</span>
        </span>
        <UBadge
          v-if="member.role === 'owner'"
          color="neutral"
          variant="subtle"
        >
          propriétaire
        </UBadge>
        <UButton
          v-if="isOwner && member.userId !== myId"
          color="neutral"
          variant="ghost"
          class="ms-auto"
          @click="toRemove = member"
        >
          Retirer
        </UButton>
      </li>
    </ul>
    <SettingsInviteModal v-if="isOwner && !apartment.archivedAt" />

    <UModal
      v-model:open="removeOpen"
      :title="`Retirer ${toRemove?.name} ?`"
    >
      <template #body>
        <p>{{ toRemove?.name }} n'aura plus accès à « {{ apartment.name }} ».</p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            @click="removeOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="error"
            :loading="removing"
            @click="confirmRemove"
          >
            Retirer
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="leaveOpen"
      :title="`Quitter « ${apartment.name} » ?`"
    >
      <UButton
        color="error"
        variant="outline"
        class="self-start"
      >
        Quitter l'appartement
      </UButton>
      <template #body>
        <p>{{ leaveMessage }}</p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            @click="leaveOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="error"
            :loading="leaving"
            @click="leave"
          >
            Quitter
          </UButton>
        </div>
      </template>
    </UModal>
  </section>
</template>
