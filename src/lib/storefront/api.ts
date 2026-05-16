import type { ExportProduct } from '@/features/export/export.contract'
import type { InventoryEntry } from '@/features/export/export.contract'
import { ExportService } from '@/features/export'

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
