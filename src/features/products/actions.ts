'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Decimal from 'decimal.js'
import { ProductsService } from './services/products.service'
import type { CreateProductDTO, CreateVariantDTO } from './products.contract'

export interface CreateProductFormData {
  name: string
  brand: string
  description?: string
  supplierId?: string
  variants: Array<{
    frameColor: string
    lensColor: string
    uvProtection: 'UV380' | 'UV400' | 'UV420'
    isPolarized: boolean
    costPrice: string
    salePrice: string
    images?: string[]
  }>
}

export async function createProductAction(data: CreateProductFormData): Promise<void> {
  const dto: CreateProductDTO = {
    name: data.name,
    brand: data.brand,
    description: data.description,
    supplierId: data.supplierId || undefined,
    variants: data.variants.map(
      (v): CreateVariantDTO => ({
        frameColor: v.frameColor,
        lensColor: v.lensColor,
        uvProtection: v.uvProtection,
        isPolarized: v.isPolarized,
        costPrice: new Decimal(v.costPrice || '0'),
        salePrice: new Decimal(v.salePrice || '0'),
        images: v.images ?? [],
      }),
    ),
  }
  const product = await ProductsService.createProduct(dto)
  revalidatePath('/produtos')
  redirect(`/produtos/${product.id}`)
}

export async function archiveProductAction(id: string): Promise<void> {
  await ProductsService.archiveProduct(id)
  revalidatePath('/produtos')
  revalidatePath(`/produtos/${id}`)
}

export async function restoreProductAction(id: string): Promise<void> {
  await ProductsService.restoreProduct(id)
  revalidatePath('/produtos')
  revalidatePath(`/produtos/${id}`)
}
