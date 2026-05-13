# Spec: Sistema de Gestão Loja de Óculos — MVP

> **Story ID:** MVP-0
> **Complexity:** COMPLEX (16/25)
> **Generated:** 2026-05-13
> **Status:** Draft
> **Constitutional Gate:** Article IV (No Invention) — VALIDATED
> **Inputs:** `requirements.json`, `complexity.json`, `architecture-decision.json`

---

## 1. Overview

Sistema de gestão (Backoffice/PDV) para loja física exclusiva de óculos de sol, com fundação arquitetural preparada para integração futura com e-commerce próprio. *(CON-2, projectName)*

O sistema resolve o problema central do lojista: **comprar bem, controlar giro de estoque e maximizar margem de lucro bruta**. *(FR-4 rationale, FR-2 rationale)*

### 1.1 Goals

- Cadastro de produtos com variantes compostas de óculos de sol *(FR-1)*
- Controle granular de estoque por variante com audit trail completo *(FR-2)*
- PDV simplificado com múltiplos meios de pagamento e pagamento dividido *(FR-3)*
- Inteligência financeira: margem bruta automática e fluxo de caixa diário *(FR-4, FR-5)*
- CRM Lite para gestão de clientes recorrentes *(FR-6)*
- Gestão de fornecedores com histórico de pedidos *(FR-7)*
- Analytics de giro de estoque e previsão de ruptura *(FR-8)*
- Gestão de devoluções e trocas *(FR-9)*
- Etiquetas com QR Code por variante *(FR-10)*
- Dashboard executivo com KPIs operacionais *(FR-11)*
- API bridge para futuro e-commerce *(FR-12, CON-2)*

### 1.2 Non-Goals (Fora do MVP)

- Emissão de NF-e / integração com SEFAZ *(ASM-4 validado em 2026-05-13)*
- Integração via TEF/API com maquininha de cartão *(ASM-3 validado)*
- Funcionamento offline / PWA com sync *(ASM-2 validado)*
- Múltiplas lojas / multi-tenant *(CON-3)*
- App mobile nativo iOS/Android *(ASM-5 validado)*
- Controle granular de permissões por perfil / RBAC *(ASM-1 validado — 1 perfil único)*
- Integração com marketplace (Shopee, Mercado Livre) *(não levantado em requirements.json)*

---

## 2. Requirements Summary

### 2.1 Functional Requirements

| ID | Descrição | Prioridade | Fonte |
|----|-----------|-----------|-------|
| FR-1 | Cadastro de produtos (óculos de sol) com variantes compostas: cor da armação, cor da lente, nível de proteção UV e flag polarizado | P0 | requirements.json |
| FR-2 | Controle de estoque granular por variante com alertas de baixa configuráveis e histórico de movimentações | P0 | requirements.json |
| FR-3 | PDV simplificado: Pix, Cartão Crédito/Débito, Dinheiro; suporte a pagamento dividido entre meios | P0 | requirements.json |
| FR-4 | Input de custo de aquisição vs preço de venda por variante com cálculo automático de margem bruta | P0 | requirements.json |
| FR-5 | Fluxo de caixa diário: entradas (vendas automáticas) + saídas (despesas manuais) + saldo consolidado | P0 | requirements.json |
| FR-6 | CRM Lite: cadastro de clientes com histórico de compras e tags de preferência | P1 | requirements.json |
| FR-7 | Gestão de fornecedores: cadastro com prazo de entrega e histórico de pedidos de compra | P1 | requirements.json |
| FR-8 | Analytics de giro: velocidade de vendas por variante (unidades/semana) + estimativa de dias até ruptura | P1 | requirements.json |
| FR-9 | Gestão de devoluções e trocas com ajuste automático de estoque e reversão financeira | P1 | requirements.json |
| FR-10 | Geração e impressão de etiquetas de preço com QR Code por variante (URL configurável) | P1 | requirements.json |
| FR-11 | Dashboard executivo: top produtos por margem, top por giro, dead stock (>60 dias), ticket médio, receita total | P1 | requirements.json |
| FR-12 | Exportação de catálogo de produtos para JSON/CSV compatível com e-commerce (WooCommerce/Shopify schema) | P2 | requirements.json |

### 2.2 Non-Functional Requirements

| ID | Categoria | Requisito | Métrica |
|----|----------|-----------|---------|
| NFR-1 | Performance | PDV completa uma venda em ≤ 3 cliques com resposta em < 2 segundos | Tempo de registro de venda simples < 2s em rede local |
| NFR-2 | Usability | Interface operável por lojista sem treinamento técnico, desktop-first com suporte a tablet touchscreen | Primeiro uso completo em < 5 minutos |
| NFR-3 | Reliability | Zero perda de dados financeiros e de estoque; operações críticas são atômicas | Transações ACID; backup automático diário |
| NFR-4 | Scalability | Arquitetura permite integração futura com e-commerce sem reescrita do core | APIs RESTful expostas para todos os recursos principais |

### 2.3 Constraints

| ID | Tipo | Constraint | Impacto na Decisão |
|----|------|-----------|-------------------|
| CON-1 | Técnica | Stack deve ser a mais produtiva possível para desenvolvimento rápido | Justifica Next.js 16 + Prisma + shadcn/ui (preset nextjs-react) |
| CON-2 | Técnica | Arquitetura deve facilitar integração futura com e-commerce sem reescrita | Justifica API-first: `app/api/v1/` desde o MVP |
| CON-3 | Negócio | MVP focado em loja física única | Sem lógica multi-tenant no banco de dados no MVP |
| CON-4 | Negócio | Produto exclusivo: óculos de sol | Variantes (frameColor, lensColor, uvProtection, isPolarized) são first-class no schema |

---

## 3. Abordagem Técnica

### 3.1 Stack Tecnológica

*(fonte: architecture-decision.json — status APPROVED por @architect)*

| Camada | Tecnologia | Versão | Justificativa (rastreável) |
|--------|-----------|--------|-----------------------------|
| Framework | Next.js (App Router) | 16+ | Full-stack em um projeto; API routes = e-commerce bridge *(CON-1, CON-2)* |
| Linguagem | TypeScript strict | 5+ | Type safety obrigatório para dados financeiros; zero `any` *(NFR-3)* |
| Banco de Dados | PostgreSQL via Neon | 16 | ACID para atomicidade sale+inventory+cashflow *(NFR-3)* |
| ORM | Prisma | 5+ | Schema-first; `$transaction` para operações atômicas *(NFR-3)* |
| UI Components | shadcn/ui + Tailwind | latest | Componentes de backoffice prontos; responsivo PC+tablet *(NFR-2, ASM-5)* |
| Estado Global | Zustand | 4.5+ | Carrinho do PDV com updates performáticos *(FR-3, NFR-1)* |
| Estado Servidor | React Query (TanStack) | 5+ | Cache com invalidação precisa após venda *(NFR-1)* |
| Forms | React Hook Form + Zod | 7.50+/3.22+ | Validação client+server com mesmo schema *(FR-1, FR-3)* |
| Financeiro | Decimal.js | 10+ | Zero floating-point em cálculos de margem e totais *(FR-4)* |
| Auth | NextAuth.js v5 | 5+ | Credentials provider; sessão JWT httpOnly; 1 perfil *(ASM-1)* |
| Deploy | Vercel + Neon | — | Zero-config para Next.js; PostgreSQL serverless com branching *(CON-1)* |

> **Rationale financeiro crítico:** `0.1 + 0.2 = 0.30000000000000004` em JavaScript Float. Todo campo monetário usa `Prisma Decimal (@db.Decimal(10,2))` no schema e `Decimal.js` nos cálculos. *(FR-4)*

### 3.2 Padrão Arquitetural: Monólito Modular

*(fonte: architecture-decision.json — "architecturalPattern": "Modular Monolith")*

Features isoladas por domínio com interfaces públicas explícitas (Contract Pattern, preset `nextjs-react`). Comunicação entre features via contratos — nunca imports diretos de implementação.

```
Browser / Tablet
      │ HTTPS
      ▼
Vercel CDN
      │
      ▼
Next.js 16 (App Router)
  ├── app/(auth)/login            ← Autenticação
  ├── app/(backoffice)/           ← UI protegida (React Server + Client Components)
  │     ├── dashboard/            ← KPIs + giro + fluxo de caixa (FR-11, FR-5)
  │     ├── produtos/             ← Catálogo + variantes (FR-1)
  │     ├── estoque/              ← Inventário + alertas (FR-2)
  │     ├── pdv/                  ← Ponto de Venda — Client Component (FR-3)
  │     ├── vendas/               ← Histórico de vendas (FR-3)
  │     ├── clientes/             ← CRM Lite (FR-6)
  │     ├── fornecedores/         ← Suppliers (FR-7)
  │     └── financeiro/           ← Fluxo de caixa (FR-5)
  └── app/api/v1/                 ← E-COMMERCE BRIDGE (CON-2)
        ├── products/             ← GET catalog
        ├── inventory/            ← GET stock
        └── customers/            ← GET/POST customers
      │
      ▼
Feature Services Layer (src/features/)
  ├── products.service.ts         ← FR-1
  ├── inventory.service.ts        ← FR-2, FR-8
  ├── sales.service.ts            ← FR-3, FR-9 ★ operação atômica
  ├── cashflow.service.ts         ← FR-5
  ├── customers.service.ts        ← FR-6
  ├── suppliers.service.ts        ← FR-7
  ├── analytics.service.ts        ← FR-8, FR-11
  └── export.service.ts           ← FR-12
      │ prisma.$transaction()
      ▼
PostgreSQL (Neon) — ACID
```

### 3.3 Operação Crítica: Registrar Venda (Fluxo Atômico)

*(fonte: FR-3 AC-3.4 + FR-2 AC-2.1 + FR-5 AC-5.1 + NFR-3)*

Esta é a operação de maior risco do sistema. Todos os efeitos devem ser atômicos — ou todos ocorrem, ou nenhum.

```typescript
// src/features/sales/services/sales.service.ts
async function createSale(dto: CreateSaleDTO): Promise<Sale> {
  return prisma.$transaction(async (tx) => {
    // 1. Cria a venda                                      → FR-3 AC-3.1
    const sale = await tx.sale.create({ data: saleData })

    for (const item of dto.items) {
      // 2. Valida e decrementa estoque por variante         → FR-2 AC-2.1, EC-1
      const inv = await tx.inventory.findUniqueOrThrow({ where: { variantId: item.variantId } })
      if (inv.quantity < item.quantity) throw new Error('Estoque insuficiente')
      await tx.inventory.update({
        where: { variantId: item.variantId },
        data: { quantity: { decrement: item.quantity } }
      })
      // 3. Registra audit trail de movimentação            → FR-2 AC-2.3
      await tx.inventoryTransaction.create({ data: { type: 'SALE', quantityDelta: -item.quantity, ... } })
    }

    // 4. Cria entrada no fluxo de caixa                    → FR-5 AC-5.1
    await tx.cashFlowEntry.create({ data: { type: 'INCOME', amount: dto.totalAmount, ... } })

    return sale
    // Se qualquer etapa lançar erro → ROLLBACK automático do PostgreSQL
  })
}
```

### 3.4 Domain Model

*(fonte: requirements.json domainModel DM-1 a DM-9)*

```
Product (DM-1)
  │ id, name, brand, description, isArchived, supplierId
  │
  ├──< ProductVariant (DM-2)
  │     │ id, sku, frameColor, lensColor, uvProtection, isPolarized
  │     │ costPrice: Decimal(10,2), salePrice: Decimal(10,2)
  │     │ images: String[]
  │     │
  │     ├──── Inventory (DM-3) [1:1]
  │     │       │ quantity: Int, minStockAlert: Int
  │     │       │
  │     │       └──< InventoryTransaction (DM-4) [append-only]
  │     │               type: SALE|PURCHASE|RETURN|EXCHANGE|ADJUSTMENT
  │     │               quantityDelta: Int (signed)
  │     │
  │     └──< SaleItem (DM-6)
  │             unitPrice: Decimal(10,2)  ← snapshot da venda
  │             unitCost:  Decimal(10,2)  ← snapshot da venda
  │
Sale (DM-5)
  │ totalAmount: Decimal(10,2)
  │ paymentBreakdown: Json  { pix, cardCredit, cardDebit, cash }
  │ status: COMPLETED|CANCELLED|RETURNED
  │ refNfe: String?  ← reservado, NF-e futura
  │
  ├──< SaleItem (DM-6)
  ├───── Customer? (DM-7) [opcional]
  └──── CashFlowEntry (DM-9) [1:1]

Customer (DM-7): name, phone, email, tags: String[]
Supplier (DM-8): name, cnpj, contactName, leadTimeDays
CashFlowEntry (DM-9): type: INCOME|EXPENSE, amount, date
```

**Decisões de schema — todas rastreáveis:**

| Decisão | Fonte |
|---------|-------|
| `costPrice`/`salePrice` como `Decimal(10,2)` | FR-4 — precisão em cálculo de margem |
| `unitPrice`/`unitCost` copiados em `SaleItem` | FR-4 AC-4.4 — histórico financeiro imutável |
| `InventoryTransaction` append-only | FR-2 AC-2.3 — auditoria completa de movimentações |
| `paymentBreakdown` como JSON | FR-3 AC-3.2 — extensibilidade sem migration |
| `isArchived` em Product (soft delete) | EC-4 — produto com vendas não pode ser excluído |
| `refNfe` nullable em Sale | ASM-4 — extensibilidade para NF-e sem breaking change |
| `minStockAlert` em Inventory | FR-2 AC-2.2 — configurável por variante |
| `Customer` opcional em Sale | FR-3 — venda sem identificação de cliente é válida |

### 3.5 API Security — E-commerce Bridge

*(fonte: CON-2, CON-5, NFR-4 — decisão de produto: Opção B [Static API Key] — resolvido em 2026-05-13)*

Todos os endpoints em `app/api/v1/` são protegidos por **API Key estática**. O cliente e-commerce envia a chave no header HTTP `X-API-Key` em cada requisição. O middleware Next.js valida a chave antes de rotear para os handlers. Rotas do backoffice (protegidas por NextAuth.js JWT) não são afetadas.

| Aspecto | Detalhe |
|---------|---------|
| Header obrigatório | `X-API-Key: {ECOMMERCE_API_KEY}` |
| Armazenamento | Variável de ambiente `ECOMMERCE_API_KEY` no Vercel (server-side only, nunca exposta ao client) |
| Validação | `src/middleware.ts` — matcher `/api/v1/:path*` |
| Resposta sem key / key inválida | `HTTP 401 Unauthorized` — `{"error": "Missing or invalid API key"}` |
| Resposta com key válida | HTTP 200 + payload da rota |
| Rotação de chave | Atualizar `ECOMMERCE_API_KEY` no Vercel + redeploy (zero downtime) |
| Escopo | Exclusivo para `/api/v1/` — não interfere com rotas do backoffice |

```typescript
// src/middleware.ts                                            ← CON-5
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  const expectedKey = process.env.ECOMMERCE_API_KEY

  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json(
      { error: 'Missing or invalid API key' },
      { status: 401 }
    )
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/api/v1/:path*',  // somente e-commerce bridge
}
```

> `ECOMMERCE_API_KEY` deve ser adicionado ao `.env.local.example` e nunca commitado ao repositório *(CON-5, CRIT-4 pattern)*.

---

## 4. Dependências

### 4.1 Dependências de Produção

*(fonte: architecture-decision.json stack — todas validadas por @architect)*

| Dependência | Versão | Propósito | FR/NFR |
|------------|--------|-----------|--------|
| `next` | ^16.0.0 | Framework fullstack — UI + API routes | CON-1, CON-2 |
| `react`, `react-dom` | ^18.0.0 | UI framework | CON-1 |
| `typescript` | ^5.0.0 | Type safety financeiro | NFR-3 |
| `prisma`, `@prisma/client` | ^5.9.0 | ORM + `$transaction` atômica | NFR-3 |
| `tailwindcss` | ^3.4.0 | Estilização utility-first | NFR-2 |
| `shadcn/ui` (componentes) | copiados via CLI (versionados internamente) | Tabelas, formulários, dialogs, badges — componentes copiados para `src/components/ui/`, sem dependência de versão externa | NFR-2 |
| `zustand` | ^4.5.0 | Estado do carrinho PDV | FR-3, NFR-1 |
| `@tanstack/react-query` | ^5.0.0 | Cache + invalidação pós-venda | NFR-1 |
| `react-hook-form` | ^7.50.0 | Formulários do PDV e cadastros | FR-1, FR-3 |
| `zod` | ^3.22.0 | Validação schemas client+server | FR-1, FR-3 |
| `decimal.js` | ^10.0.0 | Aritmética monetária precisa | FR-4, FR-5 |
| `next-auth` | ^5.0.0 | Autenticação Credentials + JWT | ASM-1 |

### 4.2 Dependências de Desenvolvimento

| Dependência | Versão | Propósito |
|------------|--------|-----------|
| `vitest` | ^1.2.0 | Testes unitários (business logic) |
| `@testing-library/react` | ^14.0.0 | Testes de componentes |
| `@playwright/test` | ^1.41.0 | Testes E2E — fluxo de venda |
| `msw` | ^2.1.0 | Mock de API em testes |
| `prisma` (CLI) | ^5.9.0 | Migrations e seed |

### 4.3 Serviços de Infraestrutura

| Serviço | Propósito | Justificativa |
|---------|-----------|--------------|
| Vercel | Hosting Next.js app | Zero-config, CDN, preview por branch *(CON-1)* |
| Neon | PostgreSQL serverless | Branching por PR, free tier MVP, ACID *(NFR-3, CON-1)* |

---

## 5. Arquivos a Criar

*(greenfield — todos os arquivos são novos. Organização por epic. Fonte: architecture-decision.json — project structure)*

### 5.1 Infraestrutura Base

| Arquivo | Propósito | Relacionado a |
|---------|-----------|--------------|
| `prisma/schema.prisma` | Schema completo — entidades DM-1 a DM-9 | FR-1 a FR-12 |
| `prisma/migrations/` | Histórico de migrations automatizado | NFR-3 |
| `prisma/seed.ts` | Dados iniciais para desenvolvimento | — |
| `src/lib/prisma.ts` | Singleton do Prisma client | Todos FRs |
| `src/lib/decimal.ts` | Helpers `calculateMargin()`, `formatCurrency()` | FR-4, FR-5 |
| `src/lib/auth.ts` | Configuração NextAuth.js v5 | ASM-1 |
| `next.config.ts` | Config Next.js com Proxy e rewrites | CON-2 |
| `.env.local.example` | Template de variáveis de ambiente (DATABASE_URL, AUTH_SECRET, ECOMMERCE_API_KEY) — commitar este; derivar `.env.local` localmente; nunca commitar `.env.local` | CON-5 |

### 5.2 Epic 1 — Foundation (Auth + Produtos + Estoque)

| Arquivo | Propósito | FR |
|---------|-----------|---|
| `app/(auth)/login/page.tsx` | Tela de login | ASM-1 |
| `src/features/auth/` | Auth contract + service + hooks | ASM-1 |
| `src/features/products/products.contract.ts` | Interface pública da feature | FR-1 |
| `src/features/products/services/products.service.ts` | CRUD + geração de SKU + margem | FR-1, FR-4 |
| `src/features/products/repositories/products.repository.ts` | Queries Prisma de produto/variante | FR-1 |
| `src/features/inventory/inventory.contract.ts` | Interface pública | FR-2 |
| `src/features/inventory/services/inventory.service.ts` | Stock ops + validação saldo >= 0 + alert | FR-2, FR-8 |
| `app/(backoffice)/layout.tsx` | Auth guard + sidebar de navegação | ASM-1 |
| `app/(backoffice)/produtos/page.tsx` | Listagem de produtos com filtros | FR-1 |
| `app/(backoffice)/produtos/[id]/page.tsx` | Detalhe com grade de variantes | FR-1, FR-4 |
| `app/(backoffice)/produtos/novo/page.tsx` | Formulário de criação de produto | FR-1 |
| `app/(backoffice)/estoque/page.tsx` | Inventário por variante + alertas | FR-2 |

### 5.3 Epic 2 — PDV + Vendas + Financeiro

| Arquivo | Propósito | FR |
|---------|-----------|---|
| `src/features/sales/sales.contract.ts` | Interface pública de vendas | FR-3 |
| `src/features/sales/services/sales.service.ts` | `createSale()` — operação atômica | FR-3, FR-2, FR-5, FR-9 |
| `src/features/sales/stores/cart.store.ts` | Zustand store do carrinho PDV | FR-3 |
| `src/features/cashflow/services/cashflow.service.ts` | Fluxo de caixa + resumo diário | FR-5 |
| `app/(backoffice)/pdv/page.tsx` | PDV — Client Component interativo | FR-3 |
| `app/(backoffice)/vendas/page.tsx` | Histórico de vendas + filtros | FR-3 |
| `app/(backoffice)/financeiro/page.tsx` | Fluxo de caixa + visão semanal/mensal | FR-5 |

### 5.4 Epic 3 — CRM + Fornecedores + Analytics + Dashboard

| Arquivo | Propósito | FR |
|---------|-----------|---|
| `src/features/customers/` | Customer CRUD + histórico de compras | FR-6 |
| `src/features/suppliers/` | Supplier CRUD + pedidos | FR-7 |
| `src/features/analytics/services/analytics.service.ts` | Velocidade de vendas + dias até ruptura + KPIs | FR-8, FR-11 |
| `src/features/labels/services/label.service.ts` | Geração de QR Code + layout de etiqueta | FR-10 |
| `app/(backoffice)/clientes/page.tsx` | Lista + perfil de clientes | FR-6 |
| `app/(backoffice)/fornecedores/page.tsx` | Lista + perfil de fornecedores | FR-7 |
| `app/(backoffice)/dashboard/page.tsx` | Dashboard executivo com KPIs | FR-11 |

### 5.5 Epic 4 — E-commerce Bridge

| Arquivo | Propósito | FR |
|---------|-----------|---|
| `src/middleware.ts` | Validação de `X-API-Key` para todas as rotas `/api/v1/*` | CON-5 |
| `app/api/v1/products/route.ts` | `GET /api/v1/products` — catálogo para e-commerce | FR-12, CON-2 |
| `app/api/v1/inventory/route.ts` | `GET /api/v1/inventory` — saldos de estoque | CON-2 |
| `app/api/v1/customers/route.ts` | `GET/POST /api/v1/customers` — sync de clientes | CON-2 |
| `src/features/export/services/export.service.ts` | Geração de JSON/CSV de catálogo | FR-12 |

---

## 6. Estratégia de Testes

*(fonte: requirements.json functional[*].acceptance + preset nextjs-react testing strategy)*

**Meta de cobertura:** Business logic (services) ≥ 90% · Hooks ≥ 80% · Componentes ≥ 60%

### 6.1 Testes Unitários — Business Logic (Vitest)

| Teste | Cobre | Prioridade |
|-------|-------|-----------|
| `SalesService.createSale` — happy path: 1 item, Pix | FR-3 AC-3.1, AC-3.4 | P0 |
| `SalesService.createSale` — venda com múltiplos itens | FR-3 AC-3.1 | P0 |
| `SalesService.createSale` — estoque zerado lança erro | EC-1, FR-2 AC-2.1 | P0 |
| `SalesService.createSale` — rollback em falha parcial (passo 4) | NFR-3 | P0 |
| `SalesService.createSale` — pagamento dividido (Pix + Dinheiro) | FR-3 AC-3.3 | P0 |
| `Decimal.calculateMargin(salePrice, costPrice)` — precisão vs Float | FR-4 AC-4.3 | P0 |
| `Decimal.calculateMargin` — custo zerado retorna 100% | FR-4 | P0 |
| `InventoryService.decrementStock` — não permite quantidade negativa | FR-2 AC-2.1, EC-1 | P0 |
| `InventoryService.checkLowStockAlerts` — retorna variantes abaixo do mínimo | FR-2 AC-2.2 | P1 |
| `AnalyticsService.getSalesVelocity` — unidades/semana por variante | FR-8 AC-8.1 | P1 |
| `AnalyticsService.getDaysUntilStockout` — estima dias corretamente | FR-8 AC-8.2 | P1 |
| `AnalyticsService.getDeadStock` — identifica variantes sem venda > 60 dias | FR-11 AC-11.3 | P1 |
| `CashFlowService.getDailySummary` — entradas - saídas = saldo | FR-5 AC-5.3 | P1 |
| `SalesService.processReturn` — reverte estoque e caixa | FR-9 AC-9.1, AC-9.2 | P1 |

### 6.2 Testes de Integração (Vitest + Prisma Test DB)

| Teste | Componentes | Cenário |
|-------|------------|---------|
| Fluxo de venda completo | SalesService + Prisma + PostgreSQL | Confirma venda → valida estoque decrementado + caixa atualizado |
| Rollback de transação | SalesService + Prisma | Força erro no step 4 → valida que estoque não mudou |
| Devolução com reversão | SalesService + InventoryService | Devolução → estoque restaurado + saída no caixa |
| Alerta de estoque baixo pós-venda | InventoryService | Venda reduz abaixo do mínimo → alerta presente na query |

### 6.3 Acceptance Tests — Gherkin (Playwright)

*(fonte: requirements.json functional[*].acceptance — conversão direta)*

```gherkin
Feature: Cadastro de Produto com Variantes (FR-1)

  Scenario: Criar produto com variante completa
    Given o lojista está na tela de cadastro de produto
    When preenche nome="Óculos X1", marca="Ray-Ban", fornecedor="Fornecedor A"
    And adiciona variante: frameColor="Preto", lensColor="Cinza", UV400, isPolarized=true
    And define costPrice=45.00, salePrice=120.00
    Then o produto é salvo com SKU único gerado automaticamente
    And a margem bruta exibida é "62.50%"
    And o produto aparece disponível no PDV

  Scenario: Não permite excluir produto com histórico de vendas (EC-4)
    Given o produto "Óculos X1" possui vendas registradas
    When o lojista tenta excluir o produto
    Then a exclusão é bloqueada
    And o sistema oferece a opção "Arquivar produto"

Feature: PDV — Registro de Venda (FR-3)

  Scenario: Venda simples com Pix
    Given o PDV está aberto e a variante "Preto/Cinza UV400" tem quantity=5
    When o operador busca "Óculos X1" e seleciona a variante
    And adiciona 1 unidade ao carrinho
    And seleciona pagamento Pix com valor total R$ 120,00
    And confirma a venda
    Then o quantity da variante é decrementado para 4
    And uma InventoryTransaction com type=SALE e quantityDelta=-1 é criada
    And uma CashFlowEntry com type=INCOME e amount=120.00 é criada
    And o comprovante fica disponível para impressão

  Scenario: Venda bloqueada por estoque insuficiente (EC-1)
    Given a variante selecionada tem quantity=0
    When o operador tenta confirmar a venda
    Then a venda é bloqueada com mensagem "Estoque insuficiente para [Produto — Variante]"
    And nenhum registro é criado no banco de dados

  Scenario: Pagamento dividido entre meios (FR-3 AC-3.3)
    Given o carrinho tem total de R$ 150,00
    When o operador define Pix=R$ 100,00 e Dinheiro=R$ 50,00
    Then o total bate com R$ 150,00
    And a venda é confirmada com paymentBreakdown={pix:100, cash:50}

Feature: Margem Bruta Automática (FR-4)

  Scenario: Cálculo de margem em tempo real
    Given o lojista está editando uma variante
    When preenche costPrice=50.00
    And preenche salePrice=150.00
    Then a margem bruta exibida é "66.67%"
    And é calculada como (150-50)/150*100

Feature: Fluxo de Caixa Diário (FR-5)

  Scenario: Venda cria entrada automática no caixa
    Given o fluxo de caixa do dia está zerado
    When uma venda de R$ 200,00 é confirmada no PDV
    Then o saldo do dia mostra entrada de R$ 200,00
    And o saldo diário é R$ 200,00

Feature: Alerta de Estoque Baixo (FR-2)

  Scenario: Alerta exibido ao atingir mínimo configurado
    Given a variante "Óculos X1 — Preto/Cinza" tem minStockAlert=3 e quantity=3
    When uma venda reduz o quantity para 2
    Then a variante aparece na lista de alertas de estoque baixo
    And badge de alerta é exibido na tela de inventário

Feature: CRM Lite — Cadastro de Clientes (FR-6)

  Scenario: Vincular venda a cliente cadastrado
    Given o cliente "Maria Silva" está cadastrado com tags=["polarizado"]
    When o operador seleciona "Maria Silva" no PDV antes de confirmar a venda
    Then a venda é salva com customerId referenciando Maria Silva
    And o histórico de compras de Maria Silva exibe esta venda

Feature: Gestão de Fornecedores (FR-7)

  Scenario: Associar produto a fornecedor
    Given o fornecedor "Óticas Brasil" está cadastrado com leadTimeDays=7
    When o produto "Óculos X1" é criado com supplierId="Óticas Brasil"
    Then o produto exibe "Fornecedor: Óticas Brasil (prazo: 7 dias)" na ficha

Feature: Etiquetas com QR Code (FR-10)

  Scenario: Gerar etiqueta com QR Code para variante
    Given a variante "Óculos X1 — Preto UV400" tem salePrice=120.00
    When o lojista solicita impressão de etiqueta para esta variante
    Then uma etiqueta é gerada com nome, preço e QR Code
    And o QR Code aponta para a URL configurada no sistema

Feature: Exportação de Catálogo (FR-12)

  Scenario: Exportar catálogo em formato JSON
    Given o catálogo tem 5 produtos ativos com variantes e estoque
    When o lojista solicita exportação em formato JSON
    Then um arquivo JSON é gerado com produtos, variantes, preços e saldos de estoque
    And o schema é compatível com o formato de importação especificado
```

---

## 7. Riscos e Mitigações

*(fonte: complexity.json dimensions + requirements.json edgeCases + architecture-decision.json criticalDecisions)*

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Inconsistência de estoque em falha parcial da transação | Baixa | Crítico | `prisma.$transaction()` garante atomicidade PostgreSQL — EC-2, NFR-3 |
| Arredondamento incorreto em cálculos de margem/totais | Média | Alto | `Decimal.js` obrigatório para todos campos monetários; nunca `number` para dinheiro — FR-4 |
| Exclusão acidental de produto com histórico de vendas | Baixa | Alto | Soft delete (`isArchived=true`); bloquear `DELETE` físico no service — EC-4 |
| Performance do PDV em tablet touchscreen | Média | Médio | PDV como Client Component com Zustand local; React Query com invalidação precisa — NFR-1, ASM-5 |
| OQ-5 aberta: dados históricos a migrar | Alta | Médio | Investigar antes do Epic 1; se confirmado, criar feature de importação CSV antes do go-live |
| Scope de analytics sub-estimado (query de giro pode ser pesada) | Média | Médio | `AnalyticsService` isolado; pode receber otimização de query (@data-engineer) sem afetar outros módulos — FR-8 |
| Sessão JWT expirar no meio de uma venda | Baixa | Médio | Configurar session TTL longo (ex: 7 dias); renovação silenciosa com NextAuth — ASM-1 |

---

## 8. Open Questions

*(fonte: requirements.json openQuestions — OQ-1 a OQ-4 resolvidas em 2026-05-13)*

| ID | Questão | Blocking | Responsável |
|----|---------|---------|------------|
| OQ-5 | A loja já tem histórico de produtos/clientes para migrar? Feature de importação CSV entra no MVP se confirmado | Não | @pm |

---

## 9. Implementation Checklist

*(fonte: complexity.json suggestedEpics + requirements.json functional[*].acceptance criteria)*

### Epic 1 — Foundation
- [ ] Inicializar projeto Next.js 16 + TypeScript strict + Tailwind + shadcn/ui
- [ ] Configurar Prisma + PostgreSQL Neon + schema.prisma completo (DM-1 a DM-9)
- [ ] Implementar autenticação NextAuth.js v5 com Credentials provider
- [ ] `FR-1`: CRUD de produtos + variantes com geração automática de SKU
- [ ] `FR-1`: Upload de imagens por variante
- [ ] `FR-4`: Cálculo de margem bruta em tempo real no formulário de variante (Decimal.js)
- [ ] `FR-2`: InventoryService com constraint `quantity >= 0` e append-only InventoryTransaction
- [ ] `FR-2`: Alertas de estoque baixo configuráveis por variante
- [ ] Telas: `/produtos`, `/produtos/[id]`, `/produtos/novo`, `/estoque`
- [ ] Testes unitários: ProductService (90%+), InventoryService (90%+)

### Epic 2 — PDV + Vendas + Financeiro
- [ ] `FR-3`: Carrinho PDV com Zustand store (adicionar, remover, alterar quantidade)
- [ ] `FR-3`: Seleção de meio de pagamento com suporte a pagamento dividido
- [ ] `FR-3`: `SalesService.createSale()` com `prisma.$transaction()` atômica
- [ ] `FR-5`: `CashFlowService` com entradas automáticas via evento de venda
- [ ] `FR-5`: Lançamento manual de despesas operacionais
- [ ] `FR-9`: `SalesService.processReturn()` e `SalesService.processExchange()`
- [ ] Telas: `/pdv`, `/vendas`, `/financeiro`
- [ ] Testes unitários: SalesService (90%+), CashFlowService (90%+)
- [ ] Teste E2E Playwright: fluxo completo de venda com Pix

### Epic 3 — CRM + Fornecedores + Analytics + Dashboard
- [ ] `FR-6`: CRUD de clientes + vinculação opcional em vendas + tags de preferência
- [ ] `FR-7`: CRUD de fornecedores + campo leadTimeDays + associação a produtos
- [ ] `FR-8`: `AnalyticsService.getSalesVelocity()` — unidades/semana por variante
- [ ] `FR-8`: `AnalyticsService.getDaysUntilStockout()` — previsão de ruptura
- [ ] `FR-10`: Geração de etiqueta com QR Code + impressão em lote
- [ ] `FR-11`: Dashboard: top por margem, top por giro, dead stock >60d, ticket médio
- [ ] Telas: `/clientes`, `/fornecedores`, `/dashboard`
- [ ] Testes unitários: AnalyticsService (90%+)

### Epic 4 — E-commerce Bridge
- [ ] `CON-5`: Implementar `src/middleware.ts` com validação de `X-API-Key` para `/api/v1/:path*`
- [ ] `CON-5`: Adicionar `ECOMMERCE_API_KEY` ao `.env.local.example` e configurar no Vercel
- [ ] `FR-12`: `ExportService` — geração de JSON/CSV de catálogo com filtros
- [ ] `GET /api/v1/products` — catálogo paginado com variantes e estoque
- [ ] `GET /api/v1/inventory` — saldos de estoque em tempo real
- [ ] `GET /api/v1/customers` — lista de clientes para sync
- [ ] Teste de integração: request sem `X-API-Key` → `401`; com key válida → `200`
- [ ] Documentação OpenAPI para `app/api/v1/`

### Transversal (todos os epics)
- [ ] Validar constraint `quantity >= 0` no service (não depender só do banco)
- [ ] Todos campos monetários usando `Decimal.js` — proibir `number` para preços/totais
- [ ] Soft delete em Product (`isArchived`) — proibir DELETE físico de produto com vendas
- [ ] Resolver OQ-5 antes do go-live (migração de dados)

---

## Metadata

```yaml
generated_by: "@pm via *write-spec"
inputs:
  - docs/stories/MVP-0/spec/requirements.json
  - docs/stories/MVP-0/spec/complexity.json
  - docs/stories/MVP-0/spec/architecture-decision.json
iteration: 2
patch_notes:
  - "2026-05-13 @pm: CRIT-3 resolved — Section 3.5 added (API Security, Opção B Static API Key); CON-5 added to requirements.json; Epic 4 checklist updated"
article_iv_gate: "VALIDATED — todas as declarações rastreiam a FR-*, NFR-*, CON-*, ASM-*, EC-* ou architecture-decision.json"
critique_verdict: "APPROVED (4.55/5.0) — CRIT-3 now FIXED"
next_phase: "@sm *draft (stories do Epic 1)"
next_agent: "@sm (River)"
```
