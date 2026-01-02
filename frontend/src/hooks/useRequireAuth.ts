import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Hook for requiring authentication before an action
 * Returns: { requireAuth, AuthModal component props }
 */
export function useRequireAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [message, setMessage] = useState('Войдите, чтобы продолжить');

  const requireAuth = useCallback(
    (action: () => void, customMessage?: string) => {
      if (isAuthenticated) {
        action();
      } else {
        setPendingAction(() => action);
        setMessage(customMessage || 'Войдите, чтобы продолжить');
        setShowModal(true);
      }
    },
    [isAuthenticated]
  );

  const handleSuccess = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const handleClose = useCallback(() => {
    setShowModal(false);
    setPendingAction(null);
  }, []);

  return {
    requireAuth,
    isAuthenticated,
    authModalProps: {
      isOpen: showModal,
      onClose: handleClose,
      onSuccess: handleSuccess,
      message,
    },
  };
}
