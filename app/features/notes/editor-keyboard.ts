interface KeyboardTarget {
  tagName?: string
  type?: string
  isContentEditable?: boolean
}

interface KeyboardKey {
  key: string
  isComposing?: boolean
}

interface HistoryKey extends KeyboardKey {
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
}

export type HistoryAction = 'undo' | 'redo'

/** Проверяет, должен ли браузер самостоятельно обрабатывать отмену ввода. */
export const shouldKeepNativeUndo = (target: unknown): boolean => {
  if (typeof target !== 'object' || target === null) return false

  const element = target as KeyboardTarget
  const tagName = element.tagName?.toLowerCase()

  if (tagName === 'textarea' || element.isContentEditable) return true
  return tagName === 'input' && element.type?.toLowerCase() !== 'checkbox'
}

/** Проверяет, нужно ли блокировать отправку формы из поля заголовка. */
export const shouldPreventTitleSubmit = (event: KeyboardKey): boolean => (
  event.key === 'Enter' && !event.isComposing
)

/** Возвращает действие истории для поддерживаемого сочетания клавиш. */
export const getHistoryAction = (event: HistoryKey): HistoryAction | null => {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return null
  return event.shiftKey ? 'redo' : 'undo'
}
