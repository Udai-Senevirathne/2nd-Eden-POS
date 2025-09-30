// Define user roles and their permissions
export interface UserPermissions {
  // Admin Panel Access
  canAccessAdminPanel: boolean;
  canAccessDashboard: boolean;
  canAccessReports: boolean;
  canAccessSettings: boolean;
  
  // Order Management
  canViewOrders: boolean;
  canUpdateOrderStatus: boolean;
  canDeleteOrders: boolean;
  canAccessOrderHistory: boolean;
  
  // Menu Management
  canViewMenu: boolean;
  canAddMenuItems: boolean;
  canEditMenuItems: boolean;
  canDeleteMenuItems: boolean;
  
  // User Management
  canViewUsers: boolean;
  canAddUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  
  // System Settings
  canEditSystemSettings: boolean;
  canEditReceiptSettings: boolean;
  canEditRestaurantSettings: boolean;
  canAccessUserManagement: boolean;
  
  // Financial Data
  canViewFinancialReports: boolean;
  canExportReports: boolean;
  canViewProfitLoss: boolean;
  
  // Staff Operations
  canProcessPayments: boolean;
  canPrintReceipts: boolean;
  canVoidTransactions: boolean;
  canApplyDiscounts: boolean;
}

// Role definitions with permissions
export const ROLE_PERMISSIONS: Record<string, UserPermissions> = {
  admin: {
    // Full access to everything
    canAccessAdminPanel: true,
    canAccessDashboard: true,
    canAccessReports: true,
    canAccessSettings: true,
    
    canViewOrders: true,
    canUpdateOrderStatus: true,
    canDeleteOrders: true,
    canAccessOrderHistory: true,
    
    canViewMenu: true,
    canAddMenuItems: true,
    canEditMenuItems: true,
    canDeleteMenuItems: true,
    
    canViewUsers: true,
    canAddUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    
    canEditSystemSettings: true,
    canEditReceiptSettings: true,
    canEditRestaurantSettings: true,
    canAccessUserManagement: true,
    
    canViewFinancialReports: true,
    canExportReports: true,
    canViewProfitLoss: true,
    
    canProcessPayments: true,
    canPrintReceipts: true,
    canVoidTransactions: true,
    canApplyDiscounts: true,
  },
  
  manager: {
    // Manager access - limited admin functions
    canAccessAdminPanel: true,
    canAccessDashboard: true,
    canAccessReports: true,
    canAccessSettings: false, // No system settings access
    
    canViewOrders: true,
    canUpdateOrderStatus: true,
    canDeleteOrders: false, // Cannot delete orders
    canAccessOrderHistory: true,
    
    canViewMenu: true,
    canAddMenuItems: true,
    canEditMenuItems: true,
    canDeleteMenuItems: false, // Cannot delete menu items
    
    canViewUsers: true,
    canAddUsers: false, // Cannot add users
    canEditUsers: false, // Cannot edit users
    canDeleteUsers: false,
    
    canEditSystemSettings: false,
    canEditReceiptSettings: true, // Can edit receipts
    canEditRestaurantSettings: true, // Can edit restaurant info
    canAccessUserManagement: false,
    
    canViewFinancialReports: true,
    canExportReports: true,
    canViewProfitLoss: true,
    
    canProcessPayments: true,
    canPrintReceipts: true,
    canVoidTransactions: true,
    canApplyDiscounts: true,
  },
  
  staff: {
    // Staff access - minimal permissions
    canAccessAdminPanel: false, // No admin panel access
    canAccessDashboard: false,
    canAccessReports: false,
    canAccessSettings: false,
    
    canViewOrders: false, // Cannot view all orders
    canUpdateOrderStatus: false,
    canDeleteOrders: false,
    canAccessOrderHistory: false,
    
    canViewMenu: true, // Can see menu for orders
    canAddMenuItems: false,
    canEditMenuItems: false,
    canDeleteMenuItems: false,
    
    canViewUsers: false,
    canAddUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    
    canEditSystemSettings: false,
    canEditReceiptSettings: false,
    canEditRestaurantSettings: false,
    canAccessUserManagement: false,
    
    canViewFinancialReports: false,
    canExportReports: false,
    canViewProfitLoss: false,
    
    canProcessPayments: true, // Main job function
    canPrintReceipts: true,
    canVoidTransactions: false, // Cannot void transactions
    canApplyDiscounts: false, // Cannot apply discounts
  },
};

// Utility functions for permission checking
export const hasPermission = (userRole: string, permission: keyof UserPermissions): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions ? rolePermissions[permission] : false;
};

export const canAccessAdminPanel = (userRole: string): boolean => {
  return hasPermission(userRole, 'canAccessAdminPanel');
};

export const canManageUsers = (userRole: string): boolean => {
  return hasPermission(userRole, 'canAccessUserManagement');
};

export const canEditMenu = (userRole: string): boolean => {
  return hasPermission(userRole, 'canEditMenuItems');
};

export const canViewReports = (userRole: string): boolean => {
  return hasPermission(userRole, 'canViewFinancialReports');
};