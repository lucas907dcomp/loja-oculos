'use client'

import type { DashboardData } from '@/features/analytics/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function pct(n: number) {
  return `${n.toFixed(1)}%`
}

function marginBadgeClass(margin: number): string {
  if (margin >= 50) return 'bg-green-100 text-green-800 border-green-300'
  if (margin >= 30) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
  return 'bg-red-100 text-red-800 border-red-300'
}

interface Props {
  data: DashboardData
}

export function DashboardClient({ data }: Props) {
  const { summary, topByMargin, topByTurnover, criticalStockouts, deadStock } = data

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{brl.format(summary.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalSales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{brl.format(summary.averageTicket)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margem Média</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pct(summary.averageMarginPercent)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 por Margem</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Armação / Lente</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topByMargin.map((r) => (
                  <TableRow key={r.variantId}>
                    <TableCell className="font-medium">{r.productName}</TableCell>
                    <TableCell className="text-muted-foreground">{r.sku}</TableCell>
                    <TableCell>{r.frameColor} / {r.lensColor}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={marginBadgeClass(r.marginPercent)}>
                        {pct(r.marginPercent)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 por Giro</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Armação / Lente</TableHead>
                  <TableHead className="text-right">Un./Semana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topByTurnover.map((r) => (
                  <TableRow key={r.variantId}>
                    <TableCell className="font-medium">{r.productName}</TableCell>
                    <TableCell className="text-muted-foreground">{r.sku}</TableCell>
                    <TableCell>{r.frameColor} / {r.lensColor}</TableCell>
                    <TableCell className="text-right">{r.unitsPerWeek.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alertas de Ruptura</CardTitle>
        </CardHeader>
        <CardContent>
          {criticalStockouts.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma variante crítica</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Un./Semana</TableHead>
                  <TableHead className="text-right">Dias até Ruptura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalStockouts.map((r) => (
                  <TableRow key={r.variantId}>
                    <TableCell className="font-medium">{r.productName}</TableCell>
                    <TableCell className="text-muted-foreground">{r.sku}</TableCell>
                    <TableCell className="text-right">{r.currentStock}</TableCell>
                    <TableCell className="text-right">{r.unitsPerWeek.toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">Crítico — {r.daysUntilStockout}d</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estoque Parado (+60 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {deadStock.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum estoque parado detectado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Armação / Lente</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadStock.map((r) => (
                  <TableRow key={r.variantId}>
                    <TableCell className="font-medium">{r.productName}</TableCell>
                    <TableCell className="text-muted-foreground">{r.sku}</TableCell>
                    <TableCell>{r.frameColor} / {r.lensColor}</TableCell>
                    <TableCell className="text-right">{r.currentStock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
