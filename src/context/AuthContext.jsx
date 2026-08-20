import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getUserRoles, getUserPermissions, getHighestRole } from '../utils/permissionService';

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

      // 2. রোল লোড
      const userRoles = await getUserRoles(userId);
      setRoles(userRoles);

      // 3. পারমিশন লোড
      const userPermissions = await getUserPermissions(userId);
      setPermissions(userPermissions);

      // 4. হাইয়েস্ট রোল
      const highest = getHighestRole(userRoles);
      setHighestRole(highest);
      
      // সঠিকভাবে রোল সেট করুন
      setIsSuperAdmin(highest === 'super_admin');
      setIsAdmin(highest === 'admin' || highest === 'super_admin');
      setIsTeacher(highest === 'teacher' || highest === 'admin' || highest === 'super_admin');

      console.log('✅ Auth loaded:', { 
        userId, 
        highest, 
        isSuperAdmin: highest === 'super_admin',
        userRoles
      });

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
      } else {
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
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth State Change:', event, session?.user?.email);
        
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

  const hasRole = (roleName) => {
    if (!roleName) return false;
    if (isSuperAdmin && roleName !== 'super_admin') return true;
    return roles.some(r => r.name === roleName);
  };

  const refreshUser = async () => {
    console.log('🔄 Refreshing user data...');
    if (user) {
      await loadUserData(user.id);
      return true;
    }
    return false;
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
      hasRole,
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
