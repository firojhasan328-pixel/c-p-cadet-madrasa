import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ForgotPasswordOTP({ onBack, onClose }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  // =============================================
  // ধাপ ১: OTP ইমেইল পাঠান
  // =============================================
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !email.includes('@')) {
      setError('❌ সঠিক ইমেইল দিন');
      setLoading(false);
      return;
    }

    try {
      // ✅ Supabase-এ OTP রিকোয়েস্ট পাঠান
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          // ⚠️ OTP সিস্টেমে redirectTo প্রয়োজন নেই!
          // কারণ আমরা কোড ব্যবহার করছি, লিংক নয়
        }
      );

      if (error) {
        console.error('❌ OTP Send Error:', error);
        throw error;
      }

      setSuccess(true);
      setStep(2);
      console.log('✅ OTP ইমেইল পাঠানো হয়েছে:', email);

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || '❌ OTP পাঠাতে সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // ধাপ ২: OTP Verify + Password Reset
  // =============================================
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!otp || otp.length !== 6) {
      setError('❌ ৬ ডিজিটের OTP দিন');
      setLoading(false);
      return;
    }

    try {
      // ✅ OTP Verify করুন
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: 'recovery',
      });

      if (error) {
        console.error('❌ OTP Verify Error:', error);
        
        if (error.message.includes('expired')) {
          setError('❌ OTP-এর মেয়াদ শেষ। নতুন OTP রিকোয়েস্ট করুন।');
        } else {
          setError(error.message || '❌ OTP ভেরিফাই করতে সমস্যা');
        }
        setLoading(false);
        return;
      }

      console.log('✅ OTP Verified Successfully!');
      setResetToken(data);
      setStep(3);

    } catch (err) {
      console.error('❌ Verify Error:', err);
      setError(err.message || '❌ OTP ভেরিফাই করতে সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // ধাপ ৩: নতুন পাসওয়ার্ড সেট করুন
  // =============================================
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (password.length < 6) {
      setError('❌ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('❌ পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না');
      setLoading(false);
      return;
    }

    try {
      // ✅ OTP Verify হওয়ার পরে password update করুন
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('❌ Password Update Error:', error);
        throw error;
      }

      setSuccess(true);
      console.log('✅ পাসওয়ার্ড সফলভাবে আপডেট হয়েছে');

      // ✅ ৩ সেকেন্ড পর হোম পেজে রিডাইরেক্ট
      setTimeout(() => {
        window.location.href = 'https://c-p-cadet-madrasa-beryl.vercel.app';
      }, 3000);

    } catch (err) {
      console.error('❌ Reset Error:', err);
      setError(err.message || '❌ পাসওয়ার্ড আপডেট করতে সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // UI Rendering
  // =============================================

  // স্টেপ ১: ইমেইল ফর্ম
  if (step === 1) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
          <button onClick={onBack} style={styles.backBtn}>⬅ পিছনে</button>

          <div style={styles.container}>
            <div style={styles.icon}>🔑</div>
            <h2 style={styles.heading}>পাসওয়ার্ড রিসেট</h2>
            <p style={styles.subHeading}>
              আপনার ইমেইলে ৬ ডিজিটের একটি কোড পাঠানো হবে
            </p>

            {error && <div style={styles.errorBox}>{error}</div>}
            {success && (
              <div style={styles.successBox}>
                ✅ OTP পাঠানো হয়েছে! আপনার ইমেইল চেক করুন।
              </div>
            )}

            <form onSubmit={handleSendOTP} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>📧 ইমেইল</label>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  disabled={loading}
                />
              </div>

              <button type="submit" disabled={loading} style={styles.btn}>
                {loading ? '⏳ পাঠাচ্ছি...' : '📧 OTP পাঠান'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // স্টেপ ২: OTP ভেরিফিকেশন
  if (step === 2) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
          <button onClick={() => setStep(1)} style={styles.backBtn}>⬅ পিছনে</button>

          <div style={styles.container}>
            <div style={styles.icon}>📱</div>
            <h2 style={styles.heading}>OTP ভেরিফাই করুন</h2>
            <p style={styles.subHeading}>
              আপনার ইমেইলে পাঠানো ৬ ডিজিটের কোড দিন
            </p>

            {error && <div style={styles.errorBox}>{error}</div>}

            <form onSubmit={handleVerifyOTP} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>🔢 OTP কোড</label>
                <input
                  type="text"
                  maxLength="6"
                  required
                  placeholder="১ ২ ৩ ৪ ৫ ৬"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ ...styles.input, textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                  disabled={loading}
                />
                <small style={styles.hint}>
                  ⏳ ১০ মিনিটের মধ্যে কোডটি ব্যবহার করুন
                </small>
              </div>

              <button type="submit" disabled={loading} style={styles.btn}>
                {loading ? '⏳ ভেরিফাই করছি...' : '✅ OTP ভেরিফাই করুন'}
              </button>

              <button
                type="button"
                onClick={handleSendOTP}
                style={styles.resendBtn}
                disabled={loading}
              >
                🔄 নতুন OTP পাঠান
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // স্টেপ ৩: নতুন পাসওয়ার্ড সেট করুন
  if (step === 3) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.container}>
            {success ? (
              <>
                <div style={styles.successIcon}>🎉</div>
                <h2 style={styles.heading}>পাসওয়ার্ড পরিবর্তন সফল!</h2>
                <p style={styles.successText}>
                  আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।
                  <br />
                  ⏳ ৩ সেকেন্ডের মধ্যে হোম পেজে রিডাইরেক্ট করা হচ্ছে...
                </p>
                <a href="https://c-p-cadet-madrasa-beryl.vercel.app" style={styles.homeLink}>
                  ⬅ হোম পেজে যান
                </a>
              </>
            ) : (
              <>
                <div style={styles.icon}>🔐</div>
                <h2 style={styles.heading}>নতুন পাসওয়ার্ড সেট করুন</h2>
                <p style={styles.subHeading}>
                  আপনার অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড দিন
                </p>

                {error && <div style={styles.errorBox}>{error}</div>}

                <form onSubmit={handleResetPassword} style={styles.form}>
                  <div style={styles.field}>
                    <label style={styles.label}>🔑 নতুন পাসওয়ার্ড</label>
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      style={styles.input}
                      disabled={loading}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>🔑 কনফার্ম পাসওয়ার্ড</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      placeholder="আবার পাসওয়ার্ড দিন"
                      style={styles.input}
                      disabled={loading}
                    />
                  </div>

                  <button type="submit" disabled={loading} style={styles.btn}>
                    {loading ? '⏳ আপডেট হচ্ছে...' : '✅ পাসওয়ার্ড আপডেট করুন'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// =============================================
// স্টাইলসমূহ
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
    cursor: 'pointer'
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
  container: {
    textAlign: 'center',
    padding: '10px 0'
  },
  icon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '8px'
  },
  heading: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 4px 0'
  },
  subHeading: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 20px 0'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155'
  },
  input: {
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff'
  },
  hint: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  btn: {
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(22, 163, 74, 0.3)',
    transition: 'all 0.2s ease'
  },
  resendBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    textDecoration: 'underline'
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
  successIcon: {
    fontSize: '56px',
    display: 'block',
    marginBottom: '12px'
  },
  successText: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '20px',
    lineHeight: '1.6'
  },
  homeLink: {
    display: 'inline-block',
    color: '#16a34a',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '600',
    padding: '10px 24px',
    borderRadius: '10px',
    border: '2px solid #16a34a'
  }
};
