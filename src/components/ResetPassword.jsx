import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidLink, setIsValidLink] = useState(true);
  const [isProcessing, setIsProcessing] = useState(true);

  // =============================================
  // ১. Recovery Session Handle
  // =============================================
  useEffect(() => {
    const handleRecoverySession = async () => {
      setIsProcessing(true);
      
      try {
        // ✅ URL hash থেকে access_token বের করুন
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('🔍 URL Hash:', window.location.hash);
        console.log('🔍 Access Token:', accessToken ? '✅ পাওয়া গেছে' : '❌ নেই');

        // ✅ যদি access_token থাকে, PKCE flow complete করুন
        if (accessToken && type === 'recovery') {
          console.log('🔄 Recovery token detected, exchanging for session...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error('❌ Session set error:', error);
            throw error;
          }

          console.log('✅ Session set successfully');
          setIsValidLink(true);
          setIsProcessing(false);
          return;
        }

        // ✅ যদি access_token না থাকে, current session চেক করুন
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('❌ No recovery session found');
          setIsValidLink(false);
          setError('❌ এই রিসেট লিংকটি মেয়াদ শেষ বা সঠিক নয়। দয়া করে নতুন রিকোয়েস্ট করুন।');
          setIsProcessing(false);
          return;
        }

        // ✅ Recovery session আছে কিনা চেক করুন
        if (session) {
          console.log('✅ Valid session found');
          setIsValidLink(true);
        } else {
          setIsValidLink(false);
          setError('❌ এই রিসেট লিংকটি মেয়াদ শেষ বা সঠিক নয়।');
        }
        
      } catch (err) {
        console.error('❌ Session check error:', err);
        setIsValidLink(false);
        setError('❌ লিংক যাচাই করতে সমস্যা। দয়া করে আবার চেষ্টা করুন।');
      }
      
      setIsProcessing(false);
    };

    handleRecoverySession();

    // ✅ Auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event:', event);
        
        if (event === 'PASSWORD_RECOVERY') {
          console.log('✅ PASSWORD_RECOVERY event received!');
          setIsValidLink(true);
          setError('');
          setIsProcessing(false);
        }
        
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in via recovery link');
          setIsValidLink(true);
          setIsProcessing(false);
        }
      }
    );

    // ✅ Cleanup: unsubscribe on unmount
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // =============================================
  // ২. Password Update Handler
  // =============================================
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
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
      // ✅ Valid session check
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('❌ সেশন মেয়াদ শেষ। দয়া করে নতুন রিসেট লিংক রিকোয়েস্ট করুন।');
        setLoading(false);
        return;
      }

      // ✅ Password update
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('❌ Update error:', updateError);
        
        if (updateError.message.includes('Invalid login credentials')) {
          setError('❌ সেশন মেয়াদ শেষ। দয়া করে নতুন রিসেট লিংক রিকোয়েস্ট করুন।');
        } else if (updateError.message.toLowerCase().includes('weak')) {
          setError('❌ পাসওয়ার্ড খুব সহজ। কমপক্ষে ৬ অক্ষরের শক্তিশালী পাসওয়ার্ড দিন।');
        } else {
          setError(updateError.message || '❌ পাসওয়ার্ড আপডেট করতে সমস্যা');
        }
        setLoading(false);
        return;
      }

      // ✅ Success!
      setSuccess(true);
      console.log('✅ পাসওয়ার্ড সফলভাবে আপডেট হয়েছে');

      // ✅ 3 seconds later, redirect to home
      setTimeout(() => {
        window.location.href = 'https://c-p-cadet-madrasa-beryl.vercel.app';
      }, 3000);

    } catch (err) {
      console.error('❌ Reset password error:', err);
      setError(err.message || '❌ পাসওয়ার্ড আপডেট করতে সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // ৩. Loading State
  // =============================================
  if (isProcessing) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>⏳ যাচাই করা হচ্ছে...</p>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // ৪. Invalid Link
  // =============================================
  if (!isValidLink) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>🚫</div>
          <h2 style={styles.heading}>লিংক মেয়াদ শেষ!</h2>
          <div style={styles.errorBoxLarge}>
            <p style={styles.errorMessage}>
              এই পাসওয়ার্ড রিসেট লিংকটি মেয়াদ শেষ বা সঠিক নয়।
            </p>
            <p style={styles.errorSubMessage}>
              দয়া করে লগইন পেজে গিয়ে আবার "পাসওয়ার্ড ভুলে গেছেন?" অপশন ব্যবহার করে 
              নতুন রিসেট লিংক রিকোয়েস্ট করুন।
            </p>
          </div>
          <a href="https://c-p-cadet-madrasa-beryl.vercel.app" style={styles.homeLink}>
            ⬅ হোম পেজে ফিরে যান
          </a>
        </div>
      </div>
    );
  }

  // =============================================
  // ৫. Reset Password Form
  // =============================================
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>🔑 নতুন পাসওয়ার্ড সেট করুন</h2>
        <p style={styles.subHeading}>
          আপনার অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড দিন
        </p>
        
        {error && <div style={styles.errorBox}>{error}</div>}
        
        {success && (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✅</div>
            <div>
              <p style={styles.successTitle}>পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!</p>
              <p style={styles.successSub}>
                ⏳ ৩ সেকেন্ডের মধ্যে হোম পেজে রিডাইরেক্ট করা হচ্ছে...
              </p>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleResetPassword} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>🔑 নতুন পাসওয়ার্ড</label>
              <input 
                type="password" 
                required 
                placeholder="কমপক্ষে ৬ অক্ষর" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                autoFocus
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
              />
            </div>

            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? '⏳ আপডেট হচ্ছে...' : '✅ পাসওয়ার্ড আপডেট করুন'}
            </button>
          </form>
        )}
        
        <div style={styles.backContainer}>
          <a href="https://c-p-cadet-madrasa-beryl.vercel.app" style={styles.backLink}>
            ⬅ হোম পেজে ফিরে যান
          </a>
        </div>
      </div>
    </div>
  );
}

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
  heading: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    margin: '0 0 8px 0'
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
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155'
  },
  input: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '15px',
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
    transition: 'all 0.2s ease',
    marginTop: '4px'
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    marginBottom: '16px',
    borderLeft: '4px solid #dc2626'
  },
  errorBoxLarge: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '20px 16px',
    borderRadius: '12px',
    marginBottom: '20px',
    borderLeft: '4px solid #dc2626',
    textAlign: 'center'
  },
  errorMessage: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 8px 0'
  },
  errorSubMessage: {
    fontSize: '14px',
    margin: 0,
    color: '#7f1d1d'
  },
  errorIcon: {
    fontSize: '56px',
    textAlign: 'center',
    display: 'block',
    marginBottom: '12px'
  },
  successBox: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '16px 20px',
    borderRadius: '12px',
    marginBottom: '16px',
    borderLeft: '4px solid #16a34a',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  successIcon: {
    fontSize: '32px'
  },
  successTitle: {
    fontSize: '15px',
    fontWeight: '700',
    margin: '0 0 4px 0'
  },
  successSub: {
    fontSize: '13px',
    margin: 0,
    color: '#15803d'
  },
  backContainer: {
    textAlign: 'center',
    marginTop: '20px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px'
  },
  backLink: {
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500'
  },
  homeLink: {
    display: 'inline-block',
    color: '#16a34a',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '600',
    padding: '10px 24px',
    borderRadius: '10px',
    border: '2px solid #16a34a',
    transition: 'all 0.2s ease'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '20px 0'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #16a34a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 12px auto'
  },
  loadingText: {
    color: '#64748b',
    fontSize: '16px',
    fontWeight: '500',
    margin: 0
  }
};
