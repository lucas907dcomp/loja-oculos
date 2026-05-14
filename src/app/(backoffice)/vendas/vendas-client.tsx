'use client'

import { useState, useTransition } from 'react'
import Decimal from 'decimal.js'
import type { SaleListItem } from '@/features/sales'
import {
  getSaleByIdAction,
  returnSaleAction,
  type SaleDetail,
} from '@/features/sales/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Props {
  sales: SaleListItem[]
}

function formatBRL(value: string | number): string {
  return `R$ ${new Decimal(value.toString()).toFixed(2).replace('.', ',')}`
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: 'COMPLETED' | 'CANCELLED' | 'RETURNED' }) {
  const labels: Record<string, string> = {
    COMPLETED: 'Concluída',
    CANCELLED: 'Cancelada',
    RETURNED: 'Devolvida',
  }
  return (
    <Badge variant={status === 'COMPLETED' ? 'outline' : 'destructive'}>
      {labels[status] ?? status}
    </Badge>
  )
}

export function VendasClient({ sales }: Props) {
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [returnError, setReturnError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleRowClick(saleId: string) {
    setIsLoadingDetail(true)
    setDetailError(null)
    setReturnError(null)
    setSheetOpen(true)
    setSelectedSale(null)

    const result = await getSaleByIdAction(saleId)
    setIsLoadingDetail(false)

    if (result.success) {
      setSelectedSale(result.sale)
    } else {
      setDetailError(result.error)
    }
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open)
    if (!open) {
      setSelectedSale(null)
      setReturnError(null)
      setDetailError(null)
    }
  }

  function handleReturn() {
    if (!selectedSale || isPending) return
    setReturnError(null)

    startTransition(async () => {
      const result = await returnSaleAction(selectedSale.id)
      if (result.success) {
        setSheetOpen(false)
        setSelectedSale(null)
        setSuccessMessage(`Devolução registrada — Venda ${result.saleId.slice(-8).toUpperCase()}`)
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setReturnError(result.error)
      }
    })
  }

  const paymentLabels: Record<string, string> = {
    pix: 'Pix',
    cardCredit: 'Cartão Crédito',
    cardDebit: 'Cartão Débito',
    cash: 'Dinheiro',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vendas</h1>
        <span className="text-sm text-muted-foreground">{sales.length} venda(s)</span>
      </div>

      {successMessage && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
          ✓ {successMessage}
        </div>
      )}

      {sales.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          Nenhuma venda registrada.
        </p>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-right">Itens</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow
                  key={sale.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(sale.id)}
                >
                  <TableCell className="text-sm">{formatDate(sale.createdAt)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {sale.id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-right text-sm">{sale.itemCount}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatBRL(sale.totalAmount.toString())}
                  </TableCell>
                  <TableCell className="text-sm">{sale.customerName ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={sale.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhe da Venda</SheetTitle>
          </SheetHeader>

          {isLoadingDetail && (
            <p className="text-muted-foreground text-sm mt-6">Carregando...</p>
          )}

          {detailError && (
            <p className="text-destructive text-sm mt-6">{detailError}</p>
          )}

          {selectedSale && !isLoadingDetail && (
            <div className="mt-4 space-y-5">
              {/* Header info */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">
                  {selectedSale.id.slice(-8).toUpperCase()}
                </span>
                <StatusBadge status={selectedSale.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(selectedSale.createdAt)}
              </p>

              {/* Items table */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Itens</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items.map((item) => {
                        const subtotal = new Decimal(item.unitPrice).mul(item.quantity)
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">
                                  {item.variant.product.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {item.variant.frameColor} / {item.variant.lensColor}
                                </span>
                                <span className="text-xs font-mono text-muted-foreground">
                                  {item.variant.sku}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                            <TableCell className="text-right text-sm">
                              {formatBRL(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {formatBRL(subtotal.toString())}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center font-semibold border-t pt-2">
                <span>Total</span>
                <span>{formatBRL(selectedSale.totalAmount)}</span>
              </div>

              {/* Payment breakdown */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Pagamento</h3>
                <div className="space-y-1">
                  {(
                    Object.entries(selectedSale.paymentBreakdown) as [string, number][]
                  )
                    .filter(([, v]) => v != null && v > 0)
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {paymentLabels[key] ?? key}
                        </span>
                        <span>{formatBRL(value)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Return error */}
              {returnError && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">
                  {returnError}
                </div>
              )}

              {/* Return button */}
              {selectedSale.status === 'COMPLETED' && (
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={isPending}
                  onClick={handleReturn}
                >
                  {isPending ? 'Processando...' : 'Registrar Devolução'}
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
