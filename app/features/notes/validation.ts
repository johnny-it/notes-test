import type { Note } from './models'

export interface NoteValidationErrors {
  title: string | null
  todos: Record<string, string>
}

/** Проверяет обязательные поля заметки и её задач. */
export const validateNote = (note: Note): NoteValidationErrors => {
  const todos: Record<string, string> = {}

  for (const todo of note.todos) {
    if (!todo.text.trim()) todos[todo.id] = 'Введите текст задачи'
  }

  return {
    title: note.title.trim() ? null : 'Введите название заметки',
    todos,
  }
}

/** Возвращает копию заметки с пробелами, удалёнными по краям текстовых полей. */
export const normalizeNote = (note: Note): Note => ({
  ...note,
  title: note.title.trim(),
  todos: note.todos.map(todo => ({ ...todo, text: todo.text.trim() })),
})
