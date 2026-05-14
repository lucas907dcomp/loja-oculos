'use server'

import { revalidatePath } from 'next/cache'
import { SupplierService } from './services/supplier.service'
import type { CreateSupplierDTO, UpdateSupplierDTO, CreatePurchaseOrderDTO } from './supplier.contract'

export interface SupplierSummaryDTO {
  id: string
  name: string
  cnpj: string | null
  contactName: string | null
  phone: string | null
  email: string | null
  leadTimeDays: number
  productCount: number
  createdAt: string
}

export interface PurchaseOrderDTO {
  id: string
  supplierId: string
  status: 'REQUESTED' | 'DELIVERED'
  notes: string | null
  deliveredAt: string | null
  createdAt: string
}

export interface SupplierProductDTO {
  id: string
  name: string
  brand: string
  variantCount: number
}

export interface SupplierDetailDTO {
  id: string
  name: string
  cnpj: string | null
  contactName: string | null
  phone: string | null
  email: string | null
  leadTimeDays: number
  createdAt: string
  updatedAt: string
  products: SupplierProductDTO[]
  purchaseOrders: PurchaseOrderDTO[]
}

export async function getSuppliersAction(
  search?: string,
): Promise<{ success: true; suppliers: SupplierSummaryDTO[] } | { success: false; error: string }> {
  try {
    const suppliers = await SupplierService.getSuppliers(search)
    return {
      success: true,
      suppliers: suppliers.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar fornecedores',
    }
  }
}

export async function getSupplierByIdAction(
  id: string,
): Promise<{ success: true; supplier: SupplierDetailDTO } | { success: false; error: string }> {
  try {
    const supplier = await SupplierService.getSupplierById(id)
    return {
      success: true,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        cnpj: supplier.cnpj,
        contactName: supplier.contactName,
        phone: supplier.phone,
        email: supplier.email,
        leadTimeDays: supplier.leadTimeDays,
        createdAt: supplier.createdAt.toISOString(),
        updatedAt: supplier.updatedAt.toISOString(),
        products: supplier.products,
        purchaseOrders: supplier.purchaseOrders.map((po) => ({
          id: po.id,
          supplierId: po.supplierId,
          status: po.status,
          notes: po.notes,
          deliveredAt: po.deliveredAt?.toISOString() ?? null,
          createdAt: po.createdAt.toISOString(),
        })),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar fornecedor',
    }
  }
}

export async function createSupplierAction(
  dto: CreateSupplierDTO,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const supplier = await SupplierService.createSupplier(dto)
    revalidatePath('/fornecedores')
    return { success: true, id: supplier.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar fornecedor',
    }
  }
}

export async function updateSupplierAction(
  id: string,
  dto: UpdateSupplierDTO,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await SupplierService.updateSupplier(id, dto)
    revalidatePath('/fornecedores')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar fornecedor',
    }
  }
}

export async function createPurchaseOrderAction(
  supplierId: string,
  dto: CreatePurchaseOrderDTO,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const po = await SupplierService.createPurchaseOrder(supplierId, dto)
    revalidatePath('/fornecedores')
    return { success: true, id: po.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar pedido de compra',
    }
  }
}

export async function updatePurchaseOrderStatusAction(
  id: string,
  status: 'REQUESTED' | 'DELIVERED',
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await SupplierService.updatePurchaseOrderStatus(id, status)
    revalidatePath('/fornecedores')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar pedido',
    }
  }
}
