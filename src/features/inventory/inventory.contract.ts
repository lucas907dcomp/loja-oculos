export type TxType = 'SALE' | 'PURCHASE' | 'RETURN' | 'EXCHANGE' | 'ADJUSTMENT'

export interface InventoryListItem {
  variantId: string
  inventoryId: string
  sku: string
  productName: string
  frameColor: string
  lensColor: string
  quantity: number
  minStockAlert: number
  status: 'Normal' | 'Alerta' | 'Zerado'
}

export interface InventoryTransactionRecord {
  id: string
  type: TxType
  quantityDelta: number
  note: string | null
  createdAt: Date
}

export interface LowStockAlert {
  variantId: string
  sku: string
  productName: string
  quantity: number
  minStockAlert: number
}

export interface AdjustStockDTO {
  type: 'PURCHASE' | 'ADJUSTMENT'
  quantity: number
  sign?: '+' | '-'
  note?: string
}

export interface InventoryWithVariant {
  id: string
  quantity: number
  minStockAlert: number
  variantId: string
  variant: {
    sku: string
    frameColor: string
    lensColor: string
    product: { name: string }
  }
}
