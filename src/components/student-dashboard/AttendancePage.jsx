import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';

export default function AttendancePage() {
  const { userProfile } = usePortal();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0, percentage: 0 });

  useEffect(() => {
    fetchAttendance();
  }, [userProfile]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', userProfile.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setAttendance(data || []);

      const total = data?.length || 0;
      const present = data?.filter(a => a.status === 'present').length || 0;
      const absent = data?.filter(a => a.status === 'absent').length || 0;
      const late = data?.filter(a => a.status === 'late').length || 0;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      setStats({ present, absent, late, total, percentage });
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
        <h2 style={styles.headerTitle}>📈 উপস্থিতি</h2>
        <button onClick={() => window.history.back()} style={styles.backBtn}>
          ⬅ ফিরে যান
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.percentage}%</div>
          <div style={styles.statLabel}>উপস্থিতি</div>
        </div>
        <div style={{ ...styles.statCard, background: '#dcfce7' }}>
          <div style={{ ...styles.statNumber, color: '#16a34a' }}>{stats.present}</div>
          <div style={styles.statLabel}>✅ উপস্থিত</div>
        </div>
        <div style={{ ...styles.statCard, background: '#fee2e2' }}>
          <div style={{ ...styles.statNumber, color: '#dc2626' }}>{stats.absent}</div>
          <div style={styles.statLabel}>❌ অনুপস্থিত</div>
        </div>
        <div style={{ ...styles.statCard, background: '#fef3c7' }}>
          <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{stats.late}</div>
          <div style={styles.statLabel}>⏰ দেরি</div>
        </div>
      </div>

      {attendance.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <p>কোনো উপস্থিতি রেকর্ড নেই</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>তারিখ</th>
                <th style={styles.th}>স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((item, index) => (
                <tr key={index} style={styles.tr}>
                  <td style={styles.td}>{new Date(item.date).toLocaleDateString('bn-BD')}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: item.status === 'present' ? '#dcfce7' : item.status === 'late' ? '#fef3c7' : '#fee2e2',
                      color: item.status === 'present' ? '#16a34a' : item.status === 'late' ? '#f59e0b' : '#dc2626',
                    }}>
                      {item.status === 'present' ? '✅ উপস্থিত' : item.status === 'late' ? '⏰ দেরি' : '❌ অনুপস্থিত'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '0 16px', fontFamily: "'Hind Siliguri', sans-serif" },
  loadingContainer: { textAlign: 'center', padding: '60px 0', color: '#64748b' },
  loadingSpinner: { width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTop: '4px solid #16a34a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  headerTitle: { fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 },
  backBtn: { background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', color: '#64748b' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { background: 'white', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' },
  statNumber: { fontSize: '28px', fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: '12px', color: '#64748b', fontWeight: '500' },
  emptyState: { textAlign: 'center', padding: '60px 0', color: '#94a3b8' },
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '12px' },
  tableWrapper: { overflowX: 'auto', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '300px' },
  th: { padding: '12px 16px', textAlign: 'left', background: '#f8fafc', fontWeight: '700', color: '#334155', borderBottom: '2px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', verticalAlign: 'middle' },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block' },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);
