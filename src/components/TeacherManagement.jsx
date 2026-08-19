import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  getAllPermissions,
  groupPermissionsByCategory,
  updateUserPermission,
  sendNotification,
  logActivity,
  assignRoleToUser
} from '../utils/permissionService';

export default function TeacherManagement() {
  const { user, isSuperAdmin, isAdmin, hasPermission } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Teacher Form
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    subject: '',
    gender: 'male',
    photo: ''
  });

  useEffect(() => {
    if (isSuperAdmin || (isAdmin && hasPermission('teacher.view'))) {
      loadData();
    }
  }, [isSuperAdmin, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. সব শিক্ষক লোড
      const { data: teachersData } = await supabase
        .from('teachers')
        .select('*')
        .order('name', { ascending: true });

      setTeachers(teachersData || []);

      // 2. সব ইউজার লোড (রোল সহ)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

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

      // 3. সব পারমিশন লোড
      const perms = await getAllPermissions();
      setAllPermissions(perms);
      setGroupedPermissions(groupPermissionsByCategory(perms));

    } catch (error) {
      console.error('Error loading data:', error);
      setErrorMsg('ডেটা লোড করতে সমস্যা: ' + error.message);
    }
    setLoading(false);
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newTeacher.name || !newTeacher.email || !newTeacher.phone) {
      setErrorMsg('❌ নাম, ইমেইল এবং ফোন নম্বর আবশ্যক');
      return;
    }

    try {
      // 1. ইউজার চেক করুন
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newTeacher.email)
        .single();

      let userId;

      if (existingUser) {
        userId = existingUser.id;
        // ইউজারকে teacher রোল দিন
        await assignRoleToUser(userId, 'teacher', user?.id);
      } else {
        // নতুন ইউজার তৈরি করুন (পাসওয়ার্ড জেনারেট করুন)
        const tempPassword = Math.random().toString(36).slice(-8);
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: newTeacher.email,
          password: tempPassword,
        });

        if (authError) throw authError;
        userId = authData.user.id;

        // প্রোফাইল তৈরি
        await supabase.from('profiles').insert({
          id: userId,
          name: newTeacher.name,
          email: newTeacher.email,
          role: 'teacher'
        });

        // teacher রোল দিন
        await assignRoleToUser(userId, 'teacher', user?.id);
      }

      // 2. শিক্ষক ডেটা ইনসার্ট
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .insert([{
          name: newTeacher.name,
          email: newTeacher.email,
          phone: newTeacher.phone,
          designation: newTeacher.designation,
          subject: newTeacher.subject,
          gender: newTeacher.gender,
          photo: newTeacher.photo || null,
          user_id: userId,
          is_approved: true
        }])
        .select();

      if (teacherError) throw teacherError;

      setSuccessMsg(`✅ ${newTeacher.name} শিক্ষক হিসেবে যোগ করা হয়েছে!`);
      
      await sendNotification(
        userId,
        'শিক্ষক নিবন্ধন',
        `আপনাকে ${newTeacher.designation || 'শিক্ষক'} হিসেবে যোগ করা হয়েছে।`,
        'success'
      );

      await logActivity(user?.id, 'ADD_TEACHER', 'teachers', teacherData[0]?.id, {
        name: newTeacher.name,
        email: newTeacher.email
      });

      setNewTeacher({
        name: '',
        email: '',
        phone: '',
        designation: '',
        subject: '',
        gender: 'male',
        photo: ''
      });
      setShowAddModal(false);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg('❌ শিক্ষক যোগ করতে সমস্যা: ' + error.message);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!confirm('এই শিক্ষককে ডিলিট করতে চান?')) return;

    try {
      await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherId);

      setSuccessMsg('✅ শিক্ষক ডিলিট করা হয়েছে!');
      await logActivity(user?.id, 'DELETE_TEACHER', 'teachers', teacherId, {});
      await loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg('❌ শিক্ষক ডিলিট করতে সমস্যা: ' + error.message);
    }
  };

  const handleUpdatePermission = async (teacherId, permissionName, isAllowed) => {
    try {
      const result = await updateUserPermission(teacherId, permissionName, isAllowed, user?.id);
      
      if (result.success) {
        setSuccessMsg(`✅ ${permissionName} পারমিশন ${isAllowed ? 'দেওয়া' : 'বাতিল'} করা হয়েছে!`);
        
        await sendNotification(
          teacherId,
          'পারমিশন পরিবর্তন',
          `${isAllowed ? '✅' : '❌'} ${permissionName} পারমিশন ${isAllowed ? 'দেওয়া' : 'বাতিল'} করা হয়েছে।`,
          isAllowed ? 'success' : 'warning'
        );
        
        await logActivity(user?.id, 'UPDATE_TEACHER_PERMISSION', 'user_permissions', teacherId, {
          permission: permissionName,
          is_allowed: isAllowed
        });

        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg('❌ পারমিশন আপডেট করতে সমস্যা: ' + result.error);
      }
    } catch (error) {
      setErrorMsg('❌ পারমিশন আপডেট করতে সমস্যা: ' + error.message);
    }
  };

  const getTeacherPermissions = async (userId) => {
    try {
      const { data } = await supabase
        .from('user_permissions')
        .select('permission_id, is_allowed, permissions(name)')
        .eq('user_id', userId);

      return data || [];
    } catch (error) {
      console.error('Error fetching teacher permissions:', error);
      return [];
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.phone?.includes(searchTerm)
  );

  // Permission Check
  const canView = isSuperAdmin || (isAdmin && hasPermission('teacher.view'));
  const canAdd = isSuperAdmin || (isAdmin && hasPermission('teacher.add'));
  const canEdit = isSuperAdmin || (isAdmin && hasPermission('teacher.edit'));
  const canDelete = isSuperAdmin || (isAdmin && hasPermission('teacher.delete'));
  const canAssignPermission = isSuperAdmin || (isAdmin && hasPermission('teacher.permission.assign'));

  if (!canView) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
        <h2 style={{ color: '#dc2626' }}>অ্যাক্সেস অস্বীকৃত!</h2>
        <p style={{ color: '#64748b' }}>আপনার এই পেজ দেখার অনুমতি নেই।</p>
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
          <h2 style={{ margin: 0, color: '#0f172a' }}>👨‍🏫 শিক্ষক ব্যবস্থাপনা</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            শিক্ষকদের তথ্য এবং পারমিশন ম্যানেজ করুন
          </p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              background: '#16a34a',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ নতুন শিক্ষক যোগ করুন
          </button>
        )}
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
          placeholder="🔍 শিক্ষক খুঁজুন (নাম, ইমেইল বা ফোন)"
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

      {/* Teacher List */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px 0' }}>⏳ লোড হচ্ছে...</p>
      ) : filteredTeachers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>👀</div>
          <p>কোনো শিক্ষক পাওয়া যায়নি</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredTeachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              canEdit={canEdit}
              canDelete={canDelete}
              canAssignPermission={canAssignPermission}
              onDelete={handleDeleteTeacher}
              onUpdatePermission={handleUpdatePermission}
              getTeacherPermissions={getTeacherPermissions}
              permissions={allPermissions}
              groupedPermissions={groupedPermissions}
            />
          ))}
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: '500px' }}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>➕ নতুন শিক্ষক যোগ করুন</h3>
              <button onClick={() => setShowAddModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleAddTeacher}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={styles.label}>নাম *</label>
                  <input
                    type="text"
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                    placeholder="শিক্ষকের নাম"
                    required
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>ইমেইল *</label>
                  <input
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                    placeholder="teacher@example.com"
                    required
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>ফোন *</label>
                  <input
                    type="tel"
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})}
                    placeholder="01XXXXXXXXX"
                    required
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>পদবী</label>
                  <input
                    type="text"
                    value={newTeacher.designation}
                    onChange={(e) => setNewTeacher({...newTeacher, designation: e.target.value})}
                    placeholder="যেমন: হেডমাস্টার"
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>বিষয়</label>
                  <input
                    type="text"
                    value={newTeacher.subject}
                    onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})}
                    placeholder="যেমন: বাংলা, ইংরেজি"
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>লিঙ্গ</label>
                  <select
                    value={newTeacher.gender}
                    onChange={(e) => setNewTeacher({...newTeacher, gender: e.target.value})}
                    style={styles.input}
                  >
                    <option value="male">পুরুষ</option>
                    <option value="female">মহিলা</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>ছবির URL (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={newTeacher.photo}
                    onChange={(e) => setNewTeacher({...newTeacher, photo: e.target.value})}
                    placeholder="https://example.com/photo.jpg"
                    style={styles.input}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    background: '#16a34a',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '15px'
                  }}
                >
                  ✅ শিক্ষক যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// Teacher Card Component
// =============================================
function TeacherCard({
  teacher,
  canEdit,
  canDelete,
  canAssignPermission,
  onDelete,
  onUpdatePermission,
  getTeacherPermissions,
  permissions,
  groupedPermissions
}) {
  const [expanded, setExpanded] = useState(false);
  const [teacherPerms, setTeacherPerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);

  useEffect(() => {
    if (expanded || showPermModal) {
      loadTeacherPermissions();
    }
  }, [expanded, showPermModal]);

  const loadTeacherPermissions = async () => {
    if (!teacher.user_id) return;
    setLoading(true);
    const perms = await getTeacherPermissions(teacher.user_id);
    setTeacherPerms(perms);
    setLoading(false);
  };

  const hasPermission = (permissionName) => {
    const perm = teacherPerms.find(p => p.permissions?.name === permissionName);
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
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: '700',
            color: '#0f172a',
            overflow: 'hidden'
          }}>
            {teacher.photo ? (
              <img src={teacher.photo} alt={teacher.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              teacher.name?.[0] || 'T'
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', color: '#0f172a' }}>{teacher.name}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              {teacher.designation || 'শিক্ষক'} • {teacher.subject || '—'}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              📞 {teacher.phone} • ✉️ {teacher.email}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {canAssignPermission && (
              <button
                onClick={() => setShowPermModal(true)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                ⚙️
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(teacher.id)}
                style={{
                  background: '#fee2e2',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#dc2626'
                }}
              >
                ✕
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: '#f1f5f9',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {expanded ? '▾' : '▸'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div style={{ padding: '0 20px 16px 20px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', paddingTop: '12px' }}>
            <div><span style={{ color: '#64748b', fontSize: '13px' }}>নাম:</span> {teacher.name}</div>
            <div><span style={{ color: '#64748b', fontSize: '13px' }}>ইমেইল:</span> {teacher.email}</div>
            <div><span style={{ color: '#64748b', fontSize: '13px' }}>ফোন:</span> {teacher.phone}</div>
            <div><span style={{ color: '#64748b', fontSize: '13px' }}>পদবী:</span> {teacher.designation || '—'}</div>
            <div><span style={{ color: '#64748b', fontSize: '13px' }}>বিষয়:</span> {teacher.subject || '—'}</div>
            <div><span style={{ color: '#64748b', fontSize: '13px' }}>লিঙ্গ:</span> {teacher.gender === 'male' ? 'পুরুষ' : 'মহিলা'}</div>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {showPermModal && teacher.user_id && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: '500px' }}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>⚙️ {teacher.name} - পারমিশন</h3>
              <button onClick={() => setShowPermModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {loading ? (
                <p style={{ textAlign: 'center', padding: '20px 0' }}>⏳ লোড হচ্ছে...</p>
              ) : (
                Object.keys(groupedPermissions).map((category) => {
                  const categoryPerms = groupedPermissions[category]?.filter(p => 
                    p.name.startsWith('teacher.') || 
                    p.name.startsWith('cms.') ||
                    p.name === 'dashboard.view'
                  ) || [];
                  
                  if (categoryPerms.length === 0) return null;

                  return (
                    <div key={category} style={{ marginBottom: '12px' }}>
                      <h5 style={{
                        margin: '0 0 6px 0',
                        fontSize: '13px',
                        color: '#166534',
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: '4px'
                      }}>
                        📁 {category}
                      </h5>
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
                            onChange={(e) => onUpdatePermission(teacher.user_id, perm.name, e.target.checked)}
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
                  );
                })
              )}
            </div>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                onClick={() => setShowPermModal(false)}
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
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155'
  }
};
