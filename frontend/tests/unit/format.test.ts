import { describe, expect, it } from 'vitest'
import { dateRangeEndingAt, formatDate, formatNumber, subtractDays } from '../../src/app/format'

describe('format helpers', () => {
  it('formats decimal values for the Peruvian locale', () => {
    expect(formatNumber(49.99999999999999, 1)).toBe('50')
    expect(formatNumber(0.354, 3)).toBe('0.354')
  })

  it('handles UTC date ranges across month boundaries', () => {
    expect(subtractDays('2025-03-01', 1)).toBe('2025-02-28')
    expect(dateRangeEndingAt('2025-03-02', 3)).toEqual(['2025-02-28', '2025-03-01', '2025-03-02'])
    expect(formatDate('2025-03-02')).toContain('2025')
  })
})
