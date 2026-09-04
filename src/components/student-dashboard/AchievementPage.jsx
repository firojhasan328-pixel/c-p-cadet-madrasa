import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';

export default function AchievementPage() {
  const { userProfile } = usePortal();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, [userProfile]);

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
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

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
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>🏆 অর্জনসমূহ</h2>
        <button onClick={() => window.history.back()} style={styles.backBtn}>
          ⬅ ফিরে যান
        </button>
      </div>

      {achievements.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>🏆</span>
          <p>কোনো অর্জন নেই</p>
          <small style={styles.emptySub}>আপনার অর্জন এখানে দেখাবে</small>
        </div>
      ) : (
        <div style={styles.grid}>
          {achievements.map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardIcon}>🏅</div>
              <div style={styles.cardContent}>
                <h3 style={styles.cardTitle}>{item.title}</h3>
                <p style={styles.cardDesc}>{item.description || 'বিবরণ নেই'}</p>
                <span style={styles.cardDate}>
                  📅 {new Date(item.date).toLocaleDateString('bn-BD')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '0 16px', fontFamily: "'Hind Siliguri', sans-serif" },
  loadingContainer: { textAlign: 'center', padding: '60px 0', color: '#64748b' },
  loadingSpinner: { width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTop: '4px solid #16a34a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  headerTitle: { fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 },
  backBtn: { background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', color: '#64748b' },
  emptyState: { textAlign: 'center', padding: '60px 0', color: '#94a3b8' },
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '8px' },
  emptySub: { fontSize: '13px', color: '#cbd5e1' },
  grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { display: 'flex', gap: '16px', background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', alignItems: 'center' },
  cardIcon: { fontSize: '32px', flexShrink: 0 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  cardDesc: { fontSize: '14px', color: '#64748b', margin: '0 0 6px 0' },
  cardDate: { fontSize: '12px', color: '#94a3b8' },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);
