import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ✅ ১০টি কার্ডের ডেটা (অনলাইন ক্লাস যোগ করা হয়েছে)
const features = [
  { id: 'profile', icon: '👤', label: 'আমার প্রোফাইল', color: '#3b82f6', bg: '#eff6ff', path: '/student/profile' },
  { id: 'result', icon: '📊', label: 'আমার রেজাল্ট', color: '#8b5cf6', bg: '#f5f3ff', path: '/student/result' },
  { id: 'routine', icon: '📅', label: 'ক্লাস রুটিন', color: '#16a34a', bg: '#f0fdf4', path: '/student/routine' },
  { id: 'assignments', icon: '📝', label: 'অ্যাসাইনমেন্ট', color: '#f59e0b', bg: '#fffbeb', path: '/student/assignments' },
  { id: 'exam', icon: '📋', label: 'পরীক্ষার রুটিন', color: '#ef4444', bg: '#fef2f2', path: '/student/exam-routine' },
  { id: 'attendance', icon: '📈', label: 'উপস্থিতি', color: '#06b6d4', bg: '#ecfeff', path: '/student/attendance' },
  { id: 'notices', icon: '🔔', label: 'আমার নোটিশ', color: '#8b5cf6', bg: '#f5f3ff', path: '/student/notices' },
  { id: 'achievements', icon: '🏆', label: 'অর্জনসমূহ', color: '#f59e0b', bg: '#fffbeb', path: '/student/achievements' },
  { id: 'certificates', icon: '📄', label: 'সার্টিফিকেট', color: '#3b82f6', bg: '#eff6ff', path: '/student/certificates' },
  // ✅ নতুন: অনলাইন ক্লাস
  { id: 'online_class', icon: '🎥', label: 'অনলাইন ক্লাস', color: '#ec4899', bg: '#fdf2f8', path: '/student/online-class' },
];

export default function DashboardCards({ studentData, onFeatureClick }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  const handleCardClick = (feature) => {
    if (feature.path) {
      navigate(feature.path);
    }
    if (onFeatureClick) {
      onFeatureClick(feature.id);
    }
  };

  return (
    <div style={styles.grid}>
      {features.map((feature) => (
        <div
          key={feature.id}
          style={{
            ...styles.card,
            backgroundColor: feature.bg,
            borderColor: hovered === feature.id ? feature.color : '#e2e8f0',
            transform: hovered === feature.id ? 'translateY(-6px)' : 'none',
            boxShadow: hovered === feature.id ? '0 12px 30px rgba(0,0,0,0.12)' : '0 4px 12px rgba(0,0,0,0.04)',
          }}
          onMouseEnter={() => setHovered(feature.id)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => handleCardClick(feature)}
        >
          <div style={{ ...styles.iconWrapper, backgroundColor: feature.color }}>
            <span style={styles.icon}>{feature.icon}</span>
          </div>
          <h3 style={styles.cardLabel}>{feature.label}</h3>
          <span style={{ ...styles.arrow, color: feature.color }}>→</span>
        </div>
      ))}
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px',
    marginTop: '20px'
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 16px',
    borderRadius: '16px',
    border: '2px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    minHeight: '120px'
  },
  iconWrapper: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px'
  },
  icon: {
    fontSize: '24px'
  },
  cardLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0',
    textAlign: 'center'
  },
  arrow: {
    position: 'absolute',
    bottom: '8px',
    right: '12px',
    fontSize: '18px',
    fontWeight: '300',
    opacity: 0.5
  }
};
