export interface SalesVelocityRecord {
  variantId: string
  productName: string
  brand: string
  sku: string
  frameColor: string
  lensColor: string
  unitsSold: number
  weeksCovered: number
  unitsPerWeek: number
}

export interface StockoutForecast extends SalesVelocityRecord {
  currentStock: number
  daysUntilStockout: number | null
  isCritical: boolean
}

export interface DeadStockRecord {
  variantId: string
  productName: string
  brand: string
  sku: string
  frameColor: string
  lensColor: string
  currentStock: number
}

export interface TopMarginRecord {
  variantId: string
  productName: string
  brand: string
  sku: string
  frameColor: string
  lensColor: string
  salePrice: number
  costPrice: number
  marginPercent: number
}

export interface TopTurnoverRecord {
  variantId: string
  productName: string
  brand: string
  sku: string
  frameColor: string
  lensColor: string
  unitsPerWeek: number
  unitsSold: number
}

export interface PeriodSummary {
  totalRevenue: number
  totalSales: number
  averageTicket: number
  averageMarginPercent: number
  from: string
  to: string
}
