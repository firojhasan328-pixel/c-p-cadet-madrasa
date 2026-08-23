import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>🔑 নতুন পাসওয়ার্ড সেট করুন</h2>
        
        {error && <div style={styles.errorBox}>{error}</div>}
        {success && (
          <div style={styles.successBox}>
            ✅ পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! 
            <a href="/" style={styles.loginLink}> লগইন করুন</a>
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
              />
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
    background: '#f8fafc',
    padding: '20px'
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '20px',
    maxWidth: '450px',
    width: '100%',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
  },
  heading: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: '20px'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#334155' },
  input: {
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none'
  },
  btn: {
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer'
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '12px'
  },
  successBox: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '12px'
  },
  loginLink: {
    color: '#2563eb',
    textDecoration: 'underline',
    fontWeight: '600'
  }
};
