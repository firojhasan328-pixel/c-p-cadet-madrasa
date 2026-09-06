import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';

export default function ResultPage({ onBack }) {
  const { userProfile } = usePortal();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalMarks: 0,
    average: 0,
    gpa: 0,
    passed: 0,
    failed: 0,
  });
  const [filterExam, setFilterExam] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [exams, setExams] = useState([]);

  useEffect(() => {
    if (userProfile) {
      fetchResults();
    }
  }, [userProfile]);

  // =============================================
  // ✅ রেজাল্ট ডেটা ফেচ
  // =============================================
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

      // ✅ ইউনিক পরীক্ষার নাম বের করা
      const uniqueExams = [...new Set(data.map(r => r.exam_name).filter(Boolean))];
      setExams(uniqueExams);

      // ✅ স্ট্যাটিস্টিক্স ক্যালকুলেশন
      if (data && data.length > 0) {
        const totalSubjects = data.length;
        const totalMarks = data.reduce((sum, r) => sum + (r.marks || 0), 0);
        const average = totalSubjects > 0 ? parseFloat((totalMarks / totalSubjects).toFixed(2)) : 0;

        // ✅ GPA ক্যালকুলেশন (সিম্পল)
        let gpaSum = 0;
        let passed = 0;
        let failed = 0;

        data.forEach(r => {
          const marks = r.marks || 0;
          if (marks >= 40) passed++;
          else failed++;

          if (marks >= 90) gpaSum += 4.0;
          else if (marks >= 80) gpaSum += 3.5;
          else if (marks >= 70) gpaSum += 3.0;
          else if (marks >= 60) gpaSum += 2.5;
          else if (marks >= 40) gpaSum += 2.0;
          else gpaSum += 0;
        });

        const avgGpa = totalSubjects > 0 ? parseFloat((gpaSum / totalSubjects).toFixed(2)) : 0;

        setStats({
          totalSubjects,
          totalMarks,
          average,
          gpa: avgGpa,
          passed,
          failed,
        });
      }

    } catch (error) {
      console.error('❌ রেজাল্ট লোড করতে সমস্যা:', error);
    }
    setLoading(false);
  };

  // =============================================
  // ✅ গ্রেড নির্ধারণ
  // =============================================
  const getGrade = (marks) => {
    if (marks >= 90) return { grade: 'A+', color: '#16a34a', bg: '#dcfce7', label: 'উত্তম' };
    if (marks >= 80) return { grade: 'A', color: '#16a34a', bg: '#dcfce7', label: 'ভালো' };
    if (marks >= 70) return { grade: 'B', color: '#f59e0b', bg: '#fef3c7', label: 'মধ্যম' };
    if (marks >= 60) return { grade: 'C', color: '#f59e0b', bg: '#fef3c7', label: 'সন্তোষজনক' };
    if (marks >= 40) return { grade: 'D', color: '#ef4444', bg: '#fee2e2', label: 'দুর্বল' };
    return { grade: 'F', color: '#dc2626', bg: '#fee2e2', label: 'অকৃতকার্য' };
  };

  // =============================================
  // ✅ ফিল্টার ডেটা
  // =============================================
  const getFilteredData = () => {
    let filtered = results;

    if (filterExam !== 'all') {
      filtered = filtered.filter(r => r.exam_name === filterExam);
    }

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.exam_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  // =============================================
  // ✅ গ্রেড ডিস্ট্রিবিউশন
  // =============================================
  const getGradeDistribution = () => {
    const dist = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    results.forEach(r => {
      const grade = getGrade(r.marks || 0);
      if (dist[grade.grade] !== undefined) {
        dist[grade.grade]++;
      }
    });
    return dist;
  };

  const gradeDist = getGradeDistribution();

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

  // =============================================
  // ✅ রেন্ডার
  // =============================================
  return (
    <div style={styles.container}>
      {/* হেডার */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>⬅ ফিরে যান</button>
        <h2 style={styles.headerTitle}>📊 আমার রেজাল্ট</h2>
        <div style={styles.headerSpacer}></div>
      </div>

      {/* স্ট্যাটিস্টিক্স কার্ড */}
      {results.length > 0 && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📚</div>
            <div>
              <div style={styles.statNumber}>{stats.totalSubjects}</div>
              <div style={styles.statLabel}>মোট বিষয়</div>
            </div>
          </div>
          <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
            <div style={styles.statIcon}>📈</div>
            <div>
              <div style={{ ...styles.statNumber, color: '#16a34a' }}>{stats.totalMarks}</div>
              <div style={styles.statLabel}>মোট নম্বর</div>
            </div>
          </div>
          <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
            <div style={styles.statIcon}>🎯</div>
            <div>
              <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{stats.average}</div>
              <div style={styles.statLabel}>গড় নম্বর</div>
            </div>
          </div>
          <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #dbeafe, #93c5fd)' }}>
            <div style={styles.statIcon}>⭐</div>
            <div>
              <div style={{ ...styles.statNumber, color: '#2563eb' }}>{stats.gpa}</div>
              <div style={styles.statLabel}>জিপিএ</div>
            </div>
          </div>
        </div>
      )}

      {/* পাস/ফেল সারাংশ */}
      {results.length > 0 && (
        <div style={styles.passFailContainer}>
          <div style={styles.passBadge}>
            ✅ পাস: <strong>{stats.passed}</strong>
          </div>
          <div style={styles.failBadge}>
            ❌ ফেল: <strong>{stats.failed}</strong>
          </div>
          <div style={styles.passRateBadge}>
            📊 পাসের হার: <strong>
              {stats.totalSubjects > 0 
                ? Math.round((stats.passed / stats.totalSubjects) * 100) 
                : 0}%
            </strong>
          </div>
        </div>
      )}

      {/* ফিল্টার বার */}
      {results.length > 0 && (
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="🔍 বিষয় বা পরীক্ষা দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={filterExam}
            onChange={(e) => setFilterExam(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">📌 সব পরীক্ষা</option>
            {exams.map((exam, i) => (
              <option key={i} value={exam}>{exam}</option>
            ))}
          </select>
        </div>
      )}

      {/* রেজাল্ট টেবিল */}
      {results.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <p>কোনো রেজাল্ট পাওয়া যায়নি</p>
          <p style={styles.emptySub}>রেজাল্ট প্রকাশিত হলে এখানে দেখাবে</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>🔍</span>
          <p>ফিল্টারে কোনো রেজাল্ট পাওয়া যায়নি</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>পরীক্ষা</th>
                <th style={styles.th}>বিষয়</th>
                <th style={styles.th}>প্রাপ্ত</th>
                <th style={styles.th}>মোট</th>
                <th style={styles.th}>গ্রেড</th>
                <th style={styles.th}>স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((result, index) => {
                const gradeInfo = getGrade(result.marks || 0);
                const isPassed = (result.marks || 0) >= 40;
                return (
                  <tr key={index} style={styles.tr}>
                    <td style={styles.td}>{result.exam_name || '—'}</td>
                    <td style={styles.td}>
                      <span style={styles.subjectBadge}>{result.subject || '—'}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.marksNumber}>{result.marks || 0}</span>
                    </td>
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
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        background: isPassed ? '#dcfce7' : '#fee2e2',
                        color: isPassed ? '#16a34a' : '#dc2626',
                      }}>
                        {isPassed ? '✅ পাস' : '❌ ফেল'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* গ্রেড ডিস্ট্রিবিউশন */}
      {results.length > 0 && (
        <div style={styles.gradeDistribution}>
          <h3 style={styles.distTitle}>📊 গ্রেড ডিস্ট্রিবিউশন</h3>
          <div style={styles.distGrid}>
            {Object.entries(gradeDist).map(([grade, count]) => {
              const colors = {
                'A+': '#16a34a',
                'A': '#22c55e',
                'B': '#f59e0b',
                'C': '#f97316',
                'D': '#ef4444',
                'F': '#dc2626',
              };
              const bgColors = {
                'A+': '#dcfce7',
                'A': '#dcfce7',
                'B': '#fef3c7',
                'C': '#ffedd5',
                'D': '#fee2e2',
                'F': '#fee2e2',
              };
              return (
                <div key={grade} style={{
                  ...styles.distItem,
                  background: bgColors[grade] || '#f1f5f9',
                  borderColor: colors[grade] || '#94a3b8',
                }}>
                  <span style={{ ...styles.distGrade, color: colors[grade] || '#0f172a' }}>{grade}</span>
                  <span style={styles.distCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// 🎨 প্রিমিয়াম স্টাইল
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
    marginBottom: '24px',
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '18px 20px',
    borderRadius: '14px',
    background: 'white',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  statIcon: {
    fontSize: '28px',
  },
  statNumber: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
  },
  passFailContainer: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '20px',
    padding: '12px 16px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  passBadge: {
    fontSize: '14px',
    color: '#16a34a',
    fontWeight: '500',
  },
  failBadge: {
    fontSize: '14px',
    color: '#dc2626',
    fontWeight: '500',
  },
  passRateBadge: {
    fontSize: '14px',
    color: '#2563eb',
    fontWeight: '500',
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
    minWidth: '180px',
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
  emptyIcon: {
    fontSize: '56px',
    display: 'block',
    marginBottom: '12px',
  },
  emptySub: {
    fontSize: '13px',
    color: '#cbd5e1',
  },
  tableWrapper: {
    overflowX: 'auto',
    background: 'white',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    minWidth: '600px',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    background: '#f8fafc',
    fontWeight: '700',
    color: '#334155',
    borderBottom: '2px solid #e2e8f0',
    whiteSpace: 'nowrap',
    fontSize: '12px',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '12px 16px',
    verticalAlign: 'middle',
  },
  subjectBadge: {
    background: '#dbeafe',
    color: '#2563eb',
    padding: '2px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    display: 'inline-block',
  },
  marksNumber: {
    fontWeight: '700',
    color: '#0f172a',
  },
  gradeBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    display: 'inline-block',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  },
  gradeDistribution: {
    marginTop: '24px',
    padding: '20px',
    background: 'white',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
  },
  distTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 16px 0',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '10px',
  },
  distGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
    gap: '10px',
  },
  distItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 8px',
    borderRadius: '10px',
    border: '2px solid',
  },
  distGrade: {
    fontSize: '18px',
    fontWeight: '800',
  },
  distCount: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
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
