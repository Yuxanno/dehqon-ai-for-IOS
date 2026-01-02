import { useNavigate } from 'react-router-dom';
import { MapPin, Eye, Heart } from 'lucide-react';
import type { Product } from '../../types';
import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import AuthModal from '../auth/AuthModal';
import clsx from 'clsx';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    setIsFavorite(!isFavorite);
    // TODO: Call API to add/remove favorite
  };

  return (
    <>
      <article
        onClick={() => navigate(`/product/${product.id}`)}
        className="product-card cursor-pointer group"
      >
        {/* Изображение */}
        <div className="product-card-image">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl md:text-5xl bg-earth-100">
              📦
            </div>
          )}
          
          {/* Favorite button */}
          <button
            onClick={handleFavorite}
            className={clsx(
              'absolute top-2 right-2 md:top-3 md:right-3 w-8 h-8 md:w-9 md:h-9 rounded-full',
              'flex items-center justify-center transition-all',
              'bg-white/90 backdrop-blur-sm shadow-sm',
              'hover:bg-white hover:shadow-md',
              isFavorite ? 'text-red-500' : 'text-earth-400'
            )}
            aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            <Heart className={clsx('w-4 h-4 md:w-5 md:h-5', isFavorite && 'fill-current')} />
          </button>
          
          {/* Просмотры */}
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {product.views}
          </div>
        </div>

        {/* Информация */}
        <div className="p-3 md:p-4">
          <h3 className="font-medium text-earth-900 line-clamp-2 text-sm md:text-base leading-tight">
            {product.title}
          </h3>
          
          <p className="text-primary-600 font-bold text-lg md:text-xl mt-1.5 md:mt-2">
            {formatPrice(product.price)} сўм
          </p>
          
          <div className="flex items-center gap-1 text-earth-500 text-xs md:text-sm mt-2">
            <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="truncate">{product.region}</span>
          </div>

          {/* Seller info - visible on larger screens */}
          <div className="hidden md:flex items-center gap-2 mt-3 pt-3 border-t border-earth-100">
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs">
              👤
            </div>
            <span className="text-sm text-earth-600 truncate">{product.seller.name}</span>
            <span className="text-sm text-yellow-600 flex items-center gap-0.5 ml-auto">
              ⭐ {product.seller.rating}
            </span>
          </div>
        </div>
      </article>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Войдите, чтобы добавить в избранное"
      />
    </>
  );
}
