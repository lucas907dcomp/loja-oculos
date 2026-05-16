import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../cart'

const item1 = {
  variantId: 'var-1',
  sku: 'SKU-001',
  productName: 'Óculos Solar A',
  variantLabel: 'Preto / Cinza',
  price: '199.90',
  imageUrl: null,
}

const item2 = {
  variantId: 'var-2',
  sku: 'SKU-002',
  productName: 'Óculos Solar B',
  variantLabel: 'Dourado / Marrom',
  price: '299.50',
  imageUrl: null,
}

beforeEach(() => {
  useCartStore.getState().clearCart()
})

describe('CartStore.addItem', () => {
  it('adds a new item with quantity 1', () => {
    useCartStore.getState().addItem(item1)

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].variantId).toBe('var-1')
    expect(items[0].quantity).toBe(1)
  })

  it('increments quantity when same variantId is added again', () => {
    useCartStore.getState().addItem(item1)
    useCartStore.getState().addItem(item1)

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('adds multiple distinct items as separate entries', () => {
    useCartStore.getState().addItem(item1)
    useCartStore.getState().addItem(item2)

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(2)
  })
})

describe('CartStore.removeItem', () => {
  it('removes item by variantId', () => {
    useCartStore.getState().addItem(item1)
    useCartStore.getState().addItem(item2)

    useCartStore.getState().removeItem('var-1')

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].variantId).toBe('var-2')
  })
})

describe('CartStore.updateQuantity', () => {
  it('updates quantity when qty > 0', () => {
    useCartStore.getState().addItem(item1)

    useCartStore.getState().updateQuantity('var-1', 5)

    expect(useCartStore.getState().items[0].quantity).toBe(5)
  })

  it('removes item when qty <= 0', () => {
    useCartStore.getState().addItem(item1)

    useCartStore.getState().updateQuantity('var-1', 0)

    expect(useCartStore.getState().items).toHaveLength(0)
  })
})

describe('CartStore.totalItems', () => {
  it('returns sum of all quantities', () => {
    useCartStore.getState().addItem(item1)
    useCartStore.getState().addItem(item1)
    useCartStore.getState().addItem(item2)

    expect(useCartStore.getState().totalItems()).toBe(3)
  })

  it('returns 0 for empty cart', () => {
    expect(useCartStore.getState().totalItems()).toBe(0)
  })
})

describe('CartStore.totalPrice', () => {
  it('calculates total correctly with Decimal precision', () => {
    useCartStore.getState().addItem(item1)
    useCartStore.getState().addItem(item1)
    useCartStore.getState().addItem(item2)

    // item1 × 2 = 399.80, item2 × 1 = 299.50 → total = 699.30
    const total = useCartStore.getState().totalPrice()
    expect(total).toBe('R$ 699,30')
  })

  it('returns R$ 0 for empty cart', () => {
    const total = useCartStore.getState().totalPrice()
    expect(total).toBe('R$ 0,00')
  })
})

describe('CartStore.clearCart', () => {
  it('empties all items', () => {
    useCartStore.getState().addItem(item1)
    useCartStore.getState().addItem(item2)

    useCartStore.getState().clearCart()

    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
