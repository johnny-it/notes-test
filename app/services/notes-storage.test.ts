import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Note, NoteDraft } from '../features/notes/models'
import { NOTES_STORAGE_KEY, NotesStorage, type StorageLike } from './notes-storage'

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

const note: Note = {
  id: 'note-1',
  title: 'План',
  todos: [{ id: 'todo-1', text: 'Задача', completed: false }],
  createdAt: '2026-08-24T09:00:00.000Z',
  updatedAt: '2026-08-24T09:00:00.000Z',
}

describe('Версионированное хранилище заметок', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('возвращает пустое состояние при отсутствии данных', () => {
    const storage = new NotesStorage(new MemoryStorage())

    expect(storage.readNotes()).toEqual({ schemaVersion: 1, notes: [] })
  })

  it('читает корректные данные первой версии', () => {
    const memory = new MemoryStorage()
    memory.setItem(NOTES_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, notes: [note] }))

    expect(new NotesStorage(memory).readNotes().notes).toEqual([note])
  })

  it('игнорирует повреждённый JSON и неизвестную версию', () => {
    const memory = new MemoryStorage()
    memory.setItem(NOTES_STORAGE_KEY, '{сломано')
    expect(new NotesStorage(memory).readNotes().notes).toEqual([])

    memory.setItem(NOTES_STORAGE_KEY, JSON.stringify({ schemaVersion: 99, notes: [note] }))
    expect(new NotesStorage(memory).readNotes().notes).toEqual([])
  })

  it('записывает состояние только после задержки', () => {
    const memory = new MemoryStorage()
    const storage = new NotesStorage(memory, 400)

    storage.scheduleNotes([note])
    expect(memory.getItem(NOTES_STORAGE_KEY)).toBeNull()

    vi.advanceTimersByTime(399)
    expect(memory.getItem(NOTES_STORAGE_KEY)).toBeNull()
    vi.advanceTimersByTime(1)

    expect(JSON.parse(memory.getItem(NOTES_STORAGE_KEY)!)).toEqual({
      schemaVersion: 1,
      notes: [note],
    })
  })

  it('объединяет несколько запланированных записей в одну последнюю', () => {
    const memory = new MemoryStorage()
    const storage = new NotesStorage(memory, 400)
    const updated = { ...note, title: 'Обновлённый план' }

    storage.scheduleNotes([note])
    storage.scheduleNotes([updated])
    vi.runAllTimers()

    expect(JSON.parse(memory.getItem(NOTES_STORAGE_KEY)!).notes[0].title).toBe('Обновлённый план')
  })

  it('сохраняет, читает и удаляет черновик', () => {
    const memory = new MemoryStorage()
    const storage = new NotesStorage(memory, 400)
    const draft: NoteDraft = {
      schemaVersion: 1,
      editorKey: 'note-1',
      noteId: 'note-1',
      baseUpdatedAt: note.updatedAt,
      value: note,
      savedAt: '2026-08-24T09:05:00.000Z',
    }

    storage.scheduleDraft(draft)
    vi.runAllTimers()
    expect(storage.readDraft('note-1')).toEqual(draft)

    storage.removeDraft('note-1')
    expect(storage.readDraft('note-1')).toBeNull()
  })
})
