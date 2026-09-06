import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';

export default function CertificatePage({ onBack }) {
  const { userProfile } = usePortal();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (userProfile) {
      fetchCertificates();
    }
  }, [userProfile]);

  // =============================================
  // ✅ সার্টিফিকেট ডেটা ফেচ
  // =============================================
  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('❌ সার্টিফিকেট লোড করতে সমস্যা:', error);
    }
    setLoading(false);
  };

  // =============================================
  // ✅ ক্যাটাগরি ব্যাজ
  // =============================================
  const getCategoryBadge = (category) => {
    const categories = {
      'academic': { label: '📚 একাডেমিক', bg: '#dbeafe', color: '#2563eb' },
      'sports': { label: '🏃 ক্রীড়া', bg: '#dcfce7', color: '#16a34a' },
      'cultural': { label: '🎭 সাংস্কৃতিক', bg: '#fce7f3', color: '#db2777' },
      'religious': { label: '🕌 ধর্মীয়', bg: '#fef3c7', color: '#f59e0b' },
      'other': { label: '📄 অন্যান্য', bg: '#f1f5f9', color: '#64748b' },
    };
    return categories[category] || categories['other'];
  };

  // =============================================
  // ✅ ফিল্টার ডেটা
  // =============================================
  const getFilteredData = () => {
    let filtered = certificates;

    if (filter !== 'all') {
      filtered = filtered.filter(c => c.category === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredData = getFilteredData();
  const categories = [...new Set(certificates.map(c => c.category).filter(Boolean))];

  // =============================================
  // ✅ ডাউনলোড ফাংশন
  // =============================================
  const handleDownload = (url, title) => {
    if (!url) {
      alert('⚠️ এই সার্টিফিকেটের ডাউনলোড লিংক নেই।');
      return;
    }
    window.open(url, '_blank');
  };

  // =============================================
  // ✅ শেয়ার ফাংশন
  // =============================================
  const handleShare = (title) => {
    if (navigator.share) {
      navigator.share({
        title: `🎓 আমার সার্টিফিকেট: ${title}`,
        text: `আমি "${title}" সার্টিফিকেট অর্জন করেছি! 🎉`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`🎓 আমি "${title}" সার্টিফিকেট অর্জন করেছি! 🎉`);
      alert('✅ লিংক কপি করা হয়েছে!');
    }
  };

  // =============================================
  // ✅ প্রিন্ট ফাংশন
  // =============================================
  const handlePrint = (url) => {
    if (!url) {
      alert('⚠️ প্রিন্ট করার জন্য সার্টিফিকেট নেই।');
      return;
    }
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        win.print();
      };
    }
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

  return (
    <div style={styles.container}>
      {/* হেডার */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>⬅ ফিরে যান</button>
        <h2 style={styles.headerTitle}>📄 সার্টিফিকেট</h2>
        <div style={styles.headerSpacer}></div>
      </div>

      {/* কাউন্ট */}
      <div style={styles.countBar}>
        <span>📄 মোট সার্টিফিকেট: <strong>{certificates.length}</strong></span>
        <span>📚 একাডেমিক: <strong>{certificates.filter(c => c.category === 'academic').length}</strong></span>
        <span>🏃 ক্রীড়া: <strong>{certificates.filter(c => c.category === 'sports').length}</strong></span>
        <span>🎭 সাংস্কৃতিক: <strong>{certificates.filter(c => c.category === 'cultural').length}</strong></span>
        <span>🕌 ধর্মীয়: <strong>{certificates.filter(c => c.category === 'religious').length}</strong></span>
      </div>

      {/* ফিল্টার */}
      {categories.length > 0 && (
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="🔍 সার্টিফিকেট খুঁজুন..."
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
            {categories.map((cat, i) => {
              const catInfo = getCategoryBadge(cat);
              return (
                <option key={i} value={cat}>{catInfo.label}</option>
              );
            })}
          </select>
        </div>
      )}

      {/* সার্টিফিকেট লিস্ট */}
      {certificates.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📄</span>
          <p>কোনো সার্টিফিকেট নেই</p>
          <p style={styles.emptySub}>সার্টিফিকেট যোগ করলে এখানে দেখাবে</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>🔍</span>
          <p>ফিল্টারে কোনো সার্টিফিকেট পাওয়া যায়নি</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredData.map((item) => {
            const category = getCategoryBadge(item.category);
            return (
              <div key={item.id} style={styles.certCard}>
                <div style={styles.certIcon}>
                  <span style={styles.certEmoji}>📜</span>
                </div>
                <div style={styles.certContent}>
                  <div style={styles.certHeader}>
                    <h3 style={styles.certTitle}>{item.title}</h3>
                    <span style={{
                      ...styles.categoryBadge,
                      background: category.bg,
                      color: category.color,
                    }}>
                      {category.label}
                    </span>
                  </div>
                  <p style={styles.certDesc}>{item.description || 'বিবরণ নেই'}</p>
                  <div style={styles.certFooter}>
                    <span style={styles.certDate}>
                      📅 {new Date(item.created_at).toLocaleDateString('bn-BD')}
                    </span>
                    {item.verified && (
                      <span style={styles.verifiedBadge}>✅ যাচাইকৃত</span>
                    )}
                  </div>
                  <div style={styles.certActions}>
                    {item.file_url && (
                      <>
                        <button
                          onClick={() => handleDownload(item.file_url, item.title)}
                          style={styles.downloadBtn}
                        >
                          📥 ডাউনলোড
                        </button>
                        <button
                          onClick={() => handlePrint(item.file_url)}
                          style={styles.printBtn}
                        >
                          🖨️ প্রিন্ট
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleShare(item.title)}
                      style={styles.shareBtn}
                    >
                      📤 শেয়ার
                    </button>
                  </div>
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
    minWidth: '150px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 0',
    color: '#94a3b8',
  },
  emptyIcon: { fontSize: '56px', display: 'block', marginBottom: '12px' },
  emptySub: { fontSize: '13px', color: '#cbd5e1' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '16px',
  },
  certCard: {
    display: 'flex',
    gap: '16px',
    background: 'white',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    transition: 'all 0.2s ease',
  },
  certIcon: {
    flexShrink: 0,
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certEmoji: {
    fontSize: '24px',
  },
  certContent: {
    flex: 1,
  },
  certHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '6px',
  },
  certTitle: {
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
    whiteSpace: 'nowrap',
  },
  certDesc: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 10px 0',
    lineHeight: '1.5',
  },
  certFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '10px',
  },
  certDate: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  verifiedBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#16a34a',
    background: '#dcfce7',
    padding: '2px 12px',
    borderRadius: '12px',
  },
  certActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  downloadBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  printBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    border: 'none',
    background: '#2563eb',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  shareBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    border: 'none',
    background: '#8b5cf6',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
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
