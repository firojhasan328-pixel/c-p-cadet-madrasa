import { supabase } from '../supabaseClient';

// =============================================
// PERMISSION SERVICE
// =============================================

let currentUserRoles = null;
let currentUserPermissions = null;
let currentUserId = null;

// =============================================
// ১. ইউজারের সব রোল পাওয়া
// =============================================
export async function getUserRoles(userId) {
  if (!userId) return [];
  
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles:role_id (
          id,
          name,
          description
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data?.map(item => item.roles) || [];
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
}

// =============================================
// ২. ইউজারের সব পারমিশন পাওয়া
// =============================================
export async function getUserPermissions(userId) {
  if (!userId) return [];
  
  try {
    const { data: rolePermissions, error: roleError } = await supabase
      .from('user_roles')
      .select(`
        roles:role_id (
          role_permissions:role_id (
            permissions:permission_id (
              id,
              name,
              category,
              description
            )
          )
        )
      `)
      .eq('user_id', userId);

    if (roleError) throw roleError;

    const { data: userPerms, error: userError } = await supabase
      .from('user_permissions')
      .select(`
        permission_id,
        is_allowed,
        permissions:permission_id (
          id,
          name,
          category,
          description
        )
      `)
      .eq('user_id', userId);

    if (userError) throw userError;

    const permissionMap = new Map();

    if (rolePermissions) {
      rolePermissions.forEach(item => {
        if (item.roles?.role_permissions) {
          item.roles.role_permissions.forEach(rp => {
            if (rp.permissions) {
              permissionMap.set(rp.permissions.id, {
                ...rp.permissions,
                source: 'role',
                is_allowed: true
              });
            }
          });
        }
      });
    }

    if (userPerms) {
      userPerms.forEach(up => {
        if (up.permissions) {
          permissionMap.set(up.permissions.id, {
            ...up.permissions,
            source: 'user',
            is_allowed: up.is_allowed
          });
        }
      });
    }

    return Array.from(permissionMap.values());
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}

// =============================================
// ৩. ইউজারের রোল চেক করা
// =============================================
export async function hasRole(userId, roleName) {
  if (!userId || !roleName) return false;
  
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('user_id', userId)
      .eq('roles.name', roleName)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

// =============================================
// ৪. ইউজারের পারমিশন চেক করা
// =============================================
export async function hasPermission(userId, permissionName) {
  if (!userId || !permissionName) return false;
  
  try {
    const permissions = await getUserPermissions(userId);
    const perm = permissions.find(p => p.name === permissionName);
    return perm ? perm.is_allowed : false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

// =============================================
// ৫. বর্তমান ইউজারের জন্য ক্যাশেড ডেটা রিফ্রেশ
// =============================================
export async function refreshCurrentUserPermissions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    currentUserRoles = null;
    currentUserPermissions = null;
    currentUserId = null;
    return null;
  }

  currentUserId = user.id;
  currentUserRoles = await getUserRoles(user.id);
  currentUserPermissions = await getUserPermissions(user.id);
  
  return {
    userId: currentUserId,
    roles: currentUserRoles,
    permissions: currentUserPermissions
  };
}

// =============================================
// ৬. বর্তমান ইউজারের রোল চেক করা
// =============================================
export function hasCurrentUserRole(roleName) {
  if (!currentUserRoles) return false;
  return currentUserRoles.some(r => r.name === roleName);
}

// =============================================
// ৭. বর্তমান ইউজারের পারমিশন চেক করা
// =============================================
export function hasCurrentUserPermission(permissionName) {
  if (!currentUserPermissions) return false;
  const perm = currentUserPermissions.find(p => p.name === permissionName);
  return perm ? perm.is_allowed : false;
}

// =============================================
// ৮. পারমিশন ক্যাশ ক্লিয়ার করা
// =============================================
export function clearPermissionCache() {
  currentUserRoles = null;
  currentUserPermissions = null;
  currentUserId = null;
}

// =============================================
// ৯. ইউজারকে রোল অ্যাসাইন করা
// =============================================
export async function assignRoleToUser(userId, roleName, grantedBy) {
  try {
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (roleError) throw roleError;

    const { data, error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role_id: roleData.id
      })
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error assigning role:', error);
    return { success: false, error: error.message };
  }
}

// =============================================
// ১০. ইউজারের পারমিশন আপডেট করা
// =============================================
export async function updateUserPermission(userId, permissionName, isAllowed, grantedBy) {
  try {
    const { data: permData, error: permError } = await supabase
      .from('permissions')
      .select('id')
      .eq('name', permissionName)
      .single();

    if (permError) throw permError;

    const { data, error } = await supabase
      .from('user_permissions')
      .upsert({
        user_id: userId,
        permission_id: permData.id,
        is_allowed: isAllowed,
        granted_by: grantedBy
      })
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating permission:', error);
    return { success: false, error: error.message };
  }
}

// =============================================
// ১১. অ্যাক্টিভিটি লগ করা
// =============================================
export async function logActivity(userId, action, entityType, entityId, data = {}) {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: action,
        entity_type: entityType,
        entity_id: entityId,
        new_data: data
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { success: false, error: error.message };
  }
}

// =============================================
// ১২. নোটিফিকেশন পাঠানো
// =============================================
export async function sendNotification(userId, title, message, type = 'info', link = null) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: title,
        message: message,
        type: type,
        link: link
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
}

// =============================================
// ১৩. সব পারমিশন পাওয়া
// =============================================
export async function getAllPermissions() {
  try {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
}

// =============================================
// ১৪. পারমিশন ক্যাটাগরি অনুযায়ী গ্রুপ করা
// =============================================
export function groupPermissionsByCategory(permissions) {
  const grouped = {};
  permissions.forEach(perm => {
    if (!grouped[perm.category]) {
      grouped[perm.category] = [];
    }
    grouped[perm.category].push(perm);
  });
  return grouped;
}

// =============================================
// ১৫. ইউজারের রোল নাম পাওয়া (সবচেয়ে গুরুত্বপূর্ণ)
// =============================================
export function getHighestRole(roles) {
  const rolePriority = {
    'super_admin': 4,
    'admin': 3,
    'teacher': 2,
    'user': 1
  };

  if (!roles || roles.length === 0) return 'user';
  
  const highest = roles.reduce((highest, current) => {
    const currentPriority = rolePriority[current.name] || 0;
    const highestPriority = rolePriority[highest] || 0;
    return currentPriority > highestPriority ? current.name : highest;
  }, roles[0]?.name || 'user');
  
  console.log('📊 getHighestRole:', { roles, highest });
  return highest;
}
