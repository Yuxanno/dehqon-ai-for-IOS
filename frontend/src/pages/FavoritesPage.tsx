import { useEffect, useState } from 'react';
import { Heart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import ProductCardOrganic from '../components/marketplace/ProductCardOrganic';
import { favoritesApi } from '../services/api';
import type { Product } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const { token } = useAuthStore();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!token) return;
      
      setIsLoading(true);
      try {
        const response = await favoritesApi.getAll(token);
        const mappedProducts: Product[] = response.favorites.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description || '',
          price: p.price,
          currency: 'UZS' as const,
          category: (p.category || 'other') as Product['category'],
          images: p.images.map((img: string) => 
            img.startsWith('/uploads') ? `${API_URL}${img}` : img
          ),
          region: p.region || '',
          sellerId: '',
          seller: { id: '', name: '', rating: 5.0, reviewsCount: 0 },
          createdAt: new Date().toISOString(),
          views: 0,
          status: 'active' as const,
        }));
        setFavorites(mappedProducts);
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFavorites();
  }, [token]);

  return (
    <div className="min-h-screen bg-earth-50 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-earth-100 sticky top-0 z-10">
        <div className="container-app py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-earth-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-earth-600" />
          </button>
          <h1 className="text-lg font-semibold text-earth-900">{t.favorites}</h1>
        </div>
      </div>

      <div className="container-app py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-earth-100 animate-pulse" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-earth-100 flex items-center justify-center">
              <Heart className="w-10 h-10 text-earth-300" />
            </div>
            <p className="text-earth-500 text-lg font-medium">
              {t.products.noProducts}
            </p>
            <button 
              onClick={() => navigate('/marketplace')}
              className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-xl font-medium"
            >
              {t.marketplace}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favorites.map((product, index) => (
              <ProductCardOrganic key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
