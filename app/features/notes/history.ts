import type { Note, Todo } from './models'

export type HistoryEntry =
  | { type: 'title', before: string, after: string }
  | { type: 'todo-text', todoId: string, before: string, after: string }
  | { type: 'todo-toggle', todoId: string, before: boolean, after: boolean }
  | { type: 'todo-add', todo: Todo, index: number }
  | { type: 'todo-remove', todo: Todo, index: number }

type Direction = 'undo' | 'redo'

/** Проверяет, изменяет ли операция состояние заметки. */
const isNoop = (entry: HistoryEntry): boolean => {
  if (entry.type === 'title' || entry.type === 'todo-text' || entry.type === 'todo-toggle') {
    return entry.before === entry.after
  }

  return false
}

/** Применяет операцию истории в направлении отмены или повтора. */
const applyEntry = (note: Note, entry: HistoryEntry, direction: Direction): void => {
  if (entry.type === 'title') {
    note.title = direction === 'undo' ? entry.before : entry.after
    return
  }

  if (entry.type === 'todo-add') {
    if (direction === 'undo') {
      const index = note.todos.findIndex(todo => todo.id === entry.todo.id)
      if (index >= 0) note.todos.splice(index, 1)
    }
    else {
      note.todos.splice(entry.index, 0, { ...entry.todo })
    }
    return
  }

  if (entry.type === 'todo-remove') {
    if (direction === 'undo') {
      note.todos.splice(entry.index, 0, { ...entry.todo })
    }
    else {
      const index = note.todos.findIndex(todo => todo.id === entry.todo.id)
      if (index >= 0) note.todos.splice(index, 1)
    }
    return
  }

  const todo = note.todos.find(item => item.id === entry.todoId)
  if (!todo) return

  if (entry.type === 'todo-text') {
    todo.text = direction === 'undo' ? entry.before : entry.after
  }
  else {
    todo.completed = direction === 'undo' ? entry.before : entry.after
  }
}

export class NoteHistory {
  readonly #limit: number
  readonly #past: HistoryEntry[] = []
  readonly #future: HistoryEntry[] = []

  /** Создаёт историю с ограничением на количество сохранённых операций. */
  constructor(limit = 50) {
    this.#limit = limit
  }

  /** Показывает, доступна ли отмена последнего изменения. */
  get canUndo(): boolean {
    return this.#past.length > 0
  }

  /** Показывает, доступен ли повтор отменённого изменения. */
  get canRedo(): boolean {
    return this.#future.length > 0
  }

  /** Возвращает количество операций в ветке отмены. */
  get size(): number {
    return this.#past.length
  }

  /** Добавляет новую операцию и очищает ветку повторов. */
  record(entry: HistoryEntry): void {
    if (isNoop(entry)) return

    this.#past.push(entry)
    if (this.#past.length > this.#limit) this.#past.shift()
    this.#future.splice(0)
  }

  /** Отменяет последнюю операцию и переносит её в ветку повторов. */
  undo(note: Note): boolean {
    const entry = this.#past.pop()
    if (!entry) return false

    applyEntry(note, entry, 'undo')
    this.#future.push(entry)
    return true
  }

  /** Повторяет последнюю отменённую операцию. */
  redo(note: Note): boolean {
    const entry = this.#future.pop()
    if (!entry) return false

    applyEntry(note, entry, 'redo')
    this.#past.push(entry)
    return true
  }

  /** Очищает историю отмены и повтора. */
  reset(): void {
    this.#past.splice(0)
    this.#future.splice(0)
  }
}
