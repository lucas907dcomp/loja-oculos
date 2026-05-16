'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function SearchBar() {
  const router = useRouter()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.trim()
      if (val) {
        router.replace(`/loja/produtos?q=${encodeURIComponent(val)}`, { scroll: false })
      } else {
        router.replace('/loja/produtos', { scroll: false })
      }
    },
    [router],
  )

  return (
    <input
      type="search"
      placeholder="Buscar produtos..."
      aria-label="Buscar produtos"
      onChange={handleChange}
      className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
    />
  )
}
