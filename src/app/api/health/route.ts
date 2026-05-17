import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized — faça login primeiro' }, { status: 401 })
  }

  const envCheck = {
    DATABASE_URL: process.env.DATABASE_URL ? `set (${process.env.DATABASE_URL.substring(0, 40)}...)` : 'MISSING',
    DIRECT_URL: process.env.DIRECT_URL ? `set (${process.env.DIRECT_URL.substring(0, 40)}...)` : 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'MISSING',
  }

  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1 as ok`
    return NextResponse.json({ status: 'ok', database: 'connected', env: envCheck })
  } catch (err) {
    return NextResponse.json(
      { status: 'error', database: 'failed', error: String(err), env: envCheck },
      { status: 500 },
    )
  }
}
