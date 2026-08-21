import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const SUPER_ADMIN = {
  email: 'firojhasan328@gmail.com',
  password: 'firojhasan1234+',
  name: 'Super Admin',
  role: 'super_admin'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('admin_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        updateRoles(parsed);
      } catch (e) {
        localStorage.removeItem('admin_user');
      }
    }
    setLoading(false);
  }, []);

  const updateRoles = (userData) => {
    if (userData?.role === 'super_admin') {
      setIsSuperAdmin(true);
      setIsAdmin(true);
      setIsTeacher(true);
      setPermissions(['*']);
    } else if (userData?.role === 'admin') {
      setIsSuperAdmin(false);
      setIsAdmin(true);
      setIsTeacher(true);
      setPermissions(userData?.permissions || []);
    } else if (userData?.role === 'teacher') {
      setIsSuperAdmin(false);
      setIsAdmin(false);
      setIsTeacher(true);
      setPermissions(userData?.permissions || []);
    } else {
      setIsSuperAdmin(false);
      setIsAdmin(false);
      setIsTeacher(false);
      setPermissions([]);
    }
  };

  const login = (email, password) => {
    if (email === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
      const userData = {
        email: SUPER_ADMIN.email,
        name: SUPER_ADMIN.name,
        role: SUPER_ADMIN.role,
        permissions: ['*']
      };
      setUser(userData);
      updateRoles(userData);
      localStorage.setItem('admin_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, error: 'ভুল ইমেইল বা পাসওয়ার্ড!' };
  };

  const logout = () => {
    setUser(null);
    setIsSuperAdmin(false);
    setIsAdmin(false);
    setIsTeacher(false);
    setPermissions([]);
    localStorage.removeItem('admin_user');
  };

  const hasPermission = (permissionKey) => {
    if (isSuperAdmin) return true;
    return permissions.includes(permissionKey);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isSuperAdmin,
      isAdmin,
      isTeacher,
      permissions,
      login,
      logout,
      hasPermission,
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
