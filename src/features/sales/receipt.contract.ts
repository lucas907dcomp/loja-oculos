import Decimal from 'decimal.js'
import type { PaymentBreakdown, SaleWithItems } from './sales.contract'

export interface ReceiptItem {
  sku: string
  productName: string
  frameColor: string
  lensColor: string
  quantity: number
  unitPrice: string
  subtotal: string
}

export interface ReceiptData {
  saleId: string
  shortId: string
  createdAt: string
  customerName: string | null
  items: ReceiptItem[]
  totalAmount: string
  paymentBreakdown: PaymentBreakdown & { exchange?: number }
  itemCount: number
}

export function buildReceipt(sale: SaleWithItems): ReceiptData {
  const items: ReceiptItem[] = sale.items.map((item) => {
    const unitPrice = new Decimal(item.unitPrice.toString())
    return {
      sku: item.variant.sku,
      productName: item.variant.product.name,
      frameColor: item.variant.frameColor,
      lensColor: item.variant.lensColor,
      quantity: item.quantity,
      unitPrice: unitPrice.toFixed(2),
      subtotal: unitPrice.mul(item.quantity).toFixed(2),
    }
  })

  return {
    saleId: sale.id,
    shortId: sale.id.slice(-8).toUpperCase(),
    createdAt: sale.createdAt.toISOString(),
    customerName: sale.customer?.name ?? null,
    items,
    totalAmount: new Decimal(sale.totalAmount.toString()).toFixed(2),
    paymentBreakdown: sale.paymentBreakdown as PaymentBreakdown & { exchange?: number },
    itemCount: items.length,
  }
}
