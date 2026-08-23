import React from 'react';

export default function ProfileCard({ studentData }) {
  if (!studentData) return null;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.headerIcon}>👤</span>
        <h3 style={styles.headerTitle}>আমার প্রোফাইল</h3>
      </div>
      <div style={styles.divider}></div>
      <div style={styles.profileRow}>
        <div style={styles.avatar}>
          {studentData.photo_url ? (
            <img src={studentData.photo_url} alt={studentData.name} style={styles.avatarImg} />
          ) : (
            <div style={styles.avatarPlaceholder}>{studentData.name?.charAt(0) || '?'}</div>
          )}
        </div>
        <div style={styles.info}>
          <h4 style={styles.name}>{studentData.name}</h4>
          <p style={styles.detail}>📚 {studentData.class_name}</p>
          <p style={styles.detail}>🔢 রোল: {studentData.roll_number || '—'}</p>
          <p style={styles.detail}>📧 {studentData.email}</p>
        </div>
      </div>
      <div style={styles.divider}></div>
      <div style={styles.footer}>
        <span style={styles.statusBadge}>✅ যাচাইকৃত</span>
        <span style={studentData.is_approved ? styles.approvedBadge : styles.pendingBadge}>
          {studentData.is_approved ? '✅ অনুমোদিত' : '⏳ অনুমোদন pending'}
        </span>
      </div>
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
    margin: 0
  },
  divider: {
    height: '1px',
    background: '#f1f5f9',
    margin: '12px 0'
  },
  profileRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  avatar: {
    flexShrink: 0
  },
  avatarImg: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #16a34a'
  },
  avatarPlaceholder: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#16a34a',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: '700',
    border: '3px solid #16a34a'
  },
  info: {
    flex: 1
  },
  name: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 4px 0'
  },
  detail: {
    fontSize: '13px',
    color: '#64748b',
    margin: '2px 0'
  },
  footer: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  statusBadge: {
    fontSize: '12px',
    color: '#16a34a',
    background: '#dcfce7',
    padding: '4px 12px',
    borderRadius: '12px',
    fontWeight: '600'
  },
  approvedBadge: {
    fontSize: '12px',
    color: '#16a34a',
    background: '#dcfce7',
    padding: '4px 12px',
    borderRadius: '12px',
    fontWeight: '600'
  },
  pendingBadge: {
    fontSize: '12px',
    color: '#f59e0b',
    background: '#fef3c7',
    padding: '4px 12px',
    borderRadius: '12px',
    fontWeight: '600'
  }
};
