import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';

export default function PortalRegister({ onSwitchToLogin, onClose }) {
  const { register } = usePortal();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: '',
    className: '',
    rollNumber: '',
    designation: '',
    subject: '',
  });

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setFormData({ ...formData, role: selectedRole });
    setStep(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // ভ্যালিডেশন
    if (!formData.name || !formData.email || !formData.password) {
      setError('দয়া করে নাম, ইমেইল ও পাসওয়ার্ড দিন');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      setLoading(false);
      return;
    }

    if (role === 'student' && !formData.className) {
      setError('দয়া করে ক্লাস নির্বাচন করুন');
      setLoading(false);
      return;
    }

    if (role === 'teacher' && !formData.designation) {
      setError('দয়া করে পদবী লিখুন');
      setLoading(false);
      return;
    }

    const result = await register(formData);

    if (result.success) {
      onClose?.();
    } else {
      setError(result.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে');
    }
    setLoading(false);
  };

  const handleBack = () => {
    setStep(1);
    setRole(null);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>

        {step === 1 && (
          <>
            <div style={styles.header}>
              <div style={styles.logo}>📝</div>
              <h2 style={styles.title}>অ্যাকাউন্ট তৈরি করুন</h2>
              <p style={styles.subtitle}>আপনি কে? নির্বাচন করুন</p>
            </div>

            <div style={styles.roleGrid}>
              <div
                style={styles.roleCard}
                onClick={() => handleRoleSelect('student')}
              >
                <div style={styles.roleIcon}>🎓</div>
                <h3 style={styles.roleTitle}>ছাত্র/ছাত্রী</h3>
                <p style={styles.roleDesc}>পড়াশোনা করুন</p>
              </div>
              <div
                style={styles.roleCard}
                onClick={() => handleRoleSelect('teacher')}
              >
                <div style={styles.roleIcon}>👨‍🏫</div>
                <h3 style={styles.roleTitle}>শিক্ষক</h3>
                <p style={styles.roleDesc}>শেখান</p>
              </div>
            </div>

            <div style={styles.footer}>
              <p style={styles.footerText}>
                ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  style={styles.switchBtn}
                >
                  🔓 লগইন করুন
                </button>
              </p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={styles.header}>
              <div style={styles.logo}>📝</div>
              <h2 style={styles.title}>
                {role === 'student' ? '🎓 ছাত্র নিবন্ধন' : '👨‍🏫 শিক্ষক নিবন্ধন'}
              </h2>
              <button
                type="button"
                onClick={handleBack}
                style={styles.backBtn}
              >
                ⬅ পিছনে
              </button>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>👤 নাম *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="আপনার নাম"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>📧 ইমেইল *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>🔑 পাসওয়ার্ড *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>📱 ফোন (ঐচ্ছিক)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                  style={styles.input}
                />
              </div>

              {role === 'student' && (
                <>
                  <div style={styles.field}>
                    <label style={styles.label}>📚 ক্লাস *</label>
                    <select
                      name="className"
                      value={formData.className}
                      onChange={handleChange}
                      required
                      style={styles.input}
                    >
                      <option value="">নির্বাচন করুন</option>
                      <option value="প্লে">প্লে</option>
                      <option value="১ম">১ম শ্রেণী</option>
                      <option value="২য়">২য় শ্রেণী</option>
                      <option value="৩য়">৩য় শ্রেণী</option>
                      <option value="৪র্থ">৪র্থ শ্রেণী</option>
                      <option value="৫ম">৫ম শ্রেণী</option>
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>🔢 রোল নম্বর (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleChange}
                      placeholder="১-৩"
                      style={styles.input}
                    />
                  </div>
                </>
              )}

              {role === 'teacher' && (
                <>
                  <div style={styles.field}>
                    <label style={styles.label}>📋 পদবী *</label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="যেমন: প্রধান শিক্ষক"
                      required
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>📚 বিষয় (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="যেমন: বাংলা, ইংরেজি"
                      style={styles.input}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                style={styles.submitBtn}
              >
                {loading ? '⏳ তৈরি হচ্ছে...' : '✅ অ্যাকাউন্ট তৈরি করুন'}
              </button>
            </form>

            <div style={styles.footer}>
              <p style={styles.footerText}>
                ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  style={styles.switchBtn}
                >
                  🔓 লগইন করুন
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '32px 28px',
    maxWidth: '440px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
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
    color: '#64748b',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  logo: {
    fontSize: '40px',
    marginBottom: '4px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#16a34a',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px',
    marginTop: '6px',
  },
  errorBox: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '16px',
    borderLeft: '4px solid #dc2626',
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '20px',
  },
  roleCard: {
    background: '#f8fafc',
    padding: '24px 16px',
    borderRadius: '16px',
    textAlign: 'center',
    cursor: 'pointer',
    border: '2px solid #e2e8f0',
    transition: 'all 0.2s ease',
  },
  roleIcon: {
    fontSize: '40px',
    marginBottom: '8px',
  },
  roleTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '4px 0',
  },
  roleDesc: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#f8fafc',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '4px',
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
  },
  footerText: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: '#16a34a',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '14px',
    textDecoration: 'underline',
  },
};
