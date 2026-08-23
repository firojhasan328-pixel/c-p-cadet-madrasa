import React from 'react';

export default function QuickStats({ studentData }) {
  const stats = [
    { icon: '📚', label: 'ক্লাস', value: studentData?.class_name || '—' },
    { icon: '🔢', label: 'রোল', value: studentData?.roll_number || '—' },
    { icon: '✅', label: 'স্ট্যাটাস', value: studentData?.is_approved ? 'অনুমোদিত' : 'Pending' },
    { icon: '📧', label: 'ইমেইল', value: studentData?.email || '—' },
  ];

  return (
    <div style={styles.container}>
      {stats.map((stat, index) => (
        <div key={index} style={styles.statCard}>
          <span style={styles.statIcon}>{stat.icon}</span>
          <div>
            <p style={styles.statLabel}>{stat.label}</p>
            <p style={styles.statValue}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '20px'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'white',
    padding: '16px 20px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  statIcon: {
    fontSize: '28px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
    margin: 0
  },
  statValue: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '2px 0 0 0'
  }
};
