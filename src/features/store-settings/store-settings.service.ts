import { prisma } from '@/lib/prisma'

export type StoreSettingsData = {
  heroImageUrl: string | null
}

export class StoreSettingsService {
  static async get(): Promise<StoreSettingsData> {
    const row = await prisma.storeSettings.findUnique({ where: { id: 'default' } })
    return { heroImageUrl: row?.heroImageUrl ?? null }
  }

  static async update(data: Partial<StoreSettingsData>): Promise<void> {
    await prisma.storeSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    })
  }
}
