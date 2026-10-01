const localDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/

function padDateTimePart(part: number) {
  return String(part).padStart(2, "0")
}

export function formatLocalDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return `${date.getFullYear()}-${padDateTimePart(date.getMonth() + 1)}-${padDateTimePart(
    date.getDate()
  )} ${padDateTimePart(date.getHours())}:${padDateTimePart(
    date.getMinutes()
  )}:${padDateTimePart(date.getSeconds())}`
}

export function parseLocalDateTime(value: string) {
  const match = localDateTimePattern.exec(value.trim())

  if (!match) {
    return ""
  }

  const [, yearPart, monthPart, dayPart, hourPart, minutePart, secondPart] = match
  const year = Number(yearPart)
  const month = Number(monthPart)
  const day = Number(dayPart)
  const hour = Number(hourPart)
  const minute = Number(minutePart)
  const second = Number(secondPart)
  const date = new Date(year, month - 1, day, hour, minute, second)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    return ""
  }

  return date.toISOString()
}
