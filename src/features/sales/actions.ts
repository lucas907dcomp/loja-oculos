'use server'

import { revalidatePath } from 'next/cache'
import type { CreateSaleDTO, CreateSaleItemDTO, PaymentBreakdown } from './sales.contract'
import { SalesService } from './services/sales.service'
import { buildReceipt } from './receipt.contract'
import type { ReceiptData } from './receipt.contract'

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

export interface SaleDetailItem {
  id: string
  quantity: number
  unitPrice: string
  unitCost: string
  variantId: string
  variant: {
    sku: string
    frameColor: string
    lensColor: string
    product: { name: string }
  }
}

export interface SaleDetail {
  id: string
  totalAmount: string
  paymentBreakdown: PaymentBreakdown
  status: 'COMPLETED' | 'CANCELLED' | 'RETURNED'
  createdAt: string
  customerId: string | null
  customer: { id: string; name: string } | null
  items: SaleDetailItem[]
  cashFlowEntry: { id: string; amount: string; type: string } | null
}

export async function getSaleByIdAction(
  saleId: string,
): Promise<{ success: true; sale: SaleDetail } | { success: false; error: string }> {
  try {
    const sale = await SalesService.getSaleById(saleId)
    return {
      success: true,
      sale: {
        id: sale.id,
        totalAmount: sale.totalAmount.toString(),
        paymentBreakdown: sale.paymentBreakdown,
        status: sale.status,
        createdAt: sale.createdAt.toISOString(),
        customerId: sale.customerId,
        customer: sale.customer,
        items: sale.items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice.toString(),
          unitCost: i.unitCost.toString(),
          variantId: i.variantId,
          variant: i.variant,
        })),
        cashFlowEntry: sale.cashFlowEntry
          ? { ...sale.cashFlowEntry, amount: sale.cashFlowEntry.amount.toString() }
          : null,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar venda',
    }
  }
}

export async function getSaleForReceiptAction(
  saleId: string,
): Promise<{ success: true; receipt: ReceiptData } | { success: false; error: string }> {
  try {
    const sale = await SalesService.getSaleById(saleId)
    return { success: true, receipt: buildReceipt(sale) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar comprovante',
    }
  }
}

export async function returnSaleAction(
  saleId: string,
): Promise<{ success: true; saleId: string } | { success: false; error: string }> {
  try {
    const sale = await SalesService.processReturn(saleId)
    revalidatePath('/vendas')
    revalidatePath('/estoque')
    return { success: true, saleId: sale.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar devolução',
    }
  }
}

export async function exchangeSaleAction(
  saleId: string,
  newItems: CreateSaleItemDTO[],
): Promise<{ success: true; saleId: string } | { success: false; error: string }> {
  try {
    const sale = await SalesService.processExchange(saleId, newItems)
    revalidatePath('/vendas')
    revalidatePath('/estoque')
    return { success: true, saleId: sale.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar troca',
    }
  }
}
