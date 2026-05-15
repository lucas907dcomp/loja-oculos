import Image from 'next/image'
import Link from 'next/link'
import type { ExportProduct } from '@/features/export/export.contract'
import type { InventoryEntry } from '@/lib/storefront/api'
import { getVariantStock, isProductInStock } from '@/lib/storefront/inventory'

interface ProductCardProps {
  product: ExportProduct
  inventory: InventoryEntry[]
}

function formatPrice(price: string): string {
  const num = parseFloat(price)
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ProductCard({ product, inventory }: ProductCardProps) {
  const { variants } = product
  const primaryImage = variants[0]?.images[0]
  const inStock = isProductInStock(product, inventory)

  const minPrice =
    variants.length > 0
      ? Math.min(...variants.map((v) => parseFloat(v.price)))
      : 0

  const availableVariants = variants.filter((v) => getVariantStock(v.id, inventory) > 0)

  return (
    <Link
      href={`/loja/produtos/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full bg-gray-100">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <span className="text-sm">Sem imagem</span>
          </div>
        )}
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
            inStock ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {inStock ? 'Em estoque' : 'Esgotado'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-xs text-gray-500">{product.brand}</p>
        <p className="line-clamp-2 text-sm font-medium text-gray-900">{product.name}</p>
        <div className="mt-auto pt-2">
          <p className="text-sm font-semibold text-gray-900">
            {variants.length > 0 ? `A partir de ${formatPrice(String(minPrice))}` : '—'}
          </p>
          {availableVariants.length > 0 && (
            <p className="text-xs text-gray-500">{availableVariants.length} variante(s) disponível(is)</p>
          )}
        </div>
      </div>
    </Link>
  )
}
