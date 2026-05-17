import { prisma } from '@/lib/prisma'

export type StoreSettingsData = {
  heroImages: string[]
}

export class StoreSettingsService {
  static async get(): Promise<StoreSettingsData> {
    const row = await prisma.storeSettings.findUnique({ where: { id: 'default' } })
    return { heroImages: row?.heroImages ?? [] }
  }

  static async update(data: Partial<StoreSettingsData>): Promise<void> {
    await prisma.storeSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    })
  }
}
