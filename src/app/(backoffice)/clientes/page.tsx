import { CustomerService } from '@/features/customers'
import type { CustomerSummaryDTO } from '@/features/customers/actions'
import { ClientesClient } from './clientes-client'

export default async function ClientesPage() {
  let customers: CustomerSummaryDTO[]

  try {
    const raw = await CustomerService.getCustomers()
    customers = raw.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    }))
  } catch {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-destructive font-medium">Erro ao carregar clientes.</p>
        <p className="text-muted-foreground text-sm">Verifique a conexão e recarregue a página.</p>
      </div>
    )
  }

  return <ClientesClient customers={customers} />
}
