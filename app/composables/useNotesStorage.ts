import { NotesStorage } from '../services/notes-storage'

let storage: NotesStorage | null = null

/** Возвращает единый экземпляр хранилища для текущей вкладки браузера. */
export const useNotesStorage = (): NotesStorage => {
  if (storage) return storage
  if (typeof window === 'undefined') {
    throw new Error('Хранилище заметок доступно только в браузере')
  }

  storage = new NotesStorage(window.localStorage)
  return storage
}
