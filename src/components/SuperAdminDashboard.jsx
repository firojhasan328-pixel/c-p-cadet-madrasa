import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { 
  getAllPermissions, 
  groupPermissionsByCategory,
  assignRoleToUser,
  updateUserPermission,
  sendNotification,
  logActivity
} from '../utils/permissionService';
import AdminPermissionManager from './AdminPermissionManager';
import AdvancedCMS from './AdvancedCMS';

export default function SuperAdminDashboard() {
  const { user, isSuperAdmin, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Dashboard Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalAdmissions: 0,
    totalNotices: 0
  });

  // Users
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [userPermissions, setUserPermissions] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});

  // Notifications
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info');
  const [notificationUserId, setNotificationUserId] = useState('');

  // Activity Logs
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // UI States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      loadDashboardData();
      loadAllUsers();
      loadAllPermissions();
      loadActivityLogs();
    }
  }, [isSuperAdmin]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // মোট ইউজার
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // মোট এডমিন
      const { data: adminRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'admin')
        .single();
      
      const { count: adminCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role_id', adminRole?.id);

      // মোট শিক্ষক
      const { count: teacherCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });

      // মোট ছাত্র
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // মোট ভর্তি আবেদন
      const { count: admissionCount } = await supabase
        .from('admissions')
        .select('*', { count: 'exact', head: true });

      // মোট নোটিশ
      const { count: noticeCount } = await supabase
        .from('site_contents')
        .select('*', { count: 'exact', head: true })
        .eq('key', 'notice_text');

      setStats({
        totalUsers: userCount || 0,
        totalAdmins: adminCount || 0,
        totalTeachers: teacherCount || 0,
        totalStudents: studentCount || 0,
        totalAdmissions: admissionCount || 0,
        totalNotices: noticeCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    setLoading(false);
  };

  const loadAllUsers = async () => {
    try {
      // সব ইউজার প্রোফাইল
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // প্রতিটি ইউজারের রোল
      const usersWithRoles = await Promise.all((profiles || []).map(async (profile) => {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', profile.id);
        
        const roleNames = roles?.map(r => r.roles?.name).filter(Boolean) || [];
        return {
          ...profile,
          roles: roleNames,
          primaryRole: roleNames[0] || 'user'
        };
      }));

      setAllUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadAllPermissions = async () => {
    try {
      const perms = await getAllPermissions();
      setAllPermissions(perms);
      setGroupedPermissions(groupPermissionsByCategory(perms));
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const loadActivityLogs = async () => {
    setLogsLoading(true);
    try {
      const { data } = await supabase
        .from('activity_logs')
        .select(`
          *,
          profiles:user_id (name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error loading activity logs:', error);
    }
    setLogsLoading(false);
  };

  const handleAssignRole = async (userId, roleName) => {
    if (!userId) return;
    
    try {
      const result = await assignRoleToUser(userId, roleName, user?.id);
      if (result.success) {
        setSuccessMsg(`✅ ${roleName} রোল সফলভাবে অ্যাসাইন করা হয়েছে!`);
        await sendNotification(
          userId,
          'রোল পরিবর্তন',
          `আপনাকে ${roleName} রোল দেওয়া হয়েছে।`,
          'success'
        );
        await logActivity(user?.id, 'ASSIGN_ROLE', 'user_roles', userId, { role: roleName });
        loadAllUsers();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg('❌ রোল অ্যাসাইন করতে সমস্যা: ' + result.error);
      }
    } catch (error) {
      setErrorMsg('❌ রোল অ্যাসাইন করতে সমস্যা: ' + error.message);
    }
  };

  const handleUpdatePermission = async (userId, permissionName, isAllowed) => {
    try {
      const result = await updateUserPermission(userId, permissionName, isAllowed, user?.id);
      if (result.success) {
        setSuccessMsg(`✅ পারমিশন আপডেট করা হয়েছে!`);
        await sendNotification(
          userId,
          'পারমিশন পরিবর্তন',
          `${isAllowed ? '✅' : '❌'} ${permissionName} পারমিশন ${isAllowed ? 'দেওয়া' : 'বাতিল'} করা হয়েছে।`,
          isAllowed ? 'success' : 'warning'
        );
        await logActivity(user?.id, 'UPDATE_PERMISSION', 'user_permissions', userId, { 
          permission: permissionName, 
          is_allowed: isAllowed 
        });
        loadAllUsers();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg('❌ পারমিশন আপডেট করতে সমস্যা: ' + result.error);
      }
    } catch (error) {
      setErrorMsg('❌ পারমিশন আপডেট করতে সমস্যা: ' + error.message);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      setErrorMsg('❌ টাইটেল এবং মেসেজ দিন');
      return;
    }

    try {
      const targetUserId = notificationUserId || 'all';
      
      if (targetUserId === 'all') {
        // সবাইকে নোটিফিকেশন
        for (const user of allUsers) {
          await sendNotification(
            user.id,
            notificationTitle,
            notificationMessage,
            notificationType
          );
        }
        setSuccessMsg(`✅ ${allUsers.length} জনকে নোটিফিকেশন পাঠানো হয়েছে!`);
      } else {
        await sendNotification(
          targetUserId,
          notificationTitle,
          notificationMessage,
          notificationType
        );
        setSuccessMsg('✅ নোটিফিকেশন পাঠানো হয়েছে!');
      }

      await logActivity(user?.id, 'SEND_NOTIFICATION', 'notifications', targetUserId, {
        title: notificationTitle,
        type: notificationType
      });

      setNotificationTitle('');
      setNotificationMessage('');
      setNotificationUserId('');
      setShowNotificationModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg('❌ নোটিফিকেশন পাঠাতে সমস্যা: ' + error.message);
    }
  };

  // =============================================
  // UI Components
  // =============================================

  const StatCard = ({ icon, label, value, color }) => (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e2e8f0',
      textAlign: 'center',
      flex: '1',
      minWidth: '140px'
    }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color: color || '#0f172a' }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#64748b' }}>{label}</div>
    </div>
  );

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: '10px 16px',
        borderRadius: '10px',
        border: 'none',
        background: activeTab === id ? '#16a34a' : 'transparent',
        color: activeTab === id ? 'white' : '#334155',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease'
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );

  // =============================================
  // Render
  // =============================================

  if (!isSuperAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
        <h2 style={{ color: '#dc2626' }}>অ্যাক্সেস অস্বীকৃত!</h2>
        <p style={{ color: '#64748b' }}>আপনার এই পেজে প্রবেশের অনুমতি নেই।</p>
        <p style={{ color: '#64748b', fontSize: '13px' }}>আপনার রোল: {user?.email || 'লগইন নেই'}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '16px',
            padding: '10px 24px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🔄 পেজ রিলোড করুন
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px' }}>⚙️ Super Admin Dashboard</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            স্বাগতম, {user?.email || 'Admin'}!
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowNotificationModal(true)}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            🔔 নোটিফিকেশন পাঠান
          </button>
          <button
            onClick={refreshUser}
            style={{
              background: '#f1f5f9',
              color: '#334155',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            🔄 রিফ্রেশ
          </button>
        </div>
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

      {/* Stats */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px 0' }}>⏳ লোড হচ্ছে...</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <StatCard icon="👤" label="মোট ইউজার" value={stats.totalUsers} color="#2563eb" />
          <StatCard icon="🛡️" label="মোট এডমিন" value={stats.totalAdmins} color="#8b5cf6" />
          <StatCard icon="👨‍🏫" label="মোট শিক্ষক" value={stats.totalTeachers} color="#16a34a" />
          <StatCard icon="🎓" label="মোট ছাত্র" value={stats.totalStudents} color="#f59e0b" />
          <StatCard icon="📝" label="ভর্তি আবেদন" value={stats.totalAdmissions} color="#ef4444" />
          <StatCard icon="📌" label="নোটিশ" value={stats.totalNotices} color="#06b6d4" />
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap',
        background: '#f1f5f9',
        padding: '6px',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <TabButton id="dashboard" label="ড্যাশবোর্ড" icon="📊" />
        <TabButton id="users" label="ইউজার ম্যানেজমেন্ট" icon="👥" />
        <TabButton id="adminPermissions" label="এডমিন পারমিশন" icon="🛡️" />
        <TabButton id="cms" label="CMS" icon="📝" />
        <TabButton id="permissions" label="সব পারমিশন" icon="🔑" />
        <TabButton id="logs" label="অ্যাক্টিভিটি লগ" icon="📋" />
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            <div className="card" style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>👋 স্বাগতম</h4>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
                সুপার এডমিন প্যানেলে আপনাকে স্বাগতম। এখান থেকে আপনি পুরো ওয়েবসাইট নিয়ন্ত্রণ করতে পারবেন।
              </p>
              <ul style={{ color: '#334155', fontSize: '14px', lineHeight: '2', paddingLeft: '20px' }}>
                <li>✅ ইউজার ম্যানেজমেন্ট</li>
                <li>✅ পারমিশন কন্ট্রোল</li>
                <li>✅ নোটিফিকেশন সিস্টেম</li>
                <li>✅ অ্যাক্টিভিটি ট্র্যাকিং</li>
              </ul>
            </div>
            <div className="card" style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>📊 দ্রুত পরিসংখ্যান</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><strong>{stats.totalUsers}</strong> <span style={{ color: '#64748b', fontSize: '13px' }}>ইউজার</span></div>
                <div><strong>{stats.totalAdmins}</strong> <span style={{ color: '#64748b', fontSize: '13px' }}>এডমিন</span></div>
                <div><strong>{stats.totalTeachers}</strong> <span style={{ color: '#64748b', fontSize: '13px' }}>শিক্ষক</span></div>
                <div><strong>{stats.totalStudents}</strong> <span style={{ color: '#64748b', fontSize: '13px' }}>ছাত্র</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <h4 style={{ color: '#0f172a', marginBottom: '16px' }}>👥 সব ইউজার</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {allUsers.map((u) => (
              <div key={u.id} style={{
                background: 'white',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <strong style={{ color: '#0f172a' }}>{u.name || u.email}</strong>
                  <span style={{ 
                    marginLeft: '8px',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: u.primaryRole === 'super_admin' ? '#fef3c7' : '#dcfce7',
                    color: u.primaryRole === 'super_admin' ? '#b45309' : '#15803d'
                  }}>
                    {u.primaryRole}
                  </span>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <select
                    value={u.primaryRole || 'user'}
                    onChange={(e) => handleAssignRole(u.id, e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      background: 'white'
                    }}
                  >
                    <option value="user">👤 ইউজার</option>
                    <option value="teacher">👨‍🏫 টিচার</option>
                    <option value="admin">🛡️ এডমিন</option>
                    <option value="super_admin">⭐ সুপার এডমিন</option>
                  </select>
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setShowPermissionModal(true);
                    }}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    ⚙️ পারমিশন
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'adminPermissions' && (
        <AdminPermissionManager />
      )}

      {activeTab === 'cms' && (
        <AdvancedCMS />
      )}

      {activeTab === 'permissions' && (
        <div>
          <h4 style={{ color: '#0f172a', marginBottom: '16px' }}>🔑 সব পারমিশন</h4>
          {Object.keys(groupedPermissions).map((category) => (
            <div key={category} style={{ marginBottom: '16px' }}>
              <h5 style={{ 
                color: '#166534', 
                margin: '0 0 8px 0',
                fontSize: '16px',
                borderBottom: '2px solid #f1f5f9',
                paddingBottom: '6px'
              }}>
                📁 {category}
              </h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {groupedPermissions[category].map((perm) => (
                  <span key={perm.id} style={{
                    background: '#f1f5f9',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#334155'
                  }}>
                    {perm.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'logs' && (
        <div>
          <h4 style={{ color: '#0f172a', marginBottom: '16px' }}>📋 অ্যাক্টিভিটি লগ</h4>
          {logsLoading ? (
            <p>⏳ লোড হচ্ছে...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activityLogs.length === 0 ? (
                <p style={{ color: '#64748b' }}>কোনো অ্যাক্টিভিটি নেই</p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} style={{
                    background: 'white',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <span>
                        <strong>{log.profiles?.name || 'Unknown'}</strong>
                        <span style={{ color: '#64748b' }}> → </span>
                        <span style={{ color: '#2563eb' }}>{log.action}</span>
                        {log.entity_type && (
                          <span style={{ color: '#64748b', fontSize: '12px' }}>
                            {' '}({log.entity_type})
                          </span>
                        )}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>
                        {new Date(log.created_at).toLocaleString('bn-BD')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Permission Modal */}
      {showPermissionModal && selectedUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>⚙️ {selectedUser.name || selectedUser.email} - পারমিশন</h3>
              <button onClick={() => setShowPermissionModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {allPermissions.map((perm) => (
                <div key={perm.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <input
                    type="checkbox"
                    id={`perm-${perm.id}`}
                    onChange={(e) => handleUpdatePermission(selectedUser.id, perm.name, e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor={`perm-${perm.id}`} style={{ fontSize: '13px', cursor: 'pointer', flex: 1 }}>
                    {perm.name}
                    <span style={{ color: '#64748b', fontSize: '11px', marginLeft: '6px' }}>
                      ({perm.category})
                    </span>
                  </label>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                onClick={() => setShowPermissionModal(false)}
                style={{
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  padding: '8px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✅ সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: '500px' }}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>🔔 নোটিফিকেশন পাঠান</h3>
              <button onClick={() => setShowNotificationModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>টাইটেল *</label>
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="নোটিফিকেশন টাইটেল"
                  style={styles.input}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>মেসেজ *</label>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="নোটিফিকেশন মেসেজ"
                  rows="3"
                  style={{ ...styles.input, minHeight: '80px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>প্রাপক</label>
                <select
                  value={notificationUserId}
                  onChange={(e) => setNotificationUserId(e.target.value)}
                  style={styles.input}
                >
                  <option value="all">🌍 সবাইকে পাঠান</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>টাইপ</label>
                <select
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value)}
                  style={styles.input}
                >
                  <option value="info">ℹ️ তথ্য</option>
                  <option value="success">✅ সফল</option>
                  <option value="warning">⚠️ সতর্কতা</option>
                  <option value="error">❌ ত্রুটি</option>
                </select>
              </div>
              <button
                onClick={handleSendNotification}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                📤 নোটিফিকেশন পাঠান
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 3000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px'
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    padding: '24px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '12px'
  },
  closeBtn: {
    background: '#f1f5f9',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    marginTop: '4px'
  }
};
