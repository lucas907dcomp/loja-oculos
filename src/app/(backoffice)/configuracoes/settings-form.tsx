'use client'

import { useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ImageUploadInput } from '@/features/products/components/image-upload-input'
import { updateHeroImagesAction } from '@/features/store-settings/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SLOTS = [0, 1, 2, 3, 4] as const

type FormValues = {
  image0: string; image1: string; image2: string; image3: string; image4: string
}

interface SettingsFormProps {
  heroImages: string[]
}

export function SettingsForm({ heroImages }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      image0: heroImages[0] ?? '',
      image1: heroImages[1] ?? '',
      image2: heroImages[2] ?? '',
      image3: heroImages[3] ?? '',
      image4: heroImages[4] ?? '',
    },
  })

  function onSubmit(data: FormValues) {
    setSaved(false)
    startTransition(async () => {
      await updateHeroImagesAction([data.image0, data.image1, data.image2, data.image3, data.image4])
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
            Adicione até 5 fotos para o banner. Elas vão alternando automaticamente a cada 5 segundos.
            Recomendado: fotos horizontais, mínimo 1200×600px.
          </p>
          <div className="flex flex-wrap gap-4">
            {SLOTS.map((n) => (
              <Controller
                key={n}
                control={control}
                name={`image${n}`}
                render={({ field }) => (
                  <ImageUploadInput
                    label={`Foto ${n + 1}`}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            ))}
          </div>
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
