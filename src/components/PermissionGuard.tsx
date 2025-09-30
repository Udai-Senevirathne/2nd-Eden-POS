import React from 'react';
import { hasPermission, UserPermissions } from '../utils/permissions';

// Component for restricting access based on permissions
interface PermissionGuardProps {
  userRole?: string;
  requiredPermission: keyof UserPermissions;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  userRole = 'staff',
  requiredPermission,
  fallback = null,
  children
}) => {
  const hasAccess = hasPermission(userRole, requiredPermission);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Restricted button component
interface RestrictedButtonProps {
  userRole?: string;
  requiredPermission: keyof UserPermissions;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const RestrictedButton: React.FC<RestrictedButtonProps> = ({
  userRole = 'staff',
  requiredPermission,
  onClick,
  className = '',
  children,
  disabled = false
}) => {
  const hasAccess = hasPermission(userRole, requiredPermission);
  const isDisabled = disabled || !hasAccess;
  
  return (
    <button
      onClick={hasAccess ? onClick : undefined}
      disabled={isDisabled}
      className={`${className} ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={!hasAccess ? 'You do not have permission to perform this action' : ''}
    >
      {children}
    </button>
  );
};