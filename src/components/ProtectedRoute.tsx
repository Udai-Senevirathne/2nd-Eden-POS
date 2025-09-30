import React, { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserPermissions } from '../utils/permissions';

// Higher-order component for protecting routes
interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: keyof UserPermissions;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  fallback = <div className="p-4 text-center text-red-600">Access Denied: Insufficient permissions</div>
}) => {
  const { isLoggedIn, hasPermission } = useAuth();

  if (!isLoggedIn) {
    return <div className="p-4 text-center text-red-600">Please log in to access this feature</div>;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};