import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import TeacherManagement from './TeacherManagement';
import AdvancedCMS from './AdvancedCMS';
import Gallery from './Gallery';
import StudentList from './StudentList';
import PermissionManager from './PermissionManager';

export default function AdminDashboard() {
  const { user, logout, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    admissions: 0,
    notices: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { count: teachers } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
      const { count: students } = await supabase.from('students').select('*', { count: 'exact', head: true });
      const { count: admissions } = await supabase.from('admissions').select('*', { count: 'exact', head: true });
      const { count: notices } = await supabase.from('site_contents').select('*', { count: 'exact', head: true }).eq('key', 'notice_text');

      setStats({ teachers: teachers || 0, students: students || 0, admissions: admissions || 0, notices: notices || 0 });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    setLoading(false);
  };

  const menuItems = [
    { id: 'dashboard', label: '📊 ড্যাশবোর্ড' },
    { id: 'teachers', label: '👨‍🏫 শিক্ষক ম্যানেজ' },
    { id: 'students', label: '🎓 ছাত্র ম্যানেজ' },
    { id: 'homepage', label: '🏠 হোমপেজ এডিট' },
    { id: 'principal', label: '👤 প্রধান শিক্ষক' },
    { id: 'notices', label: '📌 নোটিশ ম্যানেজ' },
    { id: 'gallery', label: '🖼️ গ্যালারি ম্যানেজ' },
    { id: 'contact', label: '📞 যোগাযোগ কন্ট্রোল' },
    { id: 'footer', label: '📋 ফুটার কন্ট্রোল' },
    { id: 'settings', label: '⚙️ সাইট সেটিংস' },
    { id: 'permissions', label: '🛡️ পারমিশন ম্যানেজ' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>⚙️ এডমিন প্যানেল</h2>
          <p style={styles.sidebarUser}>{user?.name || 'Admin'}</p>
          {isSuperAdmin && <span style={styles.superBadge}>⭐ সুপার এডমিন</span>}
        </div>

        <nav style={styles.nav}>
          {menuItems.map(item => (
            <div
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navItem,
                background: activeTab === item.id ? '#1e293b' : 'transparent',
                borderLeft: activeTab === item.id ? '3px solid #16a34a' : '3px solid transparent',
                color: activeTab === item.id ? '#ffffff' : '#94a3b8'
              }}
            >
              {item.label}
            </div>
          ))}
        </nav>

        <button onClick={logout} style={styles.logoutBtn}>🚪 লগআউট</button>
      </div>

      <div style={styles.content}>
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={styles.pageTitle}>📊 ড্যাশবোর্ড</h2>
            <p style={styles.pageSubtitle}>স্বাগতম! এখান থেকে পুরো ওয়েবসাইট কন্ট্রোল করুন।</p>

            <div style={styles.statsGrid}>
              <StatCard icon="👨‍🏫" label="মোট শিক্ষক" value={stats.teachers} color="#16a34a" />
              <StatCard icon="🎓" label="মোট ছাত্র" value={stats.students} color="#2563eb" />
              <StatCard icon="📝" label="ভর্তি আবেদন" value={stats.admissions} color="#f59e0b" />
              <StatCard icon="📌" label="নোটিশ" value={stats.notices} color="#8b5cf6" />
            </div>

            <div style={styles.quickActions}>
              <h3>⚡ দ্রুত অ্যাকশন</h3>
              <div style={styles.actionGrid}>
                <ActionCard icon="➕" label="নতুন শিক্ষক যোগ" onClick={() => setActiveTab('teachers')} />
                <ActionCard icon="📝" label="নতুন নোটিশ" onClick={() => setActiveTab('notices')} />
                <ActionCard icon="🖼️" label="গ্যালারি আপডেট" onClick={() => setActiveTab('gallery')} />
                <ActionCard icon="⚙️" label="সাইট সেটিংস" onClick={() => setActiveTab('settings')} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teachers' && <TeacherManagement />}
        {activeTab === 'homepage' && <AdvancedCMS />}
        {activeTab === 'principal' && <PrincipalEditor />}
        {activeTab === 'notices' && <NoticeManager />}
        {activeTab === 'gallery' && <Gallery />}
        {activeTab === 'contact' && <ContactManager />}
        {activeTab === 'footer' && <FooterManager />}
        {activeTab === 'settings' && <SettingsManager />}
        {activeTab === 'permissions' && <PermissionManager />}
        {activeTab === 'students' && <StudentList />}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ fontSize: '32px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color: color || '#0f172a' }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#64748b' }}>{label}</div>
    </div>
  );
}

function ActionCard({ icon, label, onClick }) {
  return (
    <div onClick={onClick} style={styles.actionCard}>
      <div style={{ fontSize: '28px' }}>{icon}</div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{label}</div>
    </div>
  );
}

// অস্থায়ী কম্পোনেন্ট
function PrincipalEditor() { 
  return (
    <div style={styles.placeholder}>
      <h3>👤 প্রধান শিক্ষক এডিটর</h3>
      <p style={{ color: '#94a3b8' }}>শীঘ্রই আসছে...</p>
    </div>
  ); 
}

function NoticeManager() { 
  return (
    <div style={styles.placeholder}>
      <h3>📌 নোটিশ ম্যানেজার</h3>
      <p style={{ color: '#94a3b8' }}>শীঘ্রই আসছে...</p>
    </div>
  ); 
}

function ContactManager() { 
  return (
    <div style={styles.placeholder}>
      <h3>📞 যোগাযোগ কন্ট্রোল</h3>
      <p style={{ color: '#94a3b8' }}>শীঘ্রই আসছে...</p>
    </div>
  ); 
}

function FooterManager() { 
  return (
    <div style={styles.placeholder}>
      <h3>📋 ফুটার কন্ট্রোল</h3>
      <p style={{ color: '#94a3b8' }}>শীঘ্রই আসছে...</p>
    </div>
  ); 
}

function SettingsManager() { 
  return (
    <div style={styles.placeholder}>
      <h3>⚙️ সাইট সেটিংস</h3>
      <p style={{ color: '#94a3b8' }}>শীঘ্রই আসছে...</p>
    </div>
  ); 
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f1f5f9'
  },
  sidebar: {
    width: '260px',
    background: '#0f172a',
    color: 'white',
    padding: '20px 0',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column'
  },
  sidebarHeader: {
    padding: '0 20px 20px 20px',
    borderBottom: '1px solid #1e293b'
  },
  sidebarTitle: {
    fontSize: '18px',
    margin: 0,
    color: '#f8fafc'
  },
  sidebarUser: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: '4px 0 0 0'
  },
  superBadge: {
    display: 'inline-block',
    marginTop: '4px',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '10px',
    background: '#fef3c7',
    color: '#b45309'
  },
  nav: {
    flex: 1,
    padding: '12px 0'
  },
  navItem: {
    padding: '10px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '14px'
  },
  logoutBtn: {
    margin: '16px 20px',
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    background: '#dc2626',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px'
  },
  content: {
    flex: 1,
    padding: '24px',
    overflow: 'auto'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 4px 0'
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 24px 0'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '30px'
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '16px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  quickActions: {
    background: 'white',
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0'
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginTop: '12px'
  },
  actionCard: {
    padding: '16px',
    borderRadius: '12px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  placeholder: {
    padding: '40px 20px',
    textAlign: 'center',
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    color: '#0f172a'
  }
};
