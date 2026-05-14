'use server'

import { LabelService } from './services/label.service'
import type { LabelData } from './label.contract'

export type { LabelData }

export async function getLabelsByProductAction(
  productId: string,
): Promise<{ success: true; data: LabelData[] } | { success: false; error: string }> {
  try {
    const data = await LabelService.getProductLabels(productId)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao gerar etiquetas' }
  }
}

export async function getLabelsByVariantsAction(
  variantIds: string[],
): Promise<{ success: true; data: LabelData[] } | { success: false; error: string }> {
  try {
    const data = await LabelService.getVariantLabels(variantIds)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao gerar etiquetas' }
  }
}
