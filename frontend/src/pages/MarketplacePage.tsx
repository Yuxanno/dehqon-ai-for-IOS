import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Wheat, 
  FlaskConical, 
  Tractor, 
  PawPrint, 
  Wrench, 
  LayoutGrid,
  TrendingUp,
  Package,
  Apple
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useLanguageStore } from '../store/useLanguageStore';
import ProductCardOrganic from '../components/marketplace/ProductCardOrganic';
import { productsApi } from '../services/api';
import type { Product, Category } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const categories = [
  { id: 'all', uz: 'Hammasi', ru: 'Все', Icon: LayoutGrid },
  { id: 'fruits_vegetables', uz: 'Meva-sabzavot', ru: 'Фрукты-овощи', Icon: Apple },
  { id: 'seeds', uz: "Urug'lar", ru: 'Семена', Icon: Wheat },
  { id: 'fertilizers', uz: "O'g'itlar", ru: 'Удобрения', Icon: FlaskConical },
  { id: 'equipment', uz: 'Texnika', ru: 'Техника', Icon: Tractor },
  { id: 'animals', uz: 'Hayvonlar', ru: 'Животные', Icon: PawPrint },
  { id: 'services', uz: 'Xizmatlar', ru: 'Услуги', Icon: Wrench },
];

export default function MarketplacePage() {
  const { products, setProducts, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery } = useAppStore();
  const { language } = useLanguageStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await productsApi.getAll();
        const mappedProducts: Product[] = response.products.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description || '',
          price: p.price,
          currency: p.currency as 'UZS' | 'RUB' | 'USD',
          category: p.category as Product['category'],
          images: p.images.map(img => 
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
        setProducts(mappedProducts);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [setProducts]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Hero Section */}
      <section className="relative py-6 lg:py-10">
        <div className="container-app">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto mb-6"
          >
            <motion.div 
              className="relative"
              animate={{ 
                scale: searchFocused ? 1.02 : 1,
                boxShadow: searchFocused 
                  ? '0 20px 40px -10px rgba(34, 197, 94, 0.15)' 
                  : '0 4px 20px -2px rgba(0, 0, 0, 0.08)'
              }}
              transition={{ duration: 0.2 }}
              style={{ borderRadius: '1rem' }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder={language === 'uz' ? 'Mahsulot qidirish...' : 'Поиск товаров...'}
                className={`
                  w-full h-14 pl-14 pr-4 rounded-2xl bg-white
                  text-soil-700 placeholder:text-soil-400 text-base
                  border-2 transition-all duration-300
                  focus:outline-none
                  ${searchFocused ? 'border-growth-400' : 'border-transparent'}
                `}
              />
              <Search className={`
                absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200
                ${searchFocused ? 'text-growth-500' : 'text-soil-400'}
              `} />
            </motion.div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2 lg:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 lg:justify-center lg:flex-wrap"
          >
            {categories.map((cat, index) => {
              const Icon = cat.Icon;
              const isActive = (!selectedCategory && cat.id === 'all') || selectedCategory === cat.id;
              
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(cat.id === 'all' ? null : cat.id as Category)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap
                    font-medium text-sm transition-all duration-300
                    ${isActive
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-white text-earth-600 shadow-sm hover:shadow-md hover:bg-primary-50 border border-earth-200'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-earth-500'}`} />
                  <span>{language === 'uz' ? cat.uz : cat.ru}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="container-app">
        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mb-5"
        >
          <div className="flex items-center gap-2 text-soil-600">
            <TrendingUp className="w-4 h-4 text-growth-500" />
            <span className="text-sm">
              {language === 'uz' ? 'Topildi' : 'Найдено'}:
              <span className="font-semibold text-soil-800 ml-1">{filteredProducts.length}</span>
            </span>
          </div>
          <select className="text-sm text-soil-600 bg-transparent border-none focus:outline-none cursor-pointer">
            <option>{language === 'uz' ? "Yangi" : 'Новые'}</option>
            <option>{language === 'uz' ? "Arzon" : 'Дешевле'}</option>
            <option>{language === 'uz' ? "Qimmat" : 'Дороже'}</option>
          </select>
        </motion.div>

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5"
            >
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="aspect-[3/4] rounded-3xl bg-gradient-to-br from-soil-100 to-soil-50 animate-pulse"
                />
              ))}
            </motion.div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-soil-100 flex items-center justify-center">
                <Package className="w-10 h-10 text-soil-300" />
              </div>
              <p className="text-soil-500 text-lg font-medium">
                {language === 'uz' ? "Hozircha e'lonlar yo'q" : 'Пока нет объявлений'}
              </p>
              <p className="text-soil-400 text-sm mt-1">
                {language === 'uz' ? "Birinchi bo'lib e'lon qo'shing" : 'Будьте первым, кто добавит'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="products"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5"
            >
              {filteredProducts.map((product, index) => (
                <ProductCardOrganic key={product.id} product={product} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
