'use client'

import Link from 'next/link'

interface BrandFilterProps {
  brands: string[]
  activeBrand?: string
}

export function BrandFilter({ brands, activeBrand }: BrandFilterProps) {
  if (brands.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/loja/produtos"
        className={`rounded-full border px-4 py-1.5 text-sm transition ${
          !activeBrand
            ? 'border-black bg-black text-white'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500'
        }`}
      >
        Todos
      </Link>
      {brands.map((brand) => (
        <Link
          key={brand}
          href={`/loja/produtos?brand=${encodeURIComponent(brand)}`}
          className={`rounded-full border px-4 py-1.5 text-sm transition ${
            activeBrand === brand
              ? 'border-black bg-black text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500'
          }`}
        >
          {brand}
        </Link>
      ))}
    </div>
  )
}
