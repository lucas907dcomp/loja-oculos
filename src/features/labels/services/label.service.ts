import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'
import type { LabelData } from '../label.contract'

export class LabelService {
  static async getVariantLabels(variantIds: string[]): Promise<LabelData[]> {
    if (variantIds.length === 0) return []

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds }, product: { isArchived: false } },
      include: { product: true },
    })

    return Promise.all(
      variants.map(async (v) => {
        const qrUrl = (process.env.LABEL_QR_BASE_URL ?? '') + '/p/' + v.sku
        const qrCodeDataUrl = await QRCode.toDataURL(qrUrl)
        return {
          variantId: v.id,
          productName: v.product.name,
          brand: v.product.brand,
          sku: v.sku,
          frameColor: v.frameColor,
          lensColor: v.lensColor,
          salePrice: Number(v.salePrice),
          qrUrl,
          qrCodeDataUrl,
        }
      }),
    )
  }

  static async getProductLabels(productId: string): Promise<LabelData[]> {
    const variants = await prisma.productVariant.findMany({
      where: { productId, product: { isArchived: false } },
      include: { product: true },
    })

    return Promise.all(
      variants.map(async (v) => {
        const qrUrl = (process.env.LABEL_QR_BASE_URL ?? '') + '/p/' + v.sku
        const qrCodeDataUrl = await QRCode.toDataURL(qrUrl)
        return {
          variantId: v.id,
          productName: v.product.name,
          brand: v.product.brand,
          sku: v.sku,
          frameColor: v.frameColor,
          lensColor: v.lensColor,
          salePrice: Number(v.salePrice),
          qrUrl,
          qrCodeDataUrl,
        }
      }),
    )
  }
}
