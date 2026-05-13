export type {
  ProductWithVariants,
  VariantWithInventory,
  CreateProductDTO,
  CreateVariantDTO,
  UpdateProductDTO,
} from './products.contract'
export { ProductsRepository } from './repositories/products.repository'
export { ProductsService } from './services/products.service'
export { calculateMargin } from '@/lib/decimal'
