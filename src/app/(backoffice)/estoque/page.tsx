import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { InventoryService } from '@/features/inventory/services/inventory.service'
import { StockAdjustDialog } from './stock-adjust-dialog'

export default async function EstoquePage() {
  const items = await InventoryService.getInventoryList()

  const statusOrder = { Zerado: 0, Alerta: 1, Normal: 2 } as const
  const sorted = [...items].sort(
    (a, b) =>
      statusOrder[a.status] - statusOrder[b.status] ||
      a.productName.localeCompare(b.productName)
  )

  const totalVariantes = items.length
  const emAlerta = items.filter((i) => i.status === 'Alerta').length
  const estoqueZerado = items.filter((i) => i.status === 'Zerado').length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Estoque</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Variantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalVariantes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Alerta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{emAlerta}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estoque Zerado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{estoqueZerado}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Cor Armação</TableHead>
              <TableHead>Cor Lente</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="text-right">Mín. Alerta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Nenhuma variante cadastrada.
                </TableCell>
              </TableRow>
            )}
            {sorted.map((item) => (
              <TableRow key={item.variantId}>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                <TableCell>{item.frameColor}</TableCell>
                <TableCell>{item.lensColor}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">{item.minStockAlert}</TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-right">
                  <StockAdjustDialog
                    variantId={item.variantId}
                    sku={item.sku}
                    currentQuantity={item.quantity}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'Normal' | 'Alerta' | 'Zerado' }) {
  if (status === 'Zerado') {
    return <Badge variant="destructive">Zerado</Badge>
  }
  if (status === 'Alerta') {
    return (
      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
        Alerta
      </Badge>
    )
  }
  return <Badge variant="secondary">Normal</Badge>
}
