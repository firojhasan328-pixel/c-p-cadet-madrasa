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

  // ============================================
  // ✅ প্রোফাইল লোড — ক্রম: admin_users → students → teachers
  // ============================================
  const loadUserProfile = async (userId, email) => {
    try {
      const normalizedEmail = (email || '').toLowerCase().trim();

      // ============================================
      // ১. admin_users চেক (সবচেয়ে প্রথমে)
      // ============================================
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .ilike('email', normalizedEmail)
        .maybeSingle();

      if (adminData && adminData.is_active !== false) {
        // অ্যাডমিন/সাব-অ্যাডমিন/সুপার অ্যাডমিন সবাই teacher portal এ যাবে
        return {
          profile: {
            id: adminData.user_id || userId,
            name: adminData.name || 'অ্যাডমিন',
            email: adminData.email || normalizedEmail,
            role: adminData.role,
            designation: getRoleDesignation(adminData.role),
            is_approved: true,
            is_verified: true,
          },
          role: 'teacher',
          adminRole: adminData.role,
        };
      }

      // ============================================
      // ২. students চেক
      // ============================================
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (studentData) {
        const isApproved = studentData.is_approved === true;
        if (!isApproved) {
          return { pending: true, profile: studentData, role: 'student' };
        }
        return {
          profile: studentData,
          role: 'student',
        };
      }

      // ============================================
      // ৩. teachers চেক
      // ============================================
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (teacherData) {
        const isApproved = teacherData.is_approved === true;
        if (!isApproved) {
          return { pending: true, profile: teacherData, role: 'teacher' };
        }
        return {
          profile: teacherData,
          role: 'teacher',
        };
      }

      // কিছুই পাওয়া যায়নি
      return null;
    } catch (err) {
      console.error('❌ Load profile error:', err);
      return null;
    }
  };

  // ============================================
  // রোল থেকে designation
  // ============================================
  const getRoleDesignation = (role) => {
    const map = {
      super_admin: 'সুপার অ্যাডমিন',
      admin: 'অ্যাডমিন',
      sub_admin: 'সাব-অ্যাডমিন',
      teacher: 'শিক্ষক',
    };
    return map[role] || 'শিক্ষক';
  };

  // ============================================
  // সেশন চেক
  // ============================================
  const checkUserSession = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const result = await loadUserProfile(session.user.id, session.user.email);
        
        if (result) {
          if (result.pending) {
            // pending — লগআউট করে দাও
            await supabase.auth.signOut();
            setUser(null);
            setUserProfile(null);
            setUserRole(null);
          } else {
            setUser(session.user);
            setUserProfile(result.profile);
            setUserRole(result.role);
          }
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
    setLoading(false);
  };

  // ============================================
  // ✅ Login ফাংশন — admin_users আগে চেক করবে
  // ============================================
  const login = async (email, password) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password.trim(),
      });

      if (error) throw error;

      if (data.user) {
        const result = await loadUserProfile(data.user.id, data.user.email);

        if (!result) {
          await supabase.auth.signOut();
          return { 
            success: false, 
            error: 'PROFILE_NOT_FOUND',
            errorType: 'notfound',
            message: 'প্রোফাইল পাওয়া যায়নি। দয়া করে রেজিস্ট্রেশন করুন।'
          };
        }

        if (result.pending) {
          await supabase.auth.signOut();
          return { 
            success: false, 
            error: 'PENDING_APPROVAL',
            errorType: 'pending',
            message: 'আপনার অ্যাকাউন্ট এখনো অনুমোদিত হয়নি',
            userType: result.role === 'teacher' ? 'শিক্ষক' : 'ছাত্র',
            userName: result.profile?.name || ''
          };
        }

        // সফল লগইন
        setUser(data.user);
        setUserProfile(result.profile);
        setUserRole(result.role);
        
        window.location.href = '/portal';
        
        return { success: true, profile: result.profile };
      }
      
      return { 
        success: false, 
        error: 'NO_USER',
        errorType: 'notfound',
        message: 'ব্যবহারকারী পাওয়া যায়নি' 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message,
        errorType: 'auth',
        message: error.message 
      };
    }
  };

  // ============================================
  // Register ফাংশন
  // ============================================
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
      return { 
        success: false, 
        error: error.message,
        errorType: 'auth',
        message: error.message 
      };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setUserRole(null);
    window.location.href = '/';
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
