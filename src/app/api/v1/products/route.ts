import { NextRequest, NextResponse } from 'next/server'
import { ExportService } from '@/features/export'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const format = searchParams.get('format') ?? 'json'
  const filters = {
    supplierId: searchParams.get('supplierId') ?? undefined,
    brand: searchParams.get('brand') ?? undefined,
    includeArchived: searchParams.get('includeArchived') === 'true',
  }

  try {
    if (format === 'csv') {
      const csv = await ExportService.exportCatalogCsv(filters)
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="catalog.csv"',
        },
      })
    }
    const json = await ExportService.exportCatalogJson(filters)
    return new Response(json, {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to export catalog' }, { status: 500 })
  }
}
