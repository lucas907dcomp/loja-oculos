import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,MOCK') },
}))

const mockPrisma = vi.hoisted(() => ({
  productVariant: { findMany: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { LabelService } from '../services/label.service'

const makeVariant = (id: string, sku: string) => ({
  id,
  sku,
  frameColor: 'Preto',
  lensColor: 'Cinza',
  salePrice: 299.9,
  productId: 'prod-1',
  product: { name: 'Óculos X', brand: 'Brand Y', isArchived: false },
})

describe('LabelService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getVariantLabels', () => {
    it('returns correct LabelData shape with qrUrl and numeric salePrice', async () => {
      mockPrisma.productVariant.findMany.mockResolvedValue([makeVariant('v1', 'SKU-001')])
      const result = await LabelService.getVariantLabels(['v1'])
      expect(result).toHaveLength(1)
      const label = result[0]
      expect(label.variantId).toBe('v1')
      expect(label.sku).toBe('SKU-001')
      expect(label.productName).toBe('Óculos X')
      expect(label.brand).toBe('Brand Y')
      expect(label.frameColor).toBe('Preto')
      expect(label.lensColor).toBe('Cinza')
      expect(typeof label.salePrice).toBe('number')
      expect(label.salePrice).toBe(299.9)
      expect(label.qrUrl).toContain('SKU-001')
      expect(label.qrCodeDataUrl).toBe('data:image/png;base64,MOCK')
    })

    it('returns [] without calling DB when variantIds is empty', async () => {
      const result = await LabelService.getVariantLabels([])
      expect(result).toEqual([])
      expect(mockPrisma.productVariant.findMany).not.toHaveBeenCalled()
    })
  })

  describe('getProductLabels', () => {
    it('returns all non-archived variants for a product', async () => {
      mockPrisma.productVariant.findMany.mockResolvedValue([
        makeVariant('v1', 'SKU-001'),
        makeVariant('v2', 'SKU-002'),
      ])
      const result = await LabelService.getProductLabels('prod-1')
      expect(result).toHaveLength(2)
      expect(result[0].sku).toBe('SKU-001')
      expect(result[1].sku).toBe('SKU-002')
      expect(mockPrisma.productVariant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ productId: 'prod-1' }),
        }),
      )
    })

    it('returns [] when product has no non-archived variants', async () => {
      mockPrisma.productVariant.findMany.mockResolvedValue([])
      const result = await LabelService.getProductLabels('prod-empty')
      expect(result).toEqual([])
    })
  })
})
