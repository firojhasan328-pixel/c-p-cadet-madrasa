import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const PortalContext = createContext();

export function PortalProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUser(session.user);
          setUserProfile(profile);
          setUserRole(profile.role);
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          setUser(data.user);
          setUserProfile(profile);
          setUserRole(profile.role);
          return { success: true, profile };
        }
      }
      return { success: false, error: 'প্রোফাইল পাওয়া যায়নি' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      // 1. Auth তৈরি
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email.trim(),
        password: userData.password.trim(),
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. প্রোফাইল তৈরি
        const profileData = {
          id: authData.user.id,
          name: userData.name,
          email: userData.email.trim(),
          phone: userData.phone || null,
          role: userData.role,
          class_name: userData.className || null,
          roll_number: userData.rollNumber || null,
          designation: userData.designation || null,
          subject: userData.subject || null,
          photo_url: userData.photo || null,
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (profileError) throw profileError;

        // 3. লগইন করানো
        const loginResult = await login(userData.email, userData.password);
        return loginResult;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setUserRole(null);
  };

  const value = {
    user,
    userRole,
    userProfile,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isStudent: userRole === 'student',
    isTeacher: userRole === 'teacher',
  };

  return (
    <PortalContext.Provider value={value}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
}
