import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="bg-gray-900 px-4 py-20 text-white sm:py-28">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Óculos de Sol com Estilo
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-300">
          Encontre o modelo perfeito para você. Qualidade e elegância em cada detalhe.
        </p>
        <Link
          href="/loja/produtos"
          className="mt-8 inline-block rounded-md bg-white px-8 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100"
        >
          Ver Coleção Completa
        </Link>
      </div>
    </section>
  )
}
