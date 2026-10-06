export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value)
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(new Date(`${date}T00:00:00Z`))
}

export function isoDate(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function subtractDays(date: string, count: number) {
  const parsed = new Date(`${date}T00:00:00Z`)
  parsed.setUTCDate(parsed.getUTCDate() - count)
  return isoDate(parsed)
}

export function dateRangeEndingAt(endDate: string, days: number) {
  return Array.from({ length: days }, (_, index) => subtractDays(endDate, days - index - 1))
}
