import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';
import DashboardCards from './DashboardCards';
import ProfileCard from './ProfileCard';
import NoticeCard from './NoticeCard';
import QuickStats from './QuickStats';

// =============================================
// ✅ সব পেজ ইমপোর্ট
// =============================================
import ProfilePage from './ProfilePage';
import ResultPage from './ResultPage';
import RoutinePage from './RoutinePage';
import AssignmentPage from './AssignmentPage';
import ExamRoutinePage from './ExamRoutinePage';
import AttendancePage from './AttendancePage';
import NoticePage from './NoticePage';
import AchievementPage from './AchievementPage';
import CertificatePage from './CertificatePage';

export default function StudentDashboard() {
  const { userProfile } = usePortal();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (userProfile) {
      fetchStudentData();
    }
  }, [userProfile]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', userProfile.id)
        .single();

      if (data) {
        setStudentData(data);
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
    }
    setLoading(false);
  };

  // =============================================
  // ✅ সব পেজের জন্য কন্ডিশন
  // =============================================

  // ১. প্রোফাইল পেজ
  if (activeTab === 'profile') {
    return <ProfilePage onBack={() => setActiveTab('dashboard')} />;
  }

  // ২. রেজাল্ট পেজ
  if (activeTab === 'result') {
    return <ResultPage onBack={() => setActiveTab('dashboard')} />;
  }

  // ৩. রুটিন পেজ
  if (activeTab === 'routine') {
    return <RoutinePage onBack={() => setActiveTab('dashboard')} />;
  }

  // ৪. অ্যাসাইনমেন্ট পেজ
  if (activeTab === 'assignments') {
    return <AssignmentPage onBack={() => setActiveTab('dashboard')} />;
  }

  // ৫. পরীক্ষার রুটিন পেজ
  if (activeTab === 'exam') {
    return <ExamRoutinePage onBack={() => setActiveTab('dashboard')} />;
  }

  // ৬. উপস্থিতি পেজ
  if (activeTab === 'attendance') {
    return <AttendancePage onBack={() => setActiveTab('dashboard')} />;
  }

  // ৭. নোটিশ পেজ
  if (activeTab === 'notices') {
    return <NoticePage onBack={() => setActiveTab('dashboard')} />;
  }

  // ৮. অর্জন পেজ
  if (activeTab === 'achievements') {
    return <AchievementPage onBack={() => setActiveTab('dashboard')} />;
  }

  // ৯. সার্টিফিকেট পেজ
  if (activeTab === 'certificates') {
    return <CertificatePage onBack={() => setActiveTab('dashboard')} />;
  }

  // =============================================
  // ✅ লোডিং
  // =============================================
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>⏳ লোড হচ্ছে...</p>
      </div>
    );
  }

  // =============================================
  // ✅ ড্যাশবোর্ড
  // =============================================
  return (
    <div style={styles.container}>
      {/* হেডার */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>🎓 ছাত্র ড্যাশবোর্ড</h1>
          <p style={styles.headerSubtitle}>
            স্বাগতম, {studentData?.name || 'ছাত্র'}! 👋
          </p>
        </div>
        <div style={styles.headerBadge}>
          <span style={styles.badgeClass}>{studentData?.class_name || 'ক্লাস'}</span>
          <span style={styles.badgeRoll}>রোল: {studentData?.roll_number || '—'}</span>
        </div>
      </div>

      {/* কুইক স্ট্যাটস */}
      <QuickStats studentData={studentData} />

      {/* ড্যাশবোর্ড কার্ড */}
      <DashboardCards 
        studentData={studentData} 
        onFeatureClick={(featureId) => {
          // ✅ সব ফিচারের জন্য কন্ডিশন
          const validTabs = [
            'profile', 'result', 'routine', 'assignments', 
            'exam', 'attendance', 'notices', 'achievements', 'certificates'
          ];
          if (validTabs.includes(featureId)) {
            setActiveTab(featureId);
          }
        }}
      />

      {/* প্রোফাইল ও নোটিশ */}
      <div style={styles.bottomRow}>
        <ProfileCard studentData={studentData} />
        <NoticeCard studentData={studentData} />
      </div>
    </div>
  );
}

// =============================================
// 🎨 স্টাইল
// =============================================
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 20px',
    fontFamily: "'Hind Siliguri', sans-serif"
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px'
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #16a34a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    color: '#64748b',
    fontSize: '16px',
    fontWeight: '500'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '28px',
    padding: '20px 24px',
    background: 'linear-gradient(135deg, #064e3b 0%, #14532d 100%)',
    borderRadius: '18px',
    color: 'white'
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: '800',
    margin: '0 0 4px 0',
    color: '#ffffff'
  },
  headerSubtitle: {
    fontSize: '15px',
    color: '#bbf7d0',
    margin: 0
  },
  headerBadge: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  badgeClass: {
    background: 'rgba(255,255,255,0.2)',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    backdropFilter: 'blur(4px)'
  },
  badgeRoll: {
    background: 'rgba(255,255,255,0.15)',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    backdropFilter: 'blur(4px)'
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginTop: '20px'
  }
};

// অ্যানিমেশন
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
