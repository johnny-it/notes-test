import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  createEditorModalConfig,
  type EditorModalAction,
  type EditorModalKind,
} from '../features/notes/editor-modal'
import {
  getHistoryAction,
  shouldKeepNativeUndo,
  shouldPreventTitleSubmit,
} from '../features/notes/editor-keyboard'
import { NoteHistory } from '../features/notes/history'
import type { Note, NoteDraft, Todo } from '../features/notes/models'
import { normalizeNote, validateNote, type NoteValidationErrors } from '../features/notes/validation'
import { useNotesStore } from '../stores/notes'

/** Создаёт рабочую копию заметки, не связанную с состоянием Pinia. */
const cloneNote = (note: Note): Note => ({
  ...note,
  todos: note.todos.map(todo => ({ ...todo })),
})

/** Формирует сравнимый снимок редактируемых полей заметки. */
const snapshot = (note: Note): string => JSON.stringify({ title: note.title, todos: note.todos })

/** Управляет состоянием, действиями, историей и черновиками редактора заметки. */
export const useNoteEditor = () => {
  const route = useRoute()
  const router = useRouter()
  const store = useNotesStore()
  const notesStorage = useNotesStorage()

  const routeId = Array.isArray(route.params.id) ? route.params.id[0] ?? '' : String(route.params.id)
  const isNew = routeId === 'new'
  const editorKey = isNew ? 'new' : routeId
  const now = new Date().toISOString()
  const source = isNew
    ? {
        id: crypto.randomUUID(),
        title: '',
        todos: [],
        createdAt: now,
        updatedAt: now,
      } satisfies Note
    : store.getById(routeId)

  const working = source ? reactive(cloneNote(source)) : null
  const savedSnapshot = ref(working ? snapshot(working) : '')
  const history = new NoteHistory(50)
  const historyVersion = ref(0)
  const titleBefore = ref(working?.title ?? '')
  let titleTimer: ReturnType<typeof setTimeout> | null = null
  let deletedLocally = false

  const errors = reactive<NoteValidationErrors>({ title: null, todos: {} })
  const editingTodoId = ref<string | null>(null)
  const editingText = ref('')
  const editingError = ref<string | null>(null)
  const addingTodo = ref(false)
  const newTodoText = ref('')
  const newTodoCompleted = ref(false)
  const newTodoError = ref<string | null>(null)
  const todoToDelete = ref<Todo | null>(null)
  const draftToRestore = ref<NoteDraft | null>(null)
  const activeModalKind = ref<EditorModalKind | null>(null)

  const isDirty = computed(() => Boolean(working && snapshot(working) !== savedSnapshot.value))
  const canUndo = computed(() => {
    void historyVersion.value
    return history.canUndo
  })
  const canRedo = computed(() => {
    void historyVersion.value
    return history.canRedo
  })
  const newTodoDraft = computed<Todo>(() => ({
    id: 'new-todo',
    text: newTodoText.value,
    completed: newTodoCompleted.value,
  }))
  const modalConfig = computed(() => activeModalKind.value
    ? createEditorModalConfig(
        activeModalKind.value,
        working?.title ?? '',
        todoToDelete.value?.text ?? null,
      )
    : null)

  /** Уведомляет вычисляемые свойства об изменении внутренней истории. */
  const touchHistory = (): void => {
    historyVersion.value += 1
  }

  /** Фиксирует завершённое изменение заголовка в истории. */
  const flushTitleChange = (): void => {
    if (!working) return
    if (titleTimer) clearTimeout(titleTimer)
    titleTimer = null
    const after = working.title
    history.record({ type: 'title', before: titleBefore.value, after })
    titleBefore.value = after
    touchHistory()
  }

  /** Переносит фиксацию заголовка до окончания непрерывного ввода. */
  const scheduleTitleChange = (): void => {
    if (titleTimer) clearTimeout(titleTimer)
    titleTimer = setTimeout(flushTitleChange, 600)
  }

  /** Переводит существующую задачу в режим редактирования. */
  const startTodoEdit = (todo: Todo): void => {
    editingTodoId.value = todo.id
    editingText.value = todo.text
    editingError.value = null
    addingTodo.value = false
  }

  /** Закрывает редактирование задачи без применения текста. */
  const cancelTodoEdit = (): void => {
    editingTodoId.value = null
    editingText.value = ''
    editingError.value = null
  }

  /** Проверяет и применяет изменённый текст задачи. */
  const confirmTodoEdit = (): boolean => {
    if (!working || !editingTodoId.value) return true
    const value = editingText.value.trim()
    if (!value) {
      editingError.value = 'Введите текст задачи'
      return false
    }

    const todo = working.todos.find(item => item.id === editingTodoId.value)
    if (!todo) {
      cancelTodoEdit()
      return true
    }

    const before = todo.text
    todo.text = value
    history.record({ type: 'todo-text', todoId: todo.id, before, after: value })
    touchHistory()
    cancelTodoEdit()
    return true
  }

  /** Изменяет состояние выполнения задачи и записывает операцию в историю. */
  const toggleTodo = (todo: Todo, completed: boolean): void => {
    const before = todo.completed
    todo.completed = completed
    history.record({ type: 'todo-toggle', todoId: todo.id, before, after: completed })
    touchHistory()
  }

  /** Открывает строку добавления новой задачи. */
  const openNewTodo = (): void => {
    cancelTodoEdit()
    addingTodo.value = true
    newTodoText.value = ''
    newTodoCompleted.value = false
    newTodoError.value = null
  }

  /** Закрывает строку добавления и очищает введённые данные. */
  const cancelNewTodo = (): void => {
    addingTodo.value = false
    newTodoText.value = ''
    newTodoError.value = null
  }

  /** Проверяет и добавляет новую задачу в рабочую заметку. */
  const confirmNewTodo = (): boolean => {
    if (!working) return false
    const value = newTodoText.value.trim()
    if (!value) {
      newTodoError.value = 'Введите текст задачи'
      return false
    }

    const todo: Todo = {
      id: crypto.randomUUID(),
      text: value,
      completed: newTodoCompleted.value,
    }
    const index = working.todos.length
    working.todos.push(todo)
    history.record({ type: 'todo-add', todo: { ...todo }, index })
    touchHistory()
    cancelNewTodo()
    return true
  }

  /** Удаляет выбранную задачу с возможностью последующей отмены. */
  const confirmTodoDelete = (): void => {
    if (!working || !todoToDelete.value) return
    const index = working.todos.findIndex(todo => todo.id === todoToDelete.value?.id)
    if (index < 0) return
    const [todo] = working.todos.splice(index, 1)
    if (todo) history.record({ type: 'todo-remove', todo: { ...todo }, index })
    todoToDelete.value = null
    activeModalKind.value = null
    touchHistory()
  }

  /** Выбирает задачу и открывает единое окно подтверждения удаления. */
  const requestTodoDelete = (todo: Todo): void => {
    todoToDelete.value = todo
    activeModalKind.value = 'delete-todo'
  }

  /** Отменяет последнюю операцию редактора. */
  const undo = (): void => {
    if (!working) return
    flushTitleChange()
    cancelTodoEdit()
    cancelNewTodo()
    if (history.undo(working)) touchHistory()
    titleBefore.value = working.title
  }

  /** Повторяет последнюю отменённую операцию редактора. */
  const redo = (): void => {
    if (!working) return
    flushTitleChange()
    cancelTodoEdit()
    cancelNewTodo()
    if (history.redo(working)) touchHistory()
    titleBefore.value = working.title
  }

  /** Переносит результат валидации в реактивное состояние формы. */
  const applyErrors = (nextErrors: NoteValidationErrors): void => {
    errors.title = nextErrors.title
    errors.todos = nextErrors.todos
  }

  /** Сохраняет рабочую версию как новую после удаления исходной заметки в другой вкладке. */
  const saveAsNewAfterExternalDeletion = (): void => {
    if (!working) return
    const nextErrors = validateNote(working)
    applyErrors(nextErrors)
    if (nextErrors.title || Object.keys(nextErrors.todos).length) {
      activeModalKind.value = null
      return
    }

    const timestamp = new Date().toISOString()
    const saved = normalizeNote({
      ...working,
      id: crypto.randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    store.add(saved)
    notesStorage.removeDraft(editorKey)
    void router.push('/')
  }

  /** Проверяет и сохраняет изменения заметки. */
  const save = (): void => {
    if (!working) return
    flushTitleChange()
    if (!confirmTodoEdit()) return
    if (addingTodo.value && !confirmNewTodo()) return

    const nextErrors = validateNote(working)
    applyErrors(nextErrors)
    if (nextErrors.title || Object.keys(nextErrors.todos).length) return

    const saved = normalizeNote({ ...working, updatedAt: new Date().toISOString() })
    if (isNew) store.add(saved)
    else if (!store.replace(saved)) {
      activeModalKind.value = 'external-deletion'
      return
    }

    savedSnapshot.value = snapshot(saved)
    history.reset()
    notesStorage.removeDraft(editorKey)
    void router.push('/')
  }

  /** Возвращает к списку либо запрашивает подтверждение для несохранённых изменений. */
  const requestCancel = (): void => {
    flushTitleChange()
    if (isDirty.value || editingTodoId.value || addingTodo.value) activeModalKind.value = 'cancel-editing'
    else void router.push('/')
  }

  /** Отбрасывает изменения, историю и сохранённый черновик. */
  const confirmCancel = (): void => {
    history.reset()
    notesStorage.removeDraft(editorKey)
    activeModalKind.value = null
    void router.push('/')
  }

  /** Удаляет редактируемую заметку и возвращает к списку. */
  const confirmNoteDelete = (): void => {
    if (isNew) return
    deletedLocally = true
    store.remove(routeId)
    notesStorage.removeDraft(editorKey)
    activeModalKind.value = null
    void router.push('/')
  }

  /** Переносит содержимое найденного черновика в рабочую заметку. */
  const restoreDraft = (): void => {
    if (!working || !draftToRestore.value) return
    working.title = draftToRestore.value.value.title
    working.todos.splice(0, working.todos.length, ...draftToRestore.value.value.todos.map(todo => ({ ...todo })))
    draftToRestore.value = null
    activeModalKind.value = null
    titleBefore.value = working.title
  }

  /** Удаляет найденный черновик без восстановления. */
  const discardDraft = (): void => {
    notesStorage.removeDraft(editorKey)
    draftToRestore.value = null
    activeModalKind.value = null
  }

  /** Открывает единое окно подтверждения удаления заметки. */
  const openDeleteNoteModal = (): void => {
    activeModalKind.value = 'delete-note'
  }

  /** Выполняет действие, выбранное в конфигурации модального окна. */
  const runModalAction = (action: EditorModalAction): void => {
    if (action === 'close') {
      if (activeModalKind.value === 'delete-todo') todoToDelete.value = null
      activeModalKind.value = null
      return
    }
    if (action === 'confirm-cancel') return confirmCancel()
    if (action === 'confirm-note-delete') return confirmNoteDelete()
    if (action === 'confirm-todo-delete') return confirmTodoDelete()
    if (action === 'discard-draft') return discardDraft()
    if (action === 'restore-draft') return restoreDraft()
    if (action === 'save-as-new') return saveAsNewAfterExternalDeletion()
    if (action === 'go-to-list') void router.push('/')
  }

  /** Выполняет действие закрытия, заданное для активного сценария. */
  const closeModal = (): void => {
    if (modalConfig.value) runModalAction(modalConfig.value.closeAction)
  }

  /** Не позволяет Enter в заголовке отправлять форму редактора. */
  const handleTitleKeydown = (event: KeyboardEvent): void => {
    const historyAction = getHistoryAction(event)
    if (historyAction) {
      event.preventDefault()
      event.stopPropagation()
      if (historyAction === 'redo') redo()
      else undo()
      return
    }

    if (shouldPreventTitleSubmit(event)) event.preventDefault()
  }

  /** Обрабатывает глобальные сочетания клавиш отмены и повтора. */
  const handleHotkeys = (event: KeyboardEvent): void => {
    const historyAction = getHistoryAction(event)
    if (!historyAction) return
    if (shouldKeepNativeUndo(event.target)) return
    event.preventDefault()
    if (historyAction === 'redo') redo()
    else undo()
  }

  /** Создаёт версионированный черновик текущего состояния редактора. */
  const createDraft = (): NoteDraft | null => {
    if (!working) return null
    return {
      schemaVersion: 1,
      editorKey,
      noteId: isNew ? null : routeId,
      baseUpdatedAt: isNew ? null : source?.updatedAt ?? null,
      value: cloneNote(working),
      savedAt: new Date().toISOString(),
    }
  }

  /** Немедленно записывает ожидающий черновик перед закрытием страницы. */
  const flushDraft = (): void => {
    if (!isDirty.value) return
    const draft = createDraft()
    if (!draft) return
    notesStorage.scheduleDraft(draft)
    notesStorage.flushDraft(editorKey)
  }

  if (working) {
    const draft = notesStorage.readDraft(editorKey)
    if (draft && snapshot(draft.value) !== savedSnapshot.value) {
      draftToRestore.value = draft
      activeModalKind.value = 'restore-draft'
    }

    watch(working, () => {
      if (!isDirty.value) return
      const nextDraft = createDraft()
      if (nextDraft) notesStorage.scheduleDraft(nextDraft)
    }, { deep: true })
  }

  if (!isNew) {
    watch(() => store.getById(routeId), (note) => {
      if (!note && !deletedLocally && working) activeModalKind.value = 'external-deletion'
    })
  }

  onMounted(() => {
    window.addEventListener('keydown', handleHotkeys)
    window.addEventListener('pagehide', flushDraft)
  })

  onBeforeUnmount(() => {
    if (titleTimer) clearTimeout(titleTimer)
    window.removeEventListener('keydown', handleHotkeys)
    window.removeEventListener('pagehide', flushDraft)
  })

  return {
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
  }
}
