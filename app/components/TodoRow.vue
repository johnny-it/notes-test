<script setup lang="ts">
import type { Todo } from '../features/notes/models'

defineProps<{
  todo: Todo
  editing?: boolean
  editingText?: string
  error?: string | null
}>()

const emit = defineEmits<{
  toggle: [completed: boolean]
  edit: []
  delete: []
  'update:editingText': [value: string]
  confirm: []
  cancel: []
}>()

/** Передаёт наружу актуальный текст однострочного поля задачи. */
const updateText = (event: Event): void => {
  emit('update:editingText', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <li class="todo-row" :class="{ 'todo-row--editing': editing }">
    <input
      class="todo-checkbox"
      type="checkbox"
      :checked="todo.completed"
      :aria-label="`${todo.completed ? 'Снять отметку' : 'Отметить выполненной'}: ${todo.text}`"
      @change="$emit('toggle', ($event.target as HTMLInputElement).checked)"
    >

    <div class="todo-row__body">
      <template v-if="editing">
        <input
          class="field todo-row__input"
          :class="{ 'field--error': error }"
          :value="editingText"
          aria-label="Текст задачи"
          autocomplete="off"
          @input="updateText"
          @keydown.enter.prevent="$emit('confirm')"
          @keydown.escape.prevent="$emit('cancel')"
        >
        <span v-if="error" class="field-error">{{ error }}</span>
      </template>
      <span v-else class="todo-row__text" :class="{ 'todo-row__text--completed': todo.completed }">
        {{ todo.text }}
      </span>
    </div>

    <div class="todo-row__actions">
      <template v-if="editing">
        <IconButton label="Подтвердить изменение" variant="primary" @click="$emit('confirm')">
          <AppIcon name="check" />
        </IconButton>
        <IconButton label="Отменить изменение" @click="$emit('cancel')">
          <AppIcon name="close" />
        </IconButton>
      </template>
      <template v-else>
        <IconButton label="Редактировать задачу" @click="$emit('edit')">
          <AppIcon name="edit" />
        </IconButton>
        <IconButton label="Удалить задачу" variant="danger" @click="$emit('delete')">
          <AppIcon name="trash" />
        </IconButton>
      </template>
    </div>
  </li>
</template>
