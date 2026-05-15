import type { ExportProduct } from '@/features/export/export.contract'
import type { InventoryEntry } from './api'

export const getVariantStock = (variantId: string, inventory: InventoryEntry[]): number =>
  inventory.find((e) => e.variantId === variantId)?.quantity ?? 0

export const isProductInStock = (product: ExportProduct, inventory: InventoryEntry[]): boolean =>
  product.variants.some((v) => getVariantStock(v.id, inventory) > 0)
