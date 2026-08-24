<script setup lang="ts">
const {
  addingTodo,
  canRedo,
  canUndo,
  cancelNewTodo,
  cancelTodoEdit,
  confirmNewTodo,
  confirmTodoEdit,
  closeModal,
  editingError,
  editingText,
  editingTodoId,
  errors,
  flushTitleChange,
  handleTitleKeydown,
  isNew,
  modalConfig,
  newTodoCompleted,
  newTodoDraft,
  newTodoError,
  newTodoText,
  openDeleteNoteModal,
  openNewTodo,
  redo,
  requestCancel,
  requestTodoDelete,
  router,
  runModalAction,
  save,
  scheduleTitleChange,
  startTodoEdit,
  titleBefore,
  toggleTodo,
  undo,
  working,
} = useNoteEditor()
</script>

<template>
  <main v-if="working" class="editor-shell">
    <div class="editor-card">
      <header class="editor-header">
        <h1 class="editor-title">{{ isNew ? 'Новая заметка' : 'Редактирование заметки' }}</h1>
        <div class="editor-toolbar" aria-label="Действия с заметкой">
          <button class="toolbar-button" :disabled="!canUndo" @click="undo">
            <AppIcon name="undo" />
            <span>Отменить действие</span>
          </button>
          <button class="toolbar-button" :disabled="!canRedo" @click="redo">
            <AppIcon name="redo" />
            <span>Повторить</span>
          </button>
          <button v-if="!isNew" class="toolbar-button toolbar-button--danger" @click="openDeleteNoteModal">
            <AppIcon name="trash" />
            <span>Удалить заметку</span>
          </button>
        </div>
      </header>

      <form class="editor-form" @submit.prevent="save">
        <div class="field-group">
          <label for="note-title" class="field-label">Заголовок</label>
          <input
            id="note-title"
            v-model="working.title"
            class="field field--large"
            :class="{ 'field--error': errors.title }"
            autocomplete="off"
            @focus="titleBefore = working.title"
            @input="scheduleTitleChange"
            @keydown="handleTitleKeydown"
            @blur="flushTitleChange"
          >
          <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
        </div>

        <fieldset class="todo-fieldset">
          <legend class="field-label">Задачи</legend>
          <ul class="todo-list">
            <TodoRow
              v-for="todo in working.todos"
              :key="todo.id"
              :todo="todo"
              :editing="editingTodoId === todo.id"
              :editing-text="editingTodoId === todo.id ? editingText : ''"
              :error="editingTodoId === todo.id ? editingError : errors.todos[todo.id]"
              @toggle="toggleTodo(todo, $event)"
              @edit="startTodoEdit(todo)"
              @delete="requestTodoDelete(todo)"
              @update:editing-text="editingText = $event"
              @confirm="confirmTodoEdit"
              @cancel="cancelTodoEdit"
            />
            <TodoRow
              v-if="addingTodo"
              :todo="newTodoDraft"
              editing
              :editing-text="newTodoText"
              :error="newTodoError"
              @toggle="newTodoCompleted = $event"
              @update:editing-text="newTodoText = $event"
              @confirm="confirmNewTodo"
              @cancel="cancelNewTodo"
            />
          </ul>
          <AppButton v-if="!addingTodo" class="add-todo-button" @click="openNewTodo">
            <AppIcon name="plus" />
            Добавить задачу
          </AppButton>
        </fieldset>

        <div class="editor-actions">
          <AppButton @click="requestCancel">Отменить</AppButton>
          <AppButton variant="primary" type="submit">Сохранить</AppButton>
        </div>
      </form>
    </div>

    <BaseModal
      v-if="modalConfig"
      :open="true"
      :title="modalConfig.title"
      @close="closeModal"
    >
      <p>{{ modalConfig.content }}</p>
      <template #footer>
        <AppButton
          block
          :variant="modalConfig.secondary.variant"
          @click="runModalAction(modalConfig.secondary.action)"
        >
          {{ modalConfig.secondary.label }}
        </AppButton>
        <AppButton
          block
          :variant="modalConfig.primary.variant"
          @click="runModalAction(modalConfig.primary.action)"
        >
          {{ modalConfig.primary.label }}
        </AppButton>
      </template>
    </BaseModal>
  </main>

  <main v-else class="page-shell">
    <section class="page-container not-found-state">
      <h1>Заметка не найдена</h1>
      <p>Возможно, она была удалена или адрес указан неверно.</p>
      <AppButton variant="primary" @click="router.push('/')">Вернуться к заметкам</AppButton>
    </section>
  </main>
</template>
