import type { ExportProduct } from '@/features/export/export.contract'
import type { InventoryEntry } from '@/features/export/export.contract'
import { ExportService } from '@/features/export'

export type { ExportProduct }

export type { InventoryEntry }

export async function getProducts(brand?: string): Promise<ExportProduct[]> {
  try {
    return await ExportService.getStorefrontProducts(brand)
  } catch {
    return []
  }
}

export async function getInventory(): Promise<InventoryEntry[]> {
  try {
    return await ExportService.getStorefrontInventory()
  } catch {
    return []
  }
}

export async function getProduct(id: string): Promise<ExportProduct | null> {
  try {
    return await ExportService.getStorefrontProduct(id)
  } catch {
    return null
  }
}
