import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [highestRole, setHighestRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  const loadUserData = async (userId) => {
    try {
      // 1. প্রোফাইল লোড
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      setProfile(profileData);

      // 2. রোল লোড - Super Admin চেক
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select(`
          roles:role_id (
            name
          )
        `)
        .eq('user_id', userId);

      const roleNames = userRoles?.map(r => r.roles?.name).filter(Boolean) || [];
      setRoles(roleNames);

      // 3. হাইয়েস্ট রোল নির্ধারণ
      const hasSuperAdmin = roleNames.includes('super_admin');
      const hasAdmin = roleNames.includes('admin');
      const hasTeacher = roleNames.includes('teacher');

      setIsSuperAdmin(hasSuperAdmin);
      setIsAdmin(hasAdmin || hasSuperAdmin);
      setIsTeacher(hasTeacher || hasAdmin || hasSuperAdmin);

      if (hasSuperAdmin) setHighestRole('super_admin');
      else if (hasAdmin) setHighestRole('admin');
      else if (hasTeacher) setHighestRole('teacher');
      else setHighestRole('user');

      // 4. পারমিশন লোড
      const { data: userPerms } = await supabase
        .from('user_permissions')
        .select(`
          is_allowed,
          permissions:permission_id (
            name
          )
        `)
        .eq('user_id', userId);

      const permData = userPerms?.map(p => ({
        name: p.permissions?.name,
        is_allowed: p.is_allowed
      })).filter(Boolean) || [];
      
      setPermissions(permData);

      return true;
    } catch (error) {
      console.error('Error loading user data:', error);
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
        await loadUserData(session.user.id);
      }
      setLoading(false);
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          await loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setRoles([]);
          setPermissions([]);
          setHighestRole('user');
          setIsSuperAdmin(false);
          setIsAdmin(false);
          setIsTeacher(false);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const hasPermission = (permissionName) => {
    if (!permissionName) return false;
    if (isSuperAdmin) return true;
    const perm = permissions.find(p => p.name === permissionName);
    return perm ? perm.is_allowed : false;
  };

  const refreshUser = async () => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      roles,
      permissions,
      highestRole,
      loading,
      isSuperAdmin,
      isAdmin,
      isTeacher,
      hasPermission,
      refreshUser,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
