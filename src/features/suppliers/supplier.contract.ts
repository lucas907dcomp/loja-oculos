export interface SupplierRecord {
  id: string
  name: string
  cnpj: string | null
  contactName: string | null
  phone: string | null
  email: string | null
  leadTimeDays: number
  createdAt: Date
  updatedAt: Date
}

export interface SupplierSummary {
  id: string
  name: string
  cnpj: string | null
  contactName: string | null
  phone: string | null
  email: string | null
  leadTimeDays: number
  productCount: number
  createdAt: Date
}

export interface PurchaseOrderRecord {
  id: string
  supplierId: string
  status: 'REQUESTED' | 'DELIVERED'
  notes: string | null
  deliveredAt: Date | null
  createdAt: Date
}

export interface SupplierProductSummary {
  id: string
  name: string
  brand: string
  variantCount: number
}

export interface SupplierWithDetails extends SupplierRecord {
  products: SupplierProductSummary[]
  purchaseOrders: PurchaseOrderRecord[]
}

export interface CreateSupplierDTO {
  name: string
  cnpj?: string
  contactName?: string
  phone?: string
  email?: string
  leadTimeDays?: number
}

export interface UpdateSupplierDTO {
  name?: string
  cnpj?: string
  contactName?: string
  phone?: string
  email?: string
  leadTimeDays?: number
}

export interface CreatePurchaseOrderDTO {
  notes?: string
}
