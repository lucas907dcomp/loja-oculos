import Link from 'next/link'

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const email = process.env.STOREFRONT_EMAIL ?? 'contato@loja.com.br'
  const year = new Date().getFullYear()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/loja" className="text-lg font-bold text-gray-900">
            Ótica da Loja
          </Link>
          <Link
            href="/loja/carrinho"
            aria-label="Carrinho"
            className="relative flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
              0
            </span>
          </Link>
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
