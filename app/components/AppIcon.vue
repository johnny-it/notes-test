<script setup lang="ts">
export type IconName = 'plus' | 'edit' | 'trash' | 'check' | 'clock' | 'undo' | 'redo' | 'close'

defineProps<{
  name: IconName
}>()
</script>

<template>
  <svg
    class="app-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'plus'">
      <path d="M12 5v14M5 12h14" />
    </template>
    <template v-else-if="name === 'edit'">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="m5 12 4 4L19 6" />
    </template>
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </template>
    <template v-else-if="name === 'undo'">
      <path d="m9 7-4 4 4 4" />
      <path d="M5 11h8a6 6 0 0 1 6 6" />
    </template>
    <template v-else-if="name === 'redo'">
      <path d="m15 7 4 4-4 4" />
      <path d="M19 11h-8a6 6 0 0 0-6 6" />
    </template>
    <template v-else>
      <path d="M6 6l12 12M18 6 6 18" />
    </template>
  </svg>
</template>
