import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PERMISSIONS = [
  { key: 'manage_teachers', label: '👨‍🏫 শিক্ষক ম্যানেজ', category: 'মূল ম্যানেজমেন্ট' },
  { key: 'manage_students', label: '🎓 ছাত্র ম্যানেজ', category: 'মূল ম্যানেজমেন্ট' },
  { key: 'edit_homepage', label: '🏠 হোমপেজ এডিট', category: 'কন্টেন্ট ম্যানেজমেন্ট' },
  { key: 'edit_principal', label: '👤 প্রধান শিক্ষক এডিট', category: 'কন্টেন্ট ম্যানেজমেন্ট' },
  { key: 'manage_pages', label: '📄 পেজ ম্যানেজ', category: 'কন্টেন্ট ম্যানেজমেন্ট' },
  { key: 'manage_notices', label: '📌 নোটিশ ম্যানেজ', category: 'কন্টেন্ট ম্যানেজমেন্ট' },
  { key: 'manage_gallery', label: '🖼️ গ্যালারি ম্যানেজ', category: 'কন্টেন্ট ম্যানেজমেন্ট' },
  { key: 'edit_contact', label: '📞 যোগাযোগ কন্ট্রোল', category: 'সেটিংস' },
  { key: 'edit_footer', label: '📋 ফুটার কন্ট্রোল', category: 'সেটিংস' },
  { key: 'edit_settings', label: '⚙️ সাইট সেটিংস', category: 'সেটিংস' },
  { key: 'manage_permissions', label: '🛡️ পারমিশন ম্যানেজ', category: 'এডমিন' },
];

export default function PermissionManager() {
  const { isSuperAdmin } = useAuth();
  const [teachers, setTeachers] = useState([
    { id: 1, name: 'জনাব আলী', email: 'ali@example.com', permissions: [] },
    { id: 2, name: 'জনাবা সুমি', email: 'sumi@example.com', permissions: ['manage_students', 'manage_notices'] },
  ]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [tempPermissions, setTempPermissions] = useState([]);

  if (!isSuperAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
        <h2 style={{ color: '#dc2626' }}>অ্যাক্সেস অস্বীকৃত!</h2>
        <p style={{ color: '#64748b' }}>শুধুমাত্র সুপার এডমিন এই পেজ দেখতে পারেন।</p>
      </div>
    );
  }

  const handlePermissionToggle = (permKey) => {
    if (tempPermissions.includes(permKey)) {
      setTempPermissions(tempPermissions.filter(p => p !== permKey));
    } else {
      setTempPermissions([...tempPermissions, permKey]);
    }
  };

  const savePermissions = () => {
    if (!selectedTeacher) return;
    
    const updated = teachers.map(t => {
      if (t.id === selectedTeacher.id) {
        return { ...t, permissions: tempPermissions };
      }
      return t;
    });
    
    setTeachers(updated);
    setSelectedTeacher(null);
    setTempPermissions([]);
    alert('✅ পারমিশন সফলভাবে আপডেট করা হয়েছে!');
  };

  const openPermissionModal = (teacher) => {
    setSelectedTeacher(teacher);
    setTempPermissions(teacher.permissions || []);
  };

  const groupedPermissions = PERMISSIONS.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div>
      <h2 style={{ color: '#0f172a', marginTop: 0 }}>🛡️ পারমিশন ম্যানেজমেন্ট</h2>
      <p style={{ color: '#64748b' }}>শিক্ষকদের পারমিশন দিন বা বাতিল করুন।</p>

      <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>👨‍🏫 শিক্ষক লিস্ট</h3>
        
        {teachers.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>কোনো শিক্ষক পাওয়া যায়নি।</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: '#0f172a' }}>{teacher.name}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>{teacher.email}</div>
                  <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px' }}>
                    পারমিশন: {teacher.permissions?.length || 0} টি
                  </div>
                </div>
                <button
                  onClick={() => openPermissionModal(teacher)}
                  style={{
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '13px'
                  }}
                >
                  ⚙️ পারমিশন সেট
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* পারমিশন মোডাল */}
      {selectedTeacher && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '550px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>⚙️ {selectedTeacher.name} - পারমিশন</h3>
              <button
                onClick={() => { setSelectedTeacher(null); setTempPermissions([]); }}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >✕</button>
            </div>

            {Object.keys(groupedPermissions).map((category) => (
              <div key={category} style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                  📁 {category}
                </h4>
                {groupedPermissions[category].map((perm) => (
                  <label
                    key={perm.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 0',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={tempPermissions.includes(perm.key)}
                      onChange={() => handlePermissionToggle(perm.key)}
                      style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                    />
                    {perm.label}
                  </label>
                ))}
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={savePermissions}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                💾 পারমিশন সংরক্ষণ
              </button>
              <button
                onClick={() => { setSelectedTeacher(null); setTempPermissions([]); }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#334155',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
