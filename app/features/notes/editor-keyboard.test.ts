import { describe, expect, it } from 'vitest'
import {
  getHistoryAction,
  shouldKeepNativeUndo,
  shouldPreventTitleSubmit,
} from './editor-keyboard'

describe('Клавиатурное управление редактором', () => {
  it('не использует нативную отмену браузера для checkbox', () => {
    const checkbox = { tagName: 'INPUT', type: 'checkbox', isContentEditable: false }

    expect(shouldKeepNativeUndo(checkbox)).toBe(false)
  })

  it('сохраняет нативную отмену для текстовых полей', () => {
    expect(shouldKeepNativeUndo({ tagName: 'INPUT', type: 'text', isContentEditable: false })).toBe(true)
    expect(shouldKeepNativeUndo({ tagName: 'TEXTAREA', isContentEditable: false })).toBe(true)
    expect(shouldKeepNativeUndo({ tagName: 'DIV', isContentEditable: true })).toBe(true)
  })

  it('блокирует отправку формы по Enter в заголовке', () => {
    expect(shouldPreventTitleSubmit({ key: 'Enter', isComposing: false })).toBe(true)
    expect(shouldPreventTitleSubmit({ key: 'Enter', isComposing: true })).toBe(false)
    expect(shouldPreventTitleSubmit({ key: 'Escape', isComposing: false })).toBe(false)
  })

  it('определяет отмену и повтор для Ctrl/Cmd+Z', () => {
    expect(getHistoryAction({ key: 'z', ctrlKey: true, metaKey: false, shiftKey: false })).toBe('undo')
    expect(getHistoryAction({ key: 'Z', ctrlKey: false, metaKey: true, shiftKey: true })).toBe('redo')
    expect(getHistoryAction({ key: 'z', ctrlKey: false, metaKey: false, shiftKey: false })).toBeNull()
  })
})
