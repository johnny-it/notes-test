import { describe, expect, it } from 'vitest'
import { formatTaskProgress } from './formatters'

describe('Форматирование прогресса задач', () => {
  it('правильно склоняет слово «задача» для одной задачи', () => {
    expect(formatTaskProgress(1, 1)).toBe('1 из 1 задачи выполнено')
  })

  it('использует форму «задач» для остальных количеств', () => {
    expect(formatTaskProgress(2, 5)).toBe('2 из 5 задач выполнено')
    expect(formatTaskProgress(0, 11)).toBe('0 из 11 задач выполнено')
  })
})
