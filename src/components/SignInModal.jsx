import React, { useState } from 'react';
import StudentSignUp from './StudentSignUp';
import TeacherSignUp from './TeacherSignUp';
import { usePortal } from '../context/PortalContext';
import { supabase } from '../supabaseClient';

export default function SignInModal({ isOpen, onClose }) {
  const { login, loading: authLoading } = usePortal();
  const [step, setStep] = useState('role');
  const [role, setRole] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // =============================================
  // ফরগেট পাসওয়ার্ড OTP স্টেট
  // =============================================
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=otp, 3=reset
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
      } else {
        setLoginError(result.error || 'লগইন ব্যর্থ হয়েছে');
      }
    } catch (err) {
      setLoginError(err.message || 'লগইন করতে সমস্যা');
    } finally {
      setLoginLoading(false);
    }
  };

  // =============================================
  // ফরগেট পাসওয়ার্ড OTP হ্যান্ডলার
  // =============================================
  const handleOpenForgotPassword = () => {
    setStep('forgot-password');
    setForgotError('');
    setForgotSuccess(false);
    setForgotEmail('');
    setForgotOtp('');
    setForgotStep(1);
    setOtpVerified(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  // ধাপ ১: OTP ইমেইল পাঠান
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotError('❌ সঠিক ইমেইল দিন');
      setForgotLoading(false);
      return;
    }

    try {
      // ✅ Supabase-এ OTP রিকোয়েস্ট পাঠান
      const { error } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim()
      );

      if (error) {
        console.error('❌ OTP Send Error:', error);
        throw error;
      }

      setForgotSuccess(true);
      setForgotStep(2);
      console.log('✅ OTP ইমেইল পাঠানো হয়েছে:', forgotEmail);

    } catch (err) {
      console.error('❌ Error:', err);
      setForgotError(err.message || '❌ OTP পাঠাতে সমস্যা');
    } finally {
      setForgotLoading(false);
    }
  };

  // ধাপ ২: OTP Verify করুন
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    if (!forgotOtp || forgotOtp.length !== 6) {
      setForgotError('❌ ৬ ডিজিটের OTP দিন');
      setForgotLoading(false);
      return;
    }

    try {
      // ✅ OTP Verify করুন
      const { data, error } = await supabase.auth.verifyOtp({
        email: forgotEmail.trim(),
        token: forgotOtp,
        type: 'recovery',
      });

      if (error) {
        console.error('❌ OTP Verify Error:', error);
        
        if (error.message.includes('expired')) {
          setForgotError('❌ OTP-এর মেয়াদ শেষ। নতুন OTP রিকোয়েস্ট করুন।');
        } else {
          setForgotError(error.message || '❌ OTP ভেরিফাই করতে সমস্যা');
        }
        setForgotLoading(false);
        return;
      }

      console.log('✅ OTP Verified Successfully!');
      setOtpVerified(true);
      setForgotStep(3);

    } catch (err) {
      console.error('❌ Verify Error:', err);
      setForgotError(err.message || '❌ OTP ভেরিফাই করতে সমস্যা');
    } finally {
      setForgotLoading(false);
    }
  };

  // ধাপ ৩: নতুন পাসওয়ার্ড সেট করুন
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    if (newPassword.length < 6) {
      setForgotError('❌ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      setForgotLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('❌ পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না');
      setForgotLoading(false);
      return;
    }

    try {
      // ✅ OTP Verify হওয়ার পরে password update করুন
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password Update Error:', error);
        throw error;
      }

      setForgotSuccess(true);
      console.log('✅ পাসওয়ার্ড সফলভাবে আপডেট হয়েছে');

      // ✅ ৩ সেকেন্ড পর লগইন পেজে ফিরে যান
      setTimeout(() => {
        setForgotStep(1);
        setForgotSuccess(false);
        setOtpVerified(false);
        setNewPassword('');
        setConfirmPassword('');
        setForgotEmail('');
        setForgotOtp('');
        setStep('login');
      }, 3000);

    } catch (err) {
      console.error('❌ Reset Error:', err);
      setForgotError(err.message || '❌ পাসওয়ার্ড আপডেট করতে সমস্যা');
    } finally {
      setForgotLoading(false);
    }
  };

  // OTP রিসেন্ড
  const handleResendOTP = async () => {
    setForgotError('');
    setForgotLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim()
      );

      if (error) throw error;

      setForgotSuccess(true);
      console.log('✅ নতুন OTP পাঠানো হয়েছে');

    } catch (err) {
      setForgotError(err.message || '❌ OTP পাঠাতে সমস্যা');
    } finally {
      setForgotLoading(false);
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

              <div style={styles.forgotLinkContainer}>
                <span style={styles.forgotLink} onClick={handleOpenForgotPassword}>
                  পাসওয়ার্ড ভুলে গেছেন?
                </span>
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
  // স্টেপ ৩: ফরগেট পাসওয়ার্ড (OTP সিস্টেম)
  // =============================================
  if (step === 'forgot-password') {
    // ধাপ ৩.১: ইমেইল ফর্ম
    if (forgotStep === 1) {
      return (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
            <button onClick={handleBackToLogin} style={styles.backBtn}>⬅ পিছনে</button>

            <div style={styles.loginContainer}>
              <span style={styles.loginIcon}>🔑</span>
              <h2 style={styles.loginHeading}>পাসওয়ার্ড রিসেট</h2>
              <p style={styles.loginSubText}>
                আপনার ইমেইলে ৬ ডিজিটের একটি কোড পাঠানো হবে
              </p>

              {forgotError && <div style={styles.errorBox}>{forgotError}</div>}
              {forgotSuccess && (
                <div style={styles.successBox}>
                  ✅ OTP পাঠানো হয়েছে! আপনার ইমেইল চেক করুন।
                </div>
              )}

              <form onSubmit={handleSendOTP} style={styles.loginForm}>
                <div style={styles.field}>
                  <label style={styles.label}>📧 ইমেইল</label>
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    style={styles.input}
                    disabled={forgotLoading}
                  />
                </div>

                <button type="submit" disabled={forgotLoading} style={styles.loginBtn}>
                  {forgotLoading ? '⏳ পাঠাচ্ছি...' : '📧 OTP পাঠান'}
                </button>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // ধাপ ৩.২: OTP ভেরিফিকেশন
    if (forgotStep === 2) {
      return (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
            <button onClick={() => setForgotStep(1)} style={styles.backBtn}>⬅ পিছনে</button>

            <div style={styles.loginContainer}>
              <span style={styles.loginIcon}>📱</span>
              <h2 style={styles.loginHeading}>OTP ভেরিফাই করুন</h2>
              <p style={styles.loginSubText}>
                আপনার ইমেইলে পাঠানো ৬ ডিজিটের কোড দিন
              </p>

              {forgotError && <div style={styles.errorBox}>{forgotError}</div>}

              <form onSubmit={handleVerifyOTP} style={styles.loginForm}>
                <div style={styles.field}>
                  <label style={styles.label}>🔢 OTP কোড</label>
                  <input
                    type="text"
                    maxLength="6"
                    required
                    placeholder="১ ২ ৩ ৪ ৫ ৬"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    style={{ ...styles.input, textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                    disabled={forgotLoading}
                  />
                  <small style={styles.hint}>
                    ⏳ ১০ মিনিটের মধ্যে কোডটি ব্যবহার করুন
                  </small>
                </div>

                <button type="submit" disabled={forgotLoading} style={styles.loginBtn}>
                  {forgotLoading ? '⏳ ভেরিফাই করছি...' : '✅ OTP ভেরিফাই করুন'}
                </button>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  style={styles.resendBtn}
                  disabled={forgotLoading}
                >
                  🔄 নতুন OTP পাঠান
                </button>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // ধাপ ৩.৩: নতুন পাসওয়ার্ড সেট করুন
    if (forgotStep === 3) {
      return (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <button onClick={onClose} style={styles.closeBtn}>✕</button>

            <div style={styles.loginContainer}>
              {forgotSuccess ? (
                <>
                  <span style={styles.loginIcon}>🎉</span>
                  <h2 style={styles.loginHeading}>পাসওয়ার্ড পরিবর্তন সফল!</h2>
                  <p style={styles.loginSubText}>
                    আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।
                    <br />
                    ⏳ ৩ সেকেন্ডের মধ্যে লগইন পেজে ফিরে যাচ্ছেন...
                  </p>
                </>
              ) : (
                <>
                  <span style={styles.loginIcon}>🔐</span>
                  <h2 style={styles.loginHeading}>নতুন পাসওয়ার্ড সেট করুন</h2>
                  <p style={styles.loginSubText}>
                    আপনার অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড দিন
                  </p>

                  {forgotError && <div style={styles.errorBox}>{forgotError}</div>}

                  <form onSubmit={handleResetPassword} style={styles.loginForm}>
                    <div style={styles.field}>
                      <label style={styles.label}>🔑 নতুন পাসওয়ার্ড</label>
                      <input
                        type="password"
                        required
                        placeholder="কমপক্ষে ৬ অক্ষর"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={styles.input}
                        disabled={forgotLoading}
                      />
                      <small style={styles.hint}>
                        ⚠️ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে
                      </small>
                    </div>

                    <div style={styles.field}>
                      <label style={styles.label}>🔑 কনফার্ম পাসওয়ার্ড</label>
                      <input
                        type="password"
                        required
                        placeholder="আবার পাসওয়ার্ড দিন"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={styles.input}
                        disabled={forgotLoading}
                      />
                    </div>

                    <button type="submit" disabled={forgotLoading} style={styles.loginBtn}>
                      {forgotLoading ? '⏳ আপডেট হচ্ছে...' : '✅ পাসওয়ার্ড আপডেট করুন'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  // =============================================
  // স্টেপ ৪: ছাত্র রেজিস্ট্রেশন
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
  // স্টেপ ৫: শিক্ষক রেজিস্ট্রেশন
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
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(5px)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px'
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '28px',
    padding: '24px',
    width: '100%',
    maxWidth: '450px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: '#f1f5f9',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b'
  },
  backBtn: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: '#f1f5f9',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '600',
    color: '#64748b'
  },
  // Role Selection Styles
  roleContainer: { textAlign: 'center', padding: '20px 0' },
  heading: { fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' },
  subHeading: { fontSize: '14px', color: '#64748b', margin: '0 0 24px 0' },
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  roleCard: {
    background: '#f8fafc',
    padding: '24px 16px',
    borderRadius: '16px',
    cursor: 'pointer',
    border: '2px solid #e2e8f0',
    transition: 'all 0.3s ease'
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
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    outline: 'none',
    backgroundColor: '#ffffff'
  },
  hint: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px'
  },
  loginBtn: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.3)',
    transition: 'all 0.2s ease'
  },
  resendBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    textDecoration: 'underline',
    padding: '8px 0'
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    borderLeft: '4px solid #dc2626',
    marginBottom: '12px'
  },
  successBox: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    borderLeft: '4px solid #16a34a',
    marginBottom: '12px'
  },
  switchContainer: { textAlign: 'center', marginTop: '16px' },
  switchText: { fontSize: '14px', color: '#64748b', margin: 0 },
  switchLink: { 
    color: '#2563eb',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  forgotLinkContainer: { textAlign: 'right', marginTop: '-8px' },
  forgotLink: {
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
    fontWeight: '500'
  }
};
