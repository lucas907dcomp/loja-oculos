'use server'

import { revalidatePath } from 'next/cache'
import { StoreSettingsService } from './store-settings.service'

export async function updateHeroImagesAction(images: string[]): Promise<void> {
  await StoreSettingsService.update({ heroImages: images.filter(Boolean) })
  revalidatePath('/loja')
}
