<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { doneAtSchema, noteSchema, type UpdateLogInput } from '#shared/schemas/logs'

// The log's own rules (doneAtSchema, noteSchema) on the form's shape: « Quand » is a wall-clock time in that timezone.
function formSchema(timeZone: string) {
  return z.object({
    when: z.string().min(1, 'Choisissez une date.').transform(local => fromZonedInput(local, timeZone)).pipe(doneAtSchema),
    note: noteSchema,
  })
}
type EditOutput = z.output<ReturnType<typeof formSchema>>

const editor = useLogEditor()
const { apartment } = useApartment()
const toast = useToast()
const timeZone = computed(() => apartment.value?.timezone ?? 'Europe/Brussels')
const schema = computed(() => formSchema(timeZone.value))

const entry = computed(() => editor.state.value.entry)
const open = computed({
  get: () => editor.state.value.open,
  set: (value) => {
    if (!value) editor.close()
  },
})
const subtitle = computed(() => {
  if (!entry.value) return undefined
  const rooms = entry.value.rooms.map(room => room.name).join(', ')
    || (entry.value.task.roomScope === 'none' ? null : 'Tout l\'appartement')
  return rooms ? `${entry.value.by.name} · ${rooms}` : entry.value.by.name
})

const state = reactive({ when: '', note: '' })
let initialWhen = ''
const max = ref('')
const confirming = ref(false)
const saving = ref(false)
const deleting = ref(false)

// Each opening starts from the log as it is now.
watch(() => editor.state.value, ({ entry: opened, open: isOpen }) => {
  if (!isOpen || !opened) return
  initialWhen = toZonedInput(opened.doneAt, timeZone.value)
  state.when = initialWhen
  state.note = opened.note ?? ''
  max.value = toZonedInput(new Date().toISOString(), timeZone.value)
  confirming.value = false
}, { immediate: true })

async function changed(change: LogChange) {
  editor.notify(change)
  await refreshNuxtData(`tasks:${apartment.value?.id}`)
}

async function onSubmit(event: FormSubmitEvent<EditOutput>) {
  const current = entry.value
  if (!current) return
  // Only what changed: an untouched « Quand » keeps the log's seconds, and its place among logs of the same minute.
  const body: UpdateLogInput = {}
  if (state.when !== initialWhen) body.doneAt = event.data.when
  if (event.data.note !== (current.note ?? '')) body.note = event.data.note
  if (!Object.keys(body).length) return editor.close()
  saving.value = true
  try {
    const updated = await $fetch<LogEntry>(`/api/logs/${current.id}`, { method: 'PATCH', body })
    editor.close()
    toast.add({ title: 'Entrée modifiée.' })
    await changed({ type: 'update', entry: updated })
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  }
  finally {
    saving.value = false
  }
}

// Two taps: the first only arms the button.
async function remove() {
  const current = entry.value
  if (!current) return
  if (!confirming.value) {
    confirming.value = true
    return
  }
  deleting.value = true
  try {
    await $fetch(`/api/logs/${current.id}`, { method: 'DELETE' })
    editor.close()
    toast.add({ title: 'Entrée supprimée.' })
    await changed({ type: 'delete', id: current.id })
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <UDrawer
    v-model:open="open"
    :title="entry?.task.name"
    :description="subtitle"
    :ui="{ container: 'pb-[max(1rem,env(safe-area-inset-bottom))]' }"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="flex flex-col gap-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Quand"
          name="when"
        >
          <UInput
            v-model="state.when"
            type="datetime-local"
            :max="max"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Note"
          name="note"
        >
          <UTextarea
            v-model="state.note"
            autoresize
            class="w-full"
          />
        </UFormField>
        <UButton
          type="submit"
          size="xl"
          block
          :loading="saving"
        >
          Enregistrer
        </UButton>
        <UButton
          size="xl"
          block
          color="error"
          :variant="confirming ? 'solid' : 'outline'"
          :loading="deleting"
          @click="remove"
        >
          {{ confirming ? 'Confirmer la suppression' : 'Supprimer' }}
        </UButton>
      </UForm>
    </template>
  </UDrawer>
</template>
