import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/export', () => ({
  ExportService: {
    getStorefrontProducts: vi.fn(),
    getStorefrontInventory: vi.fn(),
    getStorefrontProduct: vi.fn(),
  },
}))

import { getProduct } from '@/lib/storefront/api'
import { ExportService } from '@/features/export'

const mockProduct = {
  id: 'prod-1',
  name: 'Óculos Solar',
  brand: 'Ray-Ban',
  description: 'Óculos premium',
  supplierId: null,
  variants: [
    {
      id: 'var-1',
      sku: 'SKU-001',
      frameColor: 'Preto',
      lensColor: 'Cinza',
      uvProtection: 'UV400',
      isPolarized: true,
      price: '299.90',
      stock: 5,
      images: ['https://example.com/img.jpg'],
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getProduct', () => {
  it('returns ExportProduct when found', async () => {
    vi.mocked(ExportService.getStorefrontProduct).mockResolvedValueOnce(mockProduct)

    const result = await getProduct('prod-1')

    expect(ExportService.getStorefrontProduct).toHaveBeenCalledWith('prod-1')
    expect(result).not.toBeNull()
    expect(result?.id).toBe('prod-1')
    expect(result?.name).toBe('Óculos Solar')
    expect(result?.variants).toHaveLength(1)
  })

  it('returns null when product not found', async () => {
    vi.mocked(ExportService.getStorefrontProduct).mockResolvedValueOnce(null)

    const result = await getProduct('nonexistent-id')

    expect(result).toBeNull()
  })

  it('returns null when ExportService throws', async () => {
    vi.mocked(ExportService.getStorefrontProduct).mockRejectedValueOnce(new Error('DB error'))

    const result = await getProduct('prod-1')

    expect(result).toBeNull()
  })
})
