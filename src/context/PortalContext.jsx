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
        // ✅ প্রথমে students টেবিলে চেক করুন
        let profile = null;
        let role = null;

        // ১. students টেবিলে চেক
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();  // ← .maybeSingle() ব্যবহার করুন

        if (studentData && !studentError) {
          profile = studentData;
          role = 'student';
        } else {
          // ২. teachers টেবিলে চেক
          const { data: teacherData, error: teacherError } = await supabase
            .from('teachers')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();  // ← .maybeSingle() ব্যবহার করুন

          if (teacherData && !teacherError) {
            profile = teacherData;
            role = 'teacher';
          }
        }

        if (profile) {
          setUser(session.user);
          setUserProfile(profile);
          setUserRole(role);
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
        // ✅ students টেবিলে চেক
        let profile = null;
        let role = null;

        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (studentData && !studentError) {
          profile = studentData;
          role = 'student';
        } else {
          // teachers টেবিলে চেক
          const { data: teacherData, error: teacherError } = await supabase
            .from('teachers')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (teacherData && !teacherError) {
            profile = teacherData;
            role = 'teacher';
          }
        }

        if (profile) {
          setUser(data.user);
          setUserProfile(profile);
          setUserRole(role);
          return { success: true, profile };
        } else {
          return { success: false, error: 'প্রোফাইল পাওয়া যায়নি' };
        }
      }
      return { success: false, error: 'প্রোফাইল পাওয়া যায়নি' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email.trim(),
        password: userData.password.trim(),
        options: {
          data: {
            name: userData.name,
            role: userData.role
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // userData.role অনুযায়ী সঠিক টেবিলে ডেটা ইনসার্ট করুন
        const tableName = userData.role === 'student' ? 'students' : 'teachers';
        
        const profileData = {
          id: authData.user.id,
          name: userData.name,
          email: userData.email.trim(),
          phone: userData.phone || null,
          ...(userData.role === 'student' && {
            father_name: userData.fatherName || null,
            mother_name: userData.motherName || null,
            village: userData.village || null,
            class_name: userData.className || null,
            roll_number: userData.rollNumber || null,
          }),
          ...(userData.role === 'teacher' && {
            gender: userData.gender || null,
            designation: userData.designation || null,
            subject: userData.subject || null,
          }),
          photo_url: userData.photo || null,
          is_verified: true,
          is_approved: false
        };

        const { error: profileError } = await supabase
          .from(tableName)
          .insert([profileData]);

        if (profileError) throw profileError;

        const loginResult = await login(userData.email, userData.password);
        return loginResult;
      }
    } catch (error) {
      console.error('Register error:', error);
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
