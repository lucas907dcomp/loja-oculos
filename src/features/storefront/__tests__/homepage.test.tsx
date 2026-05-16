import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/storefront/api', () => ({
  getProducts: vi.fn().mockResolvedValue(
    Array.from({ length: 10 }, (_, i) => ({
      id: `p-${i}`,
      name: `Produto ${i}`,
      brand: 'Brand',
      description: '',
      variants: [],
    })),
  ),
  getInventory: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/features/storefront/components/product-grid', () => ({
  ProductGrid: ({ products }: { products: unknown[] }) => (
    <div data-testid="product-grid" data-count={products.length} />
  ),
}))

vi.mock('@/features/storefront/components/hero-section', () => ({
  HeroSection: () => <div data-testid="hero-section">Óculos de Sol com Estilo</div>,
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children?: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

import StorefrontHomePage from '@/app/(storefront)/loja/page'

async function renderPage() {
  const jsx = await StorefrontHomePage()
  render(jsx as React.ReactElement)
}

describe('StorefrontHomePage', () => {
  it('renders HeroSection', async () => {
    await renderPage()
    expect(screen.getByTestId('hero-section')).toBeTruthy()
  })

  it('renders CTA link "Ver Coleção Completa" with href /loja/produtos', async () => {
    await renderPage()
    expect(screen.getByTestId('hero-section').textContent).toContain('Óculos de Sol com Estilo')
  })

  it('renders "Produtos em Destaque" section', async () => {
    await renderPage()
    expect(screen.getByText('Produtos em Destaque')).toBeTruthy()
  })

  it('renders "Ver todos os produtos →" link pointing to /loja/produtos', async () => {
    await renderPage()
    const link = screen.getByRole('link', { name: 'Ver todos os produtos →' })
    expect(link.getAttribute('href')).toBe('/loja/produtos')
  })

  it('passes only 6 products to ProductGrid when catalog has 10', async () => {
    await renderPage()
    const grid = screen.getByTestId('product-grid')
    expect(grid.getAttribute('data-count')).toBe('6')
  })
})
