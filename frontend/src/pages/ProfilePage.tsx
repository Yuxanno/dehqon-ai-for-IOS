import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Heart, MessageCircle, History, Settings, LogOut, 
  ChevronRight, Plus, Phone, Globe, Edit2, Camera, MapPin, Shield 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import AuthModal from '../components/auth/AuthModal';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { productsApi, favoritesApi } from '../services/api';

// Админский номер
const ADMIN_PHONE = '+998123456789';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, token } = useAuthStore();
  const { t, language } = useLanguageStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stats, setStats] = useState({ listings: 0, views: 0, favorites: 0 });

  // Загружаем статистику
  useEffect(() => {
    const fetchStats = async () => {
      if (!token || !user) return;
      
      try {
        // Получаем объявления пользователя
        const productsRes = await productsApi.getAll();
        const myProducts = productsRes.products.filter(p => p.seller_id === user.id);
        const totalViews = myProducts.reduce((sum, p) => sum + (p.views || 0), 0);
        
        // Получаем избранное
        const favRes = await favoritesApi.getAll(token);
        
        setStats({
          listings: myProducts.length,
          views: totalViews,
          favorites: favRes.total || 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    
    fetchStats();
  }, [token, user]);

  // Not authenticated - show login prompt
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-earth-50 pb-20">
        <div className="container-app py-8">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone className="w-10 h-10 text-primary-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-earth-900 mb-2">
              {t.auth.loginToAccess}
            </h1>
            <p className="text-earth-600 mb-6">
              {t.favorites}, {t.aiAssistant}
            </p>

            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-3.5 bg-primary-500 text-white font-semibold rounded-xl
                       hover:bg-primary-600 active:scale-[0.98] transition-all"
            >
              {t.auth.loginButton}
            </button>

            {/* Language Switcher */}
            <div className="mt-8 pt-6 border-t border-earth-200">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-earth-500" />
                <span className="font-medium text-earth-700">{t.profile.language}</span>
              </div>
              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  // Authenticated - show profile
  const isAdmin = user.phone === ADMIN_PHONE;
  
  const menuItems = [
    ...(isAdmin ? [{ icon: Shield, label: language === 'uz' ? 'Admin panel' : 'Админ панель', href: '/admin' }] : []),
    { icon: Package, label: t.profile.myListings, count: stats.listings, href: '/my-listings' },
    { icon: Heart, label: t.favorites, count: stats.favorites, href: '/favorites' },
    { icon: MessageCircle, label: t.chats, count: 0, href: '/chats' },
    { icon: History, label: t.ai.chatHistory, href: '/ai' },
    { icon: Settings, label: t.profile.settings, href: '/settings' },
  ];

  const handleMenuClick = (href: string) => {
    navigate(href);
  };

  const handleLogout = () => {
    logout();
    navigate('/marketplace');
  };

  return (
    <div className="min-h-screen bg-earth-50 pb-20">
      <div className="container-app py-6 md:py-8">
        <div className="lg:flex lg:gap-8">
          {/* Left column - User info */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl md:rounded-2xl p-6">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary-100 flex items-center justify-center text-4xl overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      '👨‍🌾'
                    )}
                  </div>
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl md:text-2xl font-bold text-earth-900">
                      {user.name || (language === 'uz' ? 'Foydalanuvchi' : 'Пользователь')}
                    </h1>
                    <button 
                      onClick={() => setShowEditModal(true)}
                      className="p-1 hover:bg-earth-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-earth-400" />
                    </button>
                  </div>
                  {user.username && (
                    <p className="text-primary-600 text-sm">@{user.username}</p>
                  )}
                  <p className="text-earth-500 text-sm mt-1">{user.phone}</p>
                  {user.region && (
                    <p className="text-earth-500 text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {user.region}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <button 
                  onClick={() => navigate('/my-listings')}
                  className="text-center p-3 bg-earth-50 rounded-xl hover:bg-earth-100 transition-colors"
                >
                  <p className="text-2xl font-bold text-primary-600">{stats.listings}</p>
                  <p className="text-xs text-earth-500 mt-1">
                    {language === 'uz' ? "E'lonlar" : 'Объявления'}
                  </p>
                </button>
                <div className="text-center p-3 bg-earth-50 rounded-xl">
                  <p className="text-2xl font-bold text-primary-600">{stats.views}</p>
                  <p className="text-xs text-earth-500 mt-1">{t.products.views}</p>
                </div>
                <button 
                  onClick={() => navigate('/favorites')}
                  className="text-center p-3 bg-earth-50 rounded-xl hover:bg-earth-100 transition-colors"
                >
                  <p className="text-2xl font-bold text-primary-600">{stats.favorites}</p>
                  <p className="text-xs text-earth-500 mt-1">{t.favorites}</p>
                </button>
              </div>

              {/* Language Switcher */}
              <div className="mt-6 pt-4 border-t border-earth-100">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-earth-500" />
                  <span className="text-sm font-medium text-earth-700">{t.profile.language}</span>
                </div>
                <LanguageSwitcher />
              </div>

              {/* Create listing button - Desktop */}
              <button 
                onClick={() => navigate('/create')}
                className="hidden lg:flex w-full items-center justify-center gap-2 mt-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {language === 'uz' ? "E'lon qo'shish" : 'Добавить объявление'}
              </button>
            </div>

            {/* Menu - Desktop sidebar */}
            <div className="hidden lg:block bg-white rounded-2xl mt-4 overflow-hidden">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleMenuClick(item.href)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-earth-50 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-earth-500" />
                  <span className="flex-1 text-left font-medium text-earth-900">{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-sm bg-earth-100 text-earth-600">
                      {item.count}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-earth-400" />
                </button>
              ))}
            </div>

            {/* Logout - Desktop */}
            <button 
              onClick={handleLogout}
              className="hidden lg:flex w-full items-center gap-4 px-5 py-4 mt-4 bg-white rounded-2xl text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="flex-1 text-left font-medium">{t.auth.logout}</span>
            </button>
          </div>

          {/* Right column - Content area */}
          <div className="flex-1 mt-6 lg:mt-0">
            {/* Create listing button - Mobile */}
            <button 
              onClick={() => navigate('/create')}
              className="lg:hidden w-full flex items-center justify-center gap-2 mb-4 py-3.5 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {language === 'uz' ? "E'lon qo'shish" : 'Добавить объявление'}
            </button>

            {/* Menu - Mobile/Tablet */}
            <div className="lg:hidden bg-white rounded-xl overflow-hidden">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleMenuClick(item.href)}
                  className="w-full flex items-center gap-4 px-4 py-4 hover:bg-earth-50 active:bg-earth-100 transition-colors border-b border-earth-100 last:border-0"
                >
                  <div className="w-10 h-10 rounded-full bg-earth-100 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-earth-600" />
                  </div>
                  <span className="flex-1 text-left font-medium text-earth-900">{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-sm bg-earth-100 text-earth-600">
                      {item.count}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-earth-400" />
                </button>
              ))}
            </div>

            {/* Logout - Mobile */}
            <div className="lg:hidden mt-4 bg-white rounded-xl overflow-hidden">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-4 text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="flex-1 text-left font-medium">{t.auth.logout}</span>
              </button>
            </div>

            {/* My listings preview - Desktop */}
            <div className="hidden lg:block bg-white rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-earth-900">{t.profile.myListings}</h2>
                <button 
                  onClick={() => navigate('/my-listings')}
                  className="text-primary-600 text-sm font-medium hover:underline"
                >
                  {language === 'uz' ? "Hammasini ko'rish →" : 'Смотреть все →'}
                </button>
              </div>
              
              {stats.listings === 0 ? (
                <div className="text-center py-8 text-earth-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-earth-300" />
                  <p>{t.products.noProducts}</p>
                  <button 
                    onClick={() => navigate('/create')}
                    className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                  >
                    {language === 'uz' ? "Birinchi e'lonni qo'shish" : 'Добавить первое объявление'}
                  </button>
                </div>
              ) : (
                <p className="text-earth-500 text-center py-4">
                  {language === 'uz' 
                    ? `Sizda ${stats.listings} ta e'lon bor` 
                    : `У вас ${stats.listings} объявлений`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Version */}
      <p className="text-center text-earth-400 text-xs py-6">
        Dehqonjon v1.0.0
      </p>

      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
      />
    </div>
  );
}


// Edit Profile Modal Component
function EditProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, token, updateUser } = useAuthStore();
  const { language } = useLanguageStore();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [region, setRegion] = useState(user?.region || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setRegion(user.region || '');
    }
  }, [user]);

  const regions = [
    { uz: 'Toshkent shahri', ru: 'Ташкент' },
    { uz: 'Toshkent viloyati', ru: 'Ташкентская область' },
    { uz: 'Samarqand viloyati', ru: 'Самаркандская область' },
    { uz: "Farg'ona viloyati", ru: 'Ферганская область' },
    { uz: 'Andijon viloyati', ru: 'Андижанская область' },
    { uz: 'Namangan viloyati', ru: 'Наманганская область' },
    { uz: 'Buxoro viloyati', ru: 'Бухарская область' },
    { uz: 'Qashqadaryo viloyati', ru: 'Кашкадарьинская область' },
    { uz: 'Surxondaryo viloyati', ru: 'Сурхандарьинская область' },
    { uz: 'Jizzax viloyati', ru: 'Джизакская область' },
    { uz: 'Sirdaryo viloyati', ru: 'Сырдарьинская область' },
    { uz: 'Xorazm viloyati', ru: 'Хорезмская область' },
    { uz: 'Navoiy viloyati', ru: 'Навоийская область' },
    { uz: "Qoraqalpog'iston", ru: 'Каракалпакстан' },
  ];

  const handleSave = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/me`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ name, username: username || undefined, region }),
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        updateUser({ name: data.name, username: data.username, region: data.region });
        onClose();
      } else {
        setError(data.detail || (language === 'uz' ? 'Xatolik yuz berdi' : 'Произошла ошибка'));
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(language === 'uz' ? 'Xatolik yuz berdi' : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-earth-900 mb-6">
          {language === 'uz' ? 'Profilni tahrirlash' : 'Редактировать профиль'}
        </h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">
              {language === 'uz' ? 'Ism' : 'Имя'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'uz' ? 'Ismingiz' : 'Ваше имя'}
              className="w-full h-12 px-4 rounded-xl border border-earth-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-400">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder={language === 'uz' ? 'username' : 'username'}
                maxLength={20}
                className="w-full h-12 pl-8 pr-4 rounded-xl border border-earth-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <p className="text-xs text-earth-400 mt-1">
              {language === 'uz' ? '3-20 belgi, faqat harflar, raqamlar va _' : '3-20 символов, только буквы, цифры и _'}
            </p>
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">
              {language === 'uz' ? 'Viloyat' : 'Область'}
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-earth-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">{language === 'uz' ? 'Tanlang' : 'Выберите'}</option>
              {regions.map((r, idx) => (
                <option key={idx} value={language === 'uz' ? r.uz : r.ru}>
                  {language === 'uz' ? r.uz : r.ru}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-earth-300 text-earth-700 font-medium rounded-xl hover:bg-earth-50 transition-colors"
          >
            {language === 'uz' ? 'Bekor qilish' : 'Отмена'}
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {isLoading 
              ? (language === 'uz' ? 'Saqlanmoqda...' : 'Сохранение...') 
              : (language === 'uz' ? 'Saqlash' : 'Сохранить')}
          </button>
        </div>
      </div>
    </div>
  );
}
