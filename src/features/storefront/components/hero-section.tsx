import Link from 'next/link'
import Image from 'next/image'
import { StoreSettingsService } from '@/features/store-settings/store-settings.service'

export async function HeroSection() {
  const { heroImageUrl } = await StoreSettingsService.get()

  return (
    <section className="relative overflow-hidden bg-gray-900 px-4 py-20 text-white sm:py-28">
      {heroImageUrl && (
        <Image
          src={heroImageUrl}
          alt=""
          fill
          className="object-cover opacity-40"
          priority
          sizes="100vw"
        />
      )}
      <div className="relative mx-auto max-w-4xl text-center">
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
