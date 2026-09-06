import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';

export default function AchievementPage({ onBack }) {
  const { userProfile } = usePortal();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (userProfile) {
      fetchAchievements();
    }
  }, [userProfile]);

  // =============================================
  // ✅ অর্জন ডেটা ফেচ
  // =============================================
  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('student_id', userProfile.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('❌ অর্জন লোড করতে সমস্যা:', error);
    }
    setLoading(false);
  };

  // =============================================
  // ✅ ক্যাটাগরি ব্যাজ
  // =============================================
  const getCategoryBadge = (category) => {
    const categories = {
      'academic': { label: '📚 একাডেমিক', bg: '#dbeafe', color: '#2563eb', icon: '📚' },
      'sports': { label: '🏃 ক্রীড়া', bg: '#dcfce7', color: '#16a34a', icon: '🏃' },
      'cultural': { label: '🎭 সাংস্কৃতিক', bg: '#fce7f3', color: '#db2777', icon: '🎭' },
      'religious': { label: '🕌 ধর্মীয়', bg: '#fef3c7', color: '#f59e0b', icon: '🕌' },
      'other': { label: '🏅 অন্যান্য', bg: '#f1f5f9', color: '#64748b', icon: '🏅' },
    };
    return categories[category] || categories['other'];
  };

  // =============================================
  // ✅ র্যাঙ্ক ব্যাজ
  // =============================================
  const getRankBadge = (rank) => {
    const ranks = {
      '1st': { label: '🥇 ১ম', color: '#f59e0b', bg: '#fef3c7' },
      '2nd': { label: '🥈 ২য়', color: '#94a3b8', bg: '#f1f5f9' },
      '3rd': { label: '🥉 ৩য়', color: '#d97706', bg: '#fef3c7' },
      'gold': { label: '🏅 গোল্ড', color: '#f59e0b', bg: '#fef3c7' },
      'silver': { label: '🏅 সিলভার', color: '#94a3b8', bg: '#f1f5f9' },
      'bronze': { label: '🏅 ব্রোঞ্জ', color: '#d97706', bg: '#fef3c7' },
      'participation': { label: '🎯 অংশগ্রহণ', color: '#64748b', bg: '#f1f5f9' },
    };
    return ranks[rank] || ranks['participation'];
  };

  // =============================================
  // ✅ ফিল্টার ডেটা
  // =============================================
  const getFilteredData = () => {
    let filtered = achievements;

    if (filter !== 'all') {
      filtered = filtered.filter(a => a.category === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredData = getFilteredData();
  const categories = [...new Set(achievements.map(a => a.category).filter(Boolean))];

  // =============================================
  // ✅ লোডিং
  // =============================================
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>⏳ লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* হেডার */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>⬅ ফিরে যান</button>
        <h2 style={styles.headerTitle}>🏆 অর্জনসমূহ</h2>
        <div style={styles.headerSpacer}></div>
      </div>

      {/* কাউন্ট */}
      <div style={styles.countBar}>
        <span>🏅 মোট অর্জন: <strong>{achievements.length}</strong></span>
        <span>📚 একাডেমিক: <strong>{achievements.filter(a => a.category === 'academic').length}</strong></span>
        <span>🏃 ক্রীড়া: <strong>{achievements.filter(a => a.category === 'sports').length}</strong></span>
        <span>🎭 সাংস্কৃতিক: <strong>{achievements.filter(a => a.category === 'cultural').length}</strong></span>
        {achievements.filter(a => a.rank === '1st' || a.rank === 'gold').length > 0 && (
          <span>🥇 সেরা: <strong>{achievements.filter(a => a.rank === '1st' || a.rank === 'gold').length}</strong></span>
        )}
      </div>

      {/* ফিল্টার */}
      {categories.length > 0 && (
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="🔍 অর্জন খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">📌 সব</option>
            {categories.map((cat, i) => {
              const catInfo = getCategoryBadge(cat);
              return (
                <option key={i} value={cat}>{catInfo.label}</option>
              );
            })}
          </select>
        </div>
      )}

      {/* অর্জন লিস্ট */}
      {achievements.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>🏆</span>
          <p>কোনো অর্জন নেই</p>
          <p style={styles.emptySub}>অর্জন যোগ করলে এখানে দেখাবে</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>🔍</span>
          <p>ফিল্টারে কোনো অর্জন পাওয়া যায়নি</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredData.map((item) => {
            const category = getCategoryBadge(item.category);
            const rank = getRankBadge(item.rank);
            return (
              <div key={item.id} style={styles.achievementCard}>
                <div style={styles.cardIcon}>
                  <span style={styles.cardEmoji}>{category.icon}</span>
                </div>
                <div style={styles.cardContent}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>{item.title}</h3>
                    <span style={{
                      ...styles.rankBadge,
                      background: rank.bg,
                      color: rank.color,
                    }}>
                      {rank.label}
                    </span>
                  </div>
                  <p style={styles.cardDesc}>{item.description || 'বিবরণ নেই'}</p>
                  <div style={styles.cardFooter}>
                    <span style={{
                      ...styles.categoryBadge,
                      background: category.bg,
                      color: category.color,
                    }}>
                      {category.label}
                    </span>
                    <span style={styles.cardDate}>
                      📅 {new Date(item.date).toLocaleDateString('bn-BD')}
                    </span>
                  </div>
                  {item.certificate_url && (
                    <a
                      href={item.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.certLink}
                    >
                      📄 সার্টিফিকেট দেখুন
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================
// 🎨 স্টাইল
// =============================================
const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '0 16px 40px 16px',
    fontFamily: "'Hind Siliguri', sans-serif",
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #16a34a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingTop: '12px',
  },
  backBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#64748b',
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  headerSpacer: {
    width: '80px',
  },
  countBar: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '16px',
    padding: '12px 16px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    color: '#64748b',
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '20px',
    padding: '16px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: '160px',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
  },
  filterSelect: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    background: 'white',
    minWidth: '150px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 0',
    color: '#94a3b8',
  },
  emptyIcon: { fontSize: '56px', display: 'block', marginBottom: '12px' },
  emptySub: { fontSize: '13px', color: '#cbd5e1' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  achievementCard: {
    display: 'flex',
    gap: '16px',
    background: 'white',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    transition: 'all 0.2s ease',
  },
  cardIcon: {
    flexShrink: 0,
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: '24px',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '6px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  rankBadge: {
    padding: '2px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  cardDesc: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 10px 0',
    lineHeight: '1.5',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  categoryBadge: {
    padding: '2px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  cardDate: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  certLink: {
    display: 'inline-block',
    marginTop: '8px',
    fontSize: '13px',
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '600',
    padding: '4px 12px',
    background: '#dbeafe',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
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
