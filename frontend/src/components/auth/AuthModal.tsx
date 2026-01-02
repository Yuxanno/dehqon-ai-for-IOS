import { useState } from 'react';
import { X, Phone, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { authApi } from '../../services/api';
import clsx from 'clsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  message?: string;
}

type Mode = 'login' | 'register';

export default function AuthModal({ isOpen, onClose, onSuccess, message }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('+998 ');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const { t } = useLanguageStore();

  // Format phone number as user types
  const formatPhone = (value: string) => {
    let digits = value.replace(/[^\d+]/g, '');
    
    if (!digits.startsWith('+998')) {
      digits = '+998' + digits.replace('+', '');
    }
    
    if (digits.length > 13) {
      digits = digits.slice(0, 13);
    }
    
    let formatted = '+998';
    const rest = digits.slice(4);
    
    if (rest.length > 0) formatted += ' ' + rest.slice(0, 2);
    if (rest.length > 2) formatted += ' ' + rest.slice(2, 5);
    if (rest.length > 5) formatted += ' ' + rest.slice(5, 7);
    if (rest.length > 7) formatted += ' ' + rest.slice(7, 9);
    
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
    setError('');
  };

  const handleSubmit = async () => {
    const cleanPhone = phone.replace(/\s/g, '');
    
    // Validate
    if (cleanPhone.length !== 13) {
      setError(t.auth.phoneError);
      return;
    }
    if (password.length < 4) {
      setError(t.auth.passwordError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let response;
      
      if (mode === 'register') {
        response = await authApi.register(cleanPhone, password, name || undefined);
      } else {
        response = await authApi.login(cleanPhone, password);
      }
      
      // Transform API response to our User type
      const user = {
        id: response.user.id,
        phone: response.user.phone,
        name: response.user.name,
        username: (response.user as any).username || null,
        avatarUrl: response.user.avatar_url,
        region: response.user.region,
        role: response.user.role as 'user' | 'seller' | 'admin',
        sellerName: response.user.seller_name,
        sellerType: response.user.seller_type,
        isVerifiedSeller: response.user.is_verified_seller,
      };
      
      setAuth(user, response.token);
      handleClose();
      onSuccess?.();
    } catch (err) {
      setError(mode === 'login' ? t.auth.loginError : t.auth.registerError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMode('login');
    setPhone('+998 ');
    setPassword('');
    setName('');
    setError('');
    setShowPassword(false);
    onClose();
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-earth-400 hover:text-earth-600 rounded-full hover:bg-earth-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-earth-900">
            {mode === 'login' ? t.auth.login : t.auth.register}
          </h2>
          {message && (
            <p className="text-earth-600 mt-2 text-sm">{message}</p>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name - only for register */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">
                {t.auth.name}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.auth.namePlaceholder}
                className="w-full h-12 px-4 rounded-xl border border-earth-300
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">
              {t.auth.phone}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder={t.auth.phonePlaceholder}
              className="w-full h-12 px-4 rounded-xl border border-earth-300 text-lg
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">
              {t.auth.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder={t.auth.passwordPlaceholder}
                className="w-full h-12 px-4 pr-12 rounded-xl border border-earth-300
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-earth-400 hover:text-earth-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={clsx(
              'w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2',
              'transition-all',
              isLoading
                ? 'bg-earth-200 text-earth-400 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600 active:scale-[0.98]'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {mode === 'login' ? t.auth.loginButton : t.auth.registerButton}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Switch mode */}
        <div className="text-center mt-6">
          <button
            onClick={switchMode}
            className="text-primary-600 text-sm hover:underline"
          >
            {mode === 'login' 
              ? `${t.auth.noAccount} ${t.auth.register}` 
              : `${t.auth.hasAccount} ${t.auth.login}`}
          </button>
        </div>
      </div>
    </div>
  );
}
