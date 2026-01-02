import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, X, Loader2, Navigation } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { productsApi } from '../services/api';
import { regions } from '../data/regions';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const { isAuthenticated, token } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [error, setError] = useState('');

  const categories = language === 'uz' 
    ? [
        { value: 'fruits_vegetables', label: 'Meva va sabzavotlar' },
        { value: 'seeds', label: "Urug'lar" },
        { value: 'fertilizers', label: "O'g'itlar" },
        { value: 'equipment', label: 'Texnika' },
        { value: 'services', label: 'Xizmatlar' },
        { value: 'animals', label: 'Hayvonlar' },
        { value: 'other', label: 'Boshqa' },
      ]
    : [
        { value: 'fruits_vegetables', label: 'Фрукты и овощи' },
        { value: 'seeds', label: 'Семена' },
        { value: 'fertilizers', label: 'Удобрения' },
        { value: 'equipment', label: 'Техника' },
        { value: 'services', label: 'Услуги' },
        { value: 'animals', label: 'Животные' },
        { value: 'other', label: 'Другое' },
      ];

  const availableDistricts = selectedRegion 
    ? regions[selectedRegion]?.districts || []
    : [];

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(
        `${apiUrl}/geocode/reverse?lat=${latitude}&lon=${longitude}&lang=${language}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.display_name) {
          setDetectedLocation(data.display_name.split(',').slice(0, 2).join(', '));
        }
        
        // Используем готовый region_key от бэкенда
        if (data.region_key && regions[data.region_key]) {
          setSelectedRegion(data.region_key);
          
          // Ищем tuman
          const district = data.detected_district || '';
          if (district) {
            const districtLower = district.toLowerCase();
            const regionData = regions[data.region_key];
            
            for (const d of regionData.districts) {
              const dUz = d.uz.toLowerCase();
              const dRu = d.ru.toLowerCase();
              
              if (districtLower.includes(dUz.split(' ')[0]) ||
                  districtLower.includes(dRu.split(' ')[0]) ||
                  dUz.includes(districtLower.split(' ')[0]) ||
                  dRu.includes(districtLower.split(' ')[0])) {
                setSelectedDistrict(language === 'uz' ? d.uz : d.ru);
                break;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Location detection failed:', error);
      alert(language === 'uz' 
        ? "Joylashuvni aniqlab bo'lmadi. Iltimos, qo'lda tanlang." 
        : "Не удалось определить местоположение. Выберите вручную."
      );
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && imageFiles.length < 8) {
      const newFiles = Array.from(files).slice(0, 8 - imageFiles.length);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImageFiles([...imageFiles, ...newFiles]);
      setImagePreviews([...imagePreviews, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (const file of imageFiles) {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(`${API_URL}/upload/image`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload image');
      const data = await response.json();
      uploadedUrls.push(data.url);
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError(language === 'uz' ? 'Avval tizimga kiring' : 'Сначала войдите в систему');
      return;
    }
    if (!selectedRegion || !selectedDistrict) {
      setError(language === 'uz' ? 'Viloyat va tumanni tanlang' : 'Выберите область и район');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages();
      }

      const regionData = regions[selectedRegion];
      const districtData = availableDistricts.find(d => d.uz === selectedDistrict || d.ru === selectedDistrict);
      const regionName = language === 'uz' ? regionData.uz : regionData.ru;
      const districtName = districtData ? (language === 'uz' ? districtData.uz : districtData.ru) : '';
      const fullLocation = `${regionName}, ${districtName}`;

      await productsApi.create(token, {
        title,
        description: description || undefined,
        price: parseInt(price),
        category,
        images: imageUrls,
        region: fullLocation,
      });
      
      navigate('/my-listings');
    } catch (err) {
      console.error('Create product error:', err);
      setError(language === 'uz' ? "E'lon qo'shishda xatolik" : 'Ошибка при добавлении');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    navigate('/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-earth-50 pb-24">
      <header className="bg-white border-b border-earth-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-earth-600 hover:bg-earth-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-earth-900">
          {language === 'uz' ? "Yangi e'lon" : 'Новое объявление'}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="container-app py-4 space-y-4">
        {/* Images */}
        <div className="bg-white rounded-xl p-4">
          <label className="block text-sm font-medium text-earth-700 mb-3">
            {language === 'uz' ? 'Rasmlar (8 tagacha)' : 'Фото (до 8 шт)'}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {imagePreviews.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
            {imagePreviews.length < 8 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-earth-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <Camera className="w-6 h-6 text-earth-400" />
                <span className="text-xs text-earth-500 mt-1">+</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="bg-white rounded-xl p-4">
          <label className="block text-sm font-medium text-earth-700 mb-2">
            {language === 'uz' ? 'Nomi *' : 'Название *'}
          </label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={language === 'uz' ? "Masalan: Pomidor" : 'Например: Помидоры'}
            required className="w-full h-12 px-4 rounded-xl border border-earth-300 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        {/* Category */}
        <div className="bg-white rounded-xl p-4">
          <label className="block text-sm font-medium text-earth-700 mb-2">
            {language === 'uz' ? 'Kategoriya *' : 'Категория *'}
          </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required
            className="w-full h-12 px-4 rounded-xl border border-earth-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
            <option value="">{language === 'uz' ? 'Tanlang' : 'Выберите'}</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Location detect button */}
        <div className="bg-white rounded-xl p-4">
          <button
            type="button"
            onClick={detectLocation}
            disabled={isDetectingLocation}
            className="w-full flex items-center justify-center gap-3 p-3 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-50"
          >
            {isDetectingLocation ? (
              <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
            ) : (
              <Navigation className="w-5 h-5 text-primary-600" />
            )}
            <div className="text-left">
              <span className="font-medium text-primary-700">
                {language === 'uz' ? "Joylashuvni aniqlash" : "Определить местоположение"}
              </span>
              {detectedLocation && (
                <p className="text-sm text-primary-600 mt-0.5">{detectedLocation}</p>
              )}
            </div>
          </button>
        </div>

        {/* Region */}
        <div className="bg-white rounded-xl p-4">
          <label className="block text-sm font-medium text-earth-700 mb-2">
            {language === 'uz' ? 'Viloyat *' : 'Область *'}
          </label>
          <select value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setSelectedDistrict(''); }} required
            className="w-full h-12 px-4 rounded-xl border border-earth-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
            <option value="">{language === 'uz' ? 'Viloyatni tanlang' : 'Выберите область'}</option>
            {Object.entries(regions).map(([key, region]) => (
              <option key={key} value={key}>{language === 'uz' ? region.uz : region.ru}</option>
            ))}
          </select>
        </div>

        {/* District */}
        {selectedRegion && (
          <div className="bg-white rounded-xl p-4">
            <label className="block text-sm font-medium text-earth-700 mb-2">
              {language === 'uz' ? 'Tuman *' : 'Район *'}
            </label>
            <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} required
              className="w-full h-12 px-4 rounded-xl border border-earth-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="">{language === 'uz' ? 'Tumanni tanlang' : 'Выберите район'}</option>
              {availableDistricts.map((district, idx) => (
                <option key={idx} value={language === 'uz' ? district.uz : district.ru}>
                  {language === 'uz' ? district.uz : district.ru}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Price */}
        <div className="bg-white rounded-xl p-4">
          <label className="block text-sm font-medium text-earth-700 mb-2">
            {language === 'uz' ? 'Narxi *' : 'Цена *'}
          </label>
          <div className="relative">
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="0" required
              className="w-full h-12 px-4 pr-16 rounded-xl border border-earth-300 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-earth-500">
              {language === 'uz' ? "so'm" : 'сум'}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl p-4">
          <label className="block text-sm font-medium text-earth-700 mb-2">
            {language === 'uz' ? 'Tavsif' : 'Описание'}
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder={language === 'uz' ? 'Mahsulot haqida batafsil...' : 'Подробнее о товаре...'}
            rows={4} className="w-full px-4 py-3 rounded-xl border border-earth-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        <button type="submit" disabled={isLoading}
          className="w-full h-14 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {language === 'uz' ? 'Yuklanmoqda...' : 'Загрузка...'}
            </>
          ) : (
            language === 'uz' ? "E'lonni joylash" : 'Опубликовать'
          )}
        </button>
      </form>
    </div>
  );
}
