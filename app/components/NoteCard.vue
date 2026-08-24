<script setup lang="ts">
import { computed } from 'vue'
import type { Note } from '../features/notes/models'
import { formatTaskProgress } from '../utils/formatters'

const props = defineProps<{
  note: Note
}>()

defineEmits<{
  edit: [id: string]
  delete: [note: Note]
}>()

const completedCount = computed(() => props.note.todos.filter(todo => todo.completed).length)
const visibleTodos = computed(() => props.note.todos.slice(0, 3))
const hiddenCount = computed(() => Math.max(0, props.note.todos.length - visibleTodos.value.length))
</script>

<template>
  <article class="note-card">
    <div class="note-card__header">
      <div>
        <h2 class="note-card__title">{{ note.title }}</h2>
        <p class="note-card__meta">
          {{ formatTaskProgress(completedCount, note.todos.length) }}
        </p>
      </div>
      <div class="note-card__actions">
        <IconButton label="Редактировать заметку" @click="$emit('edit', note.id)">
          <AppIcon name="edit" />
        </IconButton>
        <IconButton label="Удалить заметку" variant="danger" @click="$emit('delete', note)">
          <AppIcon name="trash" />
        </IconButton>
      </div>
    </div>

    <ul v-if="visibleTodos.length" class="note-card__todos">
      <TodoPreview v-for="todo in visibleTodos" :key="todo.id" :todo="todo" />
    </ul>
    <p v-else class="note-card__empty">Задач пока нет</p>
    <p v-if="hiddenCount" class="note-card__more">+ ещё {{ hiddenCount }} {{ hiddenCount === 1 ? 'задача' : 'задачи' }}</p>
  </article>
</template>
