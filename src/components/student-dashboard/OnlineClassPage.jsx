import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';

export default function OnlineClassPage() {
  const { userProfile } = usePortal();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnlineClasses();
  }, [userProfile]);

  const fetchOnlineClasses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('online_classes')
        .select('*')
        .eq('class_name', userProfile.class_name)
        .order('date', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
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
        <h2 style={styles.headerTitle}>🎥 অনলাইন ক্লাস</h2>
        <button onClick={() => window.history.back()} style={styles.backBtn}>
          ⬅ ফিরে যান
        </button>
      </div>

      {classes.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>🎥</span>
          <p>কোনো অনলাইন ক্লাস নেই</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {classes.map((item) => {
            const isToday = new Date(item.date).toDateString() === new Date().toDateString();
            return (
              <div key={item.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{item.title}</h3>
                  {isToday && <span style={styles.liveBadge}>🔴 লাইভ</span>}
                </div>
                <p style={styles.cardDesc}>📚 {item.subject}</p>
                <div style={styles.cardMeta}>
                  <span>📅 {new Date(item.date).toLocaleDateString('bn-BD')}</span>
                  <span>⏰ {item.start_time} - {item.end_time}</span>
                </div>
                <a
                  href={item.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.joinBtn}
                >
                  🔗 ক্লাসে যোগ দিন
                </a>
              </div>
            );
          })}
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
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  card: { background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 },
  liveBadge: { background: '#dc2626', color: 'white', padding: '2px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', animation: 'pulse 2s infinite' },
  cardDesc: { fontSize: '14px', color: '#64748b', margin: '0 0 8px 0' },
  cardMeta: { display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8', marginBottom: '12px' },
  joinBtn: { display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', padding: '10px', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s ease' },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
`;
document.head.appendChild(styleSheet);
