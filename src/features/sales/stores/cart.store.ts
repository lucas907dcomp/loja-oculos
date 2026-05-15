import { create } from 'zustand'
import Decimal from 'decimal.js'
import type { PaymentBreakdown } from '../sales.contract'

export interface CartItem {
  variantId: string
  sku: string
  productName: string
  frameColor: string
  lensColor: string
  salePrice: Decimal
  quantity: number
}

export interface CartStore {
  items: CartItem[]
  paymentBreakdown: PaymentBreakdown
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  setPaymentBreakdown: (breakdown: PaymentBreakdown) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  paymentBreakdown: {},

  addItem: (item, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((i) => i.variantId === item.variantId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.variantId === item.variantId ? { ...i, quantity: i.quantity + quantity } : i,
          ),
        }
      }
      return { items: [...state.items, { ...item, quantity }] }
    }),

  removeItem: (variantId) =>
    set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),

  updateQuantity: (variantId, quantity) =>
    set((state) => {
      if (quantity < 1) {
        return { items: state.items.filter((i) => i.variantId !== variantId) }
      }
      return {
        items: state.items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
      }
    }),

  setPaymentBreakdown: (breakdown) => set({ paymentBreakdown: breakdown }),

  clearCart: () => set({ items: [], paymentBreakdown: {} }),
}))

export function selectTotal(state: CartStore): number {
  return state.items.reduce(
    (sum, item) => sum + new Decimal(item.salePrice.toString()).mul(item.quantity).toNumber(),
    0,
  )
}
