import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, MapPin, Eye, Star, Phone, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { CATEGORY_LABELS } from '../types';
import { useState, useEffect } from 'react';
import { productsApi } from '../services/api';
import { useLanguageStore } from '../store/useLanguageStore';
import clsx from 'clsx';

// Optimize image URL for faster loading
const optimizeImageUrl = (url: string, width = 800) => {
  if (!url) return '';
  
  // Cloudinary optimization
  if (url.includes('cloudinary.com')) {
    // Add transformation parameters for smaller size and better quality
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
  }
  
  // For other URLs, return as is
  return url;
};

// Get thumbnail URL (smaller version)
const getThumbnailUrl = (url: string) => optimizeImageUrl(url, 200);

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const { token, isAuthenticated } = useAuthStore();
  const products = useAppStore((state) => state.products);
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadedProduct, setLoadedProduct] = useState<any>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Try to find product in store first, otherwise load from API
  const storeProduct = products.find((p) => p.id === id);
  const product = storeProduct || loadedProduct;

  // Handle call button
  const handleCall = () => {
    const phone = product?.seller_phone || product?.seller?.phone;
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      alert(language === 'uz' ? 'Telefon raqami mavjud emas' : 'Номер телефона недоступен');
    }
  };

  // Handle message button - open chat with seller
  const handleMessage = async () => {
    if (!isAuthenticated || !token) {
      navigate('/profile');
      return;
    }
    
    // Try different field names for seller ID
    const sellerId = product?.seller_id || product?.sellerId || product?.seller?.id;
    console.log('Product:', product);
    console.log('Seller ID:', sellerId);
    
    if (!sellerId) {
      alert(language === 'uz' ? 'Sotuvchi topilmadi' : 'Продавец не найден');
      return;
    }
    
    // Navigate to chats with seller info in URL params
    navigate(`/chats?seller=${sellerId}&product=${id}`);
  };

  useEffect(() => {
    // If product not in store, fetch it from API
    if (!storeProduct && id && !loadedProduct && !loading) {
      setLoading(true);
      productsApi.getById(id)
        .then(data => {
          setLoadedProduct(data);
        })
        .catch(err => {
          console.error('Failed to load product:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, storeProduct, loadedProduct, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-earth-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-earth-600">Товар не найден</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дн. назад`;
    return date.toLocaleDateString('ru-RU');
  };

  // Use actual images without duplication
  const images = product.images.length > 0 ? product.images : [];

  return (
    <div className="min-h-screen bg-earth-50">
      <div className="container-app py-4 md:py-8">
        {/* Back button - Desktop */}
        <button
          onClick={() => navigate(-1)}
          className="hidden md:flex items-center gap-2 text-earth-600 hover:text-earth-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Назад к списку</span>
        </button>

        <div className="lg:flex lg:gap-8">
          {/* Left column - Images */}
          <div className="lg:w-1/2 xl:w-[55%]">
            {/* Mobile header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-lg border-b border-earth-200">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-earth-100 flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-earth-700" />
              </button>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-full bg-earth-100 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-earth-700" />
                </button>
                <button 
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={clsx(
                    "w-10 h-10 rounded-full bg-earth-100 flex items-center justify-center",
                    isFavorite && "text-red-500"
                  )}
                >
                  <Heart className={clsx("w-5 h-5", isFavorite && "fill-current")} />
                </button>
              </div>
            </div>

            {/* Image gallery */}
            <div className="relative md:rounded-2xl overflow-hidden bg-earth-200 mt-14 md:mt-0">
              <div className="aspect-square md:aspect-[4/3]">
                {images[currentImage] ? (
                  <>
                    {/* Loading placeholder */}
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-earth-100">
                        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <img
                      src={optimizeImageUrl(images[currentImage])}
                      alt={product.title}
                      className={clsx(
                        "w-full h-full object-cover transition-opacity duration-300",
                        imageLoaded ? "opacity-100" : "opacity-0"
                      )}
                      loading="eager"
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageLoaded(true)}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl bg-earth-100">
                    📦
                  </div>
                )}
              </div>
              
              {/* Navigation arrows - Desktop */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage(i => i > 0 ? i - 1 : images.length - 1)}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-lg hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCurrentImage(i => i < images.length - 1 ? i + 1 : 0)}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-lg hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnails - Desktop */}
            {images.length > 1 && (
              <div className="hidden md:flex gap-3 mt-4">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setImageLoaded(false);
                      setCurrentImage(i);
                    }}
                    className={clsx(
                      "w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors",
                      currentImage === i ? "border-primary-500" : "border-transparent hover:border-earth-300"
                    )}
                  >
                    <img 
                      src={getThumbnailUrl(img)} 
                      alt="" 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image indicators - Mobile */}
            {images.length > 1 && (
              <div className="flex justify-center gap-1.5 py-3 md:hidden">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={clsx(
                      "w-2 h-2 rounded-full transition-colors",
                      i === currentImage ? 'bg-primary-500' : 'bg-earth-300'
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right column - Info */}
          <div className="lg:w-1/2 xl:w-[45%] mt-4 lg:mt-0">
            {/* Price & Title */}
            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-primary-600">
                    {formatPrice(product.price)} so'm
                  </p>
                  <h1 className="text-xl md:text-2xl font-semibold text-earth-900 mt-2">
                    {product.title}
                  </h1>
                </div>
                
                {/* Desktop actions */}
                <div className="hidden md:flex gap-2">
                  <button className="w-10 h-10 rounded-full bg-earth-100 flex items-center justify-center hover:bg-earth-200 transition-colors">
                    <Share2 className="w-5 h-5 text-earth-700" />
                  </button>
                  <button 
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={clsx(
                      "w-10 h-10 rounded-full bg-earth-100 flex items-center justify-center hover:bg-earth-200 transition-colors",
                      isFavorite && "text-red-500"
                    )}
                  >
                    <Heart className={clsx("w-5 h-5", isFavorite && "fill-current")} />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-4 text-sm text-earth-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {product.region}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {product.views} просмотров
                </span>
                <span>{formatDate(product.createdAt)}</span>
              </div>
              
              <span className="inline-block mt-4 px-3 py-1.5 bg-earth-100 text-earth-600 text-sm rounded-full">
                {CATEGORY_LABELS[product.category]}
              </span>

              {/* Contact buttons - Desktop */}
              <div className="hidden md:flex gap-3 mt-6">
                <button 
                  onClick={handleCall}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  {language === 'uz' ? "Qo'ng'iroq" : 'Позвонить'}
                </button>
                <button 
                  onClick={handleMessage}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-earth-100 text-earth-900 font-semibold rounded-xl hover:bg-earth-200 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  {language === 'uz' ? 'Yozish' : 'Написать'}
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 mt-4">
              <h2 className="font-semibold text-earth-900 text-lg mb-3">{language === 'uz' ? 'Tavsif' : 'Описание'}</h2>
              <p className="text-earth-700 whitespace-pre-wrap leading-relaxed break-words overflow-hidden">{product.description}</p>
            </div>

            {/* Seller */}
            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 mt-4">
              <h2 className="font-semibold text-earth-900 text-lg mb-4">Продавец</h2>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl">
                  👨‍🌾
                </div>
                <div className="flex-1">
                  <p className="font-medium text-earth-900 text-lg">{product.seller?.name || product.seller_name || 'Продавец'}</p>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{product.seller?.rating || 5}</span>
                    <span className="text-earth-500">({product.seller?.reviewsCount || 0} отзывов)</span>
                  </div>
                </div>
              </div>
              <button className="w-full mt-4 py-2.5 text-primary-600 font-medium text-sm border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors">
                {language === 'uz' ? "Sotuvchining barcha tovarlari →" : 'Все товары продавца →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom buttons - Mobile only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pt-4 pb-6 bg-white/95 backdrop-blur-lg border-t border-earth-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button 
            onClick={handleCall}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl active:scale-[0.98] transition-all shadow-lg shadow-primary-500/30"
          >
            <Phone className="w-5 h-5" />
            <span>{language === 'uz' ? "Qo'ng'iroq" : 'Позвонить'}</span>
          </button>
          <button 
            onClick={handleMessage}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 bg-earth-100 text-earth-800 font-semibold rounded-2xl active:scale-[0.98] transition-all border border-earth-200 hover:bg-earth-200"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{language === 'uz' ? 'Yozish' : 'Написать'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
