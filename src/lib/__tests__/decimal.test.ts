import { describe, it, expect } from 'vitest'
import Decimal from 'decimal.js'
import { calculateMargin, formatCurrency } from '@/lib/decimal'

describe('calculateMargin', () => {
  it('returns correct margin: cost=50, sale=150 → 66.67%', () => {
    const result = calculateMargin(new Decimal(150), new Decimal(50))
    expect(result.toFixed(2)).toBe('66.67')
  })

  it('returns 100% margin when costPrice is 0', () => {
    const result = calculateMargin(new Decimal(100), new Decimal(0))
    expect(result.toFixed(2)).toBe('100.00')
  })

  it('returns 0 when salePrice is 0', () => {
    const result = calculateMargin(new Decimal(0), new Decimal(50))
    expect(result.toNumber()).toBe(0)
  })
})

describe('Decimal precision vs float', () => {
  it('0.1 + 0.2 with native float is NOT 0.3', () => {
    expect(0.1 + 0.2).not.toBe(0.3)
  })

  it('0.1 + 0.2 with Decimal equals 0.3 exactly', () => {
    const result = new Decimal('0.1').plus(new Decimal('0.2'))
    expect(result.equals(new Decimal('0.3'))).toBe(true)
  })
})

describe('formatCurrency', () => {
  it('formats 1234.56 as Brazilian currency', () => {
    const result = formatCurrency(new Decimal('1234.56'))
    expect(result).toMatch(/R\$/)
    expect(result).toMatch(/1\.234,56/)
  })
})
