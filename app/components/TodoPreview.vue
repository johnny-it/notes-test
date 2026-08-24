<script setup lang="ts">
import type { Todo } from '../features/notes/models'

defineProps<{
  todo: Todo
}>()
</script>

<template>
  <li class="todo-preview" :class="{ 'todo-preview--completed': todo.completed }">
    <AppIcon :name="todo.completed ? 'check' : 'clock'" />
    <span>{{ todo.text }}</span>
    <span class="sr-only">{{ todo.completed ? 'Выполнено' : 'Ожидает выполнения' }}</span>
  </li>
</template>
