import type { Note, NoteDraft, PersistedNotesState, Todo } from '../features/notes/models'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const NOTES_STORAGE_KEY = 'notes-spa:notes'
const DRAFT_STORAGE_PREFIX = 'notes-spa:draft:'

/** Проверяет, является ли значение объектом с именованными свойствами. */
const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
)

/** Проверяет структуру задачи, прочитанной из внешнего хранилища. */
const isTodo = (value: unknown): value is Todo => {
  if (!isRecord(value)) return false

  return typeof value.id === 'string'
    && typeof value.text === 'string'
    && typeof value.completed === 'boolean'
}

/** Проверяет структуру заметки, прочитанной из внешнего хранилища. */
const isNote = (value: unknown): value is Note => {
  if (!isRecord(value) || !Array.isArray(value.todos)) return false

  return typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string'
    && value.todos.every(isTodo)
}

/** Проверяет версию и содержимое сохранённого состояния заметок. */
const isPersistedNotesState = (value: unknown): value is PersistedNotesState => {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.notes)) return false
  return value.notes.every(isNote)
}

/** Проверяет структуру сохранённого черновика. */
const isNoteDraft = (value: unknown): value is NoteDraft => {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isNote(value.value)) return false

  return typeof value.editorKey === 'string'
    && (typeof value.noteId === 'string' || value.noteId === null)
    && (typeof value.baseUpdatedAt === 'string' || value.baseUpdatedAt === null)
    && typeof value.savedAt === 'string'
}

/** Безопасно разбирает JSON и возвращает null для повреждённых данных. */
const parseJson = (value: string | null): unknown => {
  if (value === null) return null

  try {
    return JSON.parse(value) as unknown
  }
  catch {
    return null
  }
}

export class NotesStorage {
  readonly #storage: StorageLike
  readonly #delay: number
  #notesTimer: ReturnType<typeof setTimeout> | null = null
  #pendingNotes: string | null = null
  readonly #draftTimers = new Map<string, ReturnType<typeof setTimeout>>()
  readonly #pendingDrafts = new Map<string, string>()

  /** Создаёт сервис поверх заданного хранилища с отложенной записью. */
  constructor(storage: StorageLike, delay = 500) {
    this.#storage = storage
    this.#delay = delay
  }

  /** Читает и проверяет сохранённый список заметок. */
  readNotes(): PersistedNotesState {
    const value = parseJson(this.#storage.getItem(NOTES_STORAGE_KEY))
    if (!isPersistedNotesState(value)) return { schemaVersion: 1, notes: [] }
    return value
  }

  /** Планирует запись последней версии списка заметок. */
  scheduleNotes(notes: Note[]): void {
    this.#pendingNotes = JSON.stringify({ schemaVersion: 1, notes } satisfies PersistedNotesState)
    if (this.#notesTimer) clearTimeout(this.#notesTimer)
    this.#notesTimer = setTimeout(() => this.flushNotes(), this.#delay)
  }

  /** Немедленно записывает ожидающее состояние заметок. */
  flushNotes(): void {
    if (!this.#pendingNotes) return
    this.#storage.setItem(NOTES_STORAGE_KEY, this.#pendingNotes)
    this.#pendingNotes = null
    if (this.#notesTimer) clearTimeout(this.#notesTimer)
    this.#notesTimer = null
  }

  /** Читает и проверяет черновик конкретного редактора. */
  readDraft(editorKey: string): NoteDraft | null {
    const value = parseJson(this.#storage.getItem(this.#draftKey(editorKey)))
    return isNoteDraft(value) ? value : null
  }

  /** Планирует отложенную запись черновика. */
  scheduleDraft(draft: NoteDraft): void {
    const key = draft.editorKey
    this.#pendingDrafts.set(key, JSON.stringify(draft))
    const timer = this.#draftTimers.get(key)
    if (timer) clearTimeout(timer)
    this.#draftTimers.set(key, setTimeout(() => this.flushDraft(key), this.#delay))
  }

  /** Немедленно записывает ожидающий черновик. */
  flushDraft(editorKey: string): void {
    const value = this.#pendingDrafts.get(editorKey)
    if (!value) return
    this.#storage.setItem(this.#draftKey(editorKey), value)
    this.#pendingDrafts.delete(editorKey)
    const timer = this.#draftTimers.get(editorKey)
    if (timer) clearTimeout(timer)
    this.#draftTimers.delete(editorKey)
  }

  /** Удаляет сохранённый и ожидающий черновик. */
  removeDraft(editorKey: string): void {
    const timer = this.#draftTimers.get(editorKey)
    if (timer) clearTimeout(timer)
    this.#draftTimers.delete(editorKey)
    this.#pendingDrafts.delete(editorKey)
    this.#storage.removeItem(this.#draftKey(editorKey))
  }

  /** Формирует ключ localStorage для черновика редактора. */
  #draftKey(editorKey: string): string {
    return `${DRAFT_STORAGE_PREFIX}${editorKey}`
  }
}
