import { NOTES_STORAGE_KEY } from '../services/notes-storage'
import { useNotesStore } from '../stores/notes'

/** Подключает клиентское хранилище и синхронизацию между вкладками. */
export default defineNuxtPlugin((nuxtApp) => {
  const storage = useNotesStorage()
  const store = useNotesStore()
  store.initialize(storage)

  /** Обновляет Pinia при записи заметок в другой вкладке. */
  const handleStorage = (event: StorageEvent): void => {
    if (event.key === NOTES_STORAGE_KEY) store.reload()
  }

  /** Завершает отложенную запись перед скрытием или закрытием страницы. */
  const handlePageHide = (): void => storage.flushNotes()

  window.addEventListener('storage', handleStorage)
  window.addEventListener('pagehide', handlePageHide)
  nuxtApp.vueApp.onUnmount(() => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener('pagehide', handlePageHide)
  })
})
