import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (loginError) {
        setError('❌ ' + loginError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === 'super_admin' || profile?.role === 'admin') {
          setSuccess('✅ লগইন সফল! রিডাইরেক্ট হচ্ছে...');
          setTimeout(() => {
            window.location.href = '/admin-dashboard';
          }, 1000);
        } else {
          setError('❌ আপনার এডমিন অ্যাক্সেস নেই।');
          await supabase.auth.signOut();
        }
      }
    } catch (err) {
      setError('❌ ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>🔐</div>
          <h1 style={styles.title}>এডমিন লগইন</h1>
          <p style={styles.subtitle}>শুধুমাত্র অনুমোদিত ব্যক্তিরা প্রবেশ করতে পারবেন</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>📧 ইমেইল</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>🔑 পাসওয়ার্ড</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={styles.submitBtn}
          >
            {loading ? '⏳ লগইন হচ্ছে...' : '🚀 লগইন করুন'}
          </button>
        </form>

        <button
          onClick={() => window.history.back()}
          style={styles.backBtn}
        >
          ⬅ ফিরে যান
        </button>

        <div style={styles.helpText}>
          <p>সুপার এডমিন: <strong>firojhasan328@gmail.com</strong></p>
          <p style={{ fontSize: '11px', color: '#94a3b8' }}>
            পাসওয়ার্ড: <strong>firojhasan1234+</strong>
          </p>
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
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '28px',
    padding: '40px 32px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
    position: 'relative',
    overflow: 'hidden',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logo: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '8px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 4px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  errorBox: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '16px',
    fontSize: '14px',
    borderLeft: '4px solid #dc2626',
  },
  successBox: {
    background: '#dcfce7',
    color: '#15803d',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '16px',
    fontSize: '14px',
    borderLeft: '4px solid #16a34a',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    background: '#f8fafc',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
    marginTop: '4px',
  },
  backBtn: {
    background: 'transparent',
    color: '#64748b',
    border: 'none',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    marginTop: '12px',
    transition: 'all 0.2s ease',
  },
  helpText: {
    marginTop: '20px',
    padding: '12px',
    background: '#f1f5f9',
    borderRadius: '10px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#64748b',
  },
};
