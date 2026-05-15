import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        tags: true,
        createdAt: true,
      },
    })
    return NextResponse.json(customers)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const data = body as Record<string, unknown>

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        name: data.name.trim(),
        phone: typeof data.phone === 'string' ? data.phone : null,
        email: typeof data.email === 'string' ? data.email : null,
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      },
    })
    return NextResponse.json(customer, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
