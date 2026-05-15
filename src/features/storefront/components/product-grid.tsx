import type { ExportProduct } from '@/features/export/export.contract'
import type { InventoryEntry } from '@/lib/storefront/api'
import { ProductCard } from './product-card'

interface ProductGridProps {
  products: ExportProduct[]
  inventory: InventoryEntry[]
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="aspect-square w-full bg-gray-200" />
          <div className="p-3">
            <div className="mb-2 h-3 w-1/3 rounded bg-gray-200" />
            <div className="mb-1 h-4 w-2/3 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-1/2 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProductGrid({ products, inventory }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-gray-500">
        <p>Nenhum produto encontrado.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} inventory={inventory} />
      ))}
    </div>
  )
}

ProductGrid.Skeleton = ProductGridSkeleton
