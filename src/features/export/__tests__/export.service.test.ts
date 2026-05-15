import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  product: {
    findMany: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { ExportService } from '../services/export.service'

const makeDecimal = (value: string) => ({ toString: () => value })

const makeProduct = (overrides?: { isArchived?: boolean; supplierId?: string; brand?: string }) => ({
  id: 'prod-1',
  name: 'Óculos Test',
  brand: overrides?.brand ?? 'TestBrand',
  description: 'A test product',
  supplierId: overrides?.supplierId ?? null,
  isArchived: overrides?.isArchived ?? false,
  variants: [
    {
      id: 'var-1',
      sku: 'SKU-001',
      frameColor: 'Black',
      lensColor: 'Gray',
      uvProtection: 'UV400',
      isPolarized: true,
      salePrice: makeDecimal('199.90'),
      images: ['http://example.com/img.jpg'],
      inventory: { quantity: 5, minStockAlert: 3 },
    },
  ],
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ExportService.exportCatalogJson', () => {
  it('returns valid JSON with correct ExportProduct shape', async () => {
    mockPrisma.product.findMany.mockResolvedValue([makeProduct()])

    const result = await ExportService.exportCatalogJson()
    const parsed = JSON.parse(result) as Array<{
      id: string
      name: string
      brand: string
      description: string | null
      supplierId: string | null
      variants: Array<{
        id: string
        sku: string
        price: string
        stock: number
        isPolarized: boolean
        images: string[]
      }>
    }>

    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe('prod-1')
    expect(parsed[0].name).toBe('Óculos Test')
    expect(parsed[0].variants).toHaveLength(1)
    expect(parsed[0].variants[0].price).toBe('199.90')
    expect(typeof parsed[0].variants[0].price).toBe('string')
    expect(parsed[0].variants[0].stock).toBe(5)
    expect(parsed[0].variants[0].isPolarized).toBe(true)
    expect(parsed[0].variants[0].images).toEqual(['http://example.com/img.jpg'])
  })

  it('excludes archived products by default', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])

    await ExportService.exportCatalogJson()

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isArchived: false }),
      }),
    )
  })

  it('includes archived products when includeArchived is true', async () => {
    mockPrisma.product.findMany.mockResolvedValue([makeProduct({ isArchived: true })])

    const result = await ExportService.exportCatalogJson({ includeArchived: true })
    const parsed = JSON.parse(result) as unknown[]

    expect(parsed).toHaveLength(1)
    const whereArg = mockPrisma.product.findMany.mock.calls[0][0].where as Record<string, unknown>
    expect(whereArg.isArchived).toBeUndefined()
  })

  it('passes supplierId filter to Prisma where clause', async () => {
    mockPrisma.product.findMany.mockResolvedValue([makeProduct({ supplierId: 'sup-42' })])

    await ExportService.exportCatalogJson({ supplierId: 'sup-42' })

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ supplierId: 'sup-42', isArchived: false }),
      }),
    )
  })
})

describe('ExportService.exportCatalogCsv', () => {
  it('returns CSV starting with correct header row and correct variant data', async () => {
    mockPrisma.product.findMany.mockResolvedValue([makeProduct()])

    const result = await ExportService.exportCatalogCsv()
    const lines = result.split('\n')

    expect(lines[0]).toBe(
      'product_id,product_name,brand,description,variant_id,sku,frame_color,lens_color,uv_protection,is_polarized,price,stock,images',
    )
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain('SKU-001')
    expect(lines[1]).toContain('true')
    expect(lines[1]).toContain('199.90')
    expect(lines[1]).toContain('http://example.com/img.jpg')
  })
})
