import { ProductsService } from '@/features/products'
import { LabelService } from '@/features/labels'
import type { LabelData } from '@/features/labels'
import { EtiquetasClient } from './etiquetas-client'

interface EtiquetasPageProps {
  searchParams: Promise<{ productId?: string }>
}

export default async function EtiquetasPage({ searchParams }: EtiquetasPageProps) {
  const { productId } = await searchParams

  const products = await ProductsService.findAll()

  let labels: LabelData[] = []
  if (productId) {
    try {
      labels = await LabelService.getProductLabels(productId)
    } catch {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <p className="font-medium text-destructive">Erro ao gerar etiquetas.</p>
          <p className="text-sm text-muted-foreground">Verifique a conexão e recarregue a página.</p>
        </div>
      )
    }
  }

  return (
    <EtiquetasClient
      products={products.map((p) => ({ id: p.id, name: p.name, brand: p.brand }))}
      labels={labels}
      selectedProductId={productId}
    />
  )
}
