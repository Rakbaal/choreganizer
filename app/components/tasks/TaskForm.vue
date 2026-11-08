<script setup lang="ts">
import { taskSchema, type TaskInput } from '#shared/schemas/tasks'

const props = defineProps<{ task?: Task, pending?: boolean }>()
const emit = defineEmits<{ submit: [data: TaskInput] }>()

const { apartment } = useApartment()
const { data: rooms } = await useFetch(() => `/api/apartments/${apartment.value?.id}/rooms`)
const activeRooms = computed(() => rooms.value?.filter(room => !room.archivedAt) ?? [])

// « Partout » on for a new task: the common case needs no tick.
const state = reactive<TaskInput>(props.task
  ? {
      name: props.task.name,
      description: props.task.description ?? '',
      frequency: props.task.frequency && { ...props.task.frequency },
      allRooms: props.task.allRooms,
      roomIds: props.task.rooms.map(room => room.id),
    }
  : { name: '', description: '', frequency: null, allRooms: true, roomIds: [] })

// With no active room the switch is disabled, so an edit that kept « Partout » off could never be saved. Saving turns a
// room-specific task into « Partout »; its archived rooms' rows stay, so once a room is restored, switching « Partout »
// off finds it ticked.
watch(activeRooms, (list) => {
  if (!list.length) state.allRooms = true
}, { immediate: true })

// Reka's Select refuses an empty value, hence 'none' for « Au besoin ».
const unit = computed({
  get: () => state.frequency?.unit ?? 'none',
  set: (value: Frequency['unit'] | 'none') => {
    state.frequency = value === 'none' ? null : { interval: state.frequency?.interval ?? 1, unit: value }
  },
})
const units = [
  { label: 'Au besoin', value: 'none' },
  { label: 'Jours', value: 'day' },
  { label: 'Semaines', value: 'week' },
  { label: 'Mois', value: 'month' },
]
</script>

<template>
  <!-- No validation on blur and no loading-auto, as the rooms form in settings. -->
  <UForm
    :schema="taskSchema"
    :state="state"
    :validate-on="['input', 'change']"
    :loading-auto="false"
    class="flex flex-col gap-4"
    @submit="emit('submit', $event.data)"
  >
    <UFormField
      label="Nom"
      name="name"
    >
      <UInput
        v-model="state.name"
        :autofocus="!task"
        class="w-full"
      />
    </UFormField>
    <UFormField
      label="Description"
      name="description"
      hint="Facultatif"
    >
      <UTextarea
        v-model="state.description"
        autoresize
        class="w-full"
      />
    </UFormField>
    <UFormField
      label="Fréquence"
      name="frequency.interval"
    >
      <div class="flex items-center gap-2">
        <template v-if="state.frequency">
          <span class="text-sm">Tous les</span>
          <UInputNumber
            v-model="state.frequency.interval"
            :min="1"
            :max="365"
            aria-label="Intervalle"
            class="w-28"
          />
        </template>
        <USelect
          v-model="unit"
          :items="units"
          aria-label="Unité"
          class="min-w-32"
        />
      </div>
    </UFormField>
    <UFormField
      label="Pièces"
      name="roomIds"
    >
      <div class="flex flex-col gap-3">
        <USwitch
          v-model="state.allRooms"
          label="Partout"
          :disabled="!activeRooms.length"
        />
        <UCheckboxGroup
          v-if="!state.allRooms"
          v-model="state.roomIds"
          :items="activeRooms"
          value-key="id"
          label-key="name"
        />
        <p
          v-if="!activeRooms.length"
          class="text-sm text-muted"
        >
          Ajoutez des pièces dans les
          <ULink
            :to="`/a/${apartment?.id}/settings`"
            class="text-primary"
          >
            réglages
          </ULink>
          pour choisir des pièces.
        </p>
      </div>
    </UFormField>
    <UButton
      type="submit"
      :loading="pending"
      class="self-start"
    >
      Enregistrer
    </UButton>
  </UForm>
</template>
