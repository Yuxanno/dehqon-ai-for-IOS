import { useState, useEffect } from 'react';
import { MapPin, Navigation, ChevronDown, Check, X, Loader2 } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { authApi } from '../../services/api';
import { regions } from '../../data/regions';

export default function LocationSelector() {
  const { language } = useLanguageStore();
  const { user, token, updateUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);

  // Parse current user region
  useEffect(() => {
    if (user?.region) {
      const parts = user.region.split(', ');
      if (parts.length === 2) {
        // Find region key by name
        for (const [key, value] of Object.entries(regions)) {
          const regionName = language === 'uz' ? value.uz : value.ru;
          if (regionName === parts[0] || value.uz === parts[0] || value.ru === parts[0]) {
            setSelectedRegion(key);
            // Find district
            const district = value.districts.find(d => 
              d.uz === parts[1] || d.ru === parts[1]
            );
            if (district) {
              setSelectedDistrict(language === 'uz' ? district.uz : district.ru);
            }
            break;
          }
        }
      }
    }
  }, [user?.region, language]);

  const detectLocation = async () => {
    setIsDetecting(true);
    
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
      setIsDetecting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedRegion || !selectedDistrict || !token) return;
    
    setIsSaving(true);
    try {
      const regionData = regions[selectedRegion];
      const regionName = language === 'uz' ? regionData.uz : regionData.ru;
      const fullLocation = `${regionName}, ${selectedDistrict}`;
      
      await authApi.updateProfile(token, { region: fullLocation });
      updateUser({ region: fullLocation });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save location:', error);
      alert(language === 'uz' ? "Xatolik yuz berdi" : "Произошла ошибка");
    } finally {
      setIsSaving(false);
    }
  };

  const currentLocation = user?.region || (language === 'uz' ? "Tanlanmagan" : "Не выбрано");

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-primary-600"
      >
        <span className="truncate max-w-[150px]">{currentLocation}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-earth-100">
              <h3 className="text-lg font-semibold text-earth-900">
                {language === 'uz' ? "Joylashuvni tanlang" : "Выберите местоположение"}
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-earth-100 rounded-full"
              >
                <X className="w-5 h-5 text-earth-500" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Auto-detect button */}
              <button
                onClick={detectLocation}
                disabled={isDetecting}
                className="w-full flex items-center gap-3 p-4 bg-primary-50 rounded-xl mb-4 hover:bg-primary-100 transition-colors disabled:opacity-50"
              >
                {isDetecting ? (
                  <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                ) : (
                  <Navigation className="w-5 h-5 text-primary-600" />
                )}
                <div className="text-left">
                  <p className="font-medium text-primary-700">
                    {language === 'uz' ? "Joylashuvni aniqlash" : "Определить местоположение"}
                  </p>
                  {detectedLocation && (
                    <p className="text-sm text-primary-600 mt-0.5">{detectedLocation}</p>
                  )}
                </div>
              </button>

              {/* Region selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-earth-700 mb-2">
                  {language === 'uz' ? "Viloyat" : "Область"}
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setSelectedDistrict('');
                  }}
                  className="w-full p-3 border border-earth-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">
                    {language === 'uz' ? "Viloyatni tanlang" : "Выберите область"}
                  </option>
                  {Object.entries(regions).map(([key, value]) => (
                    <option key={key} value={key}>
                      {language === 'uz' ? value.uz : value.ru}
                    </option>
                  ))}
                </select>
              </div>

              {/* District selector */}
              {selectedRegion && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-earth-700 mb-2">
                    {language === 'uz' ? "Tuman/Shahar" : "Район/Город"}
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full p-3 border border-earth-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">
                      {language === 'uz' ? "Tumanni tanlang" : "Выберите район"}
                    </option>
                    {regions[selectedRegion].districts.map((district) => (
                      <option 
                        key={district.uz} 
                        value={language === 'uz' ? district.uz : district.ru}
                      >
                        {language === 'uz' ? district.uz : district.ru}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Current selection preview */}
              {selectedRegion && selectedDistrict && (
                <div className="flex items-center gap-2 p-3 bg-growth-50 rounded-xl mb-4">
                  <MapPin className="w-5 h-5 text-growth-600" />
                  <span className="text-growth-700 font-medium">
                    {language === 'uz' ? regions[selectedRegion].uz : regions[selectedRegion].ru}, {selectedDistrict}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-earth-100">
              <button
                onClick={handleSave}
                disabled={!selectedRegion || !selectedDistrict || isSaving}
                className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {language === 'uz' ? "Saqlash" : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
