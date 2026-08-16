import React, { useState } from 'react';
import StudentSignUp from './StudentSignUp';
import TeacherSignUp from './TeacherSignUp';

export default function SignInModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1=role select, 2=student form, 3=teacher form
  const [role, setRole] = useState(null);

  if (!isOpen) return null;

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>

        {step === 1 && (
          <div style={styles.roleContainer}>
            <h2 style={styles.heading}>আপনি কে?</h2>
            <div style={styles.roleGrid}>
              <div style={styles.roleCard} onClick={() => handleRoleSelect('student')}>
                <span style={styles.roleIcon}>🎓</span>
                <h3>ছাত্র/ছাত্রী</h3>
              </div>
              <div style={styles.roleCard} onClick={() => handleRoleSelect('teacher')}>
                <span style={styles.roleIcon}>👨‍🏫</span>
                <h3>শিক্ষক/শিক্ষিকা</h3>
              </div>
            </div>
          </div>
        )}

        {step === 2 && role === 'student' && (
          <StudentSignUp onBack={() => setStep(1)} onClose={onClose} />
        )}

        {step === 3 && role === 'teacher' && (
          <TeacherSignUp onBack={() => setStep(1)} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px'
  },
  modal: {
    backgroundColor: '#ffffff', borderRadius: '28px', padding: '24px',
    width: '100%', maxWidth: '450px', maxHeight: '90vh',
    overflowY: 'auto', position: 'relative'
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '12px',
    background: '#f1f5f9', border: 'none', width: '36px', height: '36px',
    borderRadius: '50%', fontSize: '18px', cursor: 'pointer'
  },
  roleContainer: { textAlign: 'center', padding: '20px 0' },
  heading: { fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' },
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  roleCard: {
    background: '#f8fafc', padding: '24px 16px', borderRadius: '16px',
    cursor: 'pointer', border: '2px solid #e2e8f0', transition: 'all 0.3s'
  },
  roleIcon: { fontSize: '40px', display: 'block', marginBottom: '8px' }
};