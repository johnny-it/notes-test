/** Формирует строку прогресса с правильным склонением слова «задача». */
export const formatTaskProgress = (completed: number, total: number): string => {
  const lastTwoDigits = total % 100
  const lastDigit = total % 10
  const taskWord = lastDigit === 1 && lastTwoDigits !== 11 ? 'задачи' : 'задач'

  return `${completed} из ${total} ${taskWord} выполнено`
}
