import React, { useState, useEffect } from 'react';

export default function Captcha({ onVerify }) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    generateNewCaptcha();
  }, []);

  const generateNewCaptcha = () => {
    setNum1(Math.floor(Math.random() * 9) + 1);
    setNum2(Math.floor(Math.random() * 9) + 1);
    setAnswer('');
    setVerified(false);
    setError('');
    onVerify(false);
  };

  const handleVerify = () => {
    const userAnswer = parseInt(answer);
    if (userAnswer === num1 + num2) {
      setVerified(true);
      setError('');
      onVerify(true);
    } else {
      setError('ভুল উত্তর, আবার চেষ্টা করুন');
      generateNewCaptcha();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.question}>
        <span style={styles.num}>{num1}</span>
        <span style={styles.operator}>+</span>
        <span style={styles.num}>{num2}</span>
        <span style={styles.operator}>=</span>
        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="?"
          style={styles.input}
          disabled={verified}
        />
      </div>
      <div style={styles.actions}>
        {!verified ? (
          <button onClick={handleVerify} style={styles.verifyBtn}>
            🤖 ভেরিফাই করুন
          </button>
        ) : (
          <span style={styles.verified}>✅ যাচাইকৃত</span>
        )}
        <button onClick={generateNewCaptcha} style={styles.refreshBtn}>
          🔄
        </button>
      </div>
      {error && <span style={styles.error}>{error}</span>}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#f8fafc',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'center'
  },
  question: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '18px',
    fontWeight: '600'
  },
  num: {
    color: '#0f172a',
    minWidth: '24px',
    textAlign: 'center'
  },
  operator: {
    color: '#64748b'
  },
  input: {
    width: '40px',
    height: '36px',
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: '600',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
    outline: 'none'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  verifyBtn: {
    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    color: 'white',
    border: 'none',
    padding: '6px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  refreshBtn: {
    background: '#f1f5f9',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  verified: {
    color: '#16a34a',
    fontWeight: '600',
    fontSize: '14px'
  },
  error: {
    color: '#ef4444',
    fontSize: '12px'
  }
};
