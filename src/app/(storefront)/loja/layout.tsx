import Link from 'next/link'
import { CartHeader } from '@/features/storefront/components/cart-header'
import { SearchBar } from '@/features/storefront/components/search-bar'

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const email = process.env.STOREFRONT_EMAIL ?? 'contato@loja.com.br'
  const year = new Date().getFullYear()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <Link href="/loja" className="shrink-0 text-lg font-bold text-gray-900">
            Ótica da Loja
          </Link>
          <div className="hidden flex-1 sm:flex">
            <SearchBar />
          </div>
          <CartHeader />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-4 py-6 text-center text-sm text-gray-500 sm:flex-row sm:justify-between">
          <span>© {year} Ótica da Loja. Todos os direitos reservados.</span>
          <span>
            Contato:{' '}
            <a href={`mailto:${email}`} className="hover:text-gray-700">
              {email}
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}
