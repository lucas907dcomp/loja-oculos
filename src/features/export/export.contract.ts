export interface ExportFilters {
  supplierId?: string
  brand?: string
  includeArchived?: boolean
}

export interface InventoryEntry {
  variantId: string
  sku: string
  productName: string
  quantity: number
  minStockAlert: number
  isLowStock: boolean
}

export interface ExportVariant {
  id: string
  sku: string
  frameColor: string
  lensColor: string
  uvProtection: string
  isPolarized: boolean
  price: string
  stock: number
  images: string[]
}

export interface ExportProduct {
  id: string
  name: string
  brand: string
  description: string | null
  supplierId: string | null
  variants: ExportVariant[]
}
