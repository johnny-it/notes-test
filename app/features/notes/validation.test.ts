import { describe, expect, it } from 'vitest'
import type { Note } from './models'
import { normalizeNote, validateNote } from './validation'

const createNote = (): Note => ({
  id: 'note-1',
  title: '  План на неделю  ',
  todos: [{ id: 'todo-1', text: '  Подготовить отчёт  ', completed: false }],
  createdAt: '2026-08-24T09:00:00.000Z',
  updatedAt: '2026-08-24T09:00:00.000Z',
})

describe('Проверка заметки перед сохранением', () => {
  it('не разрешает пустое название', () => {
    const note = createNote()
    note.title = '   '

    expect(validateNote(note)).toEqual({ title: 'Введите название заметки', todos: {} })
  })

  it('не разрешает пустой текст задачи', () => {
    const note = createNote()
    note.todos[0]!.text = '  '

    expect(validateNote(note).todos).toEqual({ 'todo-1': 'Введите текст задачи' })
  })

  it('разрешает заметку без задач', () => {
    const note = createNote()
    note.todos = []

    expect(validateNote(note)).toEqual({ title: null, todos: {} })
  })

  it('удаляет пробелы по краям без изменения исходной заметки', () => {
    const note = createNote()

    const normalized = normalizeNote(note)

    expect(normalized.title).toBe('План на неделю')
    expect(normalized.todos[0]!.text).toBe('Подготовить отчёт')
    expect(note.title).toBe('  План на неделю  ')
  })
})
