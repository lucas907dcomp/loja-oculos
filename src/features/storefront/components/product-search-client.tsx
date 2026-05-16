'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ExportProduct, InventoryEntry } from '@/lib/storefront/api'
import { ProductGrid } from './product-grid'
import { BrandFilter } from './brand-filter'

interface ProductSearchClientProps {
  products: ExportProduct[]
  inventory: InventoryEntry[]
  brands: string[]
  activeBrand?: string
}

export function ProductSearchClient({
  products,
  inventory,
  brands,
  activeBrand,
}: ProductSearchClientProps) {
  const searchParams = useSearchParams()
  const q = (searchParams.get('q') ?? '').toLowerCase().trim()

  const filtered = useMemo(() => {
    if (!q) return products
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
    )
  }, [products, q])

  return (
    <>
      <BrandFilter brands={brands} activeBrand={activeBrand} />
      <p className="mt-2 text-sm text-gray-500">{filtered.length} produto(s) encontrado(s)</p>
      <div className="mt-6">
        <ProductGrid products={filtered} inventory={inventory} />
      </div>
    </>
  )
}
