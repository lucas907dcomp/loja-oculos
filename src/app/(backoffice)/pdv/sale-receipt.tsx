'use client'

import { Button } from '@/components/ui/button'
import type { ReceiptData } from '@/features/sales'

interface Props {
  receipt: ReceiptData
  onNewSale: () => void
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix',
  cardCredit: 'Cartão Crédito',
  cardDebit: 'Cartão Débito',
  cash: 'Dinheiro',
  exchange: 'Troca',
}

function formatBRL(decimalStr: string): string {
  return `R$ ${decimalStr.replace('.', ',')}`
}

export function SaleReceipt({ receipt, onNewSale }: Props) {
  const formattedDate = new Date(receipt.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="w-full print:block print:shadow-none bg-white border rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold">Comprovante de Venda</h2>
        <p className="text-xs text-muted-foreground font-mono">#{receipt.shortId}</p>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </div>

      {/* Customer */}
      {receipt.customerName !== null && (
        <p className="text-sm mb-3">
          <span className="font-medium">Cliente:</span> {receipt.customerName}
        </p>
      )}

      {/* Items table */}
      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="text-left pb-1 font-normal">Produto</th>
            <th className="text-right pb-1 font-normal">Qtd</th>
            <th className="text-right pb-1 font-normal">Unitário</th>
            <th className="text-right pb-1 font-normal">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {receipt.items.map((item, i) => (
            <tr key={i}>
              <td className="py-1 pr-2">
                <span className="font-medium block">{item.productName}</span>
                <span className="text-xs text-muted-foreground">
                  {item.frameColor}/{item.lensColor}
                </span>
              </td>
              <td className="text-right py-1">{item.quantity}</td>
              <td className="text-right py-1 whitespace-nowrap">{formatBRL(item.unitPrice)}</td>
              <td className="text-right py-1 whitespace-nowrap">{formatBRL(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div className="border-t pt-2 mb-3">
        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span>{formatBRL(receipt.totalAmount)}</span>
        </div>
      </div>

      {/* Payment breakdown */}
      <div className="text-sm mb-6 space-y-0.5">
        {(Object.entries(receipt.paymentBreakdown) as [string, number | undefined][])
          .filter(([, v]) => v !== undefined && v !== null && v > 0)
          .map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-muted-foreground">{PAYMENT_LABELS[key] ?? key}</span>
              <span>{formatBRL(Number(value).toFixed(2))}</span>
            </div>
          ))}
      </div>

      {/* Action buttons — hidden on print */}
      <div className="flex gap-2 print:hidden">
        <Button className="flex-1" onClick={() => window.print()}>
          Imprimir
        </Button>
        <Button variant="outline" className="flex-1" onClick={onNewSale}>
          Nova Venda
        </Button>
      </div>
    </div>
  )
}
