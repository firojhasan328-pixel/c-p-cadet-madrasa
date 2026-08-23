import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';

export default function PortalLayout({ children, activeTab, setActiveTab, onLogout }) {
  const { userProfile, userRole } = usePortal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ছাত্রদের মেনু
  const studentMenus = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'attendance', label: '📊 Attendance', icon: '📊' },
    { id: 'result', label: '📝 Result', icon: '📝' },
    { id: 'routine', label: '📅 Class Routine', icon: '📅' },
    { id: 'assignment', label: '📚 Assignment', icon: '📚' },
    { id: 'notice', label: '🔔 Personal Notice', icon: '🔔' },
    { id: 'idcard', label: '🪪 Digital ID Card', icon: '🪪' },
    { id: 'achievement', label: '🏆 Achievement', icon: '🏆' },
  ];

  // শিক্ষকদের মেনু
  const teacherMenus = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'teaching_routine', label: '📅 Teaching Routine', icon: '📅' },
    { id: 'attendance', label: '✅ Attendance', icon: '✅' },
    { id: 'result_entry', label: '📝 Result Entry', icon: '📝' },
    { id: 'assignment', label: '📚 Assignment', icon: '📚' },
    { id: 'class_notice', label: '🔔 Class Notice', icon: '🔔' },
    { id: 'student_list', label: '👥 Student List', icon: '👥' },
    { id: 'class_performance', label: '📊 Class Performance', icon: '📊' },
  ];

  const menus = userRole === 'student' ? studentMenus : teacherMenus;

  return (
    <div style={styles.container}>
      {/* মোবাইল হ্যামবার্গার */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={styles.hamburger}
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* সাইডবার */}
      <aside style={{ ...styles.sidebar, ...(mobileMenuOpen ? styles.sidebarOpen : {}) }}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {userProfile?.photo_url ? (
              <img src={userProfile.photo_url} alt="Profile" style={styles.avatarImg} />
            ) : (
              <span style={styles.avatarText}>{userProfile?.name?.[0] || 'U'}</span>
            )}
          </div>
          <div style={styles.userName}>{userProfile?.name || 'User'}</div>
          <div style={styles.userRole}>
            {userRole === 'student' ? '🎓 Student' : '👨‍🏫 Teacher'}
          </div>
        </div>

        <nav style={styles.nav}>
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => {
                setActiveTab(menu.id);
                setMobileMenuOpen(false);
              }}
              style={{
                ...styles.navItem,
                ...(activeTab === menu.id ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.navIcon}>{menu.icon}</span>
              <span>{menu.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={onLogout} style={styles.logoutBtn}>
          🚪 লগআউট
        </button>
      </aside>

      {/* মেইন কন্টেন্ট */}
      <main style={styles.mainContent}>
        <div style={styles.contentHeader}>
          <h2 style={styles.pageTitle}>
            {menus.find(m => m.id === activeTab)?.label || 'ড্যাশবোর্ড'}
          </h2>
          <div style={styles.headerRight}>
            <span style={styles.welcomeText}>
              👋 {userProfile?.name || 'User'}
            </span>
          </div>
        </div>
        <div style={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f1f5f9',
    position: 'relative',
  },
  hamburger: {
    position: 'fixed',
    top: '12px',
    left: '12px',
    zIndex: 100,
    background: '#0f172a',
    color: 'white',
    border: 'none',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'none',
  },
  sidebar: {
    width: '260px',
    background: '#0f172a',
    color: 'white',
    padding: '20px 0',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  sidebarOpen: {
    display: 'flex',
  },
  userInfo: {
    textAlign: 'center',
    padding: '0 16px 20px 16px',
    borderBottom: '1px solid #1e293b',
  },
  avatar: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    backgroundColor: '#1e293b',
    margin: '0 auto 10px auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarText: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#94a3b8',
  },
  userName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#f8fafc',
  },
  userRole: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  navItemActive: {
    background: '#1e293b',
    color: '#ffffff',
  },
  navIcon: {
    fontSize: '18px',
  },
  logoutBtn: {
    margin: '12px 16px',
    padding: '10px',
    borderRadius: '10px',
    border: 'none',
    background: '#dc2626',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
  },
  mainContent: {
    flex: 1,
    padding: '20px 24px',
    overflow: 'auto',
    background: '#f1f5f9',
  },
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  welcomeText: {
    fontSize: '14px',
    color: '#64748b',
  },
  content: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    minHeight: '400px',
  },
  '@media (max-width: 768px)': {
    hamburger: { display: 'block' },
    sidebar: { display: 'none', position: 'fixed', top: 0, left: 0, zIndex: 99, width: '280px', height: '100vh' },
    sidebarOpen: { display: 'flex' },
    mainContent: { padding: '16px', marginTop: '20px' },
  },
};

// রেসপনসিভ স্টাইল
const mediaStyles = document.createElement('style');
mediaStyles.textContent = `
  @media (max-width: 768px) {
    .portal-sidebar { display: none; }
    .portal-sidebar.open { display: flex !important; }
    .hamburger-btn { display: block !important; }
  }
`;
document.head.appendChild(mediaStyles);
