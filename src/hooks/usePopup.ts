import { useState } from 'react';

interface PopupOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  showButtons?: boolean;
}

interface PopupState {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  confirmText?: string;
  cancelText?: string;
  showButtons?: boolean;
  onConfirm?: () => void;
}

export const usePopup = () => {
  const [popup, setPopup] = useState<PopupState>({
    isOpen: false,
    message: '',
    type: 'info',
    showButtons: true
  });

  const showPopup = (
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    options?: PopupOptions
  ) => {
    setPopup({
      isOpen: true,
      message,
      type,
      title: options?.title,
      confirmText: options?.confirmText || 'OK',
      cancelText: options?.cancelText || 'Cancel',
      showButtons: options?.showButtons !== false,
      onConfirm: undefined
    });
  };

  const showConfirmPopup = (
    message: string,
    onConfirm: () => void,
    type: 'success' | 'error' | 'info' | 'warning' = 'warning',
    options?: PopupOptions
  ) => {
    setPopup({
      isOpen: true,
      message,
      type,
      title: options?.title,
      confirmText: options?.confirmText || 'Confirm',
      cancelText: options?.cancelText || 'Cancel',
      showButtons: true,
      onConfirm
    });
  };

  const closePopup = () => {
    setPopup(prev => ({ ...prev, isOpen: false }));
  };

  // Convenience methods
  const showSuccess = (message: string, options?: PopupOptions) => {
    showPopup(message, 'success', options);
  };

  const showError = (message: string, options?: PopupOptions) => {
    showPopup(message, 'error', options);
  };

  const showInfo = (message: string, options?: PopupOptions) => {
    showPopup(message, 'info', options);
  };

  const showWarning = (message: string, options?: PopupOptions) => {
    showPopup(message, 'warning', options);
  };

  return {
    popup,
    showPopup,
    showConfirmPopup,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    closePopup
  };
};