import React from 'react';

export default function FormSuccess({ formNumber, studentName, onClose }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.icon}>🎉</div>
        <h2 style={styles.title}>আবেদন সফলভাবে জমা হয়েছে!</h2>
        
        <div style={styles.formNumberBox}>
          <span style={styles.formNumberLabel}>📋 ফরম নাম্বার</span>
          <span style={styles.formNumber}>{formNumber}</span>
        </div>

        <div style={styles.message}>
          <p>প্রিয় {studentName},</p>
          <p>আপনার আবেদনটি প্রধান শিক্ষকের কাছে পাঠানো হয়েছে।</p>
          <p>
            ভর্তি বিষয়ে শিগ্রই আপনার দেওয়া নাম্বার বা ইমেইলে 
            কনফার্মেশন মেসেজ দেওয়া হবে এবং যোগাযোগ করা হবে।
          </p>
          <p style={styles.important}>
            ⚠️ <strong>ফরম নাম্বারটি সংগ্রহ করে রাখুন!</strong><br />
            আমাদের সাথে যোগাযোগ করতে এই নাম্বার ব্যবহার করুন।
          </p>
        </div>

        <button onClick={onClose} style={styles.btn}>
          ✅ বুঝতে পেরেছি
        </button>
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
    padding: '16px'
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '28px',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '480px',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    animation: 'fadeIn 0.5s ease'
  },
  icon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: '12px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 20px 0'
  },
  formNumberBox: {
    background: 'linear-gradient(135deg, #14532d, #16a34a)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    color: 'white'
  },
  formNumberLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    opacity: 0.8,
    marginBottom: '4px'
  },
  formNumber: {
    display: 'block',
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '1px'
  },
  message: {
    textAlign: 'left',
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#334155',
    marginBottom: '24px'
  },
  important: {
    backgroundColor: '#fef3c7',
    padding: '12px 16px',
    borderRadius: '10px',
    borderLeft: '4px solid #f59e0b',
    fontSize: '14px',
    marginTop: '12px'
  },
  btn: {
    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    color: 'white',
    border: 'none',
    padding: '14px 40px',
    borderRadius: '14px',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(22,163,74,0.3)',
    transition: 'all 0.2s'
  }
};
