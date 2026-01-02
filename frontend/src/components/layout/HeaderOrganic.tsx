import { motion } from 'framer-motion';
import { Search, User, Heart, Leaf } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function HeaderOrganic() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguageStore();
  const { isAuthenticated } = useAuthStore();
  const [searchFocused, setSearchFocused] = useState(false);

  if (location.pathname === '/ai') return null;

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="sticky top-0 z-50"
    >
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-soil-100" />
      
      <div className="relative container-app">
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-growth-400 to-growth-600 flex items-center justify-center shadow-md shadow-growth-500/20">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:block text-lg font-bold text-soil-800">
              Dehqonjon
            </span>
          </motion.div>

          {/* Search - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-6">
            <div className={`
              relative w-full transition-all duration-200
              ${searchFocused ? 'scale-[1.02]' : ''}
            `}>
              <input
                type="text"
                placeholder={language === 'uz' ? 'Qidirish...' : 'Поиск...'}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`
                  w-full h-10 pl-10 pr-4 rounded-xl
                  bg-soil-50 text-soil-700 placeholder:text-soil-400 text-sm
                  border transition-all duration-200
                  focus:outline-none
                  ${searchFocused 
                    ? 'border-growth-400 bg-white shadow-lg shadow-growth-500/10' 
                    : 'border-transparent hover:bg-soil-100'
                  }
                `}
              />
              <Search className={`
                absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors
                ${searchFocused ? 'text-growth-500' : 'text-soil-400'}
              `} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lg:hidden p-2 rounded-xl hover:bg-soil-100 text-soil-500 transition-colors"
            >
              <Search className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/favorites')}
              className="hidden sm:flex p-2 rounded-xl hover:bg-soil-100 text-soil-500 transition-colors"
            >
              <Heart className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-growth-500 text-white text-sm font-medium shadow-md shadow-growth-500/20 hover:bg-growth-600 transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isAuthenticated 
                  ? (language === 'uz' ? 'Profil' : 'Профиль')
                  : (language === 'uz' ? 'Kirish' : 'Войти')
                }
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
