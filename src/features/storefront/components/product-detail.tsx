'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ExportProduct, InventoryEntry } from '@/features/export/export.contract'
import { getVariantStock } from '@/lib/storefront/inventory'
import { useCartStore } from '@/store/cart'

interface ProductDetailProps {
  product: ExportProduct
  inventory: InventoryEntry[]
}

function formatPrice(price: string): string {
  return parseFloat(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ProductDetail({ product, inventory }: ProductDetailProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? '')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [added, setAdded] = useState(false)

  const addItem = useCartStore((s) => s.addItem)

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0]
  const currentImages = selectedVariant?.images ?? []
  const currentImage = currentImages[selectedImageIndex] ?? null
  const stock = selectedVariant ? getVariantStock(selectedVariant.id, inventory) : 0
  const isOutOfStock = stock === 0

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId)
    setSelectedImageIndex(0)
  }

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock) return
    addItem({
      variantId: selectedVariant.id,
      sku: selectedVariant.sku,
      productName: product.name,
      variantLabel: `${selectedVariant.frameColor} / ${selectedVariant.lensColor}`,
      price: selectedVariant.price,
      imageUrl: currentImages[0] ?? null,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/loja" className="hover:text-gray-900">
          Início
        </Link>
        <span>/</span>
        <Link href="/loja/produtos" className="hover:text-gray-900">
          Produtos
        </Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={`${product.name} — ${selectedVariant?.frameColor ?? ''}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <span className="text-sm">Sem imagem</span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {currentImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {currentImages.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition ${
                    idx === selectedImageIndex ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} miniatura ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">{product.brand}</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{product.name}</h1>
          </div>

          {selectedVariant && (
            <p className="text-2xl font-semibold text-gray-900">{formatPrice(selectedVariant.price)}</p>
          )}

          {/* Stock badge */}
          <span
            className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-medium ${
              isOutOfStock ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
            }`}
          >
            {isOutOfStock ? 'Esgotado' : 'Em estoque'}
          </span>

          {/* Description */}
          {product.description && (
            <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
          )}

          {/* Variant selector */}
          {product.variants.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                Variante: {selectedVariant ? `${selectedVariant.frameColor} / ${selectedVariant.lensColor}` : '—'}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const variantStock = getVariantStock(v.id, inventory)
                  const isSelected = v.id === selectedVariantId
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleVariantSelect(v.id)}
                      className={`rounded-md border px-3 py-1.5 text-sm transition ${
                        isSelected
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500'
                      } ${variantStock === 0 ? 'opacity-50' : ''}`}
                      title={variantStock === 0 ? 'Esgotado' : undefined}
                    >
                      {v.frameColor} / {v.lensColor}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Variant details */}
          {selectedVariant && (
            <div className="rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <p>Proteção UV: {selectedVariant.uvProtection}</p>
              <p>Polarizado: {selectedVariant.isPolarized ? 'Sim' : 'Não'}</p>
              <p className="text-xs text-gray-400">SKU: {selectedVariant.sku}</p>
            </div>
          )}

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`mt-2 w-full rounded-md px-6 py-3 text-sm font-semibold transition ${
              isOutOfStock
                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                : added
                  ? 'bg-green-600 text-white'
                  : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isOutOfStock ? 'Esgotado' : added ? '✓ Adicionado ao carrinho!' : 'Adicionar ao Carrinho'}
          </button>

          <Link
            href="/loja/produtos"
            className="text-center text-sm text-gray-500 underline-offset-2 hover:underline"
          >
            ← Voltar para o catálogo
          </Link>
        </div>
      </div>
    </div>
  )
}
