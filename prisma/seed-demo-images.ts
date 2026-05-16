/**
 * Seed demo products with curated Unsplash sunglasses images.
 * Run with: npx tsx prisma/seed-demo-images.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import Decimal from 'decimal.js'

const prisma = new PrismaClient()

// Curated Unsplash sunglasses photo IDs — each set contains 2 angles per product
const PHOTO_SETS = [
  // Set A — classic aviator / dark
  [
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80',
  ],
  // Set B — round / retro
  [
    'https://images.unsplash.com/photo-1483178672396-05b48da023d3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1473496169904-658ba7574b0d?auto=format&fit=crop&w=800&q=80',
  ],
  // Set C — sporty / modern
  [
    'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
  ],
  // Set D — luxury / gold frame
  [
    'https://images.unsplash.com/photo-1565693559368-7b5af4d0498d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1524592094714-0f0654e359b1?auto=format&fit=crop&w=800&q=80',
  ],
  // Set E — outdoor / lifestyle
  [
    'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555519563-fdb0a79fdf58?auto=format&fit=crop&w=800&q=80',
  ],
]

const DEMO_PRODUCTS = [
  {
    id: 'demo-rb-001',
    name: 'Ray-Ban Aviador Clássico',
    brand: 'Ray-Ban',
    description: 'O ícone atemporal. Lentes de cristal e armação dourada de metal, perfeito para o estilo clássico.',
    variants: [
      { sku: 'RB-AVI-DO-VD-UV400', frameColor: 'Dourado', lensColor: 'Verde Escuro', uv: 'UV400', pol: true, cost: 200, sale: 450, photos: PHOTO_SETS[3] },
      { sku: 'RB-AVI-PR-CZ-UV400', frameColor: 'Preto', lensColor: 'Cinza', uv: 'UV400', pol: false, cost: 180, sale: 400, photos: PHOTO_SETS[0] },
    ],
  },
  {
    id: 'demo-rb-002',
    name: 'Ray-Ban Wayfarer Original',
    brand: 'Ray-Ban',
    description: 'Design retrô icônico com armação em acetato resistente. Clássico que nunca sai de moda.',
    variants: [
      { sku: 'RB-WAY-PT-CZ-UV400', frameColor: 'Preto', lensColor: 'Cinza', uv: 'UV400', pol: false, cost: 160, sale: 380, photos: PHOTO_SETS[1] },
      { sku: 'RB-WAY-TR-VD-UV400', frameColor: 'Tartaruga', lensColor: 'Verde', uv: 'UV400', pol: true, cost: 170, sale: 399, photos: PHOTO_SETS[2] },
    ],
  },
  {
    id: 'demo-ok-001',
    name: 'Oakley Holbrook Esportivo',
    brand: 'Oakley',
    description: 'Alto desempenho com lente Prizm. Armação leve e resistente, ideal para esportes ao ar livre.',
    variants: [
      { sku: 'OK-HOL-PT-AZ-UV400P', frameColor: 'Preto Fosco', lensColor: 'Azul Prizm', uv: 'UV400', pol: true, cost: 220, sale: 520, photos: PHOTO_SETS[2] },
      { sku: 'OK-HOL-CZ-VD-UV400', frameColor: 'Cinza', lensColor: 'Verde Jade', uv: 'UV400', pol: false, cost: 200, sale: 480, photos: PHOTO_SETS[0] },
    ],
  },
  {
    id: 'demo-vg-001',
    name: 'Vogue Butterfly Glamour',
    brand: 'Vogue',
    description: 'Design feminino com formato butterfly elegante. Acetato premium com proteção total.',
    variants: [
      { sku: 'VG-BTF-RX-MR-UV400', frameColor: 'Rosa', lensColor: 'Marrom', uv: 'UV400', pol: false, cost: 120, sale: 280, photos: PHOTO_SETS[4] },
      { sku: 'VG-BTF-PT-CZ-UV400', frameColor: 'Preto', lensColor: 'Cinza Degradê', uv: 'UV400', pol: false, cost: 130, sale: 299, photos: PHOTO_SETS[1] },
    ],
  },
  {
    id: 'demo-pr-001',
    name: 'Persol Maestro Italiano',
    brand: 'Persol',
    description: 'Elegância italiana com dobradiças Meflecto exclusivas. Cristal óptico de alta qualidade.',
    variants: [
      { sku: 'PR-MAE-HV-MR-UV400P', frameColor: 'Havana', lensColor: 'Marrom', uv: 'UV400', pol: true, cost: 350, sale: 799, photos: PHOTO_SETS[3] },
      { sku: 'PR-MAE-PT-CZ-UV400P', frameColor: 'Preto', lensColor: 'Cinza', uv: 'UV400', pol: true, cost: 340, sale: 749, photos: PHOTO_SETS[0] },
    ],
  },
  {
    id: 'demo-gc-001',
    name: 'Guess Cat Eye Fashion',
    brand: 'Guess',
    description: 'Tendência cat eye com toque glamouroso. Armação acetato com detalhes metálicos dourados.',
    variants: [
      { sku: 'GC-CAT-PT-FU-UV400', frameColor: 'Preto', lensColor: 'Fumê', uv: 'UV400', pol: false, cost: 90, sale: 220, photos: PHOTO_SETS[4] },
      { sku: 'GC-CAT-DO-MR-UV400', frameColor: 'Dourado', lensColor: 'Marrom', uv: 'UV400', pol: false, cost: 95, sale: 240, photos: PHOTO_SETS[3] },
    ],
  },
]

async function main() {
  // Ensure seed supplier exists
  const supplier = await prisma.supplier.upsert({
    where: { id: 'seed-supplier-1' },
    update: {},
    create: {
      id: 'seed-supplier-1',
      name: 'Óticas Brasil',
      cnpj: '12.345.678/0001-99',
      contactName: 'João Silva',
      leadTimeDays: 7,
    },
  })

  for (const p of DEMO_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: { name: p.name, brand: p.brand, description: p.description },
      create: { id: p.id, name: p.name, brand: p.brand, description: p.description, supplierId: supplier.id },
    })

    for (const v of p.variants) {
      const variant = await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: { images: v.photos },
        create: {
          sku: v.sku,
          frameColor: v.frameColor,
          lensColor: v.lensColor,
          uvProtection: v.uv,
          isPolarized: v.pol,
          costPrice: new Decimal(v.cost),
          salePrice: new Decimal(v.sale),
          images: v.photos,
          productId: p.id,
        },
      })

      await prisma.inventory.upsert({
        where: { variantId: variant.id },
        update: {},
        create: { variantId: variant.id, quantity: 15, minStockAlert: 3 },
      })
    }

    console.log(`✓ ${p.name} (${p.variants.length} variantes)`)
  }

  // Update existing variants with placeholder images
  const existingVariants = await prisma.productVariant.findMany({ where: { images: { isEmpty: true } } })
  let photoIdx = 0
  for (const v of existingVariants) {
    await prisma.productVariant.update({ where: { id: v.id }, data: { images: PHOTO_SETS[photoIdx % PHOTO_SETS.length] } })
    photoIdx++
  }
  if (existingVariants.length > 0) console.log(`✓ Updated ${existingVariants.length} existing variant(s) with images`)

  const total = await prisma.product.count()
  console.log(`\nDone — ${total} produtos no banco`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
