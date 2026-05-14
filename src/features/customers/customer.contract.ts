export interface CustomerRecord {
  id: string
  name: string
  phone: string | null
  email: string | null
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CustomerSummary {
  id: string
  name: string
  phone: string | null
  email: string | null
  tags: string[]
  saleCount: number
  createdAt: Date
}

export interface CustomerSaleHistory {
  id: string
  totalAmount: string
  status: 'COMPLETED' | 'CANCELLED' | 'RETURNED'
  itemCount: number
  createdAt: Date
}

export interface CustomerWithSales extends CustomerRecord {
  sales: CustomerSaleHistory[]
}

export interface CreateCustomerDTO {
  name: string
  phone?: string
  email?: string
  tags?: string[]
}

export interface UpdateCustomerDTO {
  name?: string
  phone?: string
  email?: string
  tags?: string[]
}
