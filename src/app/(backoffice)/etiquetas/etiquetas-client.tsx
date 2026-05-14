'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LabelData } from '@/features/labels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface Product {
  id: string
  name: string
  brand: string
}

interface Props {
  products: Product[]
  labels: LabelData[]
  selectedProductId?: string
}

interface LabelCardProps {
  label: LabelData
  quantity: number
}

function LabelCard({ label, quantity }: LabelCardProps) {
  return (
    <>
      {Array.from({ length: quantity }, (_, i) => (
        <div
          key={i}
          className="label-card flex h-36 w-56 flex-col items-center justify-between rounded border border-zinc-300 p-3 print:break-inside-avoid"
        >
          <div className="w-full text-center">
            <p className="text-xs font-bold leading-tight text-zinc-900">{label.productName}</p>
            <p className="text-[10px] text-zinc-500">{label.brand}</p>
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] text-zinc-600">{label.frameColor} / {label.lensColor}</p>
              <p className="font-mono text-[10px] text-zinc-500">{label.sku}</p>
              <p className="text-sm font-bold text-zinc-900">{brl.format(label.salePrice)}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={label.qrCodeDataUrl} alt={`QR ${label.sku}`} className="h-16 w-16 shrink-0" />
          </div>
        </div>
      ))}
    </>
  )
}

export function EtiquetasClient({ products, labels, selectedProductId }: Props) {
  const router = useRouter()
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  function handleProductChange(productId: string) {
    router.push(`/etiquetas?productId=${productId}`)
  }

  function getQuantity(variantId: string) {
    return quantities[variantId] ?? 1
  }

  function setQuantity(variantId: string, value: number) {
    setQuantities((prev) => ({ ...prev, [variantId]: Math.min(10, Math.max(1, value)) }))
  }

  return (
    <>
      <style>{`
        @media print {
          aside, nav, header, .no-print { display: none !important; }
          #labels-print-area { display: flex !important; flex-wrap: wrap; gap: 8px; }
          .label-card { border: 1px solid #ccc; page-break-inside: avoid; }
          body { margin: 0; padding: 8px; }
        }
      `}</style>

      <div className="space-y-6 p-6">
        <div className="no-print flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">Etiquetas de Preço</h1>
          {labels.length > 0 && (
            <Button onClick={() => window.print()}>Imprimir</Button>
          )}
        </div>

        <div className="no-print w-72">
          <select
            value={selectedProductId ?? ''}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <option value="" disabled>Selecione um produto...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.brand}
              </option>
            ))}
          </select>
        </div>

        {labels.length === 0 && !selectedProductId && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Selecione um produto para gerar etiquetas.
          </p>
        )}

        {labels.length === 0 && selectedProductId && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma variante encontrada para este produto.
          </p>
        )}

        {labels.length > 0 && (
          <>
            <div className="no-print flex flex-wrap gap-3">
              {labels.map((label) => (
                <Card key={label.variantId} className="w-56">
                  <CardContent className="pt-3">
                    <p className="mb-1 text-xs font-medium text-zinc-700">{label.sku}</p>
                    <p className="mb-2 text-[10px] text-zinc-500">{label.frameColor} / {label.lensColor}</p>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-zinc-600">Cópias:</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={getQuantity(label.variantId)}
                        onChange={(e) => setQuantity(label.variantId, Number(e.target.value))}
                        className="w-14 rounded border border-zinc-300 px-2 py-0.5 text-center text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div id="labels-print-area" className="flex flex-wrap gap-4">
              {labels.map((label) => (
                <LabelCard
                  key={label.variantId}
                  label={label}
                  quantity={getQuantity(label.variantId)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
