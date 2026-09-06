import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';

export default function NoticePage({ onBack }) {
  const { userProfile } = usePortal();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (userProfile) {
      fetchNotices();
    }
  }, [userProfile]);

  // =============================================
  // ✅ নোটিশ ডেটা ফেচ
  // =============================================
  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portal_notices')
        .select('*')
        .or(`target_class.eq.${userProfile.class_name},target_class.is.null`)
        .or(`target_role.eq.student,target_role.eq.both`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ✅ রিড স্টেট চেক (লোকাল স্টোরেজ থেকে)
      const readNotices = JSON.parse(localStorage.getItem('readNotices') || '{}');
      const processed = (data || []).map(item => ({
        ...item,
        isRead: readNotices[item.id] || false,
        isImportant: item.is_featured || false,
      }));

      setNotices(processed);
    } catch (error) {
      console.error('❌ নোটিশ লোড করতে সমস্যা:', error);
    }
    setLoading(false);
  };

  // =============================================
  // ✅ নোটিশ রিড মার্ক করা
  // =============================================
  const markAsRead = (id) => {
    const readNotices = JSON.parse(localStorage.getItem('readNotices') || '{}');
    readNotices[id] = true;
    localStorage.setItem('readNotices', JSON.stringify(readNotices));
    setNotices(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  // =============================================
  // ✅ ক্যাটাগরি ব্যাজ
  // =============================================
  const getCategoryBadge = (notice) => {
    if (notice.is_featured) {
      return { label: '⭐ গুরুত্বপূর্ণ', bg: '#fef3c7', color: '#f59e0b' };
    }
    const categories = {
      'academic': { label: '📚 অ্যাকাডেমিক', bg: '#dbeafe', color: '#2563eb' },
      'admin': { label: '📋 অ্যাডমিন', bg: '#f1f5f9', color: '#64748b' },
      'event': { label: '🎉 ইভেন্ট', bg: '#fce7f3', color: '#db2777' },
      'exam': { label: '📝 পরীক্ষা', bg: '#dcfce7', color: '#16a34a' },
    };
    return categories[notice.category] || { label: '📌 সাধারণ', bg: '#f8fafc', color: '#64748b' };
  };

  // =============================================
  // ✅ ফিল্টার ডেটা
  // =============================================
  const getFilteredData = () => {
    let filtered = notices;

    if (filter === 'important') {
      filtered = filtered.filter(n => n.is_featured);
    } else if (filter === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.isRead);
    }

    if (searchTerm) {
      filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredData = getFilteredData();

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
        <h2 style={styles.headerTitle}>🔔 আমার নোটিশ</h2>
        <div style={styles.headerSpacer}></div>
      </div>

      {/* কাউন্ট */}
      <div style={styles.countBar}>
        <span>📢 মোট নোটিশ: <strong>{notices.length}</strong></span>
        <span>📖 পড়া হয়েছে: <strong>{notices.filter(n => n.isRead).length}</strong></span>
        <span>🆕 পড়া হয়নি: <strong>{notices.filter(n => !n.isRead).length}</strong></span>
        {notices.filter(n => n.is_featured).length > 0 && (
          <span>⭐ গুরুত্বপূর্ণ: <strong>{notices.filter(n => n.is_featured).length}</strong></span>
        )}
      </div>

      {/* ফিল্টার বার */}
      {notices.length > 0 && (
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="🔍 নোটিশ খুঁজুন..."
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
            <option value="important">⭐ গুরুত্বপূর্ণ</option>
            <option value="unread">🆕 পড়া হয়নি</option>
            <option value="read">📖 পড়া হয়েছে</option>
          </select>
        </div>
      )}

      {/* নোটিশ লিস্ট */}
      {notices.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <p>কোনো নোটিশ নেই</p>
          <p style={styles.emptySub}>নতুন নোটিশ আসলে এখানে দেখাবে</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>🔍</span>
          <p>ফিল্টারে কোনো নোটিশ পাওয়া যায়নি</p>
        </div>
      ) : (
        <div style={styles.list}>
          {filteredData.map((notice) => {
            const category = getCategoryBadge(notice);
            return (
              <div
                key={notice.id}
                style={{
                  ...styles.noticeCard,
                  ...(notice.is_featured ? styles.noticeCardImportant : {}),
                  ...(!notice.isRead ? styles.noticeCardUnread : {}),
                }}
                onClick={() => markAsRead(notice.id)}
              >
                <div style={styles.noticeHeader}>
                  <div style={styles.noticeTitleSection}>
                    <h3 style={styles.noticeTitle}>{notice.title}</h3>
                    <span style={{
                      ...styles.categoryBadge,
                      background: category.bg,
                      color: category.color,
                    }}>
                      {category.label}
                    </span>
                  </div>
                  <span style={styles.noticeDate}>
                    {new Date(notice.created_at).toLocaleDateString('bn-BD')}
                  </span>
                </div>
                <p style={styles.noticeMessage}>{notice.message}</p>
                <div style={styles.noticeFooter}>
                  <span style={styles.noticeTarget}>
                    🎯 {notice.target_role === 'both' ? 'সকলকে' :
                         notice.target_role === 'student' ? 'ছাত্র' :
                         notice.target_role === 'teacher' ? 'শিক্ষক' : 'সকলকে'}
                    {notice.target_class && ` | 📚 ${notice.target_class}`}
                  </span>
                  {!notice.isRead && (
                    <span style={styles.unreadBadge}>🆕 পড়া হয়নি</span>
                  )}
                  {notice.isRead && (
                    <span style={styles.readBadge}>✅ পড়া হয়েছে</span>
                  )}
                </div>
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
  countBar: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '16px',
    padding: '12px 16px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    color: '#64748b',
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  noticeCard: {
    background: 'white',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  noticeCardImportant: {
    borderLeft: '4px solid #f59e0b',
    background: '#fffbeb',
  },
  noticeCardUnread: {
    borderLeft: '4px solid #2563eb',
    background: '#eff6ff',
  },
  noticeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '8px',
  },
  noticeTitleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  noticeTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  categoryBadge: {
    padding: '2px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  noticeDate: {
    fontSize: '13px',
    color: '#94a3b8',
    whiteSpace: 'nowrap',
  },
  noticeMessage: {
    fontSize: '14px',
    color: '#475569',
    margin: '0 0 10px 0',
    lineHeight: '1.6',
  },
  noticeFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    paddingTop: '10px',
    borderTop: '1px solid #f1f5f9',
  },
  noticeTarget: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  unreadBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#2563eb',
    background: '#dbeafe',
    padding: '2px 12px',
    borderRadius: '12px',
  },
  readBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    background: '#f1f5f9',
    padding: '2px 12px',
    borderRadius: '12px',
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
