import { describe, it, expect } from 'vitest'
import { getVariantStock, isProductInStock } from '@/lib/storefront/inventory'
import type { ExportProduct } from '@/features/export/export.contract'
import type { InventoryEntry } from '@/lib/storefront/api'

const makeInventory = (overrides?: Partial<InventoryEntry>[]): InventoryEntry[] =>
  (overrides ?? []).map((o, i) => ({
    variantId: `var-${i + 1}`,
    sku: `SKU-00${i + 1}`,
    productName: 'Test Product',
    quantity: 5,
    minStockAlert: 3,
    isLowStock: false,
    ...o,
  }))

const makeProduct = (variantIds: string[], stockMap?: Record<string, number>): ExportProduct => ({
  id: 'prod-1',
  name: 'Óculos Test',
  brand: 'TestBrand',
  description: null,
  supplierId: null,
  variants: variantIds.map((id) => ({
    id,
    sku: `SKU-${id}`,
    frameColor: 'Black',
    lensColor: 'Gray',
    uvProtection: 'UV400',
    isPolarized: false,
    price: '199.90',
    stock: stockMap?.[id] ?? 0,
    images: [],
  })),
})

describe('getVariantStock', () => {
  it('returns quantity when variant exists in inventory', () => {
    const inventory = makeInventory([{ variantId: 'var-1', quantity: 10 }])
    expect(getVariantStock('var-1', inventory)).toBe(10)
  })

  it('returns 0 when variant is not in inventory', () => {
    const inventory = makeInventory([{ variantId: 'var-2', quantity: 5 }])
    expect(getVariantStock('var-99', inventory)).toBe(0)
  })

  it('returns 0 for empty inventory', () => {
    expect(getVariantStock('var-1', [])).toBe(0)
  })

  it('returns correct quantity when multiple entries exist', () => {
    const inventory = makeInventory([
      { variantId: 'var-1', quantity: 3 },
      { variantId: 'var-2', quantity: 7 },
    ])
    expect(getVariantStock('var-2', inventory)).toBe(7)
  })
})

describe('isProductInStock', () => {
  it('returns true when at least one variant has stock', () => {
    const inventory = makeInventory([
      { variantId: 'var-1', quantity: 0 },
      { variantId: 'var-2', quantity: 3 },
    ])
    const product = makeProduct(['var-1', 'var-2'])
    expect(isProductInStock(product, inventory)).toBe(true)
  })

  it('returns false when all variants have zero stock', () => {
    const inventory = makeInventory([
      { variantId: 'var-1', quantity: 0 },
      { variantId: 'var-2', quantity: 0 },
    ])
    const product = makeProduct(['var-1', 'var-2'])
    expect(isProductInStock(product, inventory)).toBe(false)
  })

  it('returns false when product has no variants', () => {
    const product = makeProduct([])
    expect(isProductInStock(product, [])).toBe(false)
  })

  it('returns false when variants not found in inventory (treated as zero stock)', () => {
    const product = makeProduct(['var-99'])
    expect(isProductInStock(product, [])).toBe(false)
  })
})
