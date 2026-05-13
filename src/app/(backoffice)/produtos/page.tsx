import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProductsService } from '@/features/products/services/products.service'

export default async function ProdutosPage() {
  const products = await ProductsService.findAll({ includeArchived: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <Link href="/produtos/novo" className={buttonVariants({ variant: 'default' })}>
          Novo Produto
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="text-center">Variantes</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Nenhum produto cadastrado.{' '}
                  <Link href="/produtos/novo" className="underline">
                    Adicionar primeiro produto
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/produtos/${product.id}`} className="block font-medium">
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/produtos/${product.id}`} className="block">
                      {product.brand}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/produtos/${product.id}`} className="block text-muted-foreground">
                      {product.supplier?.name ?? '—'}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    <Link href={`/produtos/${product.id}`} className="block">
                      {product.variants.length}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/produtos/${product.id}`} className="block">
                      {product.isArchived ? (
                        <Badge variant="secondary">Arquivado</Badge>
                      ) : (
                        <Badge variant="default">Ativo</Badge>
                      )}
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
