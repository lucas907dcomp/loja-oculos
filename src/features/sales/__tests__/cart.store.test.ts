import { describe, it, expect, beforeEach } from 'vitest'
import Decimal from 'decimal.js'
import { useCartStore, selectTotal } from '../stores/cart.store'

function makeItem(variantId: string, salePriceStr: string) {
  return {
    variantId,
    sku: `SKU-${variantId}`,
    productName: 'Óculos X',
    frameColor: 'Preto',
    lensColor: 'Cinza',
    salePrice: new Decimal(salePriceStr),
  }
}

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
  })

  it('addItem — appends new item with quantity 1', () => {
    useCartStore.getState().addItem(makeItem('var-1', '120.00'))
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].variantId).toBe('var-1')
    expect(items[0].quantity).toBe(1)
  })

  it('addItem same variantId — increments quantity without duplicating', () => {
    useCartStore.getState().addItem(makeItem('var-1', '120.00'))
    useCartStore.getState().addItem(makeItem('var-1', '120.00'))
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('addItem with explicit quantity — appends with correct quantity', () => {
    useCartStore.getState().addItem(makeItem('var-2', '80.00'), 3)
    expect(useCartStore.getState().items[0].quantity).toBe(3)
  })

  it('removeItem — removes item and leaves others intact', () => {
    useCartStore.getState().addItem(makeItem('var-1', '120.00'))
    useCartStore.getState().addItem(makeItem('var-2', '80.00'))
    useCartStore.getState().removeItem('var-1')
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].variantId).toBe('var-2')
  })

  it('removeItem non-existent — no-op', () => {
    useCartStore.getState().addItem(makeItem('var-1', '120.00'))
    useCartStore.getState().removeItem('var-999')
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('updateQuantity to valid value — updates correctly', () => {
    useCartStore.getState().addItem(makeItem('var-1', '120.00'))
    useCartStore.getState().updateQuantity('var-1', 5)
    expect(useCartStore.getState().items[0].quantity).toBe(5)
  })

  it('updateQuantity to 0 — removes item from cart', () => {
    useCartStore.getState().addItem(makeItem('var-1', '120.00'))
    useCartStore.getState().updateQuantity('var-1', 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('setPaymentBreakdown — replaces breakdown', () => {
    useCartStore.getState().setPaymentBreakdown({ pix: 100, cash: 20 })
    expect(useCartStore.getState().paymentBreakdown).toEqual({ pix: 100, cash: 20 })
  })

  it('clearCart — empties items and resets paymentBreakdown', () => {
    useCartStore.getState().addItem(makeItem('var-1', '120.00'))
    useCartStore.getState().setPaymentBreakdown({ pix: 120 })
    useCartStore.getState().clearCart()
    const { items, paymentBreakdown } = useCartStore.getState()
    expect(items).toHaveLength(0)
    expect(paymentBreakdown).toEqual({})
  })
})

describe('selectTotal', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
  })

  it('empty cart — returns Decimal(0)', () => {
    const total = selectTotal(useCartStore.getState())
    expect(total.equals(new Decimal(0))).toBe(true)
  })

  it('single item — computes salePrice × quantity with Decimal precision', () => {
    useCartStore.getState().addItem(makeItem('var-1', '120.00'), 2)
    const total = selectTotal(useCartStore.getState())
    expect(total.equals(new Decimal('240.00'))).toBe(true)
  })

  it('floating-point case — 0.1 × 1 + 0.2 × 1 = 0.30 (no floating-point error)', () => {
    useCartStore.getState().addItem(makeItem('var-1', '0.10'), 1)
    useCartStore.getState().addItem(makeItem('var-2', '0.20'), 1)
    const total = selectTotal(useCartStore.getState())
    expect(total.toFixed(2)).toBe('0.30')
    expect(total.equals(new Decimal('0.30'))).toBe(true)
  })

  it('multi-item — sums all items correctly', () => {
    useCartStore.getState().addItem(makeItem('var-1', '120.00'), 2)
    useCartStore.getState().addItem(makeItem('var-2', '80.00'), 1)
    const total = selectTotal(useCartStore.getState())
    expect(total.equals(new Decimal('320.00'))).toBe(true)
  })
})
