<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { moveArrayElement, useSortable } from '@vueuse/integrations/useSortable'
import { createRoomSchema, type RoomNameInput } from '#shared/schemas/rooms'

const appConfig = useAppConfig()
const toast = useToast()
const { apartment } = useApartment()
const { data: rooms, refresh } = await useFetch(() => `/api/apartments/${apartment.value?.id}/rooms`)

// Sortable needs a mutable array, and each row its own draft name.
const active = ref<Room[]>([])
const drafts = reactive<Record<string, string>>({})
watch(rooms, (list) => {
  active.value = (list ?? []).filter(room => !room.archivedAt)
  for (const room of list ?? []) drafts[room.id] = room.name
}, { immediate: true })
const archived = computed(() => rooms.value?.filter(room => room.archivedAt) ?? [])

function showError(error: unknown) {
  toast.add({ title: apiErrorMessage(error), color: 'error' })
}

function updateRoom(room: Room, body: Record<string, unknown>) {
  return $fetch(`/api/rooms/${room.id}`, { method: 'PATCH', body })
}

const list = useTemplateRef<HTMLElement>('list')
// watchElement: the list sits under a v-if, so Sortable has to start again when it appears.
useSortable(list, active, {
  handle: '[data-handle]',
  animation: 150,
  watchElement: true,
  async onUpdate(event) {
    const room = active.value[event.oldIndex!]
    // Puts the DOM back where Vue expects it, then moves the array.
    moveArrayElement(active, event.oldIndex!, event.newIndex!, event)
    if (!room) return
    try {
      await updateRoom(room, { position: event.newIndex })
    }
    catch (error) {
      showError(error)
    }
    // On an error too: puts the order back.
    await refresh()
  },
})

function blur(event: KeyboardEvent) {
  (event.target as HTMLInputElement).blur()
}

function cancelRename(room: Room, event: KeyboardEvent) {
  drafts[room.id] = room.name
  blur(event)
}

// Saves on blur, not only on Enter: a phone keyboard has no reliable Enter, and the toast confirms it.
async function rename(room: Room) {
  const name = drafts[room.id]?.trim() ?? ''
  if (name === room.name) {
    drafts[room.id] = room.name
    return
  }
  const parsed = createRoomSchema.safeParse({ name })
  if (!parsed.success) {
    drafts[room.id] = room.name
    toast.add({ title: parsed.error.issues[0]!.message, color: 'error' })
    return
  }
  try {
    await updateRoom(room, parsed.data)
    toast.add({ title: 'Pièce renommée.' })
    await refresh()
  }
  catch (error) {
    drafts[room.id] = room.name
    showError(error)
  }
}

async function setArchived(room: Room, archived: boolean) {
  try {
    await updateRoom(room, { archived })
    await refresh()
  }
  catch (error) {
    showError(error)
  }
}

const state = reactive({ name: '' })
const adding = ref(false)
const input = useTemplateRef('input')

async function onSubmit(event: FormSubmitEvent<RoomNameInput>) {
  if (!apartment.value || adding.value) return
  adding.value = true
  try {
    await $fetch(`/api/apartments/${apartment.value.id}/rooms`, { method: 'POST', body: event.data })
    state.name = ''
    await refresh()
    // Stays in the field to add several rooms in a row.
    input.value?.inputRef?.focus()
  }
  catch (error) {
    showError(error)
  }
  finally {
    adding.value = false
  }
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="text-lg font-semibold">
      Pièces
    </h2>
    <p
      v-if="!active.length"
      class="text-muted"
    >
      Aucune pièce. Ajoutez la première ci-dessous.
    </p>
    <!-- Rows keyed by id, never by index: that keeps Sortable's DOM and Vue's in sync. -->
    <ul
      v-else
      ref="list"
      class="flex flex-col gap-1"
    >
      <li
        v-for="room in active"
        :key="room.id"
        class="flex items-center gap-1"
      >
        <!-- touch-none: a touch on the handle drags the row instead of scrolling the page. -->
        <UButton
          data-handle
          variant="ghost"
          color="neutral"
          :icon="appConfig.ui.icons.drag"
          aria-label="Déplacer"
          class="cursor-grab touch-none"
        />
        <UInput
          v-model="drafts[room.id]"
          variant="ghost"
          aria-label="Nom de la pièce"
          class="min-w-0 flex-1"
          @keydown.enter="blur"
          @keydown.escape="cancelRename(room, $event)"
          @blur="rename(room)"
        />
        <UButton
          variant="ghost"
          color="neutral"
          @click="setArchived(room, true)"
        >
          Archiver
        </UButton>
      </li>
    </ul>
    <!-- No validation on blur: tapping into the field and out again must not show an error. No loading-auto: it
         disables the field while saving, which drops the focus (and a phone's keyboard). -->
    <UForm
      :schema="createRoomSchema"
      :state="state"
      :validate-on="['input', 'change']"
      :loading-auto="false"
      class="flex items-start gap-2"
      @submit="onSubmit"
    >
      <UFormField
        name="name"
        class="min-w-0 flex-1"
      >
        <UInput
          ref="input"
          v-model="state.name"
          placeholder="Nouvelle pièce"
          aria-label="Nouvelle pièce"
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        :loading="adding"
      >
        Ajouter
      </UButton>
    </UForm>
    <UCollapsible v-if="archived.length">
      <UButton
        variant="ghost"
        color="neutral"
        :trailing-icon="appConfig.ui.icons.chevronDown"
      >
        Pièces archivées ({{ archived.length }})
      </UButton>
      <template #content>
        <ul class="flex flex-col gap-1 pt-1">
          <li
            v-for="room in archived"
            :key="room.id"
            class="flex items-center justify-between gap-2 pl-3"
          >
            <span class="min-w-0 truncate text-muted">{{ room.name }}</span>
            <UButton
              variant="ghost"
              color="neutral"
              @click="setArchived(room, false)"
            >
              Restaurer
            </UButton>
          </li>
        </ul>
      </template>
    </UCollapsible>
  </section>
</template>
