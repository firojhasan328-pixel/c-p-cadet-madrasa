import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidLink, setIsValidLink] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsValidLink(false);
          setError('❌ এই রিসেট লিংকটি মেয়াদ শেষ বা সঠিক নয়। দয়া করে নতুন রিকোয়েস্ট করুন।');
        } else {
          console.log('✅ বৈধ রিসেট সেশন পাওয়া গেছে');
        }
      } catch (err) {
        console.error('সেশন চেক এরর:', err);
        setIsValidLink(false);
        setError('❌ লিংক যাচাই করতে সমস্যা। দয়া করে আবার চেষ্টা করুন।');
      }
    };
    
    checkSession();
  }, []);

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
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('আপডেট এরর:', error);
        throw error;
      }
      
      setSuccess(true);
      console.log('✅ পাসওয়ার্ড সফলভাবে আপডেট হয়েছে');
      
      // ✅ আপনার URL দিয়ে রিডাইরেক্ট
      setTimeout(() => {
        window.location.href = 'https://c-p-cadet-madrasa-beryl.vercel.app';
      }, 3000);
      
    } catch (err) {
      console.error('রিসেট পাসওয়ার্ড এরর:', err);
      
      if (err.message.includes('Invalid login credentials')) {
        setError('❌ সেশন মেয়াদ শেষ। দয়া করে নতুন রিসেট লিংক রিকোয়েস্ট করুন।');
      } else if (err.message.includes('weak password')) {
        setError('❌ পাসওয়ার্ড খুব সহজ। কমপক্ষে ৬ অক্ষরের শক্তিশালী পাসওয়ার্ড দিন।');
      } else {
        setError(err.message || '❌ পাসওয়ার্ড আপডেট করতে সমস্যা');
      }
    } finally {
      setLoading(false);
    }
  };

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
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    animation: 'fadeIn 0.5s ease'
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
    fontWeight: '500',
    transition: 'color 0.2s'
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
  }
};
