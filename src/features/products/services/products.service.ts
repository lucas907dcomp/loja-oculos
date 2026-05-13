import { prisma } from '@/lib/prisma'
import { calculateMargin } from '@/lib/decimal'
import { ProductsRepository } from '../repositories/products.repository'
import type { CreateProductDTO, CreateVariantDTO, ProductWithVariants } from '../products.contract'

export { calculateMargin }

function namePrefix(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 3).toUpperCase()
}

function colorShort(color: string): string {
  return color.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()
}

async function buildSKU(productName: string, variant: CreateVariantDTO): Promise<string> {
  const prefix = namePrefix(productName)
  const frame = colorShort(variant.frameColor)
  const lens = colorShort(variant.lensColor)
  const uv = variant.uvProtection
  const pol = variant.isPolarized ? '-P' : ''
  const base = `${prefix}-${frame}-${lens}-${uv}${pol}`

  const existing = await prisma.productVariant.findUnique({ where: { sku: base } })
  if (!existing) return base

  let counter = 2
  while (true) {
    const candidate = `${base}-${counter}`
    const conflict = await prisma.productVariant.findUnique({ where: { sku: candidate } })
    if (!conflict) return candidate
    counter++
  }
}

export class ProductsService {
  static async generateSKU(productName: string, variant: CreateVariantDTO): Promise<string> {
    return buildSKU(productName, variant)
  }

  static async createProduct(dto: CreateProductDTO): Promise<ProductWithVariants> {
    if (!dto.variants || dto.variants.length < 1) {
      throw new Error('At least one variant is required to create a product')
    }
    const variantsWithSku = await Promise.all(
      dto.variants.map(async (v) => ({
        ...v,
        sku: await buildSKU(dto.name, v),
      })),
    )
    return ProductsRepository.create({ ...dto, variants: variantsWithSku })
  }

  static async archiveProduct(id: string): Promise<void> {
    return ProductsRepository.archive(id)
  }

  static async restoreProduct(id: string): Promise<void> {
    return ProductsRepository.restore(id)
  }

  static async findAll(opts?: { includeArchived?: boolean }): Promise<ProductWithVariants[]> {
    return ProductsRepository.findAll(opts)
  }

  static async findById(id: string): Promise<ProductWithVariants> {
    return ProductsRepository.findById(id)
  }
}
