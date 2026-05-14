'use server'

import { revalidatePath } from 'next/cache'
import type { CreateSaleDTO } from './sales.contract'
import { SalesService } from './services/sales.service'

export async function createSaleAction(
  dto: CreateSaleDTO,
): Promise<{ success: true; saleId: string } | { success: false; error: string }> {
  try {
    const sale = await SalesService.createSale(dto)
    revalidatePath('/vendas')
    revalidatePath('/estoque')
    return { success: true, saleId: sale.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao registrar venda',
    }
  }
}
