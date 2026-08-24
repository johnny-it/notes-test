import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Note } from '../features/notes/models'
import { NotesStorage, type StorageLike } from '../services/notes-storage'
import { useNotesStore } from './notes'

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

const createNote = (id = 'note-1'): Note => ({
  id,
  title: 'План',
  todos: [],
  createdAt: '2026-08-24T09:00:00.000Z',
  updatedAt: '2026-08-24T09:00:00.000Z',
})

describe('Хранилище состояния заметок', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  it('загружает сохранённые заметки при инициализации', () => {
    const memory = new MemoryStorage()
    memory.setItem('notes-spa:notes', JSON.stringify({ schemaVersion: 1, notes: [createNote()] }))
    const store = useNotesStore()

    store.initialize(new NotesStorage(memory))

    expect(store.notes).toHaveLength(1)
    expect(store.getById('note-1')?.title).toBe('План')
  })

  it('добавляет заметку и планирует сохранение', () => {
    const memory = new MemoryStorage()
    const store = useNotesStore()
    store.initialize(new NotesStorage(memory, 100))

    store.add(createNote())
    vi.runAllTimers()

    expect(JSON.parse(memory.getItem('notes-spa:notes')!).notes).toHaveLength(1)
  })

  it('заменяет существующую заметку, но не создаёт удалённую во второй вкладке', () => {
    const store = useNotesStore()
    store.initialize(new NotesStorage(new MemoryStorage()))
    store.add(createNote())

    expect(store.replace({ ...createNote(), title: 'Обновлённый план' })).toBe(true)
    expect(store.getById('note-1')?.title).toBe('Обновлённый план')

    store.remove('note-1')
    expect(store.replace(createNote())).toBe(false)
    expect(store.notes).toHaveLength(0)
  })

  it('удаляет заметку и сообщает об отсутствии повторного удаления', () => {
    const store = useNotesStore()
    store.initialize(new NotesStorage(new MemoryStorage()))
    store.add(createNote())

    expect(store.remove('note-1')).toBe(true)
    expect(store.remove('note-1')).toBe(false)
  })

  it('перечитывает состояние после изменения в другой вкладке', () => {
    const memory = new MemoryStorage()
    const storage = new NotesStorage(memory, 0)
    const store = useNotesStore()
    store.initialize(storage)
    store.add(createNote())
    vi.runAllTimers()

    memory.setItem('notes-spa:notes', JSON.stringify({ schemaVersion: 1, notes: [] }))
    store.reload()

    expect(store.getById('note-1')).toBeUndefined()
  })
})
