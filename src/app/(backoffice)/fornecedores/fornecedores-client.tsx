'use client'

import { useState, useTransition, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { SupplierSummaryDTO, SupplierDetailDTO, PurchaseOrderDTO } from '@/features/suppliers/actions'
import {
  createSupplierAction,
  getSupplierByIdAction,
  createPurchaseOrderAction,
  updatePurchaseOrderStatusAction,
} from '@/features/suppliers/actions'
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
  suppliers: SupplierSummaryDTO[]
}

const createSupplierSchema = z.object({
  name: z.string().min(1, { message: 'Nome obrigatório' }),
  cnpj: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: 'E-mail inválido' }).optional().or(z.literal('')),
  leadTimeDays: z.coerce.number().int().min(0).optional(),
})

type CreateSupplierFormValues = z.infer<typeof createSupplierSchema>

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function statusLabel(status: PurchaseOrderDTO['status']): string {
  return status === 'DELIVERED' ? 'Entregue' : 'Solicitado'
}

export function FornecedoresClient({ suppliers }: Props) {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDetailDTO | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [poNotes, setPoNotes] = useState('')
  const [showPoForm, setShowPoForm] = useState(false)
  const [poError, setPoError] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()
  const [isLoadingProfile, startProfileTransition] = useTransition()
  const [isMarkingDelivered, startDeliverTransition] = useTransition()
  const [isCreatingPO, startPOTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSupplierFormValues>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: { leadTimeDays: 7 },
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers
    const q = search.toLowerCase()
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.cnpj ?? '').toLowerCase().includes(q) ||
        (s.contactName ?? '').toLowerCase().includes(q),
    )
  }, [suppliers, search])

  function handleCreateOpenChange(open: boolean) {
    setCreateOpen(open)
    if (!open) {
      reset()
      setServerError(null)
    }
  }

  function onSubmit(values: CreateSupplierFormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await createSupplierAction({
        name: values.name,
        cnpj: values.cnpj || undefined,
        contactName: values.contactName || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        leadTimeDays: values.leadTimeDays,
      })
      if (result.success) {
        setCreateOpen(false)
        reset()
        setSuccessMessage('Fornecedor cadastrado com sucesso')
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setServerError(result.error)
      }
    })
  }

  function handleViewSupplier(id: string) {
    setSelectedSupplier(null)
    setShowPoForm(false)
    setPoNotes('')
    setPoError(null)
    setProfileOpen(true)
    startProfileTransition(async () => {
      const result = await getSupplierByIdAction(id)
      if (result.success) {
        setSelectedSupplier(result.supplier)
      }
    })
  }

  function handleMarkDelivered(poId: string) {
    startDeliverTransition(async () => {
      const result = await updatePurchaseOrderStatusAction(poId, 'DELIVERED')
      if (result.success && selectedSupplier) {
        const refreshed = await getSupplierByIdAction(selectedSupplier.id)
        if (refreshed.success) setSelectedSupplier(refreshed.supplier)
      }
    })
  }

  function handleCreatePO() {
    if (!selectedSupplier) return
    setPoError(null)
    startPOTransition(async () => {
      const result = await createPurchaseOrderAction(selectedSupplier.id, { notes: poNotes || undefined })
      if (result.success) {
        setPoNotes('')
        setShowPoForm(false)
        const refreshed = await getSupplierByIdAction(selectedSupplier.id)
        if (refreshed.success) setSelectedSupplier(refreshed.supplier)
      } else {
        setPoError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Fornecedores</h1>
          <Badge variant="outline">{suppliers.length}</Badge>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Novo Fornecedor</Button>
      </div>

      {successMessage && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
          ✓ {successMessage}
        </div>
      )}

      {/* Search */}
      <Input
        placeholder="Buscar por nome, CNPJ ou contato..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      {suppliers.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          Nenhum fornecedor cadastrado.
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
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-right">Prazo (dias)</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.cnpj ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.contactName ?? '—'}</TableCell>
                  <TableCell className="text-right text-sm">{s.leadTimeDays}</TableCell>
                  <TableCell className="text-right text-sm">{s.productCount}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => handleViewSupplier(s.id)}>
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Supplier Sheet */}
      <Sheet open={createOpen} onOpenChange={handleCreateOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Fornecedor</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" placeholder="Nome da empresa" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" placeholder="00.000.000/0000-00" {...register('cnpj')} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contactName">Contato</Label>
              <Input id="contactName" placeholder="Nome do responsável" {...register('contactName')} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(11) 99999-9999" {...register('phone')} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="fornecedor@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="leadTimeDays">Prazo de Entrega (dias)</Label>
              <Input id="leadTimeDays" type="number" min="0" placeholder="7" {...register('leadTimeDays')} />
            </div>

            {serverError && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">
                {serverError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" disabled={isPending} onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando…' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Supplier Profile Sheet */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Perfil do Fornecedor</SheetTitle>
          </SheetHeader>

          {isLoadingProfile || !selectedSupplier ? (
            <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Supplier details */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Nome</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{selectedSupplier.name}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">CNPJ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedSupplier.cnpj ?? '—'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Contato</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedSupplier.contactName ?? '—'}</p>
                    {selectedSupplier.phone && (
                      <p className="text-xs text-muted-foreground mt-1">{selectedSupplier.phone}</p>
                    )}
                    {selectedSupplier.email && (
                      <p className="text-xs text-muted-foreground">{selectedSupplier.email}</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Prazo de Entrega</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedSupplier.leadTimeDays} dias</p>
                  </CardContent>
                </Card>
              </div>

              {/* Associated products */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Produtos Vinculados ({selectedSupplier.products.length})
                </p>
                {selectedSupplier.products.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum produto vinculado.</p>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Marca</TableHead>
                          <TableHead className="text-right">Variantes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSupplier.products.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium text-sm">{p.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.brand}</TableCell>
                            <TableCell className="text-right text-sm">{p.variantCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Purchase orders */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    Pedidos de Compra ({selectedSupplier.purchaseOrders.length})
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => { setShowPoForm((v) => !v); setPoError(null) }}
                  >
                    {showPoForm ? 'Cancelar' : '+ Novo Pedido'}
                  </Button>
                </div>

                {showPoForm && (
                  <div className="border rounded-md p-3 mb-3 flex flex-col gap-2 bg-muted/30">
                    <Label className="text-xs">Observações (opcional)</Label>
                    <Input
                      placeholder="Ex: 10 unidades modelo X"
                      value={poNotes}
                      onChange={(e) => setPoNotes(e.target.value)}
                      className="h-8 text-sm"
                    />
                    {poError && <p className="text-xs text-destructive">{poError}</p>}
                    <Button
                      size="sm"
                      disabled={isCreatingPO}
                      onClick={handleCreatePO}
                      className="self-end"
                    >
                      {isCreatingPO ? 'Registrando…' : 'Registrar Pedido'}
                    </Button>
                  </div>
                )}

                {selectedSupplier.purchaseOrders.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum pedido registrado.</p>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Observações</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSupplier.purchaseOrders.map((po) => (
                          <TableRow key={po.id}>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(po.createdAt)}
                            </TableCell>
                            <TableCell className="text-sm max-w-[120px] truncate">
                              {po.notes ?? '—'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={po.status === 'DELIVERED' ? 'outline' : 'secondary'}
                                className="text-xs"
                              >
                                {statusLabel(po.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {po.status === 'REQUESTED' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                  disabled={isMarkingDelivered}
                                  onClick={() => handleMarkDelivered(po.id)}
                                >
                                  Marcar Entregue
                                </Button>
                              )}
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
