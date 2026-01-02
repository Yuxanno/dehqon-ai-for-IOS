import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Store, User, Bot, Heart, MessageCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import AuthModal from '../auth/AuthModal';
import clsx from 'clsx';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { t } = useLanguageStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  const isActive = (path: string) => location.pathname.startsWith(path);
  
  // Скрываем на странице AI чата
  if (location.pathname.startsWith('/ai')) {
    return null;
  }
  
  // Скрываем на странице чатов
  if (location.pathname.startsWith('/chats')) {
    return null;
  }
  
  // Скрываем на странице просмотра товара
  if (location.pathname.startsWith('/product/')) {
    return null;
  }

  const handleNavigate = (path: string, tab: 'marketplace' | 'ai' | 'profile') => {
    setActiveTab(tab);
    navigate(path);
  };

  const handleProtectedNavigate = (
    path: string,
    tab: 'marketplace' | 'ai' | 'profile',
    message: string
  ) => {
    if (isAuthenticated) {
      handleNavigate(path, tab);
    } else {
      setAuthMessage(message);
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <nav className="bottom-nav pb-safe">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {/* Marketplace */}
          <button
            onClick={() => handleNavigate('/marketplace', 'marketplace')}
            className={clsx(
              'flex flex-col items-center justify-center flex-1 h-full',
              'transition-colors duration-150',
              isActive('/marketplace') || isActive('/product')
                ? 'text-primary-600'
                : 'text-earth-500'
            )}
          >
            <Store className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">{t.marketplace}</span>
          </button>

          {/* Favorites */}
          <button
            onClick={() => handleProtectedNavigate('/favorites', 'marketplace', t.auth.loginToAccess)}
            className={clsx(
              'flex flex-col items-center justify-center flex-1 h-full',
              'transition-colors duration-150',
              isActive('/favorites') ? 'text-primary-600' : 'text-earth-500'
            )}
          >
            <Heart className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">{t.favorites}</span>
          </button>

          {/* AI Button */}
          <button
            onClick={() => handleNavigate('/ai', 'ai')}
            className={clsx(
              'ai-button ai-button-pulse',
              isActive('/ai') && 'ring-2 ring-primary-300 ring-offset-2'
            )}
            aria-label={t.aiAssistant}
          >
            <Bot className="w-7 h-7 text-white" />
          </button>

          {/* Chats */}
          <button
            onClick={() => handleProtectedNavigate('/chats', 'profile', t.auth.loginToAccess)}
            className={clsx(
              'flex flex-col items-center justify-center flex-1 h-full',
              'transition-colors duration-150',
              isActive('/chats') ? 'text-primary-600' : 'text-earth-500'
            )}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">{t.chats}</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => handleNavigate('/profile', 'profile')}
            className={clsx(
              'flex flex-col items-center justify-center flex-1 h-full',
              'transition-colors duration-150',
              isActive('/profile') ? 'text-primary-600' : 'text-earth-500'
            )}
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">{t.profileNav}</span>
          </button>
        </div>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={authMessage}
      />
    </>
  );
}
