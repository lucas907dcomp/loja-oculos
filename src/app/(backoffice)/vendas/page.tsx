import { prisma } from '@/lib/prisma'
import { SalesService } from '@/features/sales'
import { VendasClient } from './vendas-client'

export default async function VendasPage() {
  let sales
  try {
    sales = await SalesService.getSaleHistory()
  } catch {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-destructive font-medium">Erro ao carregar vendas.</p>
        <p className="text-muted-foreground text-sm">Verifique a conexão e recarregue a página.</p>
      </div>
    )
  }

  const variants = await prisma.productVariant.findMany({
    where: { product: { isArchived: false } },
    include: { product: { select: { name: true } } },
    orderBy: [{ product: { name: 'asc' } }, { sku: 'asc' }],
  })

  const availableVariants = variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    frameColor: v.frameColor,
    lensColor: v.lensColor,
    productName: v.product.name,
  }))

  return <VendasClient sales={sales} availableVariants={availableVariants} />
}
