'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Decimal from 'decimal.js'
import type { CashFlowEntryDTO, CashFlowSummaryDTO } from '@/features/cashflow/actions'
import { createManualEntryAction } from '@/features/cashflow/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Props {
  entries: CashFlowEntryDTO[]
  summary: CashFlowSummaryDTO
  year: number
  month: number
}

const manualEntrySchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.coerce.number().positive({ message: 'Valor deve ser maior que zero' }),
  note: z.string().min(1, { message: 'Descrição obrigatória' }),
  date: z.string().optional(),
})

type ManualEntryFormValues = z.infer<typeof manualEntrySchema>

function formatBRL(value: string | number): string {
  return `R$ ${new Decimal(value.toString()).toFixed(2).replace('.', ',')}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function entryDescription(entry: CashFlowEntryDTO): string {
  if (entry.saleId) return entry.note ?? (entry.type === 'INCOME' ? 'Venda' : 'Devolução')
  return entry.note ?? '—'
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function FinanceiroClient({ entries, summary, year, month }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ManualEntryFormValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: { type: 'EXPENSE' },
  })

  const balanceDec = new Decimal(summary.balance.toString())
  const isNegativeBalance = balanceDec.lt(0)

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open)
    if (!open) {
      reset({ type: 'EXPENSE' })
      setServerError(null)
    }
  }

  function onSubmit(values: ManualEntryFormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await createManualEntryAction({
        type: values.type,
        amount: values.amount,
        note: values.note,
        date: values.date ? new Date(values.date) : undefined,
      })
      if (result.success) {
        setSheetOpen(false)
        reset({ type: 'EXPENSE' })
        setSuccessMessage('Lançamento registrado com sucesso')
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>+ Lançamento Manual</Button>
      </div>

      {successMessage && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
          ✓ {successMessage}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-green-700">{formatBRL(summary.income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-destructive">{formatBRL(summary.expense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-semibold ${isNegativeBalance ? 'text-destructive' : 'text-green-700'}`}>
              {formatBRL(summary.balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Entries table */}
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          Nenhum lançamento no período.
        </p>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(entry.date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.type === 'INCOME' ? 'outline' : 'destructive'}>
                      {entry.type === 'INCOME' ? 'Entrada' : 'Saída'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{entryDescription(entry)}</TableCell>
                  <TableCell className={`text-right text-sm font-medium ${entry.type === 'EXPENSE' ? 'text-destructive' : ''}`}>
                    {entry.type === 'EXPENSE' ? '−' : ''}{formatBRL(entry.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Manual entry sheet */}
      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Lançamento Manual</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5">
            {/* Type */}
            <div className="flex flex-col gap-2">
              <Label>Tipo</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        value="EXPENSE"
                        checked={field.value === 'EXPENSE'}
                        onChange={() => field.onChange('EXPENSE')}
                      />
                      Despesa (Saída)
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        value="INCOME"
                        checked={field.value === 'INCOME'}
                        onChange={() => field.onChange('INCOME')}
                      />
                      Receita (Entrada)
                    </label>
                  </div>
                )}
              />
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                {...register('amount')}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* Note */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="note">Descrição</Label>
              <Input
                id="note"
                placeholder="Ex: Aluguel, energia elétrica..."
                {...register('note')}
              />
              {errors.note && (
                <p className="text-xs text-destructive">{errors.note.message}</p>
              )}
            </div>

            {/* Date */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">Data (opcional)</Label>
              <Input id="date" type="date" {...register('date')} />
            </div>

            {serverError && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">
                {serverError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setSheetOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando…' : 'Confirmar'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
