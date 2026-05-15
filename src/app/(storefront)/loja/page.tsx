import Link from 'next/link'
import { getProducts, getInventory } from '@/lib/storefront/api'
import { ProductGrid } from '@/features/storefront/components/product-grid'

export default async function StorefrontHomePage() {
  const [products, inventory] = await Promise.all([getProducts(), getInventory()])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nosso Catálogo</h1>
        <Link href="/loja/produtos" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
          Ver todos os produtos →
        </Link>
      </div>
      <ProductGrid products={products} inventory={inventory} />
    </div>
  )
}
