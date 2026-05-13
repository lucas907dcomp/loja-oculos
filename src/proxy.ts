import { NextRequest, NextResponse } from 'next/server'

// CON-5: Static API Key guard for e-commerce bridge endpoints
export function proxy(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  const expectedKey = process.env.ECOMMERCE_API_KEY
  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Missing or invalid API key' }, { status: 401 })
  }
  return NextResponse.next()
}

export const config = { matcher: '/api/v1/:path*' }
