'use client'

import { useState, useTransition, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CustomerSummaryDTO, CustomerDetailDTO } from '@/features/customers/actions'
import { createCustomerAction, getCustomerByIdAction } from '@/features/customers/actions'
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
  customers: CustomerSummaryDTO[]
}

const createCustomerSchema = z.object({
  name: z.string().min(1, { message: 'Nome obrigatório' }),
  phone: z.string().optional(),
  email: z.string().email({ message: 'E-mail inválido' }).optional().or(z.literal('')),
  tags: z.string().optional(),
})

type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatBRL(value: string): string {
  const n = parseFloat(value)
  return `R$ ${n.toFixed(2).replace('.', ',')}`
}

function parseTags(raw: string): string[] {
  return raw.split(',').map((t) => t.trim()).filter(Boolean)
}

export function ClientesClient({ customers }: Props) {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetailDTO | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isLoadingProfile, startProfileTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q),
    )
  }, [customers, search])

  function handleCreateOpenChange(open: boolean) {
    setCreateOpen(open)
    if (!open) {
      reset()
      setServerError(null)
    }
  }

  function onSubmit(values: CreateCustomerFormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await createCustomerAction({
        name: values.name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        tags: values.tags ? parseTags(values.tags) : [],
      })
      if (result.success) {
        setCreateOpen(false)
        reset()
        setSuccessMessage('Cliente cadastrado com sucesso')
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setServerError(result.error)
      }
    })
  }

  function handleViewCustomer(id: string) {
    setSelectedCustomer(null)
    setProfileOpen(true)
    startProfileTransition(async () => {
      const result = await getCustomerByIdAction(id)
      if (result.success) {
        setSelectedCustomer(result.customer)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <Badge variant="outline">{customers.length}</Badge>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Novo Cliente</Button>
      </div>

      {successMessage && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
          ✓ {successMessage}
        </div>
      )}

      {/* Search */}
      <Input
        placeholder="Buscar por nome, telefone ou e-mail..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      {customers.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          Nenhum cliente cadastrado.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          Nenhum resultado para a busca.
        </p>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Compras</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.phone ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.email ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.tags.length === 0
                        ? <span className="text-muted-foreground text-xs">—</span>
                        : c.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">{c.saleCount}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewCustomer(c.id)}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create customer Sheet */}
      <Sheet open={createOpen} onOpenChange={handleCreateOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Cliente</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" placeholder="Nome completo" {...register('name')} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(11) 99999-9999" {...register('phone')} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="cliente@email.com" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input id="tags" placeholder="esportivo, casual, polarizado" {...register('tags')} />
              <p className="text-xs text-muted-foreground">Ex: esportivo, casual, polarizado</p>
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
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando…' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Customer Profile Sheet */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Perfil do Cliente</SheetTitle>
          </SheetHeader>

          {isLoadingProfile || !selectedCustomer ? (
            <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Customer details */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Nome</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{selectedCustomer.name}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Telefone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedCustomer.phone ?? '—'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">E-mail</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedCustomer.email ?? '—'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Cliente desde</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{formatDate(selectedCustomer.createdAt)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tags */}
              {selectedCustomer.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Preferências</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedCustomer.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchase history */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Histórico de Compras ({selectedCustomer.sales.length})
                </p>
                {selectedCustomer.sales.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhuma compra registrada.</p>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Itens</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCustomer.sales.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(s.createdAt)}
                            </TableCell>
                            <TableCell className="text-right text-sm">{s.itemCount}</TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {formatBRL(s.totalAmount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  s.status === 'COMPLETED'
                                    ? 'outline'
                                    : s.status === 'RETURNED'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="text-xs"
                              >
                                {s.status === 'COMPLETED'
                                  ? 'Concluída'
                                  : s.status === 'RETURNED'
                                  ? 'Devolvida'
                                  : 'Cancelada'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
