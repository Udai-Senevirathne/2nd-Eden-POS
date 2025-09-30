import { useEffect, useState } from 'react';
import { UserPermissions, ROLE_PERMISSIONS } from '../utils/permissions';

// Hook for checking user permissions
export const useUserPermissions = (userRole?: string): UserPermissions => {
  const [permissions, setPermissions] = useState<UserPermissions>(() => {
    // Default to staff permissions if no role specified
    return ROLE_PERMISSIONS[userRole || 'staff'] || ROLE_PERMISSIONS.staff;
  });

  useEffect(() => {
    if (userRole && ROLE_PERMISSIONS[userRole]) {
      setPermissions(ROLE_PERMISSIONS[userRole]);
    } else {
      // Fallback to staff permissions
      setPermissions(ROLE_PERMISSIONS.staff);
    }
  }, [userRole]);

  return permissions;
};