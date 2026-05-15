'use client'

import { useState, useTransition } from 'react'
import Decimal from 'decimal.js'
import type { SaleListItem } from '@/features/sales'
import {
  exchangeSaleAction,
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

interface AvailableVariant {
  id: string
  sku: string
  frameColor: string
  lensColor: string
  productName: string
}

interface Props {
  sales: SaleListItem[]
  availableVariants: AvailableVariant[]
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

export function VendasClient({ sales, availableVariants }: Props) {
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [returnError, setReturnError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [exchangeOpen, setExchangeOpen] = useState(false)
  const [exchangeItems, setExchangeItems] = useState<{ variantId: string; quantity: number }[]>([
    { variantId: '', quantity: 1 },
  ])
  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const [isExchangePending, startExchangeTransition] = useTransition()

  async function handleRowClick(saleId: string) {
    setIsLoadingDetail(true)
    setDetailError(null)
    setReturnError(null)
    setExchangeError(null)
    setExchangeOpen(false)
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
      setExchangeOpen(false)
      setExchangeError(null)
      setExchangeItems([{ variantId: '', quantity: 1 }])
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

  function handleExchangeSubmit() {
    if (!selectedSale || isExchangePending) return
    const validItems = exchangeItems.filter((i) => i.variantId !== '')
    if (validItems.length === 0) {
      setExchangeError('Selecione ao menos um item para a troca.')
      return
    }
    setExchangeError(null)

    startExchangeTransition(async () => {
      const result = await exchangeSaleAction(selectedSale.id, validItems)
      if (result.success) {
        setSheetOpen(false)
        setSelectedSale(null)
        setExchangeOpen(false)
        setExchangeItems([{ variantId: '', quantity: 1 }])
        setSuccessMessage(`Troca registrada — Venda ${result.saleId.slice(-8).toUpperCase()}`)
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setExchangeError(result.error)
      }
    })
  }

  function addExchangeRow() {
    setExchangeItems((prev) => [...prev, { variantId: '', quantity: 1 }])
  }

  function removeExchangeRow(index: number) {
    setExchangeItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateExchangeRow(index: number, field: 'variantId' | 'quantity', value: string | number) {
    setExchangeItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: field === 'quantity' ? Number(value) : value } : item,
      ),
    )
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

              {/* Return / Exchange errors */}
              {returnError && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">
                  {returnError}
                </div>
              )}

              {/* Action buttons for COMPLETED sales */}
              {selectedSale.status === 'COMPLETED' && !exchangeOpen && (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={isPending || isExchangePending}
                    onClick={handleReturn}
                  >
                    {isPending ? 'Processando...' : 'Registrar Devolução'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={isPending || isExchangePending}
                    onClick={() => {
                      setExchangeOpen(true)
                      setExchangeError(null)
                      setExchangeItems([{ variantId: '', quantity: 1 }])
                    }}
                  >
                    Registrar Troca
                  </Button>
                </div>
              )}

              {/* Exchange form */}
              {selectedSale.status === 'COMPLETED' && exchangeOpen && (
                <div className="space-y-3 border rounded-md p-3">
                  <h3 className="text-sm font-semibold">Itens de Substituição</h3>

                  {exchangeItems.map((row, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        className="flex-1 border rounded px-2 py-1.5 text-sm bg-background"
                        value={row.variantId}
                        onChange={(e) => updateExchangeRow(index, 'variantId', e.target.value)}
                      >
                        <option value="">Selecione um produto...</option>
                        {availableVariants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.productName} — {v.frameColor}/{v.lensColor} ({v.sku})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        className="w-16 border rounded px-2 py-1.5 text-sm bg-background text-center"
                        value={row.quantity}
                        onChange={(e) => updateExchangeRow(index, 'quantity', e.target.value)}
                      />
                      {exchangeItems.length > 1 && (
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive text-sm px-1"
                          onClick={() => removeExchangeRow(index)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                    onClick={addExchangeRow}
                  >
                    + Adicionar item
                  </button>

                  {exchangeError && (
                    <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">
                      {exchangeError}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      className="flex-1"
                      disabled={isExchangePending}
                      onClick={handleExchangeSubmit}
                    >
                      {isExchangePending ? 'Processando...' : 'Confirmar Troca'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1"
                      disabled={isExchangePending}
                      onClick={() => {
                        setExchangeOpen(false)
                        setExchangeError(null)
                        setExchangeItems([{ variantId: '', quantity: 1 }])
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
