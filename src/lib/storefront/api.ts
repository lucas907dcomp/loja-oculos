import type { ExportProduct } from '@/features/export/export.contract'

export interface InventoryEntry {
  variantId: string
  sku: string
  productName: string
  quantity: number
  minStockAlert: number
  isLowStock: boolean
}

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

async function apiFetch<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1${path}`, {
      headers: { 'X-Api-Key': process.env.ECOMMERCE_API_KEY ?? '' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return [] as unknown as T
    return res.json()
  } catch {
    return [] as unknown as T
  }
}

export const getProducts = (brand?: string): Promise<ExportProduct[]> =>
  apiFetch(`/products${brand ? `?brand=${encodeURIComponent(brand)}` : ''}`)

export const getInventory = (): Promise<InventoryEntry[]> => apiFetch('/inventory')
