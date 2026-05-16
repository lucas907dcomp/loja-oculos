import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Decimal from 'decimal.js'

export interface CartItem {
  variantId: string
  sku: string
  productName: string
  variantLabel: string
  price: string
  imageUrl: string | null
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => string
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i,
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () => {
        const total = get().items.reduce(
          (sum, i) => sum.plus(new Decimal(i.price).times(i.quantity)),
          new Decimal(0),
        )
        return parseFloat(total.toString()).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })
      },
    }),
    { name: 'otica-cart' },
  ),
)
