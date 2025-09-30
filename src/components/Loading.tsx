import React from 'react';
import { Loader2, Coffee, Utensils, ShoppingCart, Settings, Database } from 'lucide-react';

interface LoadingProps {
  type?: 'default' | 'coffee' | 'food' | 'cart' | 'settings' | 'database';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  type = 'default',
  size = 'md',
  message,
  fullScreen = false
}) => {
  const getIcon = () => {
    const baseClasses = 'animate-spin';
    let sizeClasses = '';
    
    switch (size) {
      case 'sm':
        sizeClasses = 'w-4 h-4';
        break;
      case 'md':
        sizeClasses = 'w-6 h-6';
        break;
      case 'lg':
        sizeClasses = 'w-8 h-8';
        break;
      case 'xl':
        sizeClasses = 'w-12 h-12';
        break;
    }

    const iconClasses = `${baseClasses} ${sizeClasses}`;

    switch (type) {
      case 'coffee':
        return <Coffee className={iconClasses} />;
      case 'food':
        return <Utensils className={iconClasses} />;
      case 'cart':
        return <ShoppingCart className={iconClasses} />;
      case 'settings':
        return <Settings className={iconClasses} />;
      case 'database':
        return <Database className={iconClasses} />;
      default:
        return <Loader2 className={iconClasses} />;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      case 'xl':
        return 'text-xl';
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-3">
      {/* Animated Icon */}
      <div className="text-blue-500">
        {getIcon()}
      </div>
      
      {/* Loading Message */}
      {message && (
        <p className={`text-gray-600 font-medium ${getTextSize()}`}>
          {message}
        </p>
      )}
      
      {/* Loading Dots Animation */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

// Inline Loading Spinner Component
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={`animate-spin text-current ${sizeClasses[size]}`} />
  );
};

// Button Loading Component
export const LoadingButton: React.FC<{
  children: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}> = ({ 
  children, 
  loading = false, 
  onClick, 
  disabled = false, 
  className = '', 
  type = 'button' 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center justify-center space-x-2 transition-all duration-200 ${
        disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {loading && <LoadingSpinner size="sm" />}
      <span>{loading && typeof children === 'string' ? `${children}...` : children}</span>
    </button>
  );
};