import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function NoticeCard({ studentData }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) {
        setNotices(data);
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
    }
    setLoading(false);
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.headerIcon}>🔔</span>
        <h3 style={styles.headerTitle}>সাম্প্রতিক নোটিশ</h3>
        <span style={styles.viewAll}>সব দেখুন →</span>
      </div>
      <div style={styles.divider}></div>
      {loading ? (
        <p style={styles.loading}>⏳ লোড হচ্ছে...</p>
      ) : notices.length === 0 ? (
        <p style={styles.empty}>📭 কোনো নোটিশ নেই</p>
      ) : (
        <div style={styles.noticeList}>
          {notices.map((notice) => (
            <div key={notice.id} style={styles.noticeItem}>
              <div style={styles.noticeDot}></div>
              <div>
                <p style={styles.noticeTitle}>{notice.title}</p>
                <p style={styles.noticeDate}>
                  {new Date(notice.created_at).toLocaleDateString('bn-BD')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: 'white',
    borderRadius: '18px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px'
  },
  headerIcon: {
    fontSize: '20px'
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    flex: 1
  },
  viewAll: {
    fontSize: '12px',
    color: '#64748b',
    cursor: 'pointer',
    fontWeight: '500'
  },
  divider: {
    height: '1px',
    background: '#f1f5f9',
    margin: '12px 0'
  },
  loading: {
    color: '#64748b',
    fontSize: '14px',
    textAlign: 'center',
    padding: '12px 0'
  },
  empty: {
    color: '#94a3b8',
    fontSize: '14px',
    textAlign: 'center',
    padding: '12px 0'
  },
  noticeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  noticeItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '10px 12px',
    background: '#f8fafc',
    borderRadius: '10px'
  },
  noticeDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#16a34a',
    marginTop: '6px',
    flexShrink: 0
  },
  noticeTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 2px 0'
  },
  noticeDate: {
    fontSize: '11px',
    color: '#94a3b8',
    margin: 0
  }
};
