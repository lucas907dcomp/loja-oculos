import { ProductsService } from '@/features/products'
import { PdvClient } from './pdv-client'

export default async function PdvPage() {
  let products
  try {
    products = await ProductsService.findAll({ includeArchived: false })
  } catch {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-destructive font-medium">Erro ao carregar produtos.</p>
        <p className="text-muted-foreground text-sm">Verifique a conexão e recarregue a página.</p>
      </div>
    )
  }
  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      frameColor: v.frameColor,
      lensColor: v.lensColor,
      uvProtection: v.uvProtection,
      isPolarized: v.isPolarized,
      costPrice: v.costPrice.toNumber(),
      salePrice: v.salePrice.toNumber(),
      images: v.images,
      inventory: v.inventory,
    })),
  }))

  return <PdvClient products={serialized} />
}
