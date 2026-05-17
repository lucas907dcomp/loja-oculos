import { StoreSettingsService } from '@/features/store-settings/store-settings.service'
import { SettingsForm } from './settings-form'

export default async function ConfiguracoesPage() {
  const settings = await StoreSettingsService.get()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Configurações da Loja</h1>
      <SettingsForm heroImages={settings.heroImages} />
    </div>
  )
}
