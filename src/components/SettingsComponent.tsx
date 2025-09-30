import React, { useState, useEffect } from 'react';
import { Save, Building, DollarSign, Printer, Users, Palette, Settings as SettingsIcon, Bell, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { settingsService } from '../services/database';
import { usePopup } from '../hooks/usePopup';
import { Popup } from './Popup';

interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  logoUrl: string;
  operatingHours: {
    open: string;
    close: string;
  };
  taxRate: number;
  serviceCharge: number;
  currency: string;
  autoTax: boolean;
}

interface ReceiptSettings {
  headerText: string;
  footerText: string;
  paperSize: 'thermal-58mm' | 'thermal-80mm' | 'a4';
  autoPrint: boolean;
  showLogo: boolean;
}

interface SystemSettings {
  adminPin: string;
  staffPins: string[];
  orderPrefix: string;
  theme: 'light' | 'dark' | 'blue' | 'green';
  fontSize: 'small' | 'medium' | 'large';
  language: 'en' | 'es' | 'fr';
  soundEnabled: boolean;
}

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

interface NotificationSettings {
  lowStockAlert: boolean;
  dailySummary: boolean;
  paymentSounds: boolean;
  orderSounds: boolean;
}

interface SettingsComponentProps {
  onSaveSettings: (settings: {
    restaurant: RestaurantSettings;
    receipt: ReceiptSettings;
    system: SystemSettings;
    notifications: NotificationSettings;
  }) => void;
}

type SettingsTab = 'restaurant' | 'financial' | 'receipt' | 'users' | 'interface' | 'system' | 'notifications';

export const SettingsComponent: React.FC<SettingsComponentProps> = ({ onSaveSettings }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('restaurant');
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize popup functionality
  const { popup, showSuccess, showError, closePopup } = usePopup();
  
  // Restaurant Settings
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>({
    name: '2nd Eden Restaurant',
    address: '123 Main Street, City, State 12345',
    phone: '+1 (555) 123-4567',
    logoUrl: '',
    operatingHours: {
      open: '09:00',
      close: '22:00'
    },
    taxRate: 8.5,
    serviceCharge: 0,
    currency: 'USD',
    autoTax: true
  });

  // Receipt Settings
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    headerText: 'Thank you for dining with us!',
    footerText: 'Please come again soon!',
    paperSize: 'thermal-80mm',
    autoPrint: true,
    showLogo: true
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    adminPin: '1234',
    staffPins: ['0000', '1111'],
    orderPrefix: '#',
    theme: 'light',
    fontSize: 'medium',
    language: 'en',
    soundEnabled: true
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    lowStockAlert: true,
    dailySummary: true,
    paymentSounds: true,
    orderSounds: true
  });

  // User Management States
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Administrator',
      role: 'admin',
      pin: '1234',
      password: 'admin123',
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date()
    }
  ]);
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [savingUsers, setSavingUsers] = useState(false);

  // Load settings from database on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        
        // Try to load from database first
        try {
          const settings = await settingsService.getAll();
          
          // Update state with loaded settings
          const settingsRecord = settings as Record<string, unknown>;
          
          if (settingsRecord.restaurant) {
            setRestaurantSettings(settingsRecord.restaurant as RestaurantSettings);
          }
          if (settingsRecord.receipt) {
            setReceiptSettings(settingsRecord.receipt as ReceiptSettings);
          }
          if (settingsRecord.system) {
            const systemData = settingsRecord.system as SystemSettings & { users?: User[] };
            setSystemSettings(systemData);
            
            // Load users from system settings for real-time authentication
            if (systemData.users && Array.isArray(systemData.users)) {
              const loadedUsers = systemData.users.map(user => ({
                ...user,
                createdAt: new Date(user.createdAt),
                lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
              }));
              setUsers(loadedUsers);
              console.log('✅ Loaded users from system settings:', loadedUsers.length);
              console.log('👥 User details:', loadedUsers.map(u => ({ name: u.name, role: u.role, id: u.id })));
            } else {
              console.log('⚠️ No users found in system settings, checking localStorage...');
              // Try loading from localStorage if no users in database
              const systemUsers = localStorage.getItem('systemUsers');
              if (systemUsers) {
                try {
                  const parsedUsers = JSON.parse(systemUsers) as User[];
                  const loadedUsers = parsedUsers.map((user: User) => ({
                    ...user,
                    createdAt: new Date(user.createdAt),
                    lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
                  }));
                  setUsers(loadedUsers);
                  console.log('✅ Loaded users from localStorage fallback:', loadedUsers.length);
                } catch (parseError) {
                  console.error('❌ Error parsing users from localStorage:', parseError);
                }
              } else {
                console.log('⚠️ No users found in localStorage either, starting fresh');
              }
            }
          }
          if (settingsRecord.notifications) {
            setNotificationSettings(settingsRecord.notifications as NotificationSettings);
          }
        } catch (dbError) {
          console.warn('Database load failed, trying localStorage fallback:', dbError);
          
          // Fallback to localStorage
          const restaurantData = localStorage.getItem('restaurantSettings');
          const receiptData = localStorage.getItem('receiptSettings');
          const userData = localStorage.getItem('userSettings');
          const notificationData = localStorage.getItem('notificationSettings');
          const systemUsers = localStorage.getItem('systemUsers');
          
          if (restaurantData) {
            setRestaurantSettings(JSON.parse(restaurantData));
          }
          if (receiptData) {
            setReceiptSettings(JSON.parse(receiptData));
          }
          if (userData) {
            setSystemSettings(JSON.parse(userData));
          }
          if (notificationData) {
            setNotificationSettings(JSON.parse(notificationData));
          }
          
          // Load users from localStorage for real-time authentication
          if (systemUsers) {
            try {
              const parsedUsers = JSON.parse(systemUsers) as User[];
              const loadedUsers = parsedUsers.map((user: User) => ({
                ...user,
                createdAt: new Date(user.createdAt),
                lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
              }));
              setUsers(loadedUsers);
              console.log('✅ Loaded users from localStorage:', loadedUsers.length);
            } catch (userError) {
              console.error('Error parsing users from localStorage:', userError);
            }
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        // Settings will use default values if loading fails
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const tabs = [
    { id: 'restaurant', name: 'Restaurant Info', icon: Building },
    { id: 'financial', name: 'Financial', icon: DollarSign },
    { id: 'receipt', name: 'Receipt', icon: Printer },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'interface', name: 'Interface', icon: Palette },
    { id: 'system', name: 'System', icon: SettingsIcon },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  // Restaurant settings handled individually by each input component

  const handleSaveUsers = async () => {
    try {
      setIsLoading(true);
      
      // Try to save to database first
      try {
        await settingsService.set('system', systemSettings);
      } catch (dbError) {
        console.warn('Database save failed, using localStorage fallback:', dbError);
        // Fallback to localStorage if database fails
        localStorage.setItem('userSettings', JSON.stringify(systemSettings));
      }
      
      // Always call the legacy handler for compatibility
      const allSettings = {
        restaurant: restaurantSettings,
        receipt: receiptSettings,
        system: systemSettings,
        notifications: notificationSettings
      };
      onSaveSettings(allSettings);
      showSuccess('User settings saved successfully!');
    } catch (err) {
      console.error('Error saving user settings:', err);
      showError('Failed to save user settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // User Management Functions
  const updateUser = async (userId: string, updates: Partial<User>) => {
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, ...updates } : user
    );
    setUsers(updatedUsers);
    
    // Save immediately to system settings for real-time login authentication
    await saveUsersToSystem(updatedUsers);
  };

  const deleteUser = async (userId: string) => {
    if (users.length <= 1) {
      showError('Cannot delete the last user. At least one user must remain.');
      return;
    }
    
    const updatedUsers = users.filter(user => user.id !== userId);
    setUsers(updatedUsers);
    
    // Save immediately to system settings
    await saveUsersToSystem(updatedUsers);
    showSuccess('User deleted successfully!');
  };

  const addNewUser = async (role: 'admin' | 'manager' | 'staff' = 'staff') => {
    console.log('🆕 CREATING NEW USER:', role);
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: '',
      role: role,
      pin: generateRandomPin(), // Still needed for data structure
      password: generateRandomPassword(),
      isActive: true,
      createdAt: new Date(),
    };

    console.log('👤 New user object:', newUser);
    
    const updatedUsers = [...users, newUser];
    console.log('📊 Updated users array length:', updatedUsers.length);
    
    setUsers(updatedUsers);
    setEditingUser(newUser.id);
    
    try {
      // Save immediately to system settings
      console.log('💾 Attempting to save users to system...');
      await saveUsersToSystem(updatedUsers);
      console.log('✅ Users successfully saved to system');
      showSuccess(`New ${role} user added and ready for login!`);
    } catch (error) {
      console.error('❌ Error in addNewUser:', error);
      showError(`Failed to save new ${role} user. Please try again.`);
    }
  };

  // Save users to system settings for real-time authentication
  const saveUsersToSystem = async (usersToSave: User[]) => {
    console.log('💾 SAVE USERS TO SYSTEM - Starting...');
    console.log('📝 Users to save:', usersToSave.length);
    
    setSavingUsers(true);
    try {
      // Get current system settings first
      console.log('🔍 Getting current system settings...');
      const currentSystemSettings = await settingsService.get('system') as Record<string, unknown> || {};
      console.log('📋 Current system settings keys:', Object.keys(currentSystemSettings));
      
      // Prepare user data for saving
      const userDataForSaving = usersToSave.map(user => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString()
      }));
      
      console.log('💾 Attempting database save...');
      // Save to database/settings
      await settingsService.set('system', {
        ...currentSystemSettings,
        users: userDataForSaving
      });
      console.log('✅ Database save successful');
      
      console.log('💾 Saving to localStorage backup...');
      // Also save to localStorage as backup for immediate access
      localStorage.setItem('systemUsers', JSON.stringify(userDataForSaving));
      console.log('✅ localStorage save successful');
      
      console.log('✅ Users saved to system - login authentication updated in real-time');
      console.log('📊 Saved users:', usersToSave.map(u => ({ name: u.name, role: u.role, password: u.password })));
      
      // Trigger real-time update event for admin login modal
      window.dispatchEvent(new CustomEvent('userDataUpdated', { 
        detail: { users: usersToSave, timestamp: new Date() } 
      }));
      console.log('📡 Real-time update event dispatched');
    } catch (error) {
      console.error('❌ Error saving users to system:', error);
      console.error('📋 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Fallback to localStorage only
      console.log('⚠️ Attempting localStorage fallback...');
      try {
        localStorage.setItem('systemUsers', JSON.stringify(usersToSave.map(user => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
          lastLogin: user.lastLogin?.toISOString()
        }))));
        console.log('✅ Fallback localStorage save successful');
      } catch (fallbackError) {
        console.error('❌ Even localStorage fallback failed:', fallbackError);
      }
    } finally {
      setSavingUsers(false);
      console.log('🏁 Save operation completed');
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const renderUserSettings = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">User Management</h3>
          <p className="text-sm text-gray-600 mt-1">Manage system users, roles, and authentication credentials</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => addNewUser('admin')}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Admin</span>
          </button>
          <button
            onClick={() => addNewUser('manager')}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manager</span>
          </button>
          <button
            onClick={() => addNewUser('staff')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-medium text-gray-900">System Users</h4>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-sm text-gray-600">{users.filter(u => u.isActive).length} active users • {users.length} total users</p>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Real-time sync</span>
                </div>
              </div>
            </div>
            {savingUsers && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Syncing...</span>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className={`${user.isActive ? '' : 'opacity-60 bg-gray-50'}`}>
                  {/* User Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-3 w-3 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                      <div className="ml-3">
                        {editingUser === user.id ? (
                          <input
                            type="text"
                            value={user.name}
                            onChange={(e) => updateUser(user.id, { name: e.target.value })}
                            className="text-sm font-medium text-gray-900 border-b border-gray-300 focus:border-blue-500 bg-transparent outline-none"
                            placeholder="Enter user name"
                          />
                        ) : (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser === user.id ? (
                      <select
                        value={user.role}
                        onChange={(e) => updateUser(user.id, { role: e.target.value as 'admin' | 'staff' | 'manager' })}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    )}
                  </td>

                  {/* Password */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <input
                          type={showPasswords[user.id] ? 'text' : 'password'}
                          value={user.password || ''}
                          onChange={(e) => updateUser(user.id, { password: e.target.value })}
                          className={`text-sm w-24 px-2 py-1 border rounded pr-8 ${
                            editingUser === user.id ? 'border-gray-300' : 'border-transparent bg-gray-100'
                          }`}
                          placeholder="Password"
                          disabled={editingUser !== user.id}
                        />
                        <button
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          title={showPasswords[user.id] ? 'Hide password' : 'Show password'}
                        >
                          {showPasswords[user.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                      {editingUser === user.id && (
                        <button
                          onClick={() => updateUser(user.id, { password: generateRandomPassword() })}
                          className="text-xs text-blue-600 hover:text-blue-800 px-1"
                          title="Generate random password"
                        >
                          <div className="w-4 h-4 border border-current rounded flex items-center justify-center">⟲</div>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Last Login */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {editingUser === user.id ? (
                        <>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingUser(user.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit user"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                            className={`${user.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                            title={user.isActive ? 'Deactivate user' : 'Activate user'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {user.isActive ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-400 mb-4">
              <Users className="w-12 h-12 mx-auto" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No users found</h4>
            <p className="text-sm text-gray-600 mb-4">Get started by creating your first user account.</p>
            <button
              onClick={() => addNewUser()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First User
            </button>
          </div>
        )}
      </div>

      {/* Real-Time Authentication Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${savingUsers ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></div>
            <h4 className="font-medium text-green-900">Real-Time Login System</h4>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            savingUsers ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
          }`}>
            {savingUsers ? 'Syncing...' : 'Active'}
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-green-800 mb-2">Current Status:</h5>
            <ul className="space-y-1 text-green-700">
              <li>• Users authenticate instantly after creation</li>
              <li>• PIN and password changes apply immediately</li>
              <li>• Login system syncs with user management</li>
              <li>• Session tracking and last login updates</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-green-800 mb-2">Active Users Summary:</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Users:</span>
                <span className="font-medium">{users.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Users:</span>
                <span className="font-medium text-green-600">{users.filter(u => u.isActive).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Admin Users:</span>
                <span className="font-medium text-red-600">{users.filter(u => u.role === 'admin' && u.isActive).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Authentication Guide</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Login Methods:</h5>
            <ul className="space-y-1">
              <li>• <strong>PIN:</strong> 4-digit numeric code for quick access</li>
              <li>• <strong>Password:</strong> Alphanumeric for enhanced security</li>
              <li>• Changes apply immediately to login system</li>
              <li>• Both methods work independently</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 mb-2">User Roles:</h5>
            <ul className="space-y-1">
              <li>• <strong>Admin:</strong> Full system access and user management</li>
              <li>• <strong>Manager:</strong> Store operations and limited settings</li>
              <li>• <strong>Staff:</strong> Basic POS operations only</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Save Button for User Settings */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={handleSaveUsers}
          disabled={isLoading}
          className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          <Save className="w-4 h-4" />
          <span>{isLoading ? 'Saving...' : 'Save User Settings'}</span>
        </button>
      </div>
    </div>
  );

  const renderRestaurantSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Restaurant Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Restaurant Name
          </label>
          <input
            type="text"
            value={restaurantSettings.name}
            onChange={(e) => setRestaurantSettings(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="text"
            value={restaurantSettings.phone}
            onChange={(e) => setRestaurantSettings(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            value={restaurantSettings.address}
            onChange={(e) => setRestaurantSettings(prev => ({ ...prev, address: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo URL
          </label>
          <input
            type="url"
            value={restaurantSettings.logoUrl}
            onChange={(e) => setRestaurantSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={restaurantSettings.currency}
            onChange={(e) => setRestaurantSettings(prev => ({ ...prev, currency: e.target.value }))}
          onBlur={async () => {
            try {
              await settingsService.set('restaurant', restaurantSettings);
              // Also save to localStorage as backup
              localStorage.setItem('currency', restaurantSettings.currency);
              console.log('Currency updated to:', restaurantSettings.currency);
            } catch (error) {
              console.error('Error saving currency:', error);
              // Fallback to localStorage only
              localStorage.setItem('currency', restaurantSettings.currency);
            }
          }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="USD">USD ($)</option>
            <option value="LKR">LKR (Rs)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opening Time
          </label>
          <input
            type="time"
            value={restaurantSettings.operatingHours.open}
            onChange={(e) => setRestaurantSettings(prev => ({ 
              ...prev, 
              operatingHours: { ...prev.operatingHours, open: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Closing Time
          </label>
          <input
            type="time"
            value={restaurantSettings.operatingHours.close}
            onChange={(e) => setRestaurantSettings(prev => ({ 
              ...prev, 
              operatingHours: { ...prev.operatingHours, close: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={async () => {
            try {
              setIsLoading(true);
              console.log('Attempting to save restaurant settings:', restaurantSettings);
              
              // Try to save to database first
              try {
                await settingsService.set('restaurant', restaurantSettings);
                console.log('Successfully saved to database');
              } catch (dbError) {
                console.warn('Database save failed, using localStorage fallback:', dbError);
                // Fallback to localStorage if database fails
                localStorage.setItem('restaurantSettings', JSON.stringify(restaurantSettings));
              }
              
              // Always save currency to localStorage for immediate access
              localStorage.setItem('currency', restaurantSettings.currency);
              
              showSuccess('Restaurant settings saved successfully!');
            } catch (error) {
              console.error('Error saving restaurant settings:', error);
              showError('Error saving restaurant settings. Settings saved locally as backup.');
              // Even if there's an error, save to localStorage as backup
              try {
                localStorage.setItem('restaurantSettings', JSON.stringify(restaurantSettings));
                localStorage.setItem('currency', restaurantSettings.currency);
              } catch (localError) {
                console.error('Even localStorage failed:', localError);
              }
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
          className={`px-6 py-2 ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg flex items-center space-x-2 transition-colors`}
        >
          <Save className="w-4 h-4" />
          <span>{isLoading ? 'Saving...' : 'Save Restaurant Info'}</span>
        </button>
      </div>
    </div>
  );

  const renderFinancialSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Financial Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={restaurantSettings.taxRate}
            onChange={(e) => setRestaurantSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Charge (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={restaurantSettings.serviceCharge}
            onChange={(e) => setRestaurantSettings(prev => ({ ...prev, serviceCharge: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="md:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoTax"
              checked={restaurantSettings.autoTax}
              onChange={(e) => setRestaurantSettings(prev => ({ ...prev, autoTax: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoTax" className="ml-2 block text-sm text-gray-900">
              Automatically apply tax to all items
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={async () => {
            try {
              await settingsService.set('restaurant', restaurantSettings);
              showSuccess('Financial settings saved successfully!');
            } catch (error) {
              console.error('Error saving financial settings:', error);
              showError('Error saving financial settings');
            }
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Financial Settings</span>
        </button>
      </div>
    </div>
  );

  const renderReceiptSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Receipt Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Header Text
          </label>
          <input
            type="text"
            value={receiptSettings.headerText}
            onChange={(e) => setReceiptSettings(prev => ({ ...prev, headerText: e.target.value }))}
            onBlur={async () => {
              try {
                await settingsService.set('receipt', receiptSettings);
                console.log('Receipt header text auto-saved');
              } catch (error) {
                console.warn('Auto-save failed, using localStorage:', error);
                localStorage.setItem('receipt', JSON.stringify(receiptSettings));
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Thank you for dining with us!"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Footer Text
          </label>
          <input
            type="text"
            value={receiptSettings.footerText}
            onChange={(e) => setReceiptSettings(prev => ({ ...prev, footerText: e.target.value }))}
            onBlur={async () => {
              try {
                await settingsService.set('receipt', receiptSettings);
                console.log('Receipt footer text auto-saved');
              } catch (error) {
                console.warn('Auto-save failed, using localStorage:', error);
                localStorage.setItem('receipt', JSON.stringify(receiptSettings));
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Please come again soon!"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paper Size
          </label>
          <select
            value={receiptSettings.paperSize}
            onChange={async (e) => {
              const newPaperSize = e.target.value as 'thermal-58mm' | 'thermal-80mm' | 'a4';
              setReceiptSettings(prev => ({ ...prev, paperSize: newPaperSize }));
              try {
                await settingsService.set('receipt', { ...receiptSettings, paperSize: newPaperSize });
                console.log('Paper size auto-saved:', newPaperSize);
              } catch (error) {
                console.warn('Auto-save failed, using localStorage:', error);
                localStorage.setItem('receipt', JSON.stringify({ ...receiptSettings, paperSize: newPaperSize }));
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="thermal-58mm">Thermal 58mm (Small)</option>
            <option value="thermal-80mm">Thermal 80mm (Standard)</option>
            <option value="a4">A4 Paper (Large)</option>
          </select>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoPrint"
              checked={receiptSettings.autoPrint}
              onChange={async (e) => {
                const newAutoPrint = e.target.checked;
                setReceiptSettings(prev => ({ ...prev, autoPrint: newAutoPrint }));
                try {
                  await settingsService.set('receipt', { ...receiptSettings, autoPrint: newAutoPrint });
                  console.log('Auto print setting auto-saved:', newAutoPrint);
                } catch (error) {
                  console.warn('Auto-save failed, using localStorage:', error);
                  localStorage.setItem('receipt', JSON.stringify({ ...receiptSettings, autoPrint: newAutoPrint }));
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoPrint" className="ml-2 block text-sm text-gray-900">
              Auto print receipts after payment
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showLogo"
              checked={receiptSettings.showLogo}
              onChange={async (e) => {
                const newShowLogo = e.target.checked;
                setReceiptSettings(prev => ({ ...prev, showLogo: newShowLogo }));
                try {
                  await settingsService.set('receipt', { ...receiptSettings, showLogo: newShowLogo });
                  console.log('Show logo setting auto-saved:', newShowLogo);
                } catch (error) {
                  console.warn('Auto-save failed, using localStorage:', error);
                  localStorage.setItem('receipt', JSON.stringify({ ...receiptSettings, showLogo: newShowLogo }));
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showLogo" className="ml-2 block text-sm text-gray-900">
              Show logo on receipt
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={async () => {
            try {
              await settingsService.set('receipt', receiptSettings);
              showSuccess('Receipt settings saved successfully!');
            } catch (error) {
              console.error('Error saving receipt settings:', error);
              showError('Error saving receipt settings');
            }
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Receipt Settings</span>
        </button>
      </div>
    </div>
  );

  const renderInterfaceSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Interface Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            value={systemSettings.theme}
            onChange={(e) => setSystemSettings(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' | 'blue' | 'green' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Font Size
          </label>
          <select
            value={systemSettings.fontSize}
            onChange={(e) => setSystemSettings(prev => ({ ...prev, fontSize: e.target.value as 'small' | 'medium' | 'large' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={systemSettings.language}
            onChange={(e) => setSystemSettings(prev => ({ ...prev, language: e.target.value as 'en' | 'es' | 'fr' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>
        
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="soundEnabled"
              checked={systemSettings.soundEnabled}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="soundEnabled" className="ml-2 block text-sm text-gray-900">
              Enable sound effects
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={async () => {
            try {
              await settingsService.set('system', systemSettings);
              showSuccess('Interface settings saved successfully!');
            } catch (error) {
              console.error('Error saving interface settings:', error);
              showError('Error saving interface settings');
            }
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Interface Settings</span>
        </button>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            User Authentication
          </label>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Modern User Management</span>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              User authentication is now managed through the Users tab with real-time PIN and password support.
            </p>
            <button
              onClick={() => setActiveTab('users')}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
            >
              Go to User Management →
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Prefix
          </label>
          <input
            type="text"
            value={systemSettings.orderPrefix}
            onChange={(e) => setSystemSettings(prev => ({ ...prev, orderPrefix: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={5}
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={async () => {
            try {
              await settingsService.set('system', systemSettings);
              showSuccess('System settings saved successfully!');
            } catch (error) {
              console.error('Error saving system settings:', error);
              showError('Error saving system settings');
            }
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save System Settings</span>
        </button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="lowStockAlert"
            checked={notificationSettings.lowStockAlert}
            onChange={(e) => setNotificationSettings(prev => ({ ...prev, lowStockAlert: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="lowStockAlert" className="ml-2 block text-sm text-gray-900">
            Low stock alerts
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="dailySummary"
            checked={notificationSettings.dailySummary}
            onChange={(e) => setNotificationSettings(prev => ({ ...prev, dailySummary: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="dailySummary" className="ml-2 block text-sm text-gray-900">
            Daily summary notifications
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="paymentSounds"
            checked={notificationSettings.paymentSounds}
            onChange={(e) => setNotificationSettings(prev => ({ ...prev, paymentSounds: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="paymentSounds" className="ml-2 block text-sm text-gray-900">
            Payment sound notifications
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="orderSounds"
            checked={notificationSettings.orderSounds}
            onChange={(e) => setNotificationSettings(prev => ({ ...prev, orderSounds: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="orderSounds" className="ml-2 block text-sm text-gray-900">
            New order sound notifications
          </label>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={async () => {
            try {
              await settingsService.set('notifications', notificationSettings);
              showSuccess('Notification settings saved successfully!');
            } catch (error) {
              console.error('Error saving notification settings:', error);
              showError('Error saving notification settings');
            }
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Notification Settings</span>
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'restaurant':
        return renderRestaurantSettings();
      case 'financial':
        return renderFinancialSettings();
      case 'receipt':
        return renderReceiptSettings();
      case 'users':
        return renderUserSettings();
      case 'interface':
        return renderInterfaceSettings();
      case 'system':
        return renderSystemSettings();
      case 'notifications':
        return renderNotificationSettings();
      default:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Settings Section</h3>
            <p className="text-gray-600">This section is under development...</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      </div>

      <div className="flex space-x-6">
        {/* Settings Tabs */}
        <div className="w-64 space-y-1">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-sm font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {renderContent()}
        </div>
      </div>

      {/* Popup Component */}
      <Popup
        isOpen={popup.isOpen}
        message={popup.message}
        type={popup.type}
        title={popup.title}
        onClose={closePopup}
        onConfirm={popup.onConfirm}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        showButtons={popup.showButtons}
      />
    </div>
  );
};