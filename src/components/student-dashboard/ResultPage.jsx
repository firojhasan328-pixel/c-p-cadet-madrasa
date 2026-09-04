import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';

export default function ResultPage() {
  const { userProfile } = usePortal();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalMarks: 0,
    average: 0,
    gpa: 0,
  });

  useEffect(() => {
    fetchResults();
  }, [userProfile]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('student_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setResults(data || []);

      // স্ট্যাটিস্টিক্স ক্যালকুলেশন
      if (data && data.length > 0) {
        const totalSubjects = data.length;
        const totalMarks = data.reduce((sum, r) => sum + (r.marks || 0), 0);
        const average = totalSubjects > 0 ? (totalMarks / totalSubjects) : 0;

        // GPA ক্যালকুলেশন (সিম্পল)
        let gpaSum = 0;
        data.forEach(r => {
          const marks = r.marks || 0;
          if (marks >= 90) gpaSum += 4.0;
          else if (marks >= 80) gpaSum += 3.5;
          else if (marks >= 70) gpaSum += 3.0;
          else if (marks >= 60) gpaSum += 2.5;
          else if (marks >= 40) gpaSum += 2.0;
          else gpaSum += 0;
        });
        const avgGpa = totalSubjects > 0 ? (gpaSum / totalSubjects) : 0;

        setStats({
          totalSubjects,
          totalMarks,
          average: parseFloat(average.toFixed(2)),
          gpa: parseFloat(avgGpa.toFixed(2)),
        });
      }

    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  // গ্রেড নির্ধারণ
  const getGrade = (marks) => {
    if (marks >= 90) return { grade: 'A+', color: '#16a34a', bg: '#dcfce7' };
    if (marks >= 80) return { grade: 'A', color: '#16a34a', bg: '#dcfce7' };
    if (marks >= 70) return { grade: 'B', color: '#f59e0b', bg: '#fef3c7' };
    if (marks >= 60) return { grade: 'C', color: '#f59e0b', bg: '#fef3c7' };
    if (marks >= 40) return { grade: 'D', color: '#ef4444', bg: '#fee2e2' };
    return { grade: 'F', color: '#dc2626', bg: '#fee2e2' };
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
        <h2 style={styles.headerTitle}>📝 আমার রেজাল্ট</h2>
        <button onClick={() => window.history.back()} style={styles.backBtn}>
          ⬅ ফিরে যান
        </button>
      </div>

      {/* সারাংশ */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.totalSubjects}</div>
          <div style={styles.statLabel}>মোট বিষয়</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.totalMarks}</div>
          <div style={styles.statLabel}>মোট নম্বর</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.average}</div>
          <div style={styles.statLabel}>গড় নম্বর</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.gpa}</div>
          <div style={styles.statLabel}>জিপিএ</div>
        </div>
      </div>

      {/* রেজাল্ট টেবিল */}
      {results.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <p>কোনো রেজাল্ট পাওয়া যায়নি</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>পরীক্ষার নাম</th>
                <th style={styles.th}>বিষয়</th>
                <th style={styles.th}>প্রাপ্ত নম্বর</th>
                <th style={styles.th}>মোট নম্বর</th>
                <th style={styles.th}>গ্রেড</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => {
                const gradeInfo = getGrade(result.marks);
                return (
                  <tr key={index} style={styles.tr}>
                    <td style={styles.td}>{result.exam_name || '—'}</td>
                    <td style={styles.td}>{result.subject || '—'}</td>
                    <td style={styles.td}>{result.marks || 0}</td>
                    <td style={styles.td}>{result.total_marks || 100}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.gradeBadge,
                        background: gradeInfo.bg,
                        color: gradeInfo.color,
                      }}>
                        {gradeInfo.grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '0 16px',
    fontFamily: "'Hind Siliguri', sans-serif",
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px 0',
    color: '#64748b',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #16a34a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 0',
    color: '#94a3b8',
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '12px',
  },
  tableWrapper: {
    overflowX: 'auto',
    background: 'white',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    minWidth: '500px',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    background: '#f8fafc',
    fontWeight: '700',
    color: '#334155',
    borderBottom: '2px solid #e2e8f0',
    whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', verticalAlign: 'middle' },
  gradeBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    display: 'inline-block',
  },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
