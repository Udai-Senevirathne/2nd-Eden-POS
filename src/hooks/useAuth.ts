import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';
import { UserPermissions } from '../utils/permissions';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'manager' | 'staff';
  name?: string;
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  userRole: string;
  permissions: UserPermissions;
  login: (username: string, role: 'admin' | 'manager' | 'staff') => void;
  logout: () => void;
  isLoggedIn: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  canAccessAdmin: boolean;
}

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};