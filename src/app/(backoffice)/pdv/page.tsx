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
  return <PdvClient products={products} />
}
