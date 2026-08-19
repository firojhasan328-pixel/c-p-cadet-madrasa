import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
  getUserRoles,
  getUserPermissions,
  hasPermission,
  hasRole,
  refreshCurrentUserPermissions,
  hasCurrentUserRole,
  hasCurrentUserPermission,
  clearPermissionCache,
  getHighestRole
} from '../utils/permissionService';

export function usePermission() {
  const [userId, setUserId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [highestRole, setHighestRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  const loadPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUserId(null);
        setRoles([]);
        setPermissions([]);
        setHighestRole('user');
        setIsSuperAdmin(false);
        setIsAdmin(false);
        setIsTeacher(false);
        setLoading(false);
        return;
      }

      setUserId(user.id);
      
      const userRoles = await getUserRoles(user.id);
      const userPermissions = await getUserPermissions(user.id);
      
      setRoles(userRoles);
      setPermissions(userPermissions);
      
      const highest = getHighestRole(userRoles);
      setHighestRole(highest);
      setIsSuperAdmin(highest === 'super_admin');
      setIsAdmin(highest === 'admin' || highest === 'super_admin');
      setIsTeacher(highest === 'teacher' || highest === 'admin' || highest === 'super_admin');
      
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const hasPermissionCheck = useCallback((permissionName) => {
    if (!permissionName) return false;
    if (isSuperAdmin) return true;
    const perm = permissions.find(p => p.name === permissionName);
    return perm ? perm.is_allowed : false;
  }, [permissions, isSuperAdmin]);

  const hasRoleCheck = useCallback((roleName) => {
    if (!roleName) return false;
    if (isSuperAdmin && roleName !== 'super_admin') return true;
    return roles.some(r => r.name === roleName);
  }, [roles, isSuperAdmin]);

  const refresh = useCallback(async () => {
    const result = await refreshCurrentUserPermissions();
    if (result) {
      setRoles(result.roles);
      setPermissions(result.permissions);
      const highest = getHighestRole(result.roles);
      setHighestRole(highest);
      setIsSuperAdmin(highest === 'super_admin');
      setIsAdmin(highest === 'admin' || highest === 'super_admin');
      setIsTeacher(highest === 'teacher' || highest === 'admin' || highest === 'super_admin');
    }
    return result;
  }, []);

  const clearCache = useCallback(() => {
    clearPermissionCache();
  }, []);

  useEffect(() => {
    loadPermissions();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadPermissions();
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setRoles([]);
        setPermissions([]);
        setHighestRole('user');
        setIsSuperAdmin(false);
        setIsAdmin(false);
        setIsTeacher(false);
        clearPermissionCache();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [loadPermissions]);

  return {
    userId,
    roles,
    permissions,
    highestRole,
    loading,
    isSuperAdmin,
    isAdmin,
    isTeacher,
    hasPermission: hasPermissionCheck,
    hasRole: hasRoleCheck,
    refresh,
    clearCache,
    isAuthenticated: !!userId
  };
}
