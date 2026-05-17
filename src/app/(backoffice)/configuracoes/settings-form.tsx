'use client'

import { useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ImageUploadInput } from '@/features/products/components/image-upload-input'
import { updateHeroImageAction } from '@/features/store-settings/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SettingsFormProps {
  heroImageUrl: string | null
}

export function SettingsForm({ heroImageUrl }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const { control, handleSubmit } = useForm({
    defaultValues: { heroImageUrl: heroImageUrl ?? '' },
  })

  function onSubmit(data: { heroImageUrl: string }) {
    setSaved(false)
    startTransition(async () => {
      await updateHeroImageAction(data.heroImageUrl)
      setSaved(true)
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Banner da Página Inicial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Imagem exibida no banner principal da loja. Recomendado: foto horizontal, mínimo 1200×600px.
          </p>
          <Controller
            control={control}
            name="heroImageUrl"
            render={({ field }) => (
              <ImageUploadInput
                label="Imagem do banner"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
        {saved && <p className="text-sm text-green-600">Salvo com sucesso!</p>}
      </div>
    </form>
  )
}
