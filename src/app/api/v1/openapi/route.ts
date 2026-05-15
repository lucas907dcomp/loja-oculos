import { readFile } from 'node:fs/promises'
import path from 'node:path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'openapi.json')
    const content = await readFile(filePath, 'utf-8')
    return new Response(content, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'OpenAPI spec not found' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
