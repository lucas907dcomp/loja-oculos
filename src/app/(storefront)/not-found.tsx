import Link from 'next/link'

export default function StorefrontNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Produto não encontrado</h1>
      <p className="text-gray-500">O produto que você procura não existe ou foi removido do catálogo.</p>
      <Link
        href="/loja/produtos"
        className="mt-2 inline-flex items-center gap-1 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        ← Voltar para o catálogo
      </Link>
    </div>
  )
}
