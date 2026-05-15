import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const MOCK_KEY = 'test-api-key'

vi.stubEnv('ECOMMERCE_API_KEY', MOCK_KEY)
vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')

import { getProducts, getInventory } from '@/lib/storefront/api'

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
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls /api/v1/products with X-Api-Key header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([mockProduct]), { status: 200 }),
    )

    await getProducts()

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/products',
      expect.objectContaining({
        headers: { 'X-Api-Key': MOCK_KEY },
      }),
    )
  })

  it('appends brand query param when provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([mockProduct]), { status: 200 }),
    )

    await getProducts('Ray-Ban')

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/products?brand=Ray-Ban',
      expect.any(Object),
    )
  })

  it('returns typed array on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([mockProduct]), { status: 200 }),
    )

    const result = await getProducts()

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('prod-1')
    expect(result[0].brand).toBe('Ray-Ban')
  })

  it('returns empty array on HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 500 }))

    const result = await getProducts()

    expect(result).toEqual([])
  })

  it('returns empty array on network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const result = await getProducts()

    expect(result).toEqual([])
  })
})

describe('getInventory', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls /api/v1/inventory with X-Api-Key header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockInventory), { status: 200 }),
    )

    await getInventory()

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/inventory',
      expect.objectContaining({
        headers: { 'X-Api-Key': MOCK_KEY },
      }),
    )
  })

  it('returns typed array on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockInventory), { status: 200 }),
    )

    const result = await getInventory()

    expect(result).toHaveLength(1)
    expect(result[0].variantId).toBe('var-1')
    expect(result[0].quantity).toBe(5)
  })

  it('returns empty array on HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }))

    const result = await getInventory()

    expect(result).toEqual([])
  })

  it('returns empty array on network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const result = await getInventory()

    expect(result).toEqual([])
  })
})
