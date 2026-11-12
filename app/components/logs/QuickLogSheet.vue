<script setup lang="ts">
// Room chips log at once: task, then a chip, two taps. « Plusieurs pièces… » is the rare hand-picked subset.
const props = defineProps<{
  task: Task | null
  // The task's eligible rooms, by position.
  rooms: { id: string, name: string }[]
}>()
const emit = defineEmits<{ log: [roomIds: string[]] }>()
const open = defineModel<boolean>('open', { default: false })

const several = ref(false)
const picked = ref<string[]>([])

// Closing logs nothing; the next opening starts on the chips again.
watch(open, (value) => {
  if (value) return
  several.value = false
  picked.value = []
})

function pick(roomIds: string[]) {
  open.value = false
  emit('log', roomIds)
}

// « Tout l'appartement » logs the whole flat (no room); « Toutes » every room of a room-specific task.
function pickAll() {
  pick(props.task?.roomScope === 'all' ? [] : props.rooms.map(room => room.id))
}

function toggle(roomId: string) {
  picked.value = picked.value.includes(roomId)
    ? picked.value.filter(id => id !== roomId)
    : [...picked.value, roomId]
}

function validate() {
  pick(props.rooms.filter(room => picked.value.includes(room.id)).map(room => room.id))
}
</script>

<template>
  <UDrawer
    v-model:open="open"
    :title="task?.name"
    :ui="{ container: 'pb-[max(1rem,env(safe-area-inset-bottom))]' }"
  >
    <template #body>
      <div
        v-if="!several"
        class="flex flex-col gap-4"
      >
        <div class="flex flex-wrap gap-2">
          <UButton
            size="xl"
            @click="pickAll"
          >
            {{ task?.roomScope === 'all' ? 'Tout l\'appartement' : 'Toutes' }}
          </UButton>
          <UButton
            v-for="room in rooms"
            :key="room.id"
            size="xl"
            color="neutral"
            variant="outline"
            @click="pick([room.id])"
          >
            {{ room.name }}
          </UButton>
        </div>
        <UButton
          v-if="rooms.length >= 3"
          variant="link"
          color="neutral"
          class="self-start"
          @click="several = true"
        >
          Plusieurs pièces…
        </UButton>
      </div>
      <div
        v-else
        class="flex flex-col gap-4"
      >
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="room in rooms"
            :key="room.id"
            size="xl"
            :color="picked.includes(room.id) ? 'primary' : 'neutral'"
            :variant="picked.includes(room.id) ? 'solid' : 'outline'"
            :aria-pressed="picked.includes(room.id)"
            @click="toggle(room.id)"
          >
            {{ room.name }}
          </UButton>
        </div>
        <UButton
          size="xl"
          block
          :disabled="!picked.length"
          @click="validate"
        >
          Valider
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>
