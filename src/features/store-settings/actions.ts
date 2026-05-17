'use server'

import { revalidatePath } from 'next/cache'
import { StoreSettingsService } from './store-settings.service'

export async function updateHeroImageAction(url: string): Promise<void> {
  await StoreSettingsService.update({ heroImageUrl: url || null })
  revalidatePath('/loja')
}
