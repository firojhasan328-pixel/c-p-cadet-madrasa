import React from 'react';

export default function FormProgress({ progress }) {
  const getColor = () => {
    if (progress < 30) return '#ef4444';
    if (progress < 60) return '#f59e0b';
    if (progress < 90) return '#3b82f6';
    return '#16a34a';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>ফর্ম সম্পূর্ণতা</span>
        <span style={{ ...styles.percentage, color: getColor() }}>{progress}%</span>
      </div>
      <div style={styles.track}>
        <div
          style={{
            ...styles.fill,
            width: `${progress}%`,
            backgroundColor: getColor()
          }}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginBottom: '16px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#94a3b8'
  },
  percentage: {
    fontSize: '12px',
    fontWeight: '700'
  },
  track: {
    width: '100%',
    height: '6px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease'
  }
};
