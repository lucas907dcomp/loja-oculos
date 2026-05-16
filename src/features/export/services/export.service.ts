import { prisma } from '@/lib/prisma'
import type { ExportFilters, ExportProduct, ExportVariant, InventoryEntry } from '../export.contract'

export class ExportService {
  private static buildWhere(filters?: ExportFilters) {
    return {
      ...(filters?.includeArchived !== true && { isArchived: false }),
      ...(filters?.supplierId && { supplierId: filters.supplierId }),
      ...(filters?.brand && { brand: filters.brand }),
    }
  }

  private static async fetchProducts(filters?: ExportFilters): Promise<ExportProduct[]> {
    const where = ExportService.buildWhere(filters)
    const products = await prisma.product.findMany({
      where,
      include: {
        variants: {
          include: { inventory: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      description: p.description,
      supplierId: p.supplierId,
      variants: p.variants.map((v): ExportVariant => ({
        id: v.id,
        sku: v.sku,
        frameColor: v.frameColor,
        lensColor: v.lensColor,
        uvProtection: v.uvProtection,
        isPolarized: v.isPolarized,
        price: v.salePrice.toString(),
        stock: v.inventory?.quantity ?? 0,
        images: v.images,
      })),
    }))
  }

  static async exportCatalogJson(filters?: ExportFilters): Promise<string> {
    const products = await ExportService.fetchProducts(filters)
    return JSON.stringify(products, null, 2)
  }

  static async getStorefrontProducts(brand?: string): Promise<ExportProduct[]> {
    return ExportService.fetchProducts(brand ? { brand } : undefined)
  }

  static async getStorefrontInventory(): Promise<InventoryEntry[]> {
    const variants = await prisma.productVariant.findMany({
      where: { product: { isArchived: false } },
      include: {
        product: { select: { name: true } },
        inventory: true,
      },
      orderBy: { sku: 'asc' },
    })
    return variants.map((v) => ({
      variantId: v.id,
      sku: v.sku,
      productName: v.product.name,
      quantity: v.inventory?.quantity ?? 0,
      minStockAlert: v.inventory?.minStockAlert ?? 3,
      isLowStock: (v.inventory?.quantity ?? 0) <= (v.inventory?.minStockAlert ?? 3),
    }))
  }

  static async exportCatalogCsv(filters?: ExportFilters): Promise<string> {
    const products = await ExportService.fetchProducts(filters)
    const header =
      'product_id,product_name,brand,description,variant_id,sku,frame_color,lens_color,uv_protection,is_polarized,price,stock,images'
    const rows: string[] = [header]

    for (const p of products) {
      for (const v of p.variants) {
        const description = p.description?.replace(/,/g, ';') ?? ''
        const images = v.images.join('|')
        rows.push(
          [
            p.id,
            p.name,
            p.brand,
            description,
            v.id,
            v.sku,
            v.frameColor,
            v.lensColor,
            v.uvProtection,
            String(v.isPolarized),
            v.price,
            String(v.stock),
            images,
          ].join(','),
        )
      }
    }

    return rows.join('\n')
  }
}
