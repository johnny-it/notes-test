<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'text'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  block?: boolean
}>(), {
  variant: 'secondary',
  type: 'button',
  disabled: false,
  block: false,
})
</script>

<template>
  <button
    :type="type"
    class="app-button"
    :class="[`app-button--${variant}`, { 'app-button--block': block }]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
