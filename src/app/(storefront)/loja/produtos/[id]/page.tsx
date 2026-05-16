import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProduct, getInventory } from '@/lib/storefront/api'
import { ProductDetail } from '@/features/storefront/components/product-detail'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return { title: 'Produto não encontrado' }
  return {
    title: product.name,
    description: product.description ?? product.brand,
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params
  const [product, inventory] = await Promise.all([getProduct(id), getInventory()])

  if (!product) notFound()

  return <ProductDetail product={product} inventory={inventory} />
}
