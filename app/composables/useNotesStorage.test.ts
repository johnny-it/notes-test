import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StorageLike } from '../services/notes-storage'
import { useNotesStorage } from './useNotesStorage'

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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Доступ к хранилищу заметок', () => {
  it('возвращает один экземпляр для всех потребителей', () => {
    vi.stubGlobal('window', { localStorage: new MemoryStorage() })

    expect(useNotesStorage()).toBe(useNotesStorage())
  })
})
