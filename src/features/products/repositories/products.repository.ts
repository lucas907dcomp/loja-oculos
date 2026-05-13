import Decimal from 'decimal.js'
import { prisma } from '@/lib/prisma'
import type { CreateProductDTO, ProductWithVariants } from '../products.contract'

function mapVariant(v: {
  id: string
  sku: string
  frameColor: string
  lensColor: string
  uvProtection: string
  isPolarized: boolean
  costPrice: { toString(): string }
  salePrice: { toString(): string }
  images: string[]
  inventory: { quantity: number; minStockAlert: number } | null
}) {
  return {
    id: v.id,
    sku: v.sku,
    frameColor: v.frameColor,
    lensColor: v.lensColor,
    uvProtection: v.uvProtection,
    isPolarized: v.isPolarized,
    costPrice: new Decimal(v.costPrice.toString()),
    salePrice: new Decimal(v.salePrice.toString()),
    images: v.images,
    inventory: v.inventory,
  }
}

function mapProduct(p: {
  id: string
  name: string
  brand: string
  description: string | null
  isArchived: boolean
  supplierId: string | null
  supplier: { id: string; name: string } | null
  createdAt: Date
  updatedAt: Date
  variants: Parameters<typeof mapVariant>[0][]
}): ProductWithVariants {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    description: p.description,
    isArchived: p.isArchived,
    supplierId: p.supplierId,
    supplier: p.supplier,
    variants: p.variants.map(mapVariant),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

export class ProductsRepository {
  static async findAll({ includeArchived = false }: { includeArchived?: boolean } = {}): Promise<
    ProductWithVariants[]
  > {
    const rows = await prisma.product.findMany({
      where: includeArchived ? undefined : { isArchived: false },
      include: {
        supplier: { select: { id: true, name: true } },
        variants: { include: { inventory: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(mapProduct)
  }

  static async findById(id: string): Promise<ProductWithVariants> {
    const row = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true } },
        variants: { include: { inventory: true } },
      },
    })
    if (!row) throw new Error(`Product not found: ${id}`)
    return mapProduct(row)
  }

  static async create(
    dto: CreateProductDTO & { variants: (CreateProductDTO['variants'][number] & { sku: string })[] },
  ): Promise<ProductWithVariants> {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: dto.name,
          brand: dto.brand,
          description: dto.description ?? null,
          supplierId: dto.supplierId ?? null,
        },
      })
      for (const v of dto.variants) {
        const variant = await tx.productVariant.create({
          data: {
            sku: v.sku,
            frameColor: v.frameColor,
            lensColor: v.lensColor,
            uvProtection: v.uvProtection,
            isPolarized: v.isPolarized,
            costPrice: v.costPrice.toFixed(2),
            salePrice: v.salePrice.toFixed(2),
            images: v.images ?? [],
            productId: created.id,
          },
        })
        await tx.inventory.create({
          data: {
            variantId: variant.id,
            quantity: 0,
            minStockAlert: 3,
          },
        })
      }
      return created
    })
    return ProductsRepository.findById(product.id)
  }

  static async archive(id: string): Promise<void> {
    await prisma.product.update({ where: { id }, data: { isArchived: true } })
  }

  static async restore(id: string): Promise<void> {
    await prisma.product.update({ where: { id }, data: { isArchived: false } })
  }
}
