import React from 'react';

export default function EmailExistsModal({
  isOpen,
  onClose,
  onLogin,
  email,
  role,
  sourceType, // 'teacher' বা 'student'
}) {
  if (!isOpen) return null;

  const roleBadge = {
    teacher: { label: '👨‍🏫 শিক্ষক', bg: '#fef3c7', color: '#f59e0b' },
    student: { label: '🎓 ছাত্র/ছাত্রী', bg: '#dbeafe', color: '#2563eb' },
  };

  const currentRole = roleBadge[sourceType] || roleBadge.student;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* বন্ধ আইকন */}
        <button onClick={onClose} style={styles.closeBtn} title="নতুন ইমেইল দিন">
          ✕
        </button>

        {/* হেডার */}
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <span style={styles.icon}>📧</span>
          </div>
          <h2 style={styles.title}>ইমেইল ইতিমধ্যে নিবন্ধিত!</h2>
          <p style={styles.subtitle}>
            আপনার এই ইমেইল দিয়ে সিস্টেমে একটি অ্যাকাউন্ট ইতিমধ্যেই আছে
          </p>
        </div>

        {/* ইমেইল তথ্য */}
        <div style={styles.infoBox}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>📧 ইমেইল:</span>
            <span style={styles.infoValue}>{email}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>🎭 রোল:</span>
            <span
              style={{
                ...styles.roleBadge,
                background: currentRole.bg,
                color: currentRole.color,
              }}
            >
              {currentRole.label}
            </span>
          </div>
        </div>

        {/* মেসেজ */}
        <div style={styles.messageBox}>
          <p style={styles.messageText}>
            আপনি কি লগইন করতে চান?
          </p>
          <p style={styles.messageHint}>
            💡 নতুন ইমেইল দিয়ে রেজিস্টার করতে চাইলে উপরের{' '}
            <strong>✕</strong> চিহ্নে চাপ দিন
          </p>
        </div>

        {/* বাটন */}
        <div style={styles.buttonGroup}>
          <button onClick={onClose} style={styles.cancelBtn}>
            ✕ নতুন ইমেইল দিন
          </button>
          <button onClick={onLogin} style={styles.loginBtn}>
            ✅ লগইন করুন
          </button>
        </div>

        {/* ফুটার নোট */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            🔒 আপনার অ্যাকাউন্ট নিরাপদে সংরক্ষিত আছে
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// স্টাইল
// ============================================
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex: 12000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    animation: 'emailModalFadeIn 0.3s ease',
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    padding: '28px 24px 20px 24px',
    maxWidth: '440px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 25px 60px -12px rgba(0,0,0,0.4)',
    animation: 'emailModalSlideUp 0.35s ease',
  },
  closeBtn: {
    position: 'absolute',
    top: '14px',
    right: '14px',
    background: '#f1f5f9',
    border: 'none',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  iconWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
    marginBottom: '12px',
    boxShadow: '0 8px 24px rgba(220, 38, 38, 0.2)',
  },
  icon: {
    fontSize: '36px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5',
  },
  infoBox: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: '14px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    flexShrink: 0,
  },
  infoValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a',
    wordBreak: 'break-all',
    textAlign: 'right',
    flex: 1,
  },
  roleBadge: {
    fontSize: '12px',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '20px',
    display: 'inline-block',
  },
  messageBox: {
    background: '#f0f9ff',
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: '18px',
    border: '1px solid #bae6fd',
    borderLeft: '4px solid #0ea5e9',
  },
  messageText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#075985',
    margin: '0 0 6px 0',
  },
  messageHint: {
    fontSize: '12px',
    color: '#0369a1',
    margin: 0,
    lineHeight: '1.6',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '14px',
  },
  cancelBtn: {
    flex: 1,
    background: '#f1f5f9',
    color: '#475569',
    border: 'none',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  loginBtn: {
    flex: 1.3,
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    border: 'none',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(22, 163, 74, 0.35)',
    transition: 'all 0.2s ease',
  },
  footer: {
    textAlign: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9',
  },
  footerText: {
    fontSize: '11px',
    color: '#94a3b8',
    margin: 0,
    fontWeight: '500',
  },
};

// অ্যানিমেশন
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes emailModalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes emailModalSlideUp {
      from { 
        opacity: 0; 
        transform: translateY(20px) scale(0.96); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
      }
    }
  `;
  document.head.appendChild(styleSheet);
}
