import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { CartHeader } from '../components/cart-header'
import { CartDrawer } from '../components/cart-drawer'
import { useCartStore, type CartItem } from '@/store/cart'

vi.mock('@/store/cart', () => ({ useCartStore: vi.fn() }))

vi.mock('next/image', () => ({ default: () => null }))

vi.mock('next/link', () => ({
  default: ({
    href,
    onClick,
    children,
  }: {
    href: string
    onClick?: () => void
    children?: React.ReactNode
  }) => <a href={href} onClick={onClick}>{children}</a>,
}))

const removeItemMock = vi.fn()
const updateQuantityMock = vi.fn()

function mockStore(items: CartItem[] = [], totalItemsOverride?: number) {
  const count = totalItemsOverride ?? items.reduce((s, i) => s + i.quantity, 0)
  const state = {
    items,
    totalItems: () => count,
    totalPrice: () => 'R$ 0,00',
    addItem: vi.fn(),
    removeItem: removeItemMock,
    updateQuantity: updateQuantityMock,
    clearCart: vi.fn(),
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(useCartStore as any).mockImplementation((sel?: (s: typeof state) => unknown) =>
    sel ? sel(state) : state,
  )
}

const sampleItem: CartItem = {
  variantId: 'var-1',
  sku: 'SKU-001',
  productName: 'Óculos Solar A',
  variantLabel: 'Preto / Cinza',
  price: '199.90',
  imageUrl: null,
  quantity: 2,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockStore()
})

describe('CartHeader', () => {
  it('renders badge with count when totalItems > 0', () => {
    mockStore([sampleItem])
    render(<CartHeader />)
    const cartButton = screen.getByLabelText('Abrir carrinho')
    expect(within(cartButton).getByText('2')).toBeTruthy()
  })

  it('does not render badge when totalItems === 0', () => {
    mockStore([])
    render(<CartHeader />)
    expect(screen.queryByText('0')).toBeNull()
  })

  it('renders "99+" when totalItems > 99', () => {
    mockStore([], 100)
    render(<CartHeader />)
    expect(screen.getByText('99+')).toBeTruthy()
  })
})

describe('CartDrawer', () => {
  it('shows empty state when items is empty', () => {
    mockStore([])
    render(<CartDrawer open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Seu carrinho está vazio')).toBeTruthy()
  })

  it('renders product name when items has entries', () => {
    mockStore([sampleItem])
    render(<CartDrawer open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Óculos Solar A')).toBeTruthy()
  })

  it('calls removeItem with variantId when remove button is clicked', () => {
    mockStore([sampleItem])
    render(<CartDrawer open={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Remover item'))
    expect(removeItemMock).toHaveBeenCalledWith('var-1')
  })

  it('calls updateQuantity with qty-1 when minus button is clicked', () => {
    mockStore([sampleItem])
    render(<CartDrawer open={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Diminuir quantidade'))
    expect(updateQuantityMock).toHaveBeenCalledWith('var-1', 1)
  })

  it('calls onClose when close button (×) is clicked', () => {
    mockStore([])
    const onClose = vi.fn()
    render(<CartDrawer open={true} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Fechar carrinho'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when backdrop overlay is clicked', () => {
    mockStore([])
    const onClose = vi.fn()
    render(<CartDrawer open={true} onClose={onClose} />)
    fireEvent.click(document.querySelector('[aria-hidden="true"]')!)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
