<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  variant?: 'neutral' | 'danger' | 'primary'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), {
  variant: 'neutral',
  disabled: false,
  type: 'button',
})
</script>

<template>
  <button
    :type="type"
    class="icon-button"
    :class="`icon-button--${variant}`"
    :aria-label="label"
    :title="label"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
