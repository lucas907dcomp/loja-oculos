import Decimal from 'decimal.js'

export function calculateMargin(salePrice: Decimal, costPrice: Decimal): Decimal {
  if (salePrice.isZero()) return new Decimal(0)
  return salePrice.minus(costPrice).dividedBy(salePrice).times(100)
}

export function formatCurrency(value: Decimal): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value.toNumber(),
  )
}
