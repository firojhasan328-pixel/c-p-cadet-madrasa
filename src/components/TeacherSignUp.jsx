import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { generateOTP, saveOTP, verifyOTP, sendCustomOTPEmail } from '../utils/otpService';

export default function TeacherSignUp({ onBack, onClose }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    designation: '',
    subject: '',
    phone: '',
    email: '',
    photo: null,
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ========================================
  // হ্যান্ডলার ফাংশন
  // ========================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, (compressedFile) => {
        setFormData({ ...formData, photo: compressedFile });
      });
    }
  };

  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;
        ctx.drawImage(img, 0, 0, 200, 200);
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
          callback(compressedFile);
        }, 'image/jpeg', 0.7);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async () => {
    if (!formData.photo) return null;
    const fileExt = formData.photo.name.split('.').pop();
    const fileName = `teacher_${Date.now()}.${fileExt}`;
    const filePath = `teacher-photos/${fileName}`;
    
    try {
      const { data, error } = await supabase.storage
        .from('private-admission-files')
        .upload(filePath, formData.photo);
      
      if (error) throw error;
      return data.path;
    } catch (err) {
      console.error('ছবি আপলোড সমস্যা:', err);
      return null;
    }
  };

  // ========================================
  // ধাপ ১: OTP পাঠান
  // ========================================
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // ফোন নম্বর ভ্যালিডেশন
    if (!formData.phone || formData.phone.length < 11) {
      setError('❌ সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন');
      setLoading(false);
      return;
    }

    try {
      // ১. ইমেইল চেক
      const { data: existingEmail } = await supabase
        .from('teachers')
        .select('email')
        .eq('email', formData.email.toLowerCase().trim())
        .maybeSingle();

      if (existingEmail) {
        setError('❌ এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে।');
        setLoading(false);
        return;
      }

      // ২. ফোন চেক
      const { data: existingPhone } = await supabase
        .from('teachers')
        .select('phone')
        .eq('phone', formData.phone.trim())
        .maybeSingle();

      if (existingPhone) {
        setError('❌ এই মোবাইল নাম্বারটি ইতিমধ্যে ব্যবহার করা হয়েছে।');
        setLoading(false);
        return;
      }

      // ৩. OTP জেনারেট ও ইমেইল পাঠান
      const otp = generateOTP();
      await saveOTP(formData.email, otp);
      
      const emailResult = await sendCustomOTPEmail(formData.email, otp);
      
      if (!emailResult.success) {
        setError('OTP পাঠাতে সমস্যা: ' + (emailResult.error || 'অজানা সমস্যা'));
        setLoading(false);
        return;
      }

      setStep(2);
      alert('✅ আপনার ইমেইলে OTP কোড পাঠানো হয়েছে!');
    } catch (err) {
      setError(err.message || 'OTP পাঠাতে সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // ধাপ ২: OTP ভেরিফাই ও রেজিস্ট্রেশন
  // ========================================
  const handleVerifyAndSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ১. OTP ভেরিফাই
      const result = await verifyOTP(formData.email, formData.otp);
      
      if (!result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }

      // ২. ছবি আপলোড
      const photoPath = await uploadPhoto();

      // ৩. ডেটা ইনসার্ট
      const { error: insertError } = await supabase
        .from('teachers')
        .insert([{
          name: formData.name,
          gender: formData.gender,
          designation: formData.designation,
          subject: formData.subject,
          phone: formData.phone.trim(),
          email: formData.email.toLowerCase().trim(),
          photo_url: photoPath,
          is_verified: true,
          is_approved: false
        }]);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('❌ এই ইমেইল বা ফোন নাম্বারটি ইতিমধ্যে ব্যবহার করা হয়েছে।');
        } else {
          setError('ডেটা জমা দিতে সমস্যা: ' + insertError.message);
        }
        setLoading(false);
        return;
      }

      alert('✅ শিক্ষক রেজিস্ট্রেশন সম্পূর্ণ! রিকোয়েস্ট সুপার এডমিনের কাছে গেছে।');
      onClose();
    } catch (err) {
      setError(err.message || 'সাবমিট করতে সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // UI (StudentSignUp এর মতো ডিজাইন)
  // ========================================
  return (
    <div>
      {step === 1 && (
        <form onSubmit={handleSendOTP} style={styles.form}>
          <h2 style={styles.heading}>👨‍🏫 শিক্ষক নিবন্ধন</h2>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.field}>
            <label>লিঙ্গ *</label>
            <select name="gender" required value={formData.gender} onChange={handleInputChange} style={styles.select}>
              <option value="">নির্বাচন করুন</option>
              <option value="male">পুরুষ</option>
              <option value="female">মহিলা</option>
            </select>
          </div>

          <div style={styles.field}>
            <label>পদবি *</label>
            <input type="text" name="designation" required placeholder="যেমন: হেডমাস্টার" value={formData.designation} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.field}>
            <label>বিষয় *</label>
            <input type="text" name="subject" required placeholder="যেমন: বাংলা, ইংরেজি" value={formData.subject} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.field}>
            <label>নাম *</label>
            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.field}>
            <label>মোবাইল নাম্বার *</label>
            <input type="tel" name="phone" required pattern="01[3-9]\d{8}" placeholder="01XXXXXXXXX" value={formData.phone} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.field}>
            <label>ইমেইল *</label>
            <input type="email" name="email" required placeholder="example@gmail.com" value={formData.email} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.field}>
            <label>ছবি *</label>
            <input type="file" accept="image/*" capture="environment" required onChange={handleFileChange} style={styles.fileInput} />
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={onBack} style={styles.backBtn}>পিছনে</button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? '⏳ OTP পাঠাচ্ছি...' : '📧 OTP পাঠান'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div style={styles.otpContainer}>
          <h2 style={styles.otpHeading}>📧 ইমেইল ভেরিফিকেশন</h2>
          <p style={styles.otpText}>আপনার ইমেইলে ৬ ডিজিটের কোড পাঠানো হয়েছে।</p>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleVerifyAndSubmit} style={styles.otpForm}>
            <input 
              type="text" 
              maxLength="6" 
              placeholder="------" 
              required
              value={formData.otp} 
              onChange={(e) => setFormData({...formData, otp: e.target.value})}
              style={styles.otpInput} 
            />
            <button type="submit" disabled={loading} style={styles.otpBtn}>
              {loading ? '⏳ ভেরিফাই করছি...' : '✅ নিশ্চিত করুন'}
            </button>
            <button type="button" onClick={() => setStep(1)} style={styles.backBtn}>পিছনে</button>
          </form>
        </div>
      )}
    </div>
  );
}

// ========================================
// স্টাইল (StudentSignUp এর মতো)
// ========================================
const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  heading: { fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' },
  select: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' },
  fileInput: { padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' },
  buttonGroup: { display: 'flex', gap: '10px', marginTop: '8px' },
  backBtn: { background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '8px', flex: 1, cursor: 'pointer', fontWeight: '600' },
  submitBtn: { background: '#16a34a', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', flex: 2, cursor: 'pointer', fontWeight: '600' },
  error: { background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', borderLeft: '3px solid #dc2626' },
  otpContainer: { textAlign: 'center', padding: '20px 0' },
  otpHeading: { fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  otpText: { fontSize: '14px', color: '#64748b', marginBottom: '16px' },
  otpForm: { display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' },
  otpInput: { width: '200px', padding: '12px', fontSize: '24px', letterSpacing: '8px', textAlign: 'center', border: '2px solid #cbd5e1', borderRadius: '12px', outline: 'none' },
  otpBtn: { background: '#2563eb', color: 'white', border: 'none', padding: '10px 32px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }
};
