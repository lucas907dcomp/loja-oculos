'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const CustomerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  phone: z.string().min(8, 'Telefone inválido'),
  email: z
    .string()
    .email('E-mail inválido')
    .optional()
    .or(z.literal('')),
})

export async function createCustomer(data: {
  name: string
  phone: string
  email?: string
}): Promise<{ id: string } | { error: string }> {
  const parsed = CustomerSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        tags: [],
      },
    })
    return { id: customer.id }
  } catch {
    return { error: 'Erro ao salvar dados. Tente novamente.' }
  }
}
