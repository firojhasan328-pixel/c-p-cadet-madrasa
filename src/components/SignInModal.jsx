import React, { useState } from 'react';
import StudentSignUp from './StudentSignUp';
import TeacherSignUp from './TeacherSignUp';
import { usePortal } from '../context/PortalContext';

export default function SignInModal({ isOpen, onClose }) {
  const { login, loading: authLoading } = usePortal();
  const [step, setStep] = useState('role'); // role, login, student-register, teacher-register
  const [role, setRole] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  if (!isOpen) return null;

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep('login');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const result = await login(loginData.email, loginData.password);
      if (result.success) {
        onClose();
        // সাফল্যের পর মডাল বন্ধ
      } else {
        setLoginError(result.error || 'লগইন ব্যর্থ হয়েছে');
      }
    } catch (err) {
      setLoginError(err.message || 'লগইন করতে সমস্যা');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSwitchToRegister = () => {
    if (role === 'student') {
      setStep('student-register');
    } else if (role === 'teacher') {
      setStep('teacher-register');
    }
  };

  const handleBackToLogin = () => {
    setStep('login');
  };

  const handleBackToRole = () => {
    setStep('role');
    setRole(null);
  };

  // =============================================
  // স্টেপ ১: রোল সিলেকশন
  // =============================================
  if (step === 'role') {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
          <div style={styles.roleContainer}>
            <h2 style={styles.heading}>👋 স্বাগতম!</h2>
            <p style={styles.subHeading}>আপনি কে? নিচ থেকে নির্বাচন করুন</p>
            <div style={styles.roleGrid}>
              <div style={styles.roleCard} onClick={() => handleRoleSelect('student')}>
                <span style={styles.roleIcon}>🎓</span>
                <h3 style={styles.roleTitle}>ছাত্র/ছাত্রী</h3>
                <p style={styles.roleDesc}>ছাত্র হিসেবে লগইন বা নিবন্ধন</p>
              </div>
              <div style={styles.roleCard} onClick={() => handleRoleSelect('teacher')}>
                <span style={styles.roleIcon}>👨‍🏫</span>
                <h3 style={styles.roleTitle}>শিক্ষক/শিক্ষিকা</h3>
                <p style={styles.roleDesc}>শিক্ষক হিসেবে লগইন বা নিবন্ধন</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // স্টেপ ২: লগইন ফর্ম
  // =============================================
  if (step === 'login') {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
          <button onClick={handleBackToRole} style={styles.backBtn}>⬅ পিছনে</button>
          
          <div style={styles.loginContainer}>
            <span style={styles.loginIcon}>🔐</span>
            <h2 style={styles.loginHeading}>সাইন ইন করুন</h2>
            <p style={styles.loginSubText}>
              {role === 'student' ? '🎓 ছাত্র' : '👨‍🏫 শিক্ষক'} অ্যাকাউন্টে লগইন করুন
            </p>

            {loginError && <div style={styles.errorBox}>{loginError}</div>}

            <form onSubmit={handleLogin} style={styles.loginForm}>
              <div style={styles.field}>
                <label style={styles.label}>📧 ইমেইল</label>
                <input 
                  type="email" 
                  required 
                  placeholder="your@email.com" 
                  value={loginData.email} 
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  style={styles.input} 
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>🔑 পাসওয়ার্ড</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  value={loginData.password} 
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  style={styles.input} 
                />
              </div>

              <button type="submit" disabled={loginLoading || authLoading} style={styles.loginBtn}>
                {loginLoading || authLoading ? '⏳ লগইন হচ্ছে...' : '🚀 লগইন করুন'}
              </button>
            </form>

            <div style={styles.switchContainer}>
              <p style={styles.switchText}>
                নতুন ব্যবহারকারী? 
                <span style={styles.switchLink} onClick={handleSwitchToRegister}>
                  {role === 'student' ? ' ছাত্র হিসেবে নিবন্ধন' : ' শিক্ষক হিসেবে নিবন্ধন'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // স্টেপ ৩: ছাত্র রেজিস্ট্রেশন
  // =============================================
  if (step === 'student-register') {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
          <StudentSignUp onBack={handleBackToLogin} onClose={onClose} />
        </div>
      </div>
    );
  }

  // =============================================
  // স্টেপ ৪: শিক্ষক রেজিস্ট্রেশন
  // =============================================
  if (step === 'teacher-register') {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
          <TeacherSignUp onBack={handleBackToLogin} onClose={onClose} />
        </div>
      </div>
    );
  }

  return null;
}

// =============================================
// প্রিমিয়াম ডিজাইন স্টাইল
// =============================================
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
    borderRadius: '50%', fontSize: '18px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  backBtn: {
    position: 'absolute', top: '12px', left: '12px',
    background: '#f1f5f9', border: 'none', padding: '6px 14px',
    borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
    fontWeight: '600', color: '#64748b'
  },
  // Role Selection Styles
  roleContainer: { textAlign: 'center', padding: '20px 0' },
  heading: { fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' },
  subHeading: { fontSize: '14px', color: '#64748b', margin: '0 0 24px 0' },
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  roleCard: {
    background: '#f8fafc', padding: '24px 16px', borderRadius: '16px',
    cursor: 'pointer', border: '2px solid #e2e8f0', transition: 'all 0.3s ease',
    ':hover': { borderColor: '#16a34a', transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }
  },
  roleIcon: { fontSize: '40px', display: 'block', marginBottom: '8px' },
  roleTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  roleDesc: { fontSize: '12px', color: '#64748b', margin: 0 },
  
  // Login Styles
  loginContainer: { padding: '10px 0' },
  loginIcon: { fontSize: '48px', display: 'block', textAlign: 'center', marginBottom: '8px' },
  loginHeading: { fontSize: '24px', fontWeight: '800', color: '#0f172a', textAlign: 'center', margin: '0 0 4px 0' },
  loginSubText: { fontSize: '14px', color: '#64748b', textAlign: 'center', margin: '0 0 20px 0' },
  loginForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#334155' },
  input: { 
    padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
    fontSize: '14px', transition: 'all 0.2s ease', outline: 'none',
    backgroundColor: '#ffffff'
  },
  loginBtn: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: 'white', border: 'none', padding: '14px',
    borderRadius: '12px', fontWeight: '700', fontSize: '16px',
    cursor: 'pointer', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.3)',
    transition: 'all 0.2s ease'
  },
  errorBox: {
    backgroundColor: '#fee2e2', color: '#991b1b',
    padding: '10px 14px', borderRadius: '10px',
    fontSize: '13px', borderLeft: '4px solid #dc2626',
    marginBottom: '12px'
  },
  switchContainer: { textAlign: 'center', marginTop: '16px' },
  switchText: { fontSize: '14px', color: '#64748b', margin: 0 },
  switchLink: { 
    color: '#2563eb', fontWeight: '600', cursor: 'pointer',
    textDecoration: 'underline', ':hover': { color: '#1d4ed8' }
  }
};
