import type Decimal from 'decimal.js'

export interface PaymentBreakdown {
  pix?: number
  cardCredit?: number
  cardDebit?: number
  cash?: number
}

export interface CreateSaleItemDTO {
  variantId: string
  quantity: number
}

export interface CreateSaleDTO {
  items: CreateSaleItemDTO[]
  paymentBreakdown: PaymentBreakdown
  customerId?: string
}

export interface SaleListItem {
  id: string
  totalAmount: Decimal
  status: 'COMPLETED' | 'CANCELLED' | 'RETURNED'
  createdAt: Date
  itemCount: number
  customerName: string | null
}

export interface SaleItemRecord {
  id: string
  quantity: number
  unitPrice: Decimal
  unitCost: Decimal
  variantId: string
  variant: {
    sku: string
    frameColor: string
    lensColor: string
    product: { name: string }
  }
}

export interface SaleWithItems {
  id: string
  totalAmount: Decimal
  paymentBreakdown: PaymentBreakdown
  status: 'COMPLETED' | 'CANCELLED' | 'RETURNED'
  createdAt: Date
  customerId: string | null
  customer: { id: string; name: string } | null
  items: SaleItemRecord[]
  cashFlowEntry: { id: string; amount: Decimal; type: string } | null
}
