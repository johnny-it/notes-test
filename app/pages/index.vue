<script setup lang="ts">
import { ref } from 'vue'
import type { Note } from '../features/notes/models'
import { useNotesStore } from '../stores/notes'

const store = useNotesStore()
const router = useRouter()
const noteToDelete = ref<Note | null>(null)

/** Открывает редактор выбранной заметки. */
const openEditor = (id: string): void => {
  void router.push(`/notes/${id}`)
}

/** Удаляет выбранную заметку после подтверждения. */
const confirmDelete = (): void => {
  if (!noteToDelete.value) return
  store.remove(noteToDelete.value.id)
  noteToDelete.value = null
}
</script>

<template>
  <main class="page-shell">
    <header class="page-header">
      <div class="page-container page-header__inner">
        <h1 class="page-title">Заметки</h1>
        <AppButton variant="primary" @click="router.push('/notes/new')">
          <AppIcon name="plus" />
          Новая заметка
        </AppButton>
      </div>
    </header>

    <section class="page-container notes-section" aria-labelledby="notes-heading">
      <h2 id="notes-heading" class="sr-only">Список заметок</h2>
      <div v-if="store.notes.length" class="notes-list">
        <NoteCard
          v-for="note in store.notes"
          :key="note.id"
          :note="note"
          @edit="openEditor"
          @delete="noteToDelete = $event"
        />
      </div>
      <div v-else class="empty-state">
        <h2>Заметок пока нет</h2>
        <p>Создайте первую заметку и добавьте в неё задачи.</p>
        <AppButton variant="primary" @click="router.push('/notes/new')">
          <AppIcon name="plus" />
          Новая заметка
        </AppButton>
      </div>
    </section>

    <BaseModal
      :open="Boolean(noteToDelete)"
      title="Удалить заметку?"
      @close="noteToDelete = null"
    >
      <p>
        Заметка «{{ noteToDelete?.title }}» будет удалена. Это действие нельзя отменить.
      </p>
      <template #footer>
        <AppButton block @click="noteToDelete = null">Отменить</AppButton>
        <AppButton block variant="danger" @click="confirmDelete">Удалить</AppButton>
      </template>
    </BaseModal>
  </main>
</template>
