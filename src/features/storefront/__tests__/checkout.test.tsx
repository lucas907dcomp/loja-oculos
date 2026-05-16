import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useCartStore, type CartItem } from '@/store/cart'
import CheckoutPage from '@/app/(storefront)/loja/checkout/page'
import * as actions from '@/app/(storefront)/loja/checkout/actions'

vi.mock('@/store/cart', () => ({ useCartStore: vi.fn() }))

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

vi.mock('@/app/(storefront)/loja/checkout/actions', () => ({
  createCustomer: vi.fn(),
}))

const clearCartMock = vi.fn()
const createCustomerMock = vi.mocked(actions.createCustomer)

const sampleItem: CartItem = {
  variantId: 'var-1',
  sku: 'SKU-001',
  productName: 'Óculos Solar A',
  variantLabel: 'Preto / Cinza',
  price: '199.90',
  imageUrl: null,
  quantity: 2,
}

function mockStore(items: CartItem[] = []) {
  const state = {
    items,
    totalItems: () => items.reduce((s, i) => s + i.quantity, 0),
    totalPrice: () => 'R$ 399,80',
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: clearCartMock,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(useCartStore as any).mockImplementation((sel?: (s: typeof state) => unknown) =>
    sel ? sel(state) : state,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockStore()
})

describe('CheckoutPage — empty cart', () => {
  it('shows empty state with link to /loja/produtos when items = []', () => {
    mockStore([])
    render(<CheckoutPage />)
    expect(screen.getByText('Seu carrinho está vazio.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Voltar para a loja' })).toBeTruthy()
  })
})

describe('CheckoutPage — with items', () => {
  beforeEach(() => {
    mockStore([sampleItem])
  })

  it('renders product name in cart summary', () => {
    render(<CheckoutPage />)
    expect(screen.getByText('Óculos Solar A')).toBeTruthy()
  })

  it('renders form fields: name, phone, email', () => {
    render(<CheckoutPage />)
    expect(screen.getByLabelText(/Nome/)).toBeTruthy()
    expect(screen.getByLabelText(/Telefone/)).toBeTruthy()
    expect(screen.getByLabelText(/E-mail/)).toBeTruthy()
  })

  it('shows validation error when name is blank and form is submitted', async () => {
    render(<CheckoutPage />)
    fireEvent.click(screen.getByRole('button', { name: /Finalizar Pedido/i }))
    await waitFor(() => {
      expect(screen.getByText('Nome deve ter ao menos 2 caracteres')).toBeTruthy()
    })
    expect(createCustomerMock).not.toHaveBeenCalled()
  })

  it('calls createCustomer with name and phone on valid submit', async () => {
    createCustomerMock.mockResolvedValue({ id: 'cust-1' })
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<CheckoutPage />)
    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: 'Maria Silva' } })
    fireEvent.change(screen.getByLabelText(/Telefone/), { target: { value: '11999999999' } })
    fireEvent.click(screen.getByRole('button', { name: /Finalizar Pedido/i }))

    await waitFor(() => {
      expect(createCustomerMock).toHaveBeenCalledWith({
        name: 'Maria Silva',
        phone: '11999999999',
        email: undefined,
      })
    })
    openSpy.mockRestore()
  })

  it('calls clearCart and shows confirmation after successful submit', async () => {
    createCustomerMock.mockResolvedValue({ id: 'cust-1' })
    vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<CheckoutPage />)
    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: 'Maria Silva' } })
    fireEvent.change(screen.getByLabelText(/Telefone/), { target: { value: '11999999999' } })
    fireEvent.click(screen.getByRole('button', { name: /Finalizar Pedido/i }))

    await waitFor(() => {
      expect(screen.getByText('Pedido enviado!')).toBeTruthy()
    })
    expect(clearCartMock).toHaveBeenCalledOnce()
  })

  it('shows error message and does NOT call clearCart on action error', async () => {
    createCustomerMock.mockResolvedValue({ error: 'Erro ao salvar dados. Tente novamente.' })

    render(<CheckoutPage />)
    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: 'Maria Silva' } })
    fireEvent.change(screen.getByLabelText(/Telefone/), { target: { value: '11999999999' } })
    fireEvent.click(screen.getByRole('button', { name: /Finalizar Pedido/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy()
      expect(screen.getByText('Erro ao salvar dados. Tente novamente.')).toBeTruthy()
    })
    expect(clearCartMock).not.toHaveBeenCalled()
  })

  it('calls window.open with WhatsApp URL containing cart items after success', async () => {
    createCustomerMock.mockResolvedValue({ id: 'cust-1' })
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<CheckoutPage />)
    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: 'Maria Silva' } })
    fireEvent.change(screen.getByLabelText(/Telefone/), { target: { value: '11999999999' } })
    fireEvent.click(screen.getByRole('button', { name: /Finalizar Pedido/i }))

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledOnce()
    })
    const [url, target] = openSpy.mock.calls[0] as [string, string]
    expect(url).toContain('wa.me/')
    expect(url).toContain(encodeURIComponent('Óculos Solar A'))
    expect(target).toBe('_blank')
    openSpy.mockRestore()
  })
})
