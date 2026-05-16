import { Suspense } from 'react'
import { getProducts, getInventory } from '@/lib/storefront/api'
import { ProductGrid } from '@/features/storefront/components/product-grid'
import { ProductSearchClient } from '@/features/storefront/components/product-search-client'

interface ListingPageProps {
  searchParams: Promise<{ brand?: string }>
}

export default async function ProductListingPage({ searchParams }: ListingPageProps) {
  const { brand } = await searchParams
  const [products, allProducts, inventory] = await Promise.all([
    getProducts(brand),
    getProducts(),
    getInventory(),
  ])
  const brands = [...new Set(allProducts.map((p) => p.brand))].sort()

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
      </div>
      <Suspense fallback={<ProductGrid.Skeleton />}>
        <ProductSearchClient
          products={products}
          inventory={inventory}
          brands={brands}
          activeBrand={brand}
        />
      </Suspense>
    </div>
  )
}
