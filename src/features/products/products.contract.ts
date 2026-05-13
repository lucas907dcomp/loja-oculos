import Decimal from 'decimal.js'

export interface ProductWithVariants {
  id: string
  name: string
  brand: string
  description: string | null
  isArchived: boolean
  supplierId: string | null
  supplier: { id: string; name: string } | null
  variants: VariantWithInventory[]
  createdAt: Date
  updatedAt: Date
}

export interface VariantWithInventory {
  id: string
  sku: string
  frameColor: string
  lensColor: string
  uvProtection: string
  isPolarized: boolean
  costPrice: Decimal
  salePrice: Decimal
  images: string[]
  inventory: {
    quantity: number
    minStockAlert: number
  } | null
}

export interface CreateProductDTO {
  name: string
  brand: string
  description?: string
  supplierId?: string
  variants: CreateVariantDTO[]
}

export interface CreateVariantDTO {
  frameColor: string
  lensColor: string
  uvProtection: 'UV380' | 'UV400' | 'UV420'
  isPolarized: boolean
  costPrice: Decimal
  salePrice: Decimal
  images?: string[]
}

export interface UpdateProductDTO {
  name?: string
  brand?: string
  description?: string
  supplierId?: string
}
