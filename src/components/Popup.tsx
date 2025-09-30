import React from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

interface PopupProps {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showButtons?: boolean;
}

export const Popup: React.FC<PopupProps> = ({
  isOpen,
  message,
  type,
  title,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showButtons = true
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50',
          iconColor: 'text-green-500',
          borderColor: 'border-green-200',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        };
      case 'error':
        return {
          bgColor: 'bg-red-50',
          iconColor: 'text-red-500',
          borderColor: 'border-red-200',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          iconColor: 'text-yellow-500',
          borderColor: 'border-yellow-200',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-500',
          borderColor: 'border-blue-200',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          iconColor: 'text-gray-500',
          borderColor: 'border-gray-200',
          buttonColor: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  const getIcon = () => {
    const styles = getTypeStyles();
    const iconClass = `w-6 h-6 ${styles.iconColor}`;
    
    switch (type) {
      case 'success':
        return <CheckCircle className={iconClass} />;
      case 'error':
        return <X className={iconClass} />;
      case 'warning':
        return <AlertCircle className={iconClass} />;
      case 'info':
        return <Info className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      default:
        return 'Message';
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border-2 ${styles.borderColor} ${styles.bgColor} animate-popup-in`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            {getIcon()}
            <h3 className="text-lg font-semibold text-gray-900">
              {getTitle()}
            </h3>
          </div>
          
          {/* Message */}
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">
              {message}
            </p>
          </div>
          
          {/* Buttons */}
          {showButtons && (
            <div className="flex space-x-3 justify-end">
              {onConfirm && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${styles.buttonColor}`}
              >
                {confirmText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};