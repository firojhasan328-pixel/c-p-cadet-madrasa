import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ক্লাসের ক্রম
  const classOrder = ['প্লে', '১ম', '২য়', '৩য়', '৪র্থ', '৫ম'];
  // যেসব রোল দেখাবে
  const allowedRolls = [1, 2, 3];
  // টেবিল হেডার (অপশন A)
  const rollHeaders = ['সর্বোচ্চ রোল ১', 'সর্বোচ্চ রোল ২', 'সর্বোচ্চ রোল ৩'];

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
        .in('roll_number', allowedRolls)
        .order('class_name', { ascending: true })
        .order('roll_number', { ascending: true });

      if (error) throw error;

      const filtered = data || [];
      setStudents(filtered);
      setTotalStudents(filtered.length);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
    setLoading(false);
  };

  // =============================================
  // ✅ Realtime subscription
  // =============================================
  useEffect(() => {
    fetchStudents();

    const studentChannel = supabase
      .channel('student-list-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        () => {
          fetchStudents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(studentChannel);
    };
  }, []);

  // =============================================
  // ✅ ক্লাস + রোল অনুযায়ী গ্রুপ
  // =============================================
  const getStudentsByClassAndRoll = (className, rollNumber) => {
    return students.filter(
      (s) =>
        s.class_name === className &&
        parseInt(s.roll_number) === rollNumber
    );
  };

  // ✅ কোন ক্লাসে ডেটা আছে চেক
  const classesWithData = classOrder.filter((cls) =>
    students.some((s) => s.class_name === cls)
  );

  // =============================================
  // ✅ রোল ব্যাজ
  // =============================================
  const getRankBadge = (roll) => {
    if (roll === 1) return { emoji: '🥇', label: 'প্রথম', color: '#fbbf24' };
    if (roll === 2) return { emoji: '🥈', label: 'দ্বিতীয়', color: '#94a3b8' };
    if (roll === 3) return { emoji: '🥉', label: 'তৃতীয়', color: '#d97706' };
    return { emoji: '🏅', label: 'শীর্ষ', color: '#16a34a' };
  };

  // =============================================
  // ✅ মোডাল খোলা
  // =============================================
  const openModal = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedStudent(null);
  };

  // =============================================
  // ✅ লোডিং
  // =============================================
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>⏳ লোড হচ্ছে...</p>
      </div>
    );
  }

  // =============================================
  // ✅ রেন্ডার
  // =============================================
  return (
    <div style={styles.container}>
      {/* ✅ মোট ছাত্র কাউন্ট কার্ড */}
      <div style={styles.totalCard}>
        <span style={styles.totalIcon}>👦</span>
        <div>
          <div style={styles.totalNumber}>{totalStudents}</div>
          <div style={styles.totalLabel}>জন মেধাবী ছাত্র-ছাত্রী</div>
        </div>
      </div>

      {/* ✅ যদি কোনো ছাত্র না থাকে */}
      {classesWithData.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <p style={styles.emptyText}>এখনো কোনো মেধাবী ছাত্র-ছাত্রী নেই</p>
          <p style={styles.emptySubText}>
            রোল ১, ২ বা ৩ অর্জনকারী ছাত্র-ছাত্রীরা এখানে দেখানো হবে
          </p>
        </div>
      ) : (
        /* ✅ টেবিল */
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, ...styles.thClass }}>ক্লাস</th>
                {rollHeaders.map((header, idx) => (
                  <th key={idx} style={styles.th}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classesWithData.map((className) => (
                <tr key={className} style={styles.tr}>
                  {/* ক্লাসের নাম */}
                  <td style={{ ...styles.td, ...styles.tdClass }}>
                    <span style={styles.className}>{className}</span>
                  </td>

                  {/* রোল ১, ২, ৩ এর কলাম */}
                  {allowedRolls.map((rollNumber) => {
                    const matchedStudents = getStudentsByClassAndRoll(
                      className,
                      rollNumber
                    );
                    const rank = getRankBadge(rollNumber);

                    return (
                      <td key={rollNumber} style={styles.td}>
                        {matchedStudents.length === 0 ? (
                          /* ✅ ফাঁকা ঘর — কেউ অর্জন করেনি */
                          <div style={styles.emptyBox}>
                            <span style={styles.emptyBoxIcon}>🏅</span>
                            <p style={styles.emptyBoxText}>
                              এই স্থান এখনো কেউ অর্জন করে নি
                            </p>
                          </div>
                        ) : (
                          /* ✅ ছাত্র/ছাত্রীর ছবি + নাম */
                          <div style={styles.studentGrid}>
                            {matchedStudents.map((student) => (
                              <div
                                key={student.id}
                                style={styles.studentCard}
                                onClick={() => openModal(student)}
                              >
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
                                  <div
                                    style={{
                                      ...styles.rankBadgeWrapper,
                                      background:
                                        rollNumber === 1
                                          ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                                          : rollNumber === 2
                                          ? 'linear-gradient(135deg, #cbd5e1, #94a3b8)'
                                          : 'linear-gradient(135deg, #f97316, #d97706)',
                                    }}
                                  >
                                    <span style={styles.rankEmoji}>
                                      {rank.emoji}
                                    </span>
                                    <span style={styles.rankLabel}>
                                      {rank.label}
                                    </span>
                                  </div>
                                </div>
                                <div style={styles.studentName}>
                                  {student.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ ছাত্রের বিস্তারিত মোডাল */}
      {modalOpen && selectedStudent && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeModal} style={styles.modalCloseBtn}>
              ✕
            </button>

            {/* ছবি */}
            <div style={styles.modalImageWrapper}>
              {selectedStudent.photo_url ? (
                <img
                  src={selectedStudent.photo_url}
                  alt={selectedStudent.name}
                  style={styles.modalImage}
                />
              ) : (
                <div style={styles.modalImagePlaceholder}>
                  {selectedStudent.name?.charAt(0) || '?'}
                </div>
              )}
              <div
                style={{
                  ...styles.modalRankBadge,
                  background:
                    parseInt(selectedStudent.roll_number) === 1
                      ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                      : parseInt(selectedStudent.roll_number) === 2
                      ? 'linear-gradient(135deg, #cbd5e1, #94a3b8)'
                      : 'linear-gradient(135deg, #f97316, #d97706)',
                }}
              >
                {getRankBadge(parseInt(selectedStudent.roll_number)).emoji}{' '}
                {getRankBadge(parseInt(selectedStudent.roll_number)).label}
              </div>
            </div>

            {/* নাম */}
            <h2 style={styles.modalName}>{selectedStudent.name}</h2>
            <p style={styles.modalClass}>
              📚 {selectedStudent.class_name} শ্রেণী
            </p>

            {/* বিস্তারিত */}
            <div style={styles.modalDetails}>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>👨 বাবার নাম</span>
                <span style={styles.modalValue}>
                  {selectedStudent.father_name || '—'}
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>👩 মায়ের নাম</span>
                <span style={styles.modalValue}>
                  {selectedStudent.mother_name || '—'}
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>🔢 রোল নম্বর</span>
                <span style={styles.modalValue}>
                  #{selectedStudent.roll_number}
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>📍 গ্রাম</span>
                <span style={styles.modalValue}>
                  {selectedStudent.village ||
                    selectedStudent.address ||
                    '—'}
                </span>
              </div>
              {selectedStudent.phone && (
                <div style={styles.modalRow}>
                  <span style={styles.modalLabel}>📱 ফোন</span>
                  <span style={styles.modalValue}>
                    {selectedStudent.phone}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// 🎨 প্রিমিয়াম স্টাইল (আগের সবুজ থিম বজায়)
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

  /* ✅ মোট ছাত্র কার্ড */
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
  totalLabel: { fontSize: '16px', opacity: 0.9, fontWeight: '500' },

  /* ✅ এম্পটি স্টেট */
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    background: 'white',
    borderRadius: '18px',
    border: '1px solid #e2e8f0',
  },
  emptyIcon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: '16px',
    opacity: 0.6,
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 8px 0',
  },
  emptySubText: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },

  /* ✅ টেবিল */
  tableWrapper: {
    overflowX: 'auto',
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    WebkitOverflowScrolling: 'touch',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    minWidth: '720px',
  },
  th: {
    padding: '14px 12px',
    background: '#f0fdf4',
    fontWeight: '700',
    color: '#14532d',
    borderBottom: '2px solid #bbf7d0',
    textAlign: 'center',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
  thClass: {
    width: '100px',
    textAlign: 'center',
    background: '#dcfce7',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '12px 10px',
    verticalAlign: 'top',
    textAlign: 'center',
    borderRight: '1px solid #f1f5f9',
  },
  tdClass: {
    background: '#f8fafc',
    verticalAlign: 'middle',
    borderRight: '2px solid #e2e8f0',
  },
  className: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#14532d',
    display: 'inline-block',
  },

  /* ✅ ফাঁকা ঘর (কেউ অর্জন করেনি) */
  emptyBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '140px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '2px dashed #cbd5e1',
    padding: '12px',
  },
  emptyBoxIcon: {
    fontSize: '28px',
    opacity: 0.4,
    marginBottom: '6px',
  },
  emptyBoxText: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
    margin: 0,
    lineHeight: 1.4,
  },

  /* ✅ ছাত্র কার্ড গ্রিড */
  studentGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
  },
  studentCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  imageWrapper: {
    position: 'relative',
    width: '100px',
    height: '100px',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#f1f5f9',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  studentImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    fontSize: '36px',
    fontWeight: '700',
  },
  rankBadgeWrapper: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: '2px 8px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: '700',
    color: 'white',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  rankEmoji: { fontSize: '11px' },
  rankLabel: { fontSize: '10px', color: 'white', fontWeight: '700' },
  studentName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0f172a',
    marginTop: '6px',
    textAlign: 'center',
    lineHeight: 1.3,
    maxWidth: '100px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },

  /* ✅ মোডাল */
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    animation: 'fadeIn 0.3s ease',
  },
  modalContent: {
    background: 'white',
    borderRadius: '24px',
    padding: '32px 24px 24px 24px',
    maxWidth: '440px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 25px 60px -12px rgba(0,0,0,0.4)',
    animation: 'slideUp 0.4s ease',
    textAlign: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: '14px',
    right: '14px',
    background: '#f1f5f9',
    border: 'none',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
  },
  modalImageWrapper: {
    position: 'relative',
    display: 'inline-block',
    marginBottom: '16px',
  },
  modalImage: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #16a34a',
    boxShadow: '0 8px 24px rgba(22, 163, 74, 0.3)',
  },
  modalImagePlaceholder: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    fontSize: '56px',
    fontWeight: '700',
    border: '4px solid #16a34a',
  },
  modalRankBadge: {
    position: 'absolute',
    bottom: '4px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    whiteSpace: 'nowrap',
  },
  modalName: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '8px 0 4px 0',
  },
  modalClass: {
    fontSize: '14px',
    color: '#16a34a',
    fontWeight: '600',
    margin: '0 0 20px 0',
  },
  modalDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    textAlign: 'left',
    background: '#f8fafc',
    borderRadius: '14px',
    padding: '16px',
  },
  modalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #e2e8f0',
  },
  modalLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
  },
  modalValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'right',
    maxWidth: '60%',
  },
};

// ✅ অ্যানিমেশন Inject
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;
document.head.appendChild(styleSheet);
