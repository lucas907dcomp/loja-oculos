import { prisma } from '@/lib/prisma'
import { ProductForm } from './product-form'

export default async function NovoProdutoPage() {
  const suppliers = await prisma.supplier.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Novo Produto</h1>
      <ProductForm suppliers={suppliers} />
    </div>
  )
}
