<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()

const dialog = ref<HTMLElement | null>(null)
const titleId = `modal-title-${useId()}`
let returnFocus: HTMLElement | null = null

const focusableSelector = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** Запрашивает закрытие модального окна. */
const close = (): void => emit('close')

/** Закрывает окно по Escape и удерживает фокус внутри диалога. */
const handleKeydown = (event: KeyboardEvent): void => {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab' || !dialog.value) return

  const elements = [...dialog.value.querySelectorAll<HTMLElement>(focusableSelector)]
  if (elements.length === 0) return
  const first = elements[0]!
  const last = elements.at(-1)!

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

/** Закрывает окно только при нажатии непосредственно на затемнённую область. */
const handleBackdrop = (event: MouseEvent): void => {
  if (event.target === event.currentTarget) close()
}

watch(() => props.open, async (open) => {
  if (open) {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeydown)
    await nextTick()
    const safeAction = dialog.value?.querySelector<HTMLElement>('.modal__footer button:not([disabled])')
    safeAction?.focus()
  }
  else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', handleKeydown)
    returnFocus?.focus()
  }
}, { immediate: true })

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        class="modal-backdrop"
        @mousedown="handleBackdrop"
      >
        <section
          ref="dialog"
          class="modal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <header class="modal__header">
            <h2 :id="titleId" class="modal__title">
              {{ title }}
            </h2>
            <IconButton label="Закрыть окно" @click="close">
              <AppIcon name="close" />
            </IconButton>
          </header>
          <div class="modal__content">
            <slot />
          </div>
          <footer class="modal__footer">
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
