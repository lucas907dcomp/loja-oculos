import { describe, it, expect, vi, beforeEach } from 'vitest'
import Decimal from 'decimal.js'
import { calculateMargin } from '@/lib/decimal'

// Mock prisma to avoid DB connection in unit tests
vi.mock('@/lib/prisma', () => ({
  prisma: {
    productVariant: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}))

// Mock ProductsRepository
vi.mock('../repositories/products.repository', () => ({
  ProductsRepository: {
    archive: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
  },
}))

import { ProductsService } from '../services/products.service'
import { ProductsRepository } from '../repositories/products.repository'

describe('generateSKU', () => {
  it('produces uppercase SKU with correct segments (non-polarized)', async () => {
    const sku = await ProductsService.generateSKU('Ray-Ban', {
      frameColor: 'Preto',
      lensColor: 'Cinza',
      uvProtection: 'UV400',
      isPolarized: false,
      costPrice: new Decimal('50'),
      salePrice: new Decimal('150'),
    })
    expect(sku).toBe('RAY-PRET-CINZ-UV400')
  })

  it('appends -P segment when polarized', async () => {
    const sku = await ProductsService.generateSKU('Ray-Ban', {
      frameColor: 'Preto',
      lensColor: 'Cinza',
      uvProtection: 'UV400',
      isPolarized: true,
      costPrice: new Decimal('50'),
      salePrice: new Decimal('150'),
    })
    expect(sku).toBe('RAY-PRET-CINZ-UV400-P')
  })

  it('SKU is uppercase', async () => {
    const sku = await ProductsService.generateSKU('oakley', {
      frameColor: 'azul',
      lensColor: 'verde',
      uvProtection: 'UV380',
      isPolarized: false,
      costPrice: new Decimal('30'),
      salePrice: new Decimal('100'),
    })
    expect(sku).toBe(sku.toUpperCase())
  })
})

describe('calculateMargin (re-exported from src/lib/decimal.ts)', () => {
  it('precision test: salePrice=150, costPrice=50 → 66.67%', () => {
    const margin = calculateMargin(new Decimal('150'), new Decimal('50'))
    expect(margin.toFixed(2)).toBe('66.67')
  })

  it('no floating-point drift (uses Decimal, not native number)', () => {
    // Native number: (150-50)/150*100 may drift
    const nativeResult = ((150 - 50) / 150) * 100
    const decimalResult = calculateMargin(new Decimal('150'), new Decimal('50'))
    // Both happen to be close, but Decimal should be exact to 2dp
    expect(decimalResult.toFixed(2)).toBe('66.67')
    // And should NOT be the native floating number stored as Decimal
    expect(decimalResult.toNumber()).not.toBe(nativeResult)
  })
})

describe('createProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when variants array is empty', async () => {
    await expect(
      ProductsService.createProduct({
        name: 'Test',
        brand: 'Brand',
        variants: [],
      }),
    ).rejects.toThrow('At least one variant is required')
  })

  it('calls repository create when at least one variant is provided', async () => {
    vi.mocked(ProductsRepository.create).mockResolvedValue({
      id: 'prod-1',
      name: 'Test',
      brand: 'Brand',
      description: null,
      isArchived: false,
      supplierId: null,
      supplier: null,
      variants: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await ProductsService.createProduct({
      name: 'Test',
      brand: 'Brand',
      variants: [
        {
          frameColor: 'Preto',
          lensColor: 'Cinza',
          uvProtection: 'UV400',
          isPolarized: false,
          costPrice: new Decimal('50'),
          salePrice: new Decimal('150'),
        },
      ],
    })

    expect(ProductsRepository.create).toHaveBeenCalledOnce()
  })
})

describe('archiveProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('delegates to repository archive with correct id', async () => {
    await ProductsService.archiveProduct('prod-123')
    expect(ProductsRepository.archive).toHaveBeenCalledWith('prod-123')
  })
})
