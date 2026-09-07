import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';

export default function ExamRoutinePage({ onBack }) {
  const { userProfile } = usePortal();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (userProfile) {
      fetchExamRoutine();
    }
  }, [userProfile]);

  // =============================================
  // ✅ পরীক্ষার রুটিন ডেটা ফেচ
  // =============================================
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
      console.error('❌ পরীক্ষার রুটিন লোড করতে সমস্যা:', error);
    }
    setLoading(false);
  };

  // =============================================
  // ✅ বাকি দিন কাউন্ট
  // =============================================
  const getDaysLeft = (date) => {
    const now = new Date();
    const examDate = new Date(date);
    const diff = examDate - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: '✅ শেষ', color: '#64748b', bg: '#f1f5f9' };
    if (days === 0) return { text: '🔥 আজ', color: '#dc2626', bg: '#fee2e2' };
    if (days <= 3) return { text: `⏳ ${days} দিন`, color: '#dc2626', bg: '#fee2e2' };
    if (days <= 7) return { text: `⏳ ${days} দিন`, color: '#f59e0b', bg: '#fef3c7' };
    return { text: `⏳ ${days} দিন`, color: '#16a34a', bg: '#dcfce7' };
  };

  // =============================================
  // ✅ পরীক্ষার টাইপ ব্যাজ
  // =============================================
  const getExamTypeBadge = (type) => {
    const types = {
      'অর্ধ-বার্ষিক': { bg: '#dbeafe', color: '#2563eb' },
      'বার্ষিক': { bg: '#dcfce7', color: '#16a34a' },
      'মডেল টেস্ট': { bg: '#fef3c7', color: '#f59e0b' },
      'প্রস্তুতি': { bg: '#f3e8ff', color: '#8b5cf6' },
    };
    return types[type] || { bg: '#f1f5f9', color: '#64748b' };
  };

  // =============================================
  // ✅ ফিল্টার
  // =============================================
  const getFilteredData = () => {
    if (filterType === 'all') return exams;
    return exams.filter(e => e.exam_type === filterType);
  };

  const filteredData = getFilteredData();
  const examTypes = [...new Set(exams.map(e => e.exam_type).filter(Boolean))];

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
        <h2 style={styles.headerTitle}>📋 পরীক্ষার রুটিন</h2>
        <div style={styles.headerSpacer}></div>
      </div>

      {/* ক্লাস তথ্য */}
      <div style={styles.classInfo}>
        <span style={styles.classBadge}>📚 {userProfile.class_name} শ্রেণী</span>
        <span style={styles.examCount}>📝 {exams.length} টি পরীক্ষা</span>
      </div>

      {/* ফিল্টার */}
      {examTypes.length > 0 && (
        <div style={styles.filterBar}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              ...styles.filterBtn,
              ...(filterType === 'all' ? styles.filterBtnActive : {}),
            }}
          >
            📌 সব
          </button>
          {examTypes.map((type, i) => (
            <button
              key={i}
              onClick={() => setFilterType(type)}
              style={{
                ...styles.filterBtn,
                ...(filterType === type ? styles.filterBtnActive : {}),
              }}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* পরীক্ষার তালিকা */}
      {exams.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <p>কোনো পরীক্ষার রুটিন নেই</p>
          <p style={styles.emptySub}>পরীক্ষার রুটিন প্রকাশিত হলে এখানে দেখাবে</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>🔍</span>
          <p>এই ফিল্টারে কোনো পরীক্ষা পাওয়া যায়নি</p>
        </div>
      ) : (
        <div style={styles.list}>
          {/* গ্রুপ করে দেখানো (তারিখ অনুযায়ী) */}
          {Object.entries(
            filteredData.reduce((acc, exam) => {
              const date = new Date(exam.date).toLocaleDateString('bn-BD');
              if (!acc[date]) acc[date] = [];
              acc[date].push(exam);
              return acc;
            }, {})
          ).map(([date, examsOnDate]) => (
            <div key={date} style={styles.dateGroup}>
              <div style={styles.dateHeader}>
                <span style={styles.dateIcon}>📅</span>
                <span style={styles.dateText}>{date}</span>
                <span style={styles.dateBadge}>{examsOnDate.length} টি</span>
              </div>
              {examsOnDate.map((exam, index) => {
                const daysLeft = getDaysLeft(exam.date);
                const typeBadge = getExamTypeBadge(exam.exam_type);
                return (
                  <div key={index} style={styles.examCard}>
                    <div style={styles.examHeader}>
                      <div style={styles.examTitleSection}>
                        <h3 style={styles.examTitle}>{exam.subject}</h3>
                        <span style={{
                          ...styles.examTypeBadge,
                          background: typeBadge.bg,
                          color: typeBadge.color,
                        }}>
                          {exam.exam_type || 'পরীক্ষা'}
                        </span>
                      </div>
                      <span style={{
                        ...styles.daysBadge,
                        background: daysLeft.bg,
                        color: daysLeft.color,
                      }}>
                        {daysLeft.text}
                      </span>
                    </div>
                    <div style={styles.examDetails}>
                      <span>⏰ {exam.start_time || '—'} - {exam.end_time || '—'}</span>
                      <span>🏠 {exam.room_number || 'রুম নির্ধারিত হয়নি'}</span>
                    </div>
                    {exam.notes && (
                      <p style={styles.examNotes}>📌 {exam.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
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
    maxWidth: '900px',
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
  classInfo: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px',
    padding: '12px 16px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  classBadge: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a',
  },
  examCount: {
    fontSize: '14px',
    color: '#64748b',
  },
  filterBar: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '16px',
    padding: '12px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  filterBtn: {
    padding: '6px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
    transition: 'all 0.2s ease',
  },
  filterBtnActive: {
    background: '#16a34a',
    color: 'white',
    borderColor: '#16a34a',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 0',
    color: '#94a3b8',
  },
  emptyIcon: { fontSize: '56px', display: 'block', marginBottom: '12px' },
  emptySub: { fontSize: '13px', color: '#cbd5e1' },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  dateGroup: {
    background: 'white',
    borderRadius: '14px',
    padding: '16px',
    border: '1px solid #e2e8f0',
  },
  dateHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingBottom: '12px',
    borderBottom: '2px solid #f1f5f9',
    marginBottom: '12px',
  },
  dateIcon: { fontSize: '18px' },
  dateText: { fontSize: '15px', fontWeight: '700', color: '#0f172a' },
  dateBadge: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#64748b',
    background: '#f1f5f9',
    padding: '2px 12px',
    borderRadius: '12px',
  },
  examCard: {
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: '10px',
    marginBottom: '10px',
    border: '1px solid #e2e8f0',
  },
  examHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '6px',
  },
  examTitleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  examTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  examTypeBadge: {
    padding: '2px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  daysBadge: {
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  examDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#64748b',
    flexWrap: 'wrap',
  },
  examNotes: {
    marginTop: '6px',
    fontSize: '13px',
    color: '#475569',
    background: '#fef3c7',
    padding: '6px 12px',
    borderRadius: '6px',
    borderLeft: '3px solid #f59e0b',
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
