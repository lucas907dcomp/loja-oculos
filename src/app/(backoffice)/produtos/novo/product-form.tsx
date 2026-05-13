'use client'

import { useState, useTransition } from 'react'
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Decimal from 'decimal.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateMargin } from '@/lib/decimal'
import { createProductAction } from '@/features/products/actions'

const UV_OPTIONS = ['UV380', 'UV400', 'UV420'] as const

const variantSchema = z.object({
  frameColor: z.string().min(1, 'Obrigatório'),
  lensColor: z.string().min(1, 'Obrigatório'),
  uvProtection: z.enum(['UV380', 'UV400', 'UV420']),
  isPolarized: z.boolean(),
  costPrice: z
    .string()
    .refine((v) => v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), {
      message: 'Valor inválido',
    }),
  salePrice: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
    message: 'Valor inválido',
  }),
  image0: z.string().optional(),
  image1: z.string().optional(),
  image2: z.string().optional(),
  image3: z.string().optional(),
  image4: z.string().optional(),
})

const productSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  brand: z.string().min(2, 'Marca deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  supplierId: z.string().optional(),
  variants: z.array(variantSchema).min(1, 'Adicione ao menos uma variante'),
})

type ProductFormValues = z.infer<typeof productSchema>

interface SupplierOption {
  id: string
  name: string
}

interface ProductFormProps {
  suppliers: SupplierOption[]
}

function VariantMarginDisplay({ costPrice, salePrice }: { costPrice: string; salePrice: string }) {
  const cost = parseFloat(costPrice || '0')
  const sale = parseFloat(salePrice || '0')

  if (sale === 0) return <span className="text-sm text-muted-foreground">—</span>

  if (cost === 0) {
    return (
      <Badge
        variant="outline"
        className="border-amber-300 bg-amber-50 text-xs text-amber-700"
      >
        Margem não calculável — adicione o custo de aquisição
      </Badge>
    )
  }

  const margin = calculateMargin(new Decimal(sale), new Decimal(cost))
  return <span className="text-sm font-medium text-green-700">{margin.toFixed(2)}% margem</span>
}

function emptyVariant() {
  return {
    frameColor: '',
    lensColor: '',
    uvProtection: 'UV400' as const,
    isPolarized: false,
    costPrice: '',
    salePrice: '',
    image0: '',
    image1: '',
    image2: '',
    image3: '',
    image4: '',
  }
}

export function ProductForm({ suppliers }: ProductFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      brand: '',
      description: '',
      supplierId: '',
      variants: [emptyVariant()],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })
  const watchedVariants = useWatch({ control, name: 'variants' })

  function onSubmit(data: ProductFormValues) {
    setServerError(null)
    startTransition(async () => {
      try {
        await createProductAction({
          name: data.name,
          brand: data.brand,
          description: data.description || undefined,
          supplierId: data.supplierId || undefined,
          variants: data.variants.map((v) => ({
            frameColor: v.frameColor,
            lensColor: v.lensColor,
            uvProtection: v.uvProtection,
            isPolarized: v.isPolarized,
            costPrice: v.costPrice || '0',
            salePrice: v.salePrice,
            images: [v.image0, v.image1, v.image2, v.image3, v.image4].filter(Boolean) as string[],
          })),
        })
      } catch (err) {
        if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) return
        setServerError(err instanceof Error ? err.message : 'Erro ao salvar produto')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
      )}

      {/* Product fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do Produto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" {...register('name')} placeholder="Ex: Ray-Ban Aviador" />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="brand">Marca *</Label>
              <Input id="brand" {...register('brand')} placeholder="Ex: Ray-Ban" />
              {errors.brand && <p className="text-xs text-red-600">{errors.brand.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...register('description')} placeholder="Opcional" />
          </div>
          {suppliers.length > 0 && (
            <div className="space-y-1">
              <Label htmlFor="supplierId">Fornecedor</Label>
              <select
                id="supplierId"
                {...register('supplierId')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Nenhum</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variant builder */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Variantes{' '}
            {typeof errors.variants?.root?.message === 'string' && (
              <span className="text-sm font-normal text-red-600">
                — {errors.variants.root.message}
              </span>
            )}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(emptyVariant())}
          >
            + Adicionar Variante
          </Button>
        </div>

        {fields.map((field, index) => {
          const v = watchedVariants?.[index]
          return (
            <Card key={field.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Variante {index + 1}</CardTitle>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => remove(index)}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Cor Armação *</Label>
                    <Input
                      {...register(`variants.${index}.frameColor`)}
                      placeholder="Ex: Preto"
                    />
                    {errors.variants?.[index]?.frameColor && (
                      <p className="text-xs text-red-600">
                        {errors.variants[index]?.frameColor?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Cor Lente *</Label>
                    <Input {...register(`variants.${index}.lensColor`)} placeholder="Ex: Cinza" />
                    {errors.variants?.[index]?.lensColor && (
                      <p className="text-xs text-red-600">
                        {errors.variants[index]?.lensColor?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Proteção UV *</Label>
                    <select
                      {...register(`variants.${index}.uvProtection`)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {UV_OPTIONS.map((uv) => (
                        <option key={uv} value={uv}>
                          {uv}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Controller
                      control={control}
                      name={`variants.${index}.isPolarized`}
                      render={({ field: f }) => (
                        <input
                          type="checkbox"
                          id={`isPolarized-${index}`}
                          checked={f.value}
                          onChange={f.onChange}
                          className="h-4 w-4"
                        />
                      )}
                    />
                    <Label htmlFor={`isPolarized-${index}`}>Polarizado</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Custo de Aquisição (R$)</Label>
                    <Input
                      {...register(`variants.${index}.costPrice`)}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                    {errors.variants?.[index]?.costPrice && (
                      <p className="text-xs text-red-600">
                        {errors.variants[index]?.costPrice?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Preço de Venda (R$) *</Label>
                    <Input
                      {...register(`variants.${index}.salePrice`)}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                    {errors.variants?.[index]?.salePrice && (
                      <p className="text-xs text-red-600">
                        {errors.variants[index]?.salePrice?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <VariantMarginDisplay
                    costPrice={v?.costPrice ?? ''}
                    salePrice={v?.salePrice ?? ''}
                  />
                </div>

                {/* Image URLs (up to 5) */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    URLs de Imagens (opcional, até 5)
                  </Label>
                  {([0, 1, 2, 3, 4] as const).map((n) => (
                    <Input
                      key={n}
                      {...register(`variants.${index}.image${n}`)}
                      placeholder={`URL da imagem ${n + 1}`}
                      className="text-xs"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar Produto'}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
