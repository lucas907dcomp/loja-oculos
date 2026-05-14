'use server'

import { revalidatePath } from 'next/cache'
import { CustomerService } from './services/customer.service'
import type { CreateCustomerDTO, UpdateCustomerDTO } from './customer.contract'

export interface CustomerSummaryDTO {
  id: string
  name: string
  phone: string | null
  email: string | null
  tags: string[]
  saleCount: number
  createdAt: string
}

export interface CustomerSaleHistoryDTO {
  id: string
  totalAmount: string
  status: 'COMPLETED' | 'CANCELLED' | 'RETURNED'
  itemCount: number
  createdAt: string
}

export interface CustomerDetailDTO {
  id: string
  name: string
  phone: string | null
  email: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
  sales: CustomerSaleHistoryDTO[]
}

export async function getCustomersAction(
  search?: string,
): Promise<{ success: true; customers: CustomerSummaryDTO[] } | { success: false; error: string }> {
  try {
    const customers = await CustomerService.getCustomers(search)
    return {
      success: true,
      customers: customers.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar clientes',
    }
  }
}

export async function getCustomerByIdAction(
  id: string,
): Promise<{ success: true; customer: CustomerDetailDTO } | { success: false; error: string }> {
  try {
    const customer = await CustomerService.getCustomerById(id)
    return {
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        tags: customer.tags,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        sales: customer.sales.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
        })),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar cliente',
    }
  }
}

export async function createCustomerAction(
  dto: CreateCustomerDTO,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const customer = await CustomerService.createCustomer(dto)
    revalidatePath('/clientes')
    return { success: true, id: customer.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar cliente',
    }
  }
}

export async function updateCustomerAction(
  id: string,
  dto: UpdateCustomerDTO,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await CustomerService.updateCustomer(id, dto)
    revalidatePath('/clientes')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar cliente',
    }
  }
}

export async function searchCustomersAction(
  q: string,
): Promise<{ success: true; customers: { id: string; name: string; phone: string | null }[] } | { success: false; error: string }> {
  try {
    const customers = await CustomerService.searchCustomers(q)
    return { success: true, customers }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar clientes',
    }
  }
}
