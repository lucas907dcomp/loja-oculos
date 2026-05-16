'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCartStore, type CartItem } from '@/store/cart'
import { createCustomer } from './actions'

const FormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  phone: z.string().min(8, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof FormSchema>

function formatPrice(price: string): string {
  return parseFloat(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function buildWhatsAppLink(items: CartItem[], name: string, phone: string): string {
  const storePhone = process.env.NEXT_PUBLIC_STOREFRONT_WHATSAPP_PHONE ?? '5511999999999'
  const lines = items.map(
    (i) => `• ${i.productName} (${i.variantLabel}) x${i.quantity} — ${formatPrice(i.price)}`,
  )
  const total = items
    .reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0)
    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const message = [
    'Olá! Gostaria de fazer o seguinte pedido:',
    '',
    ...lines,
    '',
    `Total: ${total}`,
    '',
    `Nome: ${name}`,
    `Telefone: ${phone}`,
  ].join('\n')
  return `https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`
}

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)
  const totalPrice = useCartStore((s) => s.totalPrice)

  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema) })

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Pedido enviado!</h1>
        <p className="text-gray-600">
          Seu pedido foi enviado via WhatsApp. Em breve entraremos em contato.
        </p>
        <Link
          href="/loja/produtos"
          className="rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
        >
          Continuar comprando
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="text-gray-500">Seu carrinho está vazio.</p>
        <Link
          href="/loja/produtos"
          className="text-sm font-medium text-black underline hover:text-gray-700"
        >
          Voltar para a loja
        </Link>
      </div>
    )
  }

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await createCustomer({
      name: values.name,
      phone: values.phone,
      email: values.email || undefined,
    })

    if ('error' in result) {
      setServerError(result.error)
      return
    }

    const url = buildWhatsAppLink(items, values.name, values.phone)
    window.open(url, '_blank')
    clearCart()
    setSubmitted(true)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Finalizar Pedido</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Resumo do carrinho */}
        <section aria-label="Resumo do pedido">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Resumo do pedido</h2>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {items.map((item) => (
              <li key={item.variantId} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                  <p className="text-xs text-gray-500">
                    {item.variantLabel} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm text-gray-700">{formatPrice(item.price)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-sm font-semibold text-gray-900">{totalPrice()}</span>
          </div>
        </section>

        {/* Formulário de contato */}
        <section aria-label="Dados de contato">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Seus dados</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                Nome *
              </label>
              <input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                {...register('name')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                Telefone / WhatsApp *
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                {...register('phone')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                E-mail <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {serverError && (
              <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                'Aguarde...'
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Finalizar Pedido via WhatsApp
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
