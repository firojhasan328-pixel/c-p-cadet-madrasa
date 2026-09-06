import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';

export default function AssignmentPage({ onBack }) {
  const { userProfile } = usePortal();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    graded: 0,
    overdue: 0,
  });
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (userProfile) {
      fetchAssignments();
    }
  }, [userProfile]);

  // =============================================
  // ✅ অ্যাসাইনমেন্ট ডেটা ফেচ
  // =============================================
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_name', userProfile.class_name)
        .order('deadline', { ascending: true });

      if (error) throw error;

      // ✅ স্ট্যাটাস ক্যালকুলেশন
      const now = new Date();
      const processed = (data || []).map(item => {
        const deadline = new Date(item.deadline);
        const isOverdue = deadline < now && item.status !== 'submitted' && item.status !== 'graded';
        return { ...item, isOverdue };
      });

      setAssignments(processed);

      // ✅ স্ট্যাটিস্টিক্স
      const total = processed.length;
      const pending = processed.filter(a => a.status === 'pending' || !a.status).length;
      const submitted = processed.filter(a => a.status === 'submitted').length;
      const graded = processed.filter(a => a.status === 'graded').length;
      const overdue = processed.filter(a => a.isOverdue).length;

      setStats({ total, pending, submitted, graded, overdue });

    } catch (error) {
      console.error('❌ অ্যাসাইনমেন্ট লোড করতে সমস্যা:', error);
    }
    setLoading(false);
  };

  // =============================================
  // ✅ ফিল্টার ডেটা
  // =============================================
  const getFilteredData = () => {
    let filtered = assignments;

    if (filter === 'pending') {
      filtered = filtered.filter(a => a.status === 'pending' || !a.status);
    } else if (filter === 'submitted') {
      filtered = filtered.filter(a => a.status === 'submitted');
    } else if (filter === 'graded') {
      filtered = filtered.filter(a => a.status === 'graded');
    } else if (filter === 'overdue') {
      filtered = filtered.filter(a => a.isOverdue);
    }

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  // =============================================
  // ✅ ডেডলাইন কাউন্টডাউন
  // =============================================
  const getDeadlineStatus = (deadline, isOverdue) => {
    if (isOverdue) return { text: '⏰ মেয়াদ শেষ', color: '#dc2626', bg: '#fee2e2' };
    const now = new Date();
    const diff = new Date(deadline) - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 1) return { text: `⏳ ${days} দিন বাকি`, color: '#dc2626', bg: '#fee2e2' };
    if (days <= 3) return { text: `⏳ ${days} দিন বাকি`, color: '#f59e0b', bg: '#fef3c7' };
    return { text: `⏳ ${days} দিন বাকি`, color: '#16a34a', bg: '#dcfce7' };
  };

  // =============================================
  // ✅ স্ট্যাটাস ব্যাজ
  // =============================================
  const getStatusBadge = (status, isOverdue) => {
    if (isOverdue && status !== 'submitted' && status !== 'graded') {
      return { label: '⏰ মেয়াদ শেষ', color: '#dc2626', bg: '#fee2e2' };
    }
    const statuses = {
      'pending': { label: '⏳ pending', color: '#f59e0b', bg: '#fef3c7' },
      'submitted': { label: '✅ জমা দেওয়া', color: '#2563eb', bg: '#dbeafe' },
      'graded': { label: '📊 গ্রেড দেওয়া', color: '#16a34a', bg: '#dcfce7' },
    };
    return statuses[status] || statuses['pending'];
  };

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
        <h2 style={styles.headerTitle}>📝 অ্যাসাইনমেন্ট</h2>
        <div style={styles.headerSpacer}></div>
      </div>

      {/* স্ট্যাটিস্টিক্স কার্ড */}
      {assignments.length > 0 && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📋</div>
            <div>
              <div style={styles.statNumber}>{stats.total}</div>
              <div style={styles.statLabel}>মোট</div>
            </div>
          </div>
          <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
            <div style={styles.statIcon}>⏳</div>
            <div>
              <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{stats.pending}</div>
              <div style={styles.statLabel}>pending</div>
            </div>
          </div>
          <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #dbeafe, #93c5fd)' }}>
            <div style={styles.statIcon}>✅</div>
            <div>
              <div style={{ ...styles.statNumber, color: '#2563eb' }}>{stats.submitted}</div>
              <div style={styles.statLabel}>জমা দেওয়া</div>
            </div>
          </div>
          <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
            <div style={styles.statIcon}>📊</div>
            <div>
              <div style={{ ...styles.statNumber, color: '#16a34a' }}>{stats.graded}</div>
              <div style={styles.statLabel}>গ্রেড দেওয়া</div>
            </div>
          </div>
        </div>
      )}

      {/* ফিল্টার বার */}
      {assignments.length > 0 && (
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="🔍 অ্যাসাইনমেন্ট খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">📌 সব</option>
            <option value="pending">⏳ pending</option>
            <option value="submitted">✅ জমা দেওয়া</option>
            <option value="graded">📊 গ্রেড দেওয়া</option>
            <option value="overdue">⏰ মেয়াদ শেষ</option>
          </select>
        </div>
      )}

      {/* অ্যাসাইনমেন্ট লিস্ট */}
      {assignments.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <p>কোনো অ্যাসাইনমেন্ট নেই</p>
          <p style={styles.emptySub}>শিক্ষক অ্যাসাইনমেন্ট দিলে এখানে দেখাবে</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>🔍</span>
          <p>ফিল্টারে কোনো অ্যাসাইনমেন্ট পাওয়া যায়নি</p>
        </div>
      ) : (
        <div style={styles.list}>
          {filteredData.map((item) => {
            const status = getStatusBadge(item.status, item.isOverdue);
            const deadline = getDeadlineStatus(item.deadline, item.isOverdue);
            return (
              <div key={item.id} style={{
                ...styles.assignmentCard,
                borderLeftColor: item.isOverdue && item.status !== 'submitted' && item.status !== 'graded' ? '#dc2626' : '#16a34a',
              }}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitleSection}>
                    <h3 style={styles.cardTitle}>{item.title}</h3>
                    <span style={{
                      ...styles.statusBadge,
                      background: status.bg,
                      color: status.color,
                    }}>
                      {status.label}
                    </span>
                  </div>
                  <span style={{
                    ...styles.deadlineBadge,
                    background: deadline.bg,
                    color: deadline.color,
                  }}>
                    {deadline.text}
                  </span>
                </div>
                <p style={styles.cardDesc}>{item.description || 'বিবরণ নেই'}</p>
                <div style={styles.cardMeta}>
                  <span>📚 {item.subject || '—'}</span>
                  <span>👨‍🏫 {item.teacher_name || 'শিক্ষক'}</span>
                  <span>📅 {new Date(item.deadline).toLocaleDateString('bn-BD')}</span>
                </div>
                {item.marks && (
                  <div style={styles.marksBadge}>
                    📊 প্রাপ্ত নম্বর: <strong>{item.marks}</strong>
                  </div>
                )}
              </div>
            );
          })}
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 20px',
    borderRadius: '14px',
    background: 'white',
    border: '1px solid #e2e8f0',
  },
  statIcon: { fontSize: '28px' },
  statNumber: { fontSize: '24px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 },
  statLabel: { fontSize: '12px', color: '#64748b', fontWeight: '500' },
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
    minWidth: '160px',
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
    minWidth: '130px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 0',
    color: '#94a3b8',
  },
  emptyIcon: { fontSize: '56px', display: 'block', marginBottom: '12px' },
  emptySub: { fontSize: '13px', color: '#cbd5e1' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  assignmentCard: {
    background: 'white',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    borderLeft: '4px solid #16a34a',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '8px',
  },
  cardTitleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  statusBadge: {
    padding: '3px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  deadlineBadge: {
    padding: '3px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  cardDesc: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 10px 0',
  },
  cardMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#94a3b8',
    flexWrap: 'wrap',
  },
  marksBadge: {
    marginTop: '10px',
    padding: '8px 14px',
    background: '#f0fdf4',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#16a34a',
    border: '1px solid #bbf7d0',
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
