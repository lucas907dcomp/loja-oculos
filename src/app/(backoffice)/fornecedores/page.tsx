import { SupplierService } from '@/features/suppliers'
import type { SupplierSummaryDTO } from '@/features/suppliers/actions'
import { FornecedoresClient } from './fornecedores-client'

export default async function FornecedoresPage() {
  let suppliers: SupplierSummaryDTO[]

  try {
    const raw = await SupplierService.getSuppliers()
    suppliers = raw.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    }))
  } catch {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-destructive font-medium">Erro ao carregar fornecedores.</p>
        <p className="text-muted-foreground text-sm">Verifique a conexão e recarregue a página.</p>
      </div>
    )
  }

  return <FornecedoresClient suppliers={suppliers} />
}
