import ProductCard from './ProductCard';
import type { Product } from '../../types';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

export default function ProductGrid({ products, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="product-grid">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="product-card animate-pulse">
            <div className="product-card-image bg-earth-200" />
            <div className="p-3 md:p-4 space-y-2">
              <div className="h-4 bg-earth-200 rounded w-3/4" />
              <div className="h-5 bg-earth-200 rounded w-1/2" />
              <div className="h-3 bg-earth-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 md:py-20">
        <div className="text-5xl md:text-6xl mb-4">🔍</div>
        <p className="text-earth-600 font-medium text-lg">Товары не найдены</p>
        <p className="text-earth-500 text-sm mt-1">Попробуйте изменить фильтры</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
