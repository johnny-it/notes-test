import { describe, expect, it } from 'vitest'
import type { Note } from './models'
import { NoteHistory } from './history'

const createNote = (): Note => ({
  id: 'note-1',
  title: 'План на неделю',
  todos: [
    { id: 'todo-1', text: 'Подготовить отчёт', completed: false },
    { id: 'todo-2', text: 'Встреча с командой', completed: false },
  ],
  createdAt: '2026-08-24T09:00:00.000Z',
  updatedAt: '2026-08-24T09:00:00.000Z',
})

describe('История изменений заметки', () => {
  it('отменяет и повторяет изменение названия', () => {
    const note = createNote()
    const history = new NoteHistory()

    note.title = 'Новый план'
    history.record({ type: 'title', before: 'План на неделю', after: 'Новый план' })

    expect(history.undo(note)).toBe(true)
    expect(note.title).toBe('План на неделю')
    expect(history.redo(note)).toBe(true)
    expect(note.title).toBe('Новый план')
  })

  it('отменяет добавление задачи и возвращает её на прежнюю позицию', () => {
    const note = createNote()
    const history = new NoteHistory()
    const todo = { id: 'todo-3', text: 'Подготовить презентацию', completed: false }

    note.todos.splice(1, 0, todo)
    history.record({ type: 'todo-add', todo: { ...todo }, index: 1 })

    history.undo(note)
    expect(note.todos.map(item => item.id)).toEqual(['todo-1', 'todo-2'])

    history.redo(note)
    expect(note.todos.map(item => item.id)).toEqual(['todo-1', 'todo-3', 'todo-2'])
  })

  it('отменяет удаление задачи и восстанавливает её данные', () => {
    const note = createNote()
    const history = new NoteHistory()
    const removed = note.todos.splice(0, 1)[0]!

    history.record({ type: 'todo-remove', todo: { ...removed }, index: 0 })
    history.undo(note)

    expect(note.todos[0]).toEqual(removed)
  })

  it('отменяет изменение текста и отметки задачи', () => {
    const note = createNote()
    const history = new NoteHistory()

    note.todos[0]!.text = 'Обновить отчёт'
    history.record({
      type: 'todo-text',
      todoId: 'todo-1',
      before: 'Подготовить отчёт',
      after: 'Обновить отчёт',
    })
    note.todos[0]!.completed = true
    history.record({ type: 'todo-toggle', todoId: 'todo-1', before: false, after: true })

    history.undo(note)
    expect(note.todos[0]!.completed).toBe(false)
    history.undo(note)
    expect(note.todos[0]!.text).toBe('Подготовить отчёт')
  })

  it('очищает ветку повторов после нового изменения', () => {
    const note = createNote()
    const history = new NoteHistory()

    note.title = 'Первое изменение'
    history.record({ type: 'title', before: 'План на неделю', after: 'Первое изменение' })
    history.undo(note)

    note.title = 'Другая ветка'
    history.record({ type: 'title', before: 'План на неделю', after: 'Другая ветка' })

    expect(history.canRedo).toBe(false)
    expect(history.redo(note)).toBe(false)
  })

  it('хранит не более пятидесяти операций', () => {
    const history = new NoteHistory(50)

    for (let index = 0; index < 55; index += 1) {
      history.record({ type: 'title', before: `${index}`, after: `${index + 1}` })
    }

    expect(history.size).toBe(50)
  })

  it('не записывает изменение без фактической разницы', () => {
    const history = new NoteHistory()

    history.record({ type: 'title', before: 'План', after: 'План' })

    expect(history.size).toBe(0)
  })

  it('сбрасывает обе ветки истории после завершения сессии', () => {
    const note = createNote()
    const history = new NoteHistory()

    note.title = 'Изменение'
    history.record({ type: 'title', before: 'План на неделю', after: 'Изменение' })
    history.undo(note)
    history.reset()

    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
  })
})
