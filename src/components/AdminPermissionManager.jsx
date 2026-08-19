import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { 
  getAllPermissions, 
  groupPermissionsByCategory,
  updateUserPermission,
  sendNotification,
  logActivity
} from '../utils/permissionService';

export default function AdminPermissionManager() {
  const { user, isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. সব এডমিন লোড
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          profiles:user_id (
            id,
            name,
            email,
            created_at
          )
        `)
        .eq('role_id', (await supabase.from('roles').select('id').eq('name', 'admin').single()).data.id);

      const adminList = adminRoles?.map(item => ({
        ...item.profiles,
        userId: item.user_id
      })).filter(Boolean) || [];

      setAdmins(adminList);

      // 2. সব পারমিশন লোড
      const perms = await getAllPermissions();
      setAllPermissions(perms);
      setGroupedPermissions(groupPermissionsByCategory(perms));

    } catch (error) {
      console.error('Error loading data:', error);
      setErrorMsg('ডেটা লোড করতে সমস্যা: ' + error.message);
    }
    setLoading(false);
  };

  const handleUpdatePermission = async (adminId, permissionName, isAllowed) => {
    try {
      const result = await updateUserPermission(adminId, permissionName, isAllowed, user?.id);
      
      if (result.success) {
        setSuccessMsg(`✅ ${permissionName} পারমিশন ${isAllowed ? 'দেওয়া' : 'বাতিল'} করা হয়েছে!`);
        
        await sendNotification(
          adminId,
          'পারমিশন পরিবর্তন',
          `${isAllowed ? '✅' : '❌'} ${permissionName} পারমিশন ${isAllowed ? 'দেওয়া' : 'বাতিল'} করা হয়েছে।`,
          isAllowed ? 'success' : 'warning'
        );
        
        await logActivity(user?.id, 'UPDATE_ADMIN_PERMISSION', 'user_permissions', adminId, {
          permission: permissionName,
          is_allowed: isAllowed
        });

        // রিফ্রেশ
        await loadData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg('❌ পারমিশন আপডেট করতে সমস্যা: ' + result.error);
      }
    } catch (error) {
      setErrorMsg('❌ পারমিশন আপডেট করতে সমস্যা: ' + error.message);
    }
  };

  const handleRemoveAdmin = async (adminId) => {
    if (!confirm('এই এডমিনকে রিমুভ করতে চান?')) return;

    try {
      // admin রোল রিমুভ
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'admin')
        .single();

      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', adminId)
        .eq('role_id', roleData.id);

      // user রোল সেট করা
      const { data: userRoleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'user')
        .single();

      await supabase
        .from('user_roles')
        .insert({
          user_id: adminId,
          role_id: userRoleData.id
        });

      setSuccessMsg('✅ এডমিন রিমুভ করা হয়েছে!');
      
      await sendNotification(
        adminId,
        'এডমিন রিমুভ',
        'আপনার এডমিন রোল রিমুভ করা হয়েছে।',
        'warning'
      );

      await logActivity(user?.id, 'REMOVE_ADMIN', 'user_roles', adminId, {});
      
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg('❌ এডমিন রিমুভ করতে সমস্যা: ' + error.message);
    }
  };

  const getAdminPermissions = async (adminId) => {
    try {
      const { data } = await supabase
        .from('user_permissions')
        .select('permission_id, is_allowed, permissions(name)')
        .eq('user_id', adminId);

      return data || [];
    } catch (error) {
      console.error('Error fetching admin permissions:', error);
      return [];
    }
  };

  const filteredAdmins = admins.filter(admin => 
    admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
        <h2 style={{ color: '#dc2626' }}>অ্যাক্সেস অস্বীকৃত!</h2>
        <p style={{ color: '#64748b' }}>শুধুমাত্র সুপার এডমিন এই পেজ দেখতে পারেন।</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>🛡️ এডমিন পারমিশন ম্যানেজার</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            এডমিনদের পারমিশন কন্ট্রোল করুন
          </p>
        </div>
        <button
          onClick={loadData}
          style={{
            background: '#f1f5f9',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          🔄 রিফ্রেশ
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{
          background: '#dcfce7',
          color: '#15803d',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '16px',
          fontWeight: '600'
        }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{
          background: '#fee2e2',
          color: '#991b1b',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '16px',
          fontWeight: '600'
        }}>
          {errorMsg}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 এডমিন খুঁজুন (নাম বা ইমেইল)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1.5px solid #e2e8f0',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>

      {/* Admin List */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px 0' }}>⏳ লোড হচ্ছে...</p>
      ) : filteredAdmins.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>👀</div>
          <p>কোনো এডমিন পাওয়া যায়নি</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAdmins.map((admin) => (
            <AdminCard
              key={admin.id}
              admin={admin}
              permissions={allPermissions}
              groupedPermissions={groupedPermissions}
              onUpdatePermission={handleUpdatePermission}
              onRemoveAdmin={handleRemoveAdmin}
              isSuperAdmin={isSuperAdmin}
              getAdminPermissions={getAdminPermissions}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================
// Admin Card Component
// =============================================
function AdminCard({ 
  admin, 
  permissions, 
  groupedPermissions, 
  onUpdatePermission, 
  onRemoveAdmin,
  isSuperAdmin,
  getAdminPermissions 
}) {
  const [expanded, setExpanded] = useState(false);
  const [adminPerms, setAdminPerms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expanded) {
      loadAdminPermissions();
    }
  }, [expanded]);

  const loadAdminPermissions = async () => {
    setLoading(true);
    const perms = await getAdminPermissions(admin.id);
    setAdminPerms(perms);
    setLoading(false);
  };

  const hasPermission = (permissionName) => {
    const perm = adminPerms.find(p => p.permissions?.name === permissionName);
    return perm ? perm.is_allowed : false;
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          background: expanded ? '#f8fafc' : 'white',
          transition: 'all 0.2s ease'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '700',
              color: '#0f172a'
            }}>
              {admin.name?.[0] || 'A'}
            </div>
            <div>
              <div style={{ fontWeight: '700', color: '#0f172a' }}>
                {admin.name || 'নাম নেই'}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {admin.email}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            padding: '2px 12px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            background: '#dbeafe',
            color: '#1d4ed8'
          }}>
            এডমিন
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveAdmin(admin.id);
            }}
            style={{
              background: '#fee2e2',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '6px',
              color: '#dc2626',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            রিমুভ
          </button>
          <span style={{ fontSize: '20px', color: '#64748b' }}>
            {expanded ? '▾' : '▸'}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div style={{ padding: '16px 20px 20px 20px', borderTop: '1px solid #f1f5f9' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>
              ⏳ পারমিশন লোড হচ্ছে...
            </p>
          ) : (
            <div>
              {Object.keys(groupedPermissions).map((category) => {
                const categoryPerms = groupedPermissions[category];
                return (
                  <div key={category} style={{ marginBottom: '16px' }}>
                    <h5 style={{
                      margin: '0 0 8px 0',
                      fontSize: '14px',
                      color: '#166534',
                      borderBottom: '1px solid #f1f5f9',
                      paddingBottom: '4px'
                    }}>
                      📁 {category}
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                      {categoryPerms.map((perm) => (
                        <label
                          key={perm.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            padding: '2px 0'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={hasPermission(perm.name)}
                            onChange={(e) => onUpdatePermission(admin.id, perm.name, e.target.checked)}
                            style={{
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer',
                              accentColor: '#16a34a'
                            }}
                          />
                          <span style={{ color: '#334155' }}>{perm.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
