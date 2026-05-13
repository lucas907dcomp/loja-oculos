import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProductsService, calculateMargin } from '@/features/products'
import { archiveProductAction, restoreProductAction } from '@/features/products/actions'
import { formatCurrency } from '@/lib/decimal'

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params

  let product
  try {
    product = await ProductsService.findById(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Product header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            {product.isArchived ? (
              <Badge variant="secondary">Arquivado</Badge>
            ) : (
              <Badge variant="default">Ativo</Badge>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">{product.brand}</p>
          {product.description && (
            <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
          )}
          {product.supplier && (
            <p className="mt-1 text-sm text-muted-foreground">
              Fornecedor: {product.supplier.name}
            </p>
          )}
        </div>

        {/* EC-4: archive or restore — no physical delete */}
        <div>
          {product.isArchived ? (
            <form action={restoreProductAction.bind(null, product.id)}>
              <Button type="submit" variant="outline">
                Restaurar Produto
              </Button>
            </form>
          ) : (
            <form action={archiveProductAction.bind(null, product.id)}>
              <Button type="submit" variant="destructive">
                Arquivar Produto
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Variant grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Variantes ({product.variants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {product.variants.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma variante.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Cor Armação</TableHead>
                    <TableHead>Cor Lente</TableHead>
                    <TableHead>UV</TableHead>
                    <TableHead>Polarizado</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Preço Venda</TableHead>
                    <TableHead className="text-right">Margem %</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variants.map((v) => {
                    const margin = calculateMargin(v.salePrice, v.costPrice)
                    const showMarginWarning = v.costPrice.isZero() && !v.salePrice.isZero()
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono text-xs">{v.sku}</TableCell>
                        <TableCell>{v.frameColor}</TableCell>
                        <TableCell>{v.lensColor}</TableCell>
                        <TableCell>{v.uvProtection}</TableCell>
                        <TableCell>{v.isPolarized ? 'Sim' : 'Não'}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(v.costPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(v.salePrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {showMarginWarning ? (
                            <span className="text-xs text-amber-600">N/A</span>
                          ) : v.salePrice.isZero() ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <span>{margin.toFixed(2)}%</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {v.inventory?.quantity ?? 0}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
