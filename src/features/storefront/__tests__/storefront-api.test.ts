import { describe, it, expect, vi } from 'vitest'

vi.mock('@/features/export', () => ({
  ExportService: {
    getStorefrontProducts: vi.fn(),
    getStorefrontInventory: vi.fn(),
  },
}))

import { getProducts, getInventory } from '@/lib/storefront/api'
import { ExportService } from '@/features/export'

const mockProduct = {
  id: 'prod-1',
  name: 'Óculos Solar',
  brand: 'Ray-Ban',
  description: null,
  supplierId: null,
  variants: [
    {
      id: 'var-1',
      sku: 'SKU-001',
      frameColor: 'Black',
      lensColor: 'Gray',
      uvProtection: 'UV400',
      isPolarized: true,
      price: '299.90',
      stock: 5,
      images: ['https://example.com/img.jpg'],
    },
  ],
}

const mockInventory = [
  {
    variantId: 'var-1',
    sku: 'SKU-001',
    productName: 'Óculos Solar',
    quantity: 5,
    minStockAlert: 3,
    isLowStock: false,
  },
]

describe('getProducts', () => {
  it('returns typed array from ExportService', async () => {
    vi.mocked(ExportService.getStorefrontProducts).mockResolvedValueOnce([mockProduct])

    const result = await getProducts()

    expect(ExportService.getStorefrontProducts).toHaveBeenCalledWith(undefined)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('prod-1')
    expect(result[0].brand).toBe('Ray-Ban')
  })

  it('passes brand filter to ExportService', async () => {
    vi.mocked(ExportService.getStorefrontProducts).mockResolvedValueOnce([mockProduct])

    await getProducts('Ray-Ban')

    expect(ExportService.getStorefrontProducts).toHaveBeenCalledWith('Ray-Ban')
  })

  it('returns empty array when ExportService throws', async () => {
    vi.mocked(ExportService.getStorefrontProducts).mockRejectedValueOnce(new Error('DB error'))

    const result = await getProducts()

    expect(result).toEqual([])
  })
})

describe('getInventory', () => {
  it('returns typed array from ExportService', async () => {
    vi.mocked(ExportService.getStorefrontInventory).mockResolvedValueOnce(mockInventory)

    const result = await getInventory()

    expect(ExportService.getStorefrontInventory).toHaveBeenCalled()
    expect(result).toHaveLength(1)
    expect(result[0].variantId).toBe('var-1')
    expect(result[0].quantity).toBe(5)
  })

  it('returns empty array when ExportService throws', async () => {
    vi.mocked(ExportService.getStorefrontInventory).mockRejectedValueOnce(new Error('DB error'))

    const result = await getInventory()

    expect(result).toEqual([])
  })
})
