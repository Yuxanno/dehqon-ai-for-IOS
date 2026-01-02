import { motion } from 'framer-motion';
import { Store, Heart, Bot, MessageCircle, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useState } from 'react';
import AuthModal from '../auth/AuthModal';

export default function BottomNavOrganic() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguageStore();
  const { isAuthenticated } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (location.pathname === '/ai') return null;
  
  // Hide on product detail page
  if (location.pathname.startsWith('/product/')) return null;

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleProtectedNav = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      setShowAuthModal(true);
    }
  };

  const navItems = [
    { path: '/marketplace', icon: Store, label: t.marketplace },
    { path: '/favorites', icon: Heart, label: t.favorites, protected: true },
    { path: '/ai', icon: Bot, label: 'AI', isAI: true },
    { path: '/chats', icon: MessageCircle, label: t.chats, protected: true },
    { path: '/profile', icon: User, label: t.profileNav },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      >
        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-soil-100" />
        
        <div className="relative flex items-center justify-around h-16 max-w-md mx-auto px-2 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            if (item.isAI) {
              return (
                <motion.button
                  key={item.path}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(item.path)}
                  className="relative -mt-5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-growth-400 to-growth-600 flex items-center justify-center shadow-lg shadow-growth-500/30">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </motion.button>
              );
            }

            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.9 }}
                onClick={() => item.protected ? handleProtectedNav(item.path) : navigate(item.path)}
                className="flex flex-col items-center justify-center flex-1 py-2"
              >
                <div className={`
                  p-1.5 rounded-xl transition-all duration-200
                  ${active ? 'text-growth-600' : 'text-soil-400'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`
                  text-[10px] mt-0.5 font-medium transition-colors
                  ${active ? 'text-growth-600' : 'text-soil-400'}
                `}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={t.auth.loginToAccess}
      />
    </>
  );
}
