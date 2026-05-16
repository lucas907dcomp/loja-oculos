import Link from 'next/link'
import { getProducts, getInventory } from '@/lib/storefront/api'
import { ProductGrid } from '@/features/storefront/components/product-grid'
import { HeroSection } from '@/features/storefront/components/hero-section'

export default async function StorefrontHomePage() {
  const [products, inventory] = await Promise.all([getProducts(), getInventory()])
  const featured = products.slice(0, 6)

  return (
    <>
      <HeroSection />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-gray-900">Produtos em Destaque</h2>
          <Link href="/loja/produtos" className="text-sm text-gray-600 hover:underline">
            Ver todos os produtos →
          </Link>
        </div>
        <ProductGrid products={featured} inventory={inventory} />
      </div>
    </>
  )
}
