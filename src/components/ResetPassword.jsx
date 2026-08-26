import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ResetPassword() {
  // =============================================
  // State
  // =============================================
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=reset
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // =============================================
  // Resend Cooldown Timer
  // =============================================
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

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

      setOtpSent(true);
      setStep(2);
      setCooldown(60);
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
        } else if (error.message.includes('Invalid token')) {
          setError('❌ ভুল OTP কোড। আবার চেষ্টা করুন।');
        } else {
          setError(error.message || '❌ OTP ভেরিফাই করতে সমস্যা');
        }
        setLoading(false);
        return;
      }

      console.log('✅ OTP Verified Successfully!');
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

      // ✅ ৩ সেকেন্ড পর লগইন পেজে রিডাইরেক্ট
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);

    } catch (err) {
      console.error('❌ Reset Error:', err);
      setError(err.message || '❌ পাসওয়ার্ড আপডেট করতে সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // Resend OTP
  // =============================================
  const handleResendOTP = async () => {
    if (cooldown > 0) return;
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim()
      );

      if (error) throw error;

      setCooldown(60);
      setOtpSent(true);
      console.log('✅ নতুন OTP পাঠানো হয়েছে');

    } catch (err) {
      setError(err.message || '❌ OTP পাঠাতে সমস্যা');
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
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>🔑</div>
          <h2 style={styles.heading}>পাসওয়ার্ড রিসেট</h2>
          <p style={styles.subHeading}>
            আপনার ইমেইলে ৬ ডিজিটের একটি কোড পাঠানো হবে
          </p>

          {error && <div style={styles.errorBox}>{error}</div>}

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

            <div style={styles.backContainer}>
              <a href="/" style={styles.backLink}>⬅ লগইন পেজে ফিরে যান</a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // স্টেপ ২: OTP ভেরিফিকেশন
  if (step === 2) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
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

            <div style={styles.resendContainer}>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading || cooldown > 0}
                style={styles.resendBtn}
              >
                🔄 নতুন OTP পাঠান {cooldown > 0 && `(${cooldown}s)`}
              </button>
            </div>

            <div style={styles.backContainer}>
              <a href="/" style={styles.backLink}>⬅ লগইন পেজে ফিরে যান</a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // স্টেপ ৩: নতুন পাসওয়ার্ড সেট করুন
  if (step === 3) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          {success ? (
            <>
              <div style={styles.successIcon}>🎉</div>
              <h2 style={styles.heading}>পাসওয়ার্ড পরিবর্তন সফল!</h2>
              <p style={styles.successText}>
                আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।
                <br />
                ⏳ ৩ সেকেন্ডের মধ্যে লগইন পেজে রিডাইরেক্ট করা হচ্ছে...
              </p>
              <a href="/" style={styles.homeLink}>
                ⬅ লগইন পেজে যান
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={styles.input}
                    disabled={loading}
                  />
                </div>

                <button type="submit" disabled={loading} style={styles.btn}>
                  {loading ? '⏳ আপডেট হচ্ছে...' : '✅ পাসওয়ার্ড আপডেট করুন'}
                </button>

                <div style={styles.backContainer}>
                  <a href="/" style={styles.backLink}>⬅ লগইন পেজে ফিরে যান</a>
                </div>
              </form>
            </>
          )}
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
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #064e3b 0%, #14532d 50%, #166534 100%)',
    padding: '20px'
  },
  card: {
    background: 'white',
    padding: '40px 32px',
    borderRadius: '28px',
    maxWidth: '450px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
  },
  icon: {
    fontSize: '48px',
    textAlign: 'center',
    display: 'block',
    marginBottom: '8px'
  },
  heading: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    margin: '0 0 4px 0'
  },
  subHeading: {
    fontSize: '14px',
    color: '#64748b',
    textAlign: 'center',
    margin: '0 0 24px 0'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
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
    transition: 'border-color 0.2s',
    backgroundColor: '#f8fafc'
  },
  hint: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px'
  },
  btn: {
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '14px',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(22, 163, 74, 0.3)',
    transition: 'all 0.2s ease'
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
  resendContainer: {
    textAlign: 'center'
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
  backContainer: {
    textAlign: 'center',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px'
  },
  backLink: {
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500'
  },
  successIcon: {
    fontSize: '56px',
    textAlign: 'center',
    display: 'block',
    marginBottom: '12px'
  },
  successText: {
    fontSize: '14px',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: '20px',
    lineHeight: '1.6'
  },
  homeLink: {
    display: 'block',
    textAlign: 'center',
    color: '#16a34a',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '600',
    padding: '10px 24px',
    borderRadius: '10px',
    border: '2px solid #16a34a'
  }
};
