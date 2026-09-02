import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  // =============================================
  // ✅ ডেটা ফেচ
  // =============================================
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_approved', true) // শুধু অনুমোদিত
        .in('roll_number', [1, 2, 3]) // শুধু রোল ১-৩
        .order('class_name', { ascending: true })
        .order('roll_number', { ascending: true });

      if (error) throw error;

      setStudents(data || []);
      setTotalStudents(data?.length || 0);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
    setLoading(false);
  };

  // =============================================
  // ✅ Realtime subscription (পুরো টেবিল)
  // =============================================
  useEffect(() => {
    fetchStudents();

    const studentChannel = supabase
      .channel('student-list-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
        },
        () => {
          fetchStudents(); // রিফ্রেশ ছাড়াই আপডেট
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(studentChannel);
    };
  }, []);

  // =============================================
  // ✅ ক্লাস অনুযায়ী গ্রুপ
  // =============================================
  const groupedStudents = students.reduce((acc, student) => {
    const className = student.class_name || 'অনির্ধারিত';
    if (!acc[className]) acc[className] = [];
    acc[className].push(student);
    return acc;
  }, {});

  const classOrder = ['প্লে', '১ম', '২য়', '৩য়', '৪র্থ', '৫ম'];
  const sortedClassNames = Object.keys(groupedStudents).sort(
    (a, b) => classOrder.indexOf(a) - classOrder.indexOf(b)
  );

  // =============================================
  // ✅ রোল অনুযায়ী ব্যাজ
  // =============================================
  const getRankBadge = (roll) => {
    if (roll === 1) return { emoji: '🥇', label: 'প্রথম', color: '#fbbf24' };
    if (roll === 2) return { emoji: '🥈', label: 'দ্বিতীয়', color: '#94a3b8' };
    if (roll === 3) return { emoji: '🥉', label: 'তৃতীয়', color: '#d97706' };
    return { emoji: '🏅', label: 'শীর্ষ', color: '#16a34a' };
  };

  // =============================================
  // ✅ রেন্ডার
  // =============================================
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
      {/* ✅ মোট ছাত্র কাউন্ট */}
      <div style={styles.totalCard}>
        <span style={styles.totalIcon}>👦</span>
        <div>
          <div style={styles.totalNumber}>{totalStudents}</div>
          <div style={styles.totalLabel}>জন মেধাবী ছাত্র-ছাত্রী</div>
        </div>
      </div>

      {/* ✅ ক্লাস ভিত্তিক সেকশন (খালি থাকলেও দেখাবে না) */}
      {sortedClassNames.map((className) => {
        const classStudents = groupedStudents[className] || [];
        if (classStudents.length === 0) return null; // ✅ খালি থাকলে দেখাবে না

        return (
          <div key={className} style={styles.classSection}>
            <h3 style={styles.classTitle}>📚 {className} শ্রেণী</h3>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ক্রম</th>
                    <th style={styles.th}>ছবি</th>
                    <th style={styles.th}>নাম</th>
                    <th style={styles.th}>বাবার নাম</th>
                    <th style={styles.th}>মায়ের নাম</th>
                    <th style={styles.th}>রোল</th>
                    <th style={styles.th}>গ্রাম</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map((student, index) => {
                    const rank = getRankBadge(student.roll_number);
                    return (
                      <tr key={student.id} style={styles.tr}>
                        <td style={styles.td}>
                          <span style={styles.rankNumber}>{index + 1}</span>
                        </td>
                        <td style={styles.td}>
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              alt={student.name}
                              style={styles.avatar}
                            />
                          ) : (
                            <div style={styles.avatarPlaceholder}>
                              {student.name?.charAt(0) || '?'}
                            </div>
                          )}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.nameContainer}>
                            <span style={styles.studentName}>{student.name}</span>
                            <span style={styles.rankBadge}>
                              {rank.emoji} {rank.label}
                            </span>
                          </div>
                        </td>
                        <td style={styles.td}>{student.father_name || '—'}</td>
                        <td style={styles.td}>{student.mother_name || '—'}</td>
                        <td style={styles.td}>
                          <span style={styles.rollBadge}>#{student.roll_number}</span>
                        </td>
                        <td style={styles.td}>{student.village || student.address || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================
// 🎨 প্রিমিয়াম স্টাইল
// =============================================
const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '0 16px',
    fontFamily: "'Hind Siliguri', sans-serif",
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
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
  loadingText: {
    color: '#64748b',
    fontSize: '16px',
    fontWeight: '500',
  },
  totalCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    background: 'linear-gradient(135deg, #14532d, #16a34a)',
    borderRadius: '18px',
    padding: '24px 32px',
    marginBottom: '32px',
    color: 'white',
    boxShadow: '0 8px 24px rgba(22, 163, 74, 0.3)',
  },
  totalIcon: {
    fontSize: '48px',
  },
  totalNumber: {
    fontSize: '32px',
    fontWeight: '800',
    lineHeight: 1.2,
  },
  totalLabel: {
    fontSize: '16px',
    opacity: 0.85,
    fontWeight: '500',
  },
  classSection: {
    marginBottom: '28px',
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  classTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    padding: '16px 20px',
    background: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  tableWrapper: {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
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
    fontWeight: '700',
    color: '#475569',
    background: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.15s ease',
  },
  td: {
    padding: '12px 16px',
    verticalAlign: 'middle',
    fontSize: '14px',
    color: '#1e293b',
  },
  rankNumber: {
    fontWeight: '700',
    color: '#94a3b8',
    fontSize: '14px',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    objectFit: 'cover',
    border: '2px solid #e2e8f0',
    display: 'block',
  },
  avatarPlaceholder: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    border: '2px solid #e2e8f0',
  },
  nameContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  studentName: {
    fontWeight: '600',
    color: '#0f172a',
  },
  rankBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
  },
  rollBadge: {
    display: 'inline-block',
    padding: '2px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    background: '#dbeafe',
    color: '#2563eb',
  },
};

// ✅ অ্যানিমেশন
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
