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
  return <VendasClient sales={sales} />
}
