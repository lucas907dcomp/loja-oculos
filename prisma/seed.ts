import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import Decimal from 'decimal.js'

const prisma = new PrismaClient()

async function main() {
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

  const product = await prisma.product.upsert({
    where: { id: 'seed-product-1' },
    update: {},
    create: {
      id: 'seed-product-1',
      name: 'Óculos Modelo Demo',
      brand: 'Demo Brand',
      description: 'Produto de demonstração para smoke testing',
      supplierId: supplier.id,
    },
  })

  const variant1 = await prisma.productVariant.upsert({
    where: { sku: 'DEMO-001-PT-CZ' },
    update: {},
    create: {
      sku: 'DEMO-001-PT-CZ',
      frameColor: 'Preto',
      lensColor: 'Cinza',
      uvProtection: 'UV400',
      isPolarized: false,
      costPrice: new Decimal('60.00'),
      salePrice: new Decimal('120.00'),
      images: [],
      productId: product.id,
    },
  })

  const variant2 = await prisma.productVariant.upsert({
    where: { sku: 'DEMO-001-DO-MA' },
    update: {},
    create: {
      sku: 'DEMO-001-DO-MA',
      frameColor: 'Dourado',
      lensColor: 'Marrom',
      uvProtection: 'UV400',
      isPolarized: true,
      costPrice: new Decimal('75.00'),
      salePrice: new Decimal('150.00'),
      images: [],
      productId: product.id,
    },
  })

  await prisma.inventory.upsert({
    where: { variantId: variant1.id },
    update: {},
    create: { variantId: variant1.id, quantity: 10, minStockAlert: 3 },
  })

  await prisma.inventory.upsert({
    where: { variantId: variant2.id },
    update: {},
    create: { variantId: variant2.id, quantity: 10, minStockAlert: 3 },
  })

  await prisma.cashFlowEntry.upsert({
    where: { id: 'seed-cashflow-1' },
    update: {},
    create: {
      id: 'seed-cashflow-1',
      type: 'INCOME',
      amount: new Decimal('120.00'),
      note: 'Entrada de demonstração — smoke test',
      date: new Date(),
    },
  })

  console.log('Seed complete: Supplier, Product, 2 Variants, 2 Inventory records, 1 CashFlowEntry')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
