import React from 'react';

export default function FormPreview({ formData, onBack, onConfirm, loading, isSubmitting }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onBack} style={styles.backBtn}>⬅ ফিরে যান</button>
        
        <div style={styles.header}>
          <span style={styles.headerIcon}>👁️</span>
          <h2 style={styles.heading}>আপনার আবেদনের প্রিভিউ</h2>
          <p style={styles.subHeading}>সব তথ্য ঠিক আছে কিনা চেক করুন</p>
        </div>

        <div style={styles.previewBox}>
          <div style={styles.row}>
            <span style={styles.label}>👤 ছাত্র/ছাত্রীর নাম</span>
            <span style={styles.value}>{formData.studentName}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>📚 ক্লাস</span>
            <span style={styles.value}>{formData.classToAdmit}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>👨 বাবার নাম</span>
            <span style={styles.value}>{formData.fatherName}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>👩 মায়ের নাম</span>
            <span style={styles.value}>{formData.motherName}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>📱 মোবাইল নাম্বার</span>
            <span style={styles.value}>{formData.phone}</span>
          </div>
          {formData.email && (
            <div style={styles.row}>
              <span style={styles.label}>📧 ইমেইল</span>
              <span style={styles.value}>{formData.email}</span>
            </div>
          )}
          <div style={styles.row}>
            <span style={styles.label}>📸 ছবি</span>
            <span style={styles.value}>{formData.studentPhoto ? '✅ আপলোড হয়েছে' : '❌ নেই'}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>📄 জন্ম নিবন্ধন</span>
            <span style={styles.value}>{formData.birthCertPhoto ? '✅ আপলোড হয়েছে' : '❌ নেই'}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>🆔 বাবার NID</span>
            <span style={styles.value}>{formData.fatherNidPhoto ? '✅ আপলোড হয়েছে' : '❌ নেই'}</span>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={onBack} style={styles.editBtn}>✏️ এডিট করুন</button>
          <button 
            onClick={onConfirm} 
            disabled={isSubmitting} 
            style={styles.confirmBtn}
          >
            {isSubmitting ? '⏳ সাবমিট হচ্ছে...' : '✅ নিশ্চিত করুন'}
          </button>
        </div>

        {loading && (
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>সাবমিট হচ্ছে...</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px'
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '28px',
    padding: '28px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
  },
  backBtn: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    background: '#f1f5f9',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '600',
    color: '#64748b'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
    marginTop: '8px'
  },
  headerIcon: {
    fontSize: '36px',
    display: 'block',
    marginBottom: '4px'
  },
  heading: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 4px 0'
  },
  subHeading: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  previewBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '20px'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid #e2e8f0'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b'
  },
  value: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#0f172a'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px'
  },
  editBtn: {
    flex: 1,
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    padding: '12px',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer'
  },
  confirmBtn: {
    flex: 2,
    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(22,163,74,0.3)'
  },
  loading: {
    textAlign: 'center',
    marginTop: '16px'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #16a34a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 8px auto'
  }
};
