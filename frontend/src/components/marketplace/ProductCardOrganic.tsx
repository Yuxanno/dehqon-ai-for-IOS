import { motion } from 'framer-motion';
import { Heart, MapPin, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { favoritesApi } from '../../services/api';

// Optimize image URL for faster loading
const optimizeImageUrl = (url: string, width = 400) => {
  if (!url) return '';
  
  // Cloudinary optimization
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
  }
  
  return url;
};

interface ProductCardOrganicProps {
  product: Product;
  index?: number;
}

export default function ProductCardOrganic({ product, index = 0 }: ProductCardOrganicProps) {
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const { token, isAuthenticated } = useAuthStore();
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if product is in favorites on mount
  useEffect(() => {
    const checkFavorite = async () => {
      if (!token || !isAuthenticated) return;
      try {
        const result = await favoritesApi.check(token, product.id);
        setIsLiked(result.is_favorite);
      } catch (err) {
        // Ignore errors - product might not be in favorites
      }
    };
    checkFavorite();
  }, [token, isAuthenticated, product.id]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated || !token) {
      navigate('/auth');
      return;
    }

    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (isLiked) {
        await favoritesApi.remove(token, product.id);
        setIsLiked(false);
      } else {
        await favoritesApi.add(token, product.id);
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Failed to update favorite:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + ' mln';
    }
    if (price >= 1000) {
      return (price / 1000).toFixed(0) + ' ming';
    }
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{ y: -6 }}
      onClick={() => navigate(`/product/${product.id}`)}
      className="group cursor-pointer"
    >
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-soil-100">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-soil-100 to-soil-50 animate-pulse" />
          )}
          
          <motion.img
            src={optimizeImageUrl(product.images[0]) || 'https://via.placeholder.com/400x400?text=No+Image'}
            alt={product.title}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
            className={`
              w-full h-full object-cover transition-all duration-500
              group-hover:scale-105
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
          />
          
          {/* Like Button */}
          <motion.button
            onClick={handleFavoriteClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={isLoading}
            className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm ${isLoading ? 'opacity-50' : ''}`}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isLiked ? 'fill-red-500 text-red-500' : 'text-soil-400'
              }`}
            />
          </motion.button>

          {/* Views Badge */}
          {product.views > 0 && (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
              <Eye className="w-3 h-3" />
              <span>{product.views}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Price */}
          <div className="mb-1.5">
            <span className="text-lg font-bold text-growth-600">
              {formatPrice(product.price)}
            </span>
            <span className="text-soil-400 text-xs ml-1">
              {language === 'uz' ? "so'm" : 'сум'}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm text-soil-700 line-clamp-2 leading-snug mb-2 group-hover:text-growth-600 transition-colors">
            {product.title}
          </h3>

          {/* Location */}
          {product.region && (
            <div className="flex items-center gap-1 text-soil-400 text-xs">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{product.region}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
