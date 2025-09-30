import React, { useState, useEffect } from 'react';
import { X, Lock, User, Eye, EyeOff } from 'lucide-react';
import { settingsService } from '../services/database';
import { useAuth } from '../hooks/useAuth';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'staff' | 'manager';
  pin: string;
  password?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: User) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
}) => {
  const [credential, setCredential] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const { login } = useAuth();

  // Force refresh user data function
  const refreshUserData = async () => {
    console.log('🔄 FORCE REFRESH - Getting latest user data...');
    setIsLoading(true);
    
    try {
      // Always try database first, then localStorage
      const systemSettings = await settingsService.get('system') as { users?: User[] } | null;
      
      if (systemSettings?.users && Array.isArray(systemSettings.users)) {
        const loadedUsers = systemSettings.users.map(user => ({
          ...user,
          createdAt: new Date(user.createdAt),
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
        }));
        setUsers(loadedUsers);
        console.log('✅ REFRESHED FROM DATABASE:', loadedUsers.map(u => ({ name: u.name, pin: u.pin })));
        return;
      }
      
      // Fallback to localStorage
      const localUsers = localStorage.getItem('systemUsers');
      if (localUsers) {
        const parsed = JSON.parse(localUsers) as User[];
        const loadedUsers = parsed.map((user: User) => ({
          ...user,
          createdAt: new Date(user.createdAt),
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
        }));
        setUsers(loadedUsers);
        console.log('✅ REFRESHED FROM LOCALSTORAGE:', loadedUsers.map(u => ({ name: u.name, pin: u.pin })));
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time event listener for user data updates
  useEffect(() => {
    if (!isOpen) return;

    const handleUserDataUpdate = (event: CustomEvent) => {
      console.log('🚨 REAL-TIME UPDATE: User data changed, refreshing login data...');
      console.log('📊 Updated user data:', event.detail);
      setIsRealTimeActive(true);
      refreshUserData();
      
      // Show real-time indicator briefly
      setTimeout(() => setIsRealTimeActive(false), 2000);
    };

    // Listen for real-time user updates from SettingsComponent
    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);

    // Cleanup event listener
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, [isOpen]);

  // Load users from the user management system
  useEffect(() => {
    const loadUsers = async () => {
      if (!isOpen) return;
      
      console.log('🔄 AdminAuthModal: Starting to load users...');
      
      try {
        setIsLoading(true);
        
        // First, let's test localStorage directly
        const localUsers = localStorage.getItem('systemUsers');
        console.log('💾 localStorage systemUsers raw:', localUsers);
        
        if (localUsers) {
          try {
            const parsedLocal = JSON.parse(localUsers);
            console.log('💾 localStorage parsed users:', parsedLocal.map((u: User) => ({ name: u.name, pin: u.pin, role: u.role })));
          } catch (e) {
            console.error('💾 localStorage parse error:', e);
          }
        }
        
        // Try to get users from the system settings (from user management)
        const systemSettings = await settingsService.get('system') as { 
          users?: User[];
          adminPin?: string; 
          staffPins?: string[];
        } | null;

        console.log('🔍 AdminAuthModal: Raw system settings:', systemSettings);

        let loadedUsers: User[] = [];

        if (systemSettings?.users && Array.isArray(systemSettings.users)) {
          // Load users from the modern user management system
          loadedUsers = systemSettings.users.map(user => ({
            ...user,
            createdAt: new Date(user.createdAt),
            lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
          }));
          console.log('✅ AdminAuthModal: Loaded users from database:', loadedUsers.map(u => ({ name: u.name, role: u.role, password: u.password })));
        } else {
          // Fallback: Create default admin user only if no user management exists
          console.log('⚠️  No user management system found, creating default admin user');
          loadedUsers.push({
            id: 'admin-default',
            name: 'Administrator',
            role: 'admin',
            pin: '1234',
            password: 'admin123',
            isActive: true,
            createdAt: new Date(),
          });
        }

        setUsers(loadedUsers);
        if (loadedUsers.length > 0) {
          console.log('� Admin PIN should be:', loadedUsers.find(u => u.role === 'admin')?.pin);
        }
      } catch (err) {
        console.warn('Could not load users from database, trying localStorage:', err);
        
        // Fallback to localStorage
        try {
          const localUsers = localStorage.getItem('systemUsers');
          if (localUsers) {
            const parsed = JSON.parse(localUsers) as User[];
            const loadedUsers = parsed.map((user: User) => ({
              ...user,
              createdAt: new Date(user.createdAt),
              lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
            }));
            setUsers(loadedUsers);
            console.log('✅ AdminAuthModal: Loaded users from localStorage fallback:', loadedUsers.map(u => ({ name: u.name, role: u.role, pin: u.pin })));
          } else {
            // Create default admin user if nothing is found
            setUsers([{
              id: 'admin-default',
              name: 'Administrator',
              role: 'admin',
              pin: '1234',
              password: 'admin123',
              isActive: true,
              createdAt: new Date(),
            }]);
          }
        } catch (localError) {
          console.error('Failed to load from localStorage:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadUsers();
    }
    
    // Reset form when modal opens
    if (isOpen) {
      setCredential('');
      setError('');
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    console.log('🚀 Starting authentication process...');
    console.log('📝 Password entered:', credential);
    console.log(' Total users loaded:', users.length);
    
    try {
      // Allow all active users to login (admin, manager, staff)
      const activeUsers = users.filter(user => user.isActive);
      console.log('🔐 Multi-user login mode - Active users:', activeUsers.length);
      console.log('👥 Available users:', activeUsers.map(u => ({ name: u.name, role: u.role })));
      
      let authenticatedUser: User | null = null;

      // Password authentication for all active users
      console.log('🔐 PASSWORD CHECK:');
      console.log('- You entered:', credential);
      console.log('- All users and their passwords:');
      activeUsers.forEach(user => {
        console.log(`  ${user.name || 'Unnamed'} (${user.role}): "${user.password}"`);
      });
      
      // Check against all active users
      authenticatedUser = activeUsers.find(user => {
        const userPassword = String(user.password || '').trim();
        const enteredPassword = String(credential || '').trim();
        
        console.log(`Testing ${user.name || 'Unnamed'} (${user.role}): "${userPassword}" === "${enteredPassword}" = ${userPassword === enteredPassword}`);
        
        return userPassword === enteredPassword;
      }) || null;
      
      console.log('🎯 LOGIN RESULT:', authenticatedUser ? `✅ SUCCESS: ${authenticatedUser.name} (${authenticatedUser.role})` : '❌ FAILED');

      if (authenticatedUser) {
        // Update last login time
        const updatedUser = {
          ...authenticatedUser,
          lastLogin: new Date()
        };

        // Update the users array with new last login
        const updatedUsers = users.map(user => 
          user.id === authenticatedUser!.id ? updatedUser : user
        );

        // Save updated users back to database
        try {
          const systemSettings = await settingsService.get('system') as Record<string, unknown> || {};
          await settingsService.set('system', {
            ...systemSettings,
            users: updatedUsers.map(user => ({
              ...user,
              createdAt: user.createdAt.toISOString(),
              lastLogin: user.lastLogin?.toISOString()
            }))
          });
        } catch (saveError) {
          console.warn('Could not save to database, using localStorage:', saveError);
          localStorage.setItem('systemUsers', JSON.stringify(updatedUsers.map(user => ({
            ...user,
            createdAt: user.createdAt.toISOString(),
            lastLogin: user.lastLogin?.toISOString()
          }))));
        }

        // Update global authentication state
        login(authenticatedUser.name, authenticatedUser.role);

        // Call authentication success with user data
        onAuthenticated(updatedUser);
        setCredential('');
        setError('');
      } else {
        setError('Invalid password. Please try again.');
        setCredential('');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialChange = (value: string) => {
    console.log('📝 Input change - Raw value:', `"${value}"`, 'Type:', typeof value);
    
    // Password mode - allow any characters
    setCredential(value);
    setError('');
    console.log('✅ Password input accepted:', `"${value}"`);
  };

  // Show all active users (admin, manager, staff)
  const activeUsers = users.filter(user => user.isActive);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Admin Access</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={credential}
                      onChange={(e) => handleCredentialChange(e.target.value)}
                      placeholder="Password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent text-left pr-12"
                      maxLength={50}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!credential || isLoading}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    credential && !isLoading
                      ? 'bg-gray-900 hover:bg-gray-800 text-white transform hover:scale-105 shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? 'Authenticating...' : 'Access Admin Panel'}
                </button>
              </form>

              {/* User Information - All Active Users */}
              {activeUsers.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-800">Available Users ({activeUsers.length} active)</h4>
                    <button
                      onClick={() => refreshUserData()}
                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-100 rounded"
                    >
                      Refresh Data
                    </button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {activeUsers.slice(0, 4).map((user: User) => (
                      <div key={user.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{user.name || 'Unnamed User'}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === 'admin' ? 'bg-red-100 text-red-700' :
                          user.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    ))}
                    {activeUsers.length > 4 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{activeUsers.length - 4} more users
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-gray-500 text-center border-t pt-3">
                    <div className="flex items-center justify-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${isRealTimeActive ? 'bg-blue-400 animate-ping' : 'bg-green-400 animate-pulse'}`}></div>
                      <span>{isRealTimeActive ? 'Updating...' : 'Real-time sync active'} • All user access</span>
                    </div>
                    <div className="mt-1">
                      Use your password to login
                    </div>
                  </div>
                </div>
              )}

              {activeUsers.length === 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="text-center">
                    <Lock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">No Active Users Found</h4>
                    <p className="text-xs text-yellow-600">
                      Please create users in Settings → Users to access the system.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
