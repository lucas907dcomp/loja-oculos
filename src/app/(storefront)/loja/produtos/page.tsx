import { getProducts, getInventory } from '@/lib/storefront/api'
import { ProductGrid } from '@/features/storefront/components/product-grid'
import { BrandFilter } from '@/features/storefront/components/brand-filter'

interface ListingPageProps {
  searchParams: Promise<{ brand?: string }>
}

export default async function ProductListingPage({ searchParams }: ListingPageProps) {
  const { brand } = await searchParams
  const [products, inventory] = await Promise.all([getProducts(brand), getInventory()])

  const allProducts = brand ? await getProducts() : products
  const brands = [...new Set(allProducts.map((p) => p.brand))].sort()

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <p className="mt-1 text-sm text-gray-500">{products.length} produto(s) encontrado(s)</p>
      </div>
      <div className="mb-6">
        <BrandFilter brands={brands} activeBrand={brand} />
      </div>
      <ProductGrid products={products} inventory={inventory} />
    </div>
  )
}
