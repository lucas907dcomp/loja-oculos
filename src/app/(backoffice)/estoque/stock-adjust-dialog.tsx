'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { adjustStockAction } from '@/features/inventory/actions'

const adjustSchema = z
  .object({
    type: z.enum(['PURCHASE', 'ADJUSTMENT']),
    quantity: z.coerce.number().int().min(1, 'Quantidade deve ser no mínimo 1'),
    sign: z.enum(['+', '-']).optional(),
    note: z.string().optional(),
  })
  .refine((data) => data.type !== 'ADJUSTMENT' || data.sign !== undefined, {
    message: 'Selecione o sinal para ajuste manual',
    path: ['sign'],
  })

type AdjustFormValues = z.infer<typeof adjustSchema>

interface StockAdjustDialogProps {
  variantId: string
  sku: string
  currentQuantity: number
}

export function StockAdjustDialog({ variantId, sku, currentQuantity }: StockAdjustDialogProps) {
  const [open, setOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { type: 'PURCHASE', sign: '+' },
  })

  const watchedType = watch('type')

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      reset({ type: 'PURCHASE', sign: '+' })
      setSuccessMessage(null)
      setServerError(null)
    }
  }

  function onSubmit(values: AdjustFormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await adjustStockAction(variantId, {
        type: values.type,
        quantity: values.quantity,
        sign: values.sign,
        note: values.note || undefined,
      })
      if (result.success) {
        setSuccessMessage('Estoque atualizado')
        setTimeout(() => setOpen(false), 1200)
      } else {
        setServerError(result.error ?? 'Erro desconhecido')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Ajustar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar Estoque — {sku}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Estoque atual: <span className="font-medium text-foreground">{currentQuantity}</span>
        </p>

        {successMessage ? (
          <div className="rounded-md bg-green-50 p-3 text-sm font-medium text-green-700">
            {successMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Tipo</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        value="PURCHASE"
                        checked={field.value === 'PURCHASE'}
                        onChange={() => field.onChange('PURCHASE')}
                      />
                      Compra (Entrada)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        value="ADJUSTMENT"
                        checked={field.value === 'ADJUSTMENT'}
                        onChange={() => field.onChange('ADJUSTMENT')}
                      />
                      Ajuste Manual
                    </label>
                  </div>
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                {...register('quantity')}
                placeholder="1"
              />
              {errors.quantity && (
                <p className="text-xs text-destructive">{errors.quantity.message}</p>
              )}
            </div>

            {watchedType === 'ADJUSTMENT' && (
              <div className="flex flex-col gap-2">
                <Label>Sinal</Label>
                <Controller
                  name="sign"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          value="+"
                          checked={field.value === '+'}
                          onChange={() => field.onChange('+')}
                        />
                        Entrada (+)
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          value="-"
                          checked={field.value === '-'}
                          onChange={() => field.onChange('-')}
                        />
                        Saída (−)
                      </label>
                    </div>
                  )}
                />
                {errors.sign && (
                  <p className="text-xs text-destructive">{errors.sign.message}</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="note">Observação (opcional)</Label>
              <Input id="note" {...register('note')} placeholder="Ex: reposição fornecedor X" />
            </div>

            {serverError && (
              <p className="text-sm font-medium text-destructive">{serverError}</p>
            )}

            <div className="flex justify-end gap-2">
              <DialogClose render={<Button type="button" variant="outline" disabled={isPending} />}>
                Cancelar
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando…' : 'Confirmar'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
