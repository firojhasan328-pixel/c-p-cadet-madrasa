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

  // =============================================
  // ইউজার ডেটা লোড করার ফাংশন
  // =============================================
  const loadUserData = async (userId) => {
    try {
      console.log('🔍 লোড হচ্ছে ইউজার ডেটা:', userId);
      
      // 1. প্রোফাইল লোড
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ প্রোফাইল লোডে সমস্যা:', profileError);
        return false;
      }

      console.log('✅ প্রোফাইল পাওয়া গেছে:', profileData);
      setProfile(profileData);

      // 2. রোল লোড
      const userRoles = await getUserRoles(userId);
      console.log('✅ রোল পাওয়া গেছে:', userRoles);
      setRoles(userRoles);

      // 3. পারমিশন লোড
      const userPermissions = await getUserPermissions(userId);
      setPermissions(userPermissions);

      // 4. হাইয়েস্ট রোল নির্ধারণ
      const highest = getHighestRole(userRoles);
      console.log('✅ হাইয়েস্ট রোল:', highest);
      setHighestRole(highest);
      
      // 5. বুলিয়ান স্টেট আপডেট
      const isSuper = highest === 'super_admin';
      const isAdm = highest === 'admin' || highest === 'super_admin';
      const isTch = highest === 'teacher' || highest === 'admin' || highest === 'super_admin';
      
      setIsSuperAdmin(isSuper);
      setIsAdmin(isAdm);
      setIsTeacher(isTch);
      
      console.log('✅ অথ স্টেট আপডেট:', { isSuper, isAdm, isTch });

      return true;
    } catch (error) {
      console.error('❌ ইউজার ডেটা লোডে সমস্যা:', error);
      return false;
    }
  };

  // =============================================
  // অথ স্টেট রিফ্রেশ (লগইনের পর কল করুন)
  // =============================================
  const refreshUser = async () => {
    console.log('🔄 refreshUser কল করা হয়েছে');
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (currentUser) {
      console.log('✅ বর্তমান ইউজার:', currentUser.email);
      setUser(currentUser);
      await loadUserData(currentUser.id);
    } else {
      console.log('❌ কোনো ইউজার নেই');
      setUser(null);
      setProfile(null);
      setRoles([]);
      setPermissions([]);
      setHighestRole('user');
      setIsSuperAdmin(false);
      setIsAdmin(false);
      setIsTeacher(false);
    }
  };

  // =============================================
  // অথ লিসেনার সেটআপ
  // =============================================
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        console.log('✅ সেশন পাওয়া গেছে:', session.user.email);
        setUser(session.user);
        await loadUserData(session.user.id);
      } else {
        console.log('❌ কোনো সেশন নেই');
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

    // অথ স্টেট চেঞ্জ লিসেনার
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 অথ ইভেন্ট:', event);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ লগইন সফল:', session.user.email);
          setUser(session.user);
          await loadUserData(session.user.id);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 টোকেন রিফ্রেশ হয়েছে');
          if (session) {
            await loadUserData(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 লগআউট হয়েছে');
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

  // =============================================
  // হেল্পার ফাংশন
  // =============================================
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
