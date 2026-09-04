import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';

export default function ExamRoutinePage() {
  const { userProfile } = usePortal();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExamRoutine();
  }, [userProfile]);

  const fetchExamRoutine = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_routines')
        .select('*')
        .eq('class_name', userProfile.class_name)
        .order('date', { ascending: true });

      if (error) throw error;
      setExams(data || []);
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
        <h2 style={styles.headerTitle}>📋 পরীক্ষার রুটিন</h2>
        <button onClick={() => window.history.back()} style={styles.backBtn}>
          ⬅ ফিরে যান
        </button>
      </div>

      {exams.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <p>কোনো পরীক্ষার রুটিন নেই</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>পরীক্ষার নাম</th>
                <th style={styles.th}>বিষয়</th>
                <th style={styles.th}>তারিখ</th>
                <th style={styles.th}>সময়</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((item, index) => (
                <tr key={index} style={styles.tr}>
                  <td style={styles.td}>{item.exam_name}</td>
                  <td style={styles.td}>{item.subject}</td>
                  <td style={styles.td}>{new Date(item.date).toLocaleDateString('bn-BD')}</td>
                  <td style={styles.td}>
                    {item.start_time && item.end_time
                      ? `${item.start_time} - ${item.end_time}`
                      : '—'}
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
  emptyState: { textAlign: 'center', padding: '60px 0', color: '#94a3b8' },
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '12px' },
  tableWrapper: { overflowX: 'auto', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '400px' },
  th: { padding: '12px 16px', textAlign: 'left', background: '#f8fafc', fontWeight: '700', color: '#334155', borderBottom: '2px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', verticalAlign: 'middle' },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);
