import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { ReadonlyURLSearchParams } from 'next/navigation'

const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ replace: replaceMock })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/loja/produtos'),
}))

vi.mock('@/features/storefront/components/product-grid', () => ({
  ProductGrid: ({ products }: { products: unknown[] }) => (
    <div data-testid="product-grid" data-count={products.length} />
  ),
}))

vi.mock('@/features/storefront/components/brand-filter', () => ({
  BrandFilter: () => <div data-testid="brand-filter" />,
}))

import { SearchBar } from '@/features/storefront/components/search-bar'
import { ProductSearchClient } from '@/features/storefront/components/product-search-client'
import type { ExportProduct } from '@/lib/storefront/api'

const sampleProducts: ExportProduct[] = [
  { id: 'p1', name: 'Ray-Ban Aviador', brand: 'Ray-Ban', description: null, supplierId: null, variants: [] },
  { id: 'p2', name: 'Oakley Holbrook', brand: 'Oakley', description: null, supplierId: null, variants: [] },
  { id: 'p3', name: 'Vogue Retro', brand: 'Vogue', description: null, supplierId: null, variants: [] },
]

function mockSearchParams(search: string): ReadonlyURLSearchParams {
  return new URLSearchParams(search) as unknown as ReadonlyURLSearchParams
}

beforeEach(() => {
  vi.clearAllMocks()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(useRouter).mockReturnValue({ replace: replaceMock } as any)
  vi.mocked(useSearchParams).mockReturnValue(mockSearchParams(''))
})

// ─── SearchBar ───────────────────────────────────────────────────────────────

describe('SearchBar', () => {
  it('renders input with aria-label "Buscar produtos"', () => {
    render(<SearchBar />)
    const input = screen.getByRole('searchbox', { name: 'Buscar produtos' })
    expect(input).toBeTruthy()
  })

  it('calls router.replace with /loja/produtos?q=ray%20ban when user types "ray ban"', () => {
    render(<SearchBar />)
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'ray ban' } })
    expect(replaceMock).toHaveBeenCalledWith('/loja/produtos?q=ray%20ban', { scroll: false })
  })

  it('calls router.replace with /loja/produtos (no q) when field is cleared', () => {
    render(<SearchBar />)
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: '   ' } })
    expect(replaceMock).toHaveBeenCalledWith('/loja/produtos', { scroll: false })
  })
})

// ─── ProductSearchClient ──────────────────────────────────────────────────────

describe('ProductSearchClient', () => {
  const defaultProps = {
    products: sampleProducts,
    inventory: [],
    brands: ['Ray-Ban', 'Oakley', 'Vogue'],
    activeBrand: undefined,
  }

  it('shows all products when there is no query', () => {
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams(''))
    render(<ProductSearchClient {...defaultProps} />)
    expect(screen.getByTestId('product-grid').getAttribute('data-count')).toBe('3')
  })

  it('filters products by name (case-insensitive)', () => {
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams('q=Ray-Ban'))
    render(<ProductSearchClient {...defaultProps} />)
    expect(screen.getByTestId('product-grid').getAttribute('data-count')).toBe('1')
  })

  it('filters products by brand (case-insensitive)', () => {
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams('q=oakley'))
    render(<ProductSearchClient {...defaultProps} />)
    expect(screen.getByTestId('product-grid').getAttribute('data-count')).toBe('1')
  })

  it('passes empty array to ProductGrid when no products match', () => {
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams('q=xyzxyz'))
    render(<ProductSearchClient {...defaultProps} />)
    expect(screen.getByTestId('product-grid').getAttribute('data-count')).toBe('0')
  })

  it('shows correct count text for filtered results', () => {
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams('q=ray'))
    render(<ProductSearchClient {...defaultProps} />)
    expect(screen.getByText('1 produto(s) encontrado(s)')).toBeTruthy()
  })

  it('renders BrandFilter', () => {
    render(<ProductSearchClient {...defaultProps} />)
    expect(screen.getByTestId('brand-filter')).toBeTruthy()
  })
})
