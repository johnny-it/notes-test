import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Note } from '../features/notes/models'
import { NotesStorage } from '../services/notes-storage'

/** Создаёт независимую копию заметки и вложенных задач. */
const cloneNote = (note: Note): Note => ({
  ...note,
  todos: note.todos.map(todo => ({ ...todo })),
})

/** Управляет сохранённым списком заметок и синхронизирует его с хранилищем. */
export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const initialized = ref(false)
  let repository: NotesStorage | null = null

  const count = computed(() => notes.value.length)

  /** Подключает хранилище и загружает начальное состояние заметок. */
  const initialize = (storage: NotesStorage): void => {
    repository = storage
    notes.value = storage.readNotes().notes.map(cloneNote)
    initialized.value = true
  }

  /** Находит заметку по идентификатору. */
  const getById = (id: string): Note | undefined => notes.value.find(note => note.id === id)

  /** Планирует сохранение текущего списка заметок. */
  const persist = (): void => {
    repository?.scheduleNotes(notes.value)
  }

  /** Добавляет новую заметку и планирует сохранение. */
  const add = (note: Note): void => {
    notes.value.push(cloneNote(note))
    persist()
  }

  /** Заменяет существующую заметку, если она ещё доступна. */
  const replace = (note: Note): boolean => {
    const index = notes.value.findIndex(item => item.id === note.id)
    if (index < 0) return false
    notes.value[index] = cloneNote(note)
    persist()
    return true
  }

  /** Удаляет заметку по идентификатору. */
  const remove = (id: string): boolean => {
    const index = notes.value.findIndex(note => note.id === id)
    if (index < 0) return false
    notes.value.splice(index, 1)
    persist()
    return true
  }

  /** Повторно читает заметки после изменения localStorage в другой вкладке. */
  const reload = (): void => {
    if (!repository) return
    notes.value = repository.readNotes().notes.map(cloneNote)
  }

  return {
    notes,
    initialized,
    count,
    initialize,
    getById,
    add,
    replace,
    remove,
    reload,
  }
})
