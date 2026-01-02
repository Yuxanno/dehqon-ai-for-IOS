import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import AuthModal from './AuthModal';

interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  message?: string;
}

/**
 * Wrapper component that shows auth modal if user is not authenticated
 * Usage: <RequireAuth message="Войдите, чтобы добавить в избранное"><Button>...</Button></RequireAuth>
 */
export default function RequireAuth({ children, fallback, message }: RequireAuthProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAuthModal(true);
  };

  return (
    <>
      <div onClick={handleClick} className="cursor-pointer">
        {fallback || children}
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={message || 'Войдите, чтобы продолжить'}
      />
    </>
  );
}
