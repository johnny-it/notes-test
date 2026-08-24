import { describe, expect, it } from 'vitest'
import {
  createEditorModalConfig,
  type EditorModalAction,
  type EditorModalKind,
} from './editor-modal'

describe('Конфигурация модального окна редактора', () => {
  it.each<{
    kind: EditorModalKind
    scenario: string
    title: string
    secondaryLabel: string
    primaryLabel: string
    primaryAction: EditorModalAction
  }>([
    { kind: 'cancel-editing', scenario: 'отмены редактирования', title: 'Отменить редактирование?', secondaryLabel: 'Продолжить', primaryLabel: 'Отменить', primaryAction: 'confirm-cancel' },
    { kind: 'delete-note', scenario: 'удаления заметки', title: 'Удалить заметку?', secondaryLabel: 'Отменить', primaryLabel: 'Удалить', primaryAction: 'confirm-note-delete' },
    { kind: 'delete-todo', scenario: 'удаления задачи', title: 'Удалить задачу?', secondaryLabel: 'Отменить', primaryLabel: 'Удалить', primaryAction: 'confirm-todo-delete' },
    { kind: 'restore-draft', scenario: 'восстановления черновика', title: 'Восстановить черновик?', secondaryLabel: 'Не восстанавливать', primaryLabel: 'Восстановить', primaryAction: 'restore-draft' },
    { kind: 'external-deletion', scenario: 'удаления в другой вкладке', title: 'Заметка удалена', secondaryLabel: 'К списку', primaryLabel: 'Сохранить как новую', primaryAction: 'save-as-new' },
  ])('создаёт содержимое и действия для сценария $scenario', ({ kind, title, secondaryLabel, primaryLabel, primaryAction }) => {
    const config = createEditorModalConfig(kind, 'План', 'Подготовить отчёт')

    expect(config.title).toBe(title)
    expect(config.secondary.label).toBe(secondaryLabel)
    expect(config.primary.label).toBe(primaryLabel)
    expect(config.primary.action).toBe(primaryAction)
  })

  it('подставляет названия заметки и задачи в текст подтверждения', () => {
    expect(createEditorModalConfig('delete-note', 'План', null).content).toContain('«План»')
    expect(createEditorModalConfig('delete-todo', 'План', 'Отчёт').content).toContain('«Отчёт»')
  })
})
