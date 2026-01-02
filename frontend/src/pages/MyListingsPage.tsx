import { useEffect, useState } from 'react';
import { Package, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import ProductCardOrganic from '../components/marketplace/ProductCardOrganic';
import { productsApi } from '../services/api';
import type { Product } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function MyListingsPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguageStore();
  const { user, token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyProducts = async () => {
      if (!token || !user) return;
      
      setIsLoading(true);
      try {
        // Fetch all products and filter by seller_id
        const response = await productsApi.getAll();
        const myProducts = response.products
          .filter((p: any) => p.seller_id === user.id)
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description || '',
            price: p.price,
            currency: p.currency as 'UZS',
            category: p.category as Product['category'],
            images: p.images.map((img: string) => 
              img.startsWith('/uploads') ? `${API_URL}${img}` : img
            ),
            region: p.region || '',
            sellerId: p.seller_id,
            seller: {
              id: p.seller_id,
              name: p.seller_name,
              rating: 5.0,
              reviewsCount: 0,
            },
            createdAt: p.created_at,
            views: p.views,
            status: p.status as 'active' | 'sold' | 'archived',
          }));
        setProducts(myProducts);
      } catch (err) {
        console.error('Failed to fetch my products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyProducts();
  }, [token, user]);

  const emptyMessage = language === 'uz' 
    ? "Sizda hali e'lonlar yo'q" 
    : "У вас пока нет объявлений";

  return (
    <div className="min-h-screen bg-earth-50 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-earth-100 sticky top-0 z-10">
        <div className="container-app py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-earth-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-earth-600" />
            </button>
            <h1 className="text-lg font-semibold text-earth-900">{t.profile.myListings}</h1>
          </div>
          <button 
            onClick={() => navigate('/create')}
            className="w-10 h-10 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="container-app py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-earth-100 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-earth-100 flex items-center justify-center">
              <Package className="w-10 h-10 text-earth-300" />
            </div>
            <p className="text-earth-600 text-lg font-medium">{emptyMessage}</p>
            <button 
              onClick={() => navigate('/create')}
              className="mt-6 px-6 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              {language === 'uz' ? "E'lon qo'shish" : 'Добавить объявление'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product, index) => (
              <ProductCardOrganic key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
