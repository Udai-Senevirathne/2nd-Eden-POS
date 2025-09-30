import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { UserPermissions, hasPermission, canAccessAdminPanel } from '../utils/permissions';
import { useUserPermissions } from '../hooks/usePermissions';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const userRole = user?.role || 'staff';
  const permissions = useUserPermissions(userRole);

  // Load user from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log('🔐 User loaded from storage:', userData);
      } catch (error) {
        console.error('Error loading user from storage:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = (username: string, role: 'admin' | 'manager' | 'staff') => {
    const newUser: User = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username,
      role,
      name: username,
      createdAt: new Date().toISOString(),
    };

    setUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    console.log('🔐 User logged in:', newUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    console.log('🔐 User logged out');
  };

  const checkPermission = (permission: keyof UserPermissions): boolean => {
    return hasPermission(userRole, permission);
  };

  const contextValue: AuthContextType = {
    user,
    userRole,
    permissions,
    login,
    logout,
    isLoggedIn: !!user,
    hasPermission: checkPermission,
    canAccessAdmin: canAccessAdminPanel(userRole),
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;