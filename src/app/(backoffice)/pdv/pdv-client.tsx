'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Decimal from 'decimal.js'
import { useCartStore, selectTotal } from '@/features/sales'
import type { ReceiptData } from '@/features/sales'
import { createSaleAction, getSaleForReceiptAction } from '@/features/sales/actions'
import { searchCustomersAction } from '@/features/customers/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SaleReceipt } from './sale-receipt'

interface SerializedVariant {
  id: string
  sku: string
  frameColor: string
  lensColor: string
  uvProtection: string
  isPolarized: boolean
  costPrice: number
  salePrice: number
  images: string[]
  inventory: { quantity: number; minStockAlert: number } | null
}

interface SerializedProduct {
  id: string
  name: string
  brand: string
  variants: SerializedVariant[]
}

interface Props {
  products: SerializedProduct[]
}

function formatBRL(value: Decimal | number | string): string {
  return `R$ ${new Decimal(value.toString()).toFixed(2).replace('.', ',')}`
}

export function PdvClient({ products }: Props) {
  const { items, paymentBreakdown, addItem, removeItem, updateQuantity, setPaymentBreakdown, clearCart } =
    useCartStore()
  const total = new Decimal(useCartStore(selectTotal))

  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  // userEditedPayment: true when the user has manually changed any payment field
  const [userEditedPayment, setUserEditedPayment] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Customer search — independent transition so it doesn't block the sale confirm state
  const [customerQuery, setCustomerQuery] = useState('')
  const [customerResults, setCustomerResults] = useState<{ id: string; name: string; phone: string | null }[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [, startSearchTransition] = useTransition()
  const customerInputRef = useRef<HTMLInputElement>(null)
  const customerContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!customerContainerRef.current?.contains(e.target as Node)) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleCustomerSearch(q: string) {
    setCustomerQuery(q)
    setSelectedCustomer(null)
    if (q.length < 2) {
      setCustomerResults([])
      setShowCustomerDropdown(false)
      return
    }
    startSearchTransition(async () => {
      const result = await searchCustomersAction(q)
      if (result.success) {
        setCustomerResults(result.customers)
        setShowCustomerDropdown(true)
      }
    })
  }

  function handleSelectCustomer(c: { id: string; name: string; phone: string | null }) {
    setSelectedCustomer({ id: c.id, name: c.name })
    setCustomerQuery(c.name)
    setShowCustomerDropdown(false)
    setCustomerResults([])
  }

  function clearCustomer() {
    setSelectedCustomer(null)
    setCustomerQuery('')
    setCustomerResults([])
    setShowCustomerDropdown(false)
  }

  const totalStr = total.toFixed(2)

  // Effective payment breakdown:
  // - Pix auto-fills with the cart total while the user hasn't edited any field
  // - Once the user edits any field, we respect their manual values
  const effectiveBreakdown = {
    pix: userEditedPayment ? paymentBreakdown.pix : items.length > 0 ? Number(totalStr) : undefined,
    cardCredit: paymentBreakdown.cardCredit,
    cardDebit: paymentBreakdown.cardDebit,
    cash: paymentBreakdown.cash,
  }

  const paymentSum = new Decimal(effectiveBreakdown.pix ?? 0)
    .plus(effectiveBreakdown.cardCredit ?? 0)
    .plus(effectiveBreakdown.cardDebit ?? 0)
    .plus(effectiveBreakdown.cash ?? 0)

  const isPaymentValid = items.length > 0 && paymentSum.equals(total)
  const difference = total.minus(paymentSum)

  function handlePaymentChange(field: 'pix' | 'cardCredit' | 'cardDebit' | 'cash', raw: string) {
    setUserEditedPayment(true)
    const value = raw === '' ? undefined : Number(raw)
    setPaymentBreakdown({ ...paymentBreakdown, [field]: value })
  }

  function handleClearCart() {
    clearCart()
    setUserEditedPayment(false)
    setSuccessMessage(null)
    setErrorMessage(null)
    clearCustomer()
  }

  function handleNewSale() {
    setReceipt(null)
    clearCart()
    setUserEditedPayment(false)
    setSuccessMessage(null)
    setErrorMessage(null)
    clearCustomer()
  }

  function handleConfirm() {
    if (!isPaymentValid || isPending) return
    setErrorMessage(null)
    setSuccessMessage(null)

    startTransition(async () => {
      const result = await createSaleAction({
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        paymentBreakdown: {
          pix: effectiveBreakdown.pix,
          cardCredit: effectiveBreakdown.cardCredit,
          cardDebit: effectiveBreakdown.cardDebit,
          cash: effectiveBreakdown.cash,
        },
        customerId: selectedCustomer?.id,
      })

      if (result.success) {
        const receiptResult = await getSaleForReceiptAction(result.saleId)
        if (receiptResult.success) {
          setReceipt(receiptResult.receipt)
          clearCart()
          setUserEditedPayment(false)
          clearCustomer()
        } else {
          // fallback: receipt unavailable, show text confirmation
          setSuccessMessage(`Venda registrada! ID: ${result.saleId}`)
          clearCart()
          setUserEditedPayment(false)
          clearCustomer()
        }
      } else {
        setErrorMessage(result.error)
      }
    })
  }

  return (
    <div className="flex gap-0 h-[calc(100vh-7rem)]">
      {/* Left panel — Product list; hidden on print when receipt is showing */}
      <div className={`flex-1 overflow-y-auto pr-4${receipt ? ' print:hidden' : ''}`}>
        <h1 className="text-2xl font-semibold mb-4">PDV</h1>
        {products.length === 0 && (
          <p className="text-muted-foreground">Nenhum produto cadastrado.</p>
        )}
        {products.map((product) => (
          <div key={product.id} className="mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {product.name} · {product.brand}
            </h2>
            <div className="border rounded-md divide-y">
              {product.variants.map((variant) => {
                const qty = variant.inventory?.quantity ?? 0
                const inStock = qty > 0
                return (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between px-3 py-2 gap-3"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs text-muted-foreground font-mono">{variant.sku}</span>
                      <span className="text-sm">
                        {variant.frameColor} / {variant.lensColor}
                        {variant.isPolarized && ' · Polarizado'}
                      </span>
                      <span className="text-sm font-medium">{formatBRL(variant.salePrice)}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={inStock ? 'outline' : 'destructive'}
                        className="text-xs"
                      >
                        {inStock ? `${qty} un` : 'Sem estoque'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!inStock}
                        onClick={() =>
                          addItem(
                            {
                              variantId: variant.id,
                              sku: variant.sku,
                              productName: product.name,
                              frameColor: variant.frameColor,
                              lensColor: variant.lensColor,
                              salePrice: new Decimal(variant.salePrice.toString()),
                            },
                            1,
                          )
                        }
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Vertical divider */}
      <div className={`w-px bg-border mx-4 shrink-0${receipt ? ' print:hidden' : ''}`} />

      {/* Right panel — Cart + Payment, or Receipt after successful sale */}
      <div className="w-80 flex flex-col gap-4 overflow-y-auto">
        {receipt && (
          <SaleReceipt receipt={receipt} onNewSale={handleNewSale} />
        )}
        {!receipt && (<>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Carrinho</h2>
          {items.length > 0 && (
            <Button size="sm" variant="ghost" className="text-muted-foreground h-7" onClick={handleClearCart}>
              Limpar
            </Button>
          )}
        </div>

        {/* Cart items */}
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum item no carrinho.</p>
        ) : (
          <div className="border rounded-md divide-y">
            {items.map((item) => {
              const subtotal = new Decimal(item.salePrice.toString()).mul(item.quantity)
              return (
                <div key={item.variantId} className="px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium truncate">{item.productName}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.frameColor} / {item.lensColor}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive h-6 w-6 p-0 shrink-0"
                      onClick={() => removeItem(item.variantId)}
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      >
                        –
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <span className="text-sm font-medium">{formatBRL(subtotal)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Total */}
        {items.length > 0 && (
          <div className="flex justify-between items-center font-semibold text-base border-t pt-2">
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>
        )}

        <div className="h-px bg-border" />

        {/* Customer search (optional) */}
        <div ref={customerContainerRef} className="flex flex-col gap-1">
          <Label className="text-sm font-semibold">Cliente (opcional)</Label>
          <div className="relative">
            <div className="flex gap-1">
              <Input
                ref={customerInputRef}
                placeholder="Buscar cliente (mín. 2 caracteres)..."
                value={customerQuery}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                onFocus={() => customerResults.length > 0 && setShowCustomerDropdown(true)}
                className="h-8 text-sm"
              />
              {selectedCustomer && (
                <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground shrink-0" onClick={clearCustomer}>
                  ✕
                </Button>
              )}
            </div>
            {selectedCustomer && (
              <Badge variant="outline" className="mt-1 text-xs">
                {selectedCustomer.name}
              </Badge>
            )}
            {showCustomerDropdown && customerResults.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-md">
                {customerResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex flex-col"
                    onClick={() => handleSelectCustomer(c)}
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Payment breakdown */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Pagamento</h3>
          {(
            [
              { field: 'pix', label: 'Pix' },
              { field: 'cardCredit', label: 'Cartão Crédito' },
              { field: 'cardDebit', label: 'Cartão Débito' },
              { field: 'cash', label: 'Dinheiro' },
            ] as const
          ).map(({ field, label }) => (
            <div key={field} className="flex items-center gap-2">
              <Label className="w-32 text-sm shrink-0">{label}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={
                  field === 'pix'
                    ? (effectiveBreakdown.pix ?? '')
                    : (paymentBreakdown[field] ?? '')
                }
                onChange={(e) => handlePaymentChange(field, e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>

        {/* Payment validation feedback */}
        {items.length > 0 && (
          <div className="text-sm">
            {isPaymentValid ? (
              <span className="text-green-600 font-medium">✓ Pagamento OK</span>
            ) : (
              <span className="text-destructive">
                {difference.greaterThan(0)
                  ? `Faltam ${formatBRL(difference)}`
                  : `Excesso de ${formatBRL(difference.abs())}`}
              </span>
            )}
          </div>
        )}

        {/* Success / Error messages */}
        {successMessage && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">
            {errorMessage}
          </div>
        )}

        {/* Confirm button */}
        <Button
          className="w-full"
          disabled={items.length === 0 || !isPaymentValid || isPending}
          onClick={handleConfirm}
        >
          {isPending ? 'Processando…' : 'Confirmar Venda'}
        </Button>
        </>)}
      </div>
    </div>
  )
}
