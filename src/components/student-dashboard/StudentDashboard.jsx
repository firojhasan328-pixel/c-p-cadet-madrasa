import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';
import DashboardCards from './DashboardCards';
import ProfileCard from './ProfileCard';
import QuickStats from './QuickStats';

export default function StudentDashboard() {
  const { userProfile } = usePortal();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);

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

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>⏳ লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
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

      <QuickStats studentData={studentData} />
      <DashboardCards studentData={studentData} />

      <div style={styles.bottomRow}>
        <ProfileCard studentData={studentData} />
      </div>
    </div>
  );
}

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
    gridTemplateColumns: '1fr',
    gap: '20px',
    marginTop: '20px'
  }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
