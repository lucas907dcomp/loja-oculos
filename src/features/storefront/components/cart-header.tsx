'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { CartDrawer } from './cart-drawer'

export function CartHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const count = useCartStore((s) => s.totalItems())

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Abrir carrinho"
        className="relative flex items-center gap-1 text-gray-600 hover:text-gray-900"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
          />
        </svg>
        {count > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      <CartDrawer open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
