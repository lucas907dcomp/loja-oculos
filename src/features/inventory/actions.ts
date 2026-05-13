'use server'

import { revalidatePath } from 'next/cache'
import type { AdjustStockDTO } from './inventory.contract'
import { InventoryService } from './services/inventory.service'

export async function adjustStockAction(
  variantId: string,
  dto: AdjustStockDTO
): Promise<{ success: boolean; error?: string }> {
  try {
    await InventoryService.adjustStock(variantId, dto)
    revalidatePath('/estoque')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao ajustar estoque',
    }
  }
}

export async function updateMinStockAlertAction(variantId: string, value: number): Promise<void> {
  await InventoryService.updateMinStockAlert(variantId, value)
  revalidatePath('/estoque')
}
