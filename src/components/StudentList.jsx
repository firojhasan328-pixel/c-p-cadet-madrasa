import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  // =============================================
  // ✅ ডেটা ফেচ (শুধু অনুমোদিত + রোল ১-৩)
  // =============================================
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_approved', true)
        .in('roll_number', [1, 2, 3])
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
  // ✅ Realtime subscription (রিফ্রেশ ছাড়া আপডেট)
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

      {/* ✅ ক্লাস ভিত্তিক টপ ৩ কার্ড */}
      {sortedClassNames.map((className) => {
        const classStudents = groupedStudents[className] || [];
        if (classStudents.length === 0) return null;

        return (
          <div key={className} style={styles.classSection}>
            <h3 style={styles.classTitle}>📚 {className} শ্রেণী</h3>

            <div style={styles.cardGrid}>
              {classStudents.map((student) => {
                const rank = getRankBadge(student.roll_number);
                return (
                  <div key={student.id} style={styles.studentCard}>
                    {/* ✅ ছবি */}
                    <div style={styles.imageWrapper}>
                      {student.photo_url ? (
                        <img
                          src={student.photo_url}
                          alt={student.name}
                          style={styles.studentImage}
                        />
                      ) : (
                        <div style={styles.imagePlaceholder}>
                          {student.name?.charAt(0) || '?'}
                        </div>
                      )}
                      {/* ✅ রোল ব্যাজ */}
                      <div style={styles.rankBadgeWrapper}>
                        <span style={styles.rankEmoji}>{rank.emoji}</span>
                        <span style={styles.rankLabel}>{rank.label}</span>
                      </div>
                    </div>

                    {/* ✅ ডিটেল্স */}
                    <div style={styles.studentInfo}>
                      <h4 style={styles.studentName}>{student.name}</h4>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>👨 বাবা:</span>
                        <span style={styles.detailValue}>{student.father_name || '—'}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>👩 মা:</span>
                        <span style={styles.detailValue}>{student.mother_name || '—'}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>🔢 রোল:</span>
                        <span style={styles.detailValue}>#{student.roll_number}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>📍 গ্রাম:</span>
                        <span style={styles.detailValue}>{student.village || student.address || '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================
// 🎨 প্রিমিয়াম স্টাইল (শিক্ষক কার্ডের মতো)
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
  totalIcon: { fontSize: '48px' },
  totalNumber: { fontSize: '32px', fontWeight: '800', lineHeight: 1.2 },
  totalLabel: { fontSize: '16px', opacity: 0.85, fontWeight: '500' },
  classSection: {
    marginBottom: '32px',
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  classTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 16px 0',
    paddingBottom: '10px',
    borderBottom: '2px solid #f1f5f9',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  studentCard: {
    background: '#f8fafc',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    paddingTop: '100%',
    background: '#f1f5f9',
  },
  studentImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    fontSize: '48px',
    fontWeight: '700',
  },
  rankBadgeWrapper: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(0,0,0,0.7)',
    padding: '4px 12px',
    borderRadius: '20px',
    backdropFilter: 'blur(4px)',
  },
  rankEmoji: {
    fontSize: '16px',
  },
  rankLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'white',
  },
  studentInfo: {
    padding: '16px',
  },
  studentName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 10px 0',
    textAlign: 'center',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '13px',
    borderBottom: '1px solid #f1f5f9',
  },
  detailLabel: {
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    color: '#0f172a',
    fontWeight: '600',
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
