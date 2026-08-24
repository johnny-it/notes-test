export type EditorModalKind =
  | 'cancel-editing'
  | 'delete-note'
  | 'delete-todo'
  | 'restore-draft'
  | 'external-deletion'

export type EditorModalAction =
  | 'close'
  | 'confirm-cancel'
  | 'confirm-note-delete'
  | 'confirm-todo-delete'
  | 'discard-draft'
  | 'restore-draft'
  | 'go-to-list'
  | 'save-as-new'

export interface EditorModalButton {
  label: string
  variant: 'primary' | 'secondary' | 'danger'
  action: EditorModalAction
}

export interface EditorModalConfig {
  title: string
  content: string
  closeAction: EditorModalAction
  secondary: EditorModalButton
  primary: EditorModalButton
}

/** Создаёт содержимое и действия единого модального окна редактора. */
export const createEditorModalConfig = (
  kind: EditorModalKind,
  noteTitle: string,
  todoText: string | null,
): EditorModalConfig => {
  if (kind === 'cancel-editing') {
    return {
      title: 'Отменить редактирование?',
      content: 'Все несохранённые изменения будут потеряны.',
      closeAction: 'close',
      secondary: { label: 'Продолжить', variant: 'secondary', action: 'close' },
      primary: { label: 'Отменить', variant: 'danger', action: 'confirm-cancel' },
    }
  }

  if (kind === 'delete-note') {
    return {
      title: 'Удалить заметку?',
      content: `Заметка «${noteTitle}» будет удалена. Это действие нельзя отменить.`,
      closeAction: 'close',
      secondary: { label: 'Отменить', variant: 'secondary', action: 'close' },
      primary: { label: 'Удалить', variant: 'danger', action: 'confirm-note-delete' },
    }
  }

  if (kind === 'delete-todo') {
    return {
      title: 'Удалить задачу?',
      content: `Задача «${todoText ?? ''}» будет удалена. Действие можно отменить через историю изменений.`,
      closeAction: 'close',
      secondary: { label: 'Отменить', variant: 'secondary', action: 'close' },
      primary: { label: 'Удалить', variant: 'danger', action: 'confirm-todo-delete' },
    }
  }

  if (kind === 'restore-draft') {
    return {
      title: 'Восстановить черновик?',
      content: 'Найдены несохранённые изменения после предыдущего открытия страницы.',
      closeAction: 'discard-draft',
      secondary: { label: 'Не восстанавливать', variant: 'secondary', action: 'discard-draft' },
      primary: { label: 'Восстановить', variant: 'primary', action: 'restore-draft' },
    }
  }

  return {
    title: 'Заметка удалена',
    content: 'Заметка была удалена в другой вкладке. Текущую версию можно сохранить как новую.',
    closeAction: 'close',
    secondary: { label: 'К списку', variant: 'secondary', action: 'go-to-list' },
    primary: { label: 'Сохранить как новую', variant: 'primary', action: 'save-as-new' },
  }
}
