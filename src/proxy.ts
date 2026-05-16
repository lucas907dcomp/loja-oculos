import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  // OpenAPI spec is publicly accessible — no auth required (Story 4.3)
  if (request.nextUrl.pathname === '/api/v1/openapi') {
    return NextResponse.next()
  }

  // CON-5: Static API Key guard for all other /api/v1/* endpoints
  const apiKey = request.headers.get('x-api-key')
  const expectedKey = process.env.ECOMMERCE_API_KEY
  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Missing or invalid API key' }, { status: 401 })
  }
  return NextResponse.next()
}

export const config = { matcher: ['/api/v1/:path*'] }
