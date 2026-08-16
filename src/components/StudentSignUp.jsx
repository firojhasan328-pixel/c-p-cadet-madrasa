import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { generateOTP, saveOTP, verifyOTP, sendCustomOTPEmail } from '../utils/otpService';

export default function StudentSignUp({ onBack, onClose }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', fatherName: '', motherName: '', village: '',
    class: '', roll: '', photo: null, email: '', otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    const fileName = `student_${Date.now()}.${fileExt}`;
    const filePath = `student-photos/${fileName}`;
    
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
  // সাবমিট (OTP পাঠান)
  // ========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ১. ছবি আপলোড
      const photoPath = await uploadPhoto();

      // ২. ছাত্র ডেটা ইনসার্ট
      const { data, error } = await supabase
        .from('students')
        .insert([{
          name: formData.name,
          father_name: formData.fatherName,
          mother_name: formData.motherName,
          village: formData.village,
          class_name: formData.class,
          roll_number: formData.roll || null,
          photo_url: photoPath,
          email: formData.email,
          is_verified: false,
          is_approved: false
        }]);

      if (error) {
        console.error('Insert Error:', error);
        setError('ডেটা জমা দিতে সমস্যা: ' + error.message);
        setLoading(false);
        return;
      }

      // ৩. OTP জেনারেট ও ইমেইল পাঠান
      const otp = generateOTP();
      await saveOTP(formData.email, otp);
      
      const emailResult = await sendCustomOTPEmail(formData.email, otp);
      
      if (!emailResult.success) {
        setError('OTP পাঠাতে সমস্যা: ' + emailResult.error);
        setLoading(false);
        return;
      }

      setStep(2);
      alert(`✅ আপনার ইমেইলে OTP কোড পাঠানো হয়েছে!`);
    } catch (err) {
      console.error('Submit Error:', err);
      setError('সাবমিট করতে সমস্যা: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // OTP ভেরিফাই
  // ========================================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await verifyOTP(formData.email, formData.otp);
      
      if (result.success) {
        // students টেবিলে is_verified আপডেট করুন
        await supabase
          .from('students')
          .update({ is_verified: true })
          .eq('email', formData.email);
        
        alert('✅ ইমেইল ভেরিফাইড! আপনার রিকোয়েস্ট সুপার এডমিনের কাছে গেছে।');
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {step === 1 && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.heading}>🎓 ছাত্র নিবন্ধন</h2>
          {error && <div style={styles.error}>{error}</div>}
          
          <div style={styles.field}>
            <label>আপনার নাম *</label>
            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.field}>
            <label>বাবার নাম *</label>
            <input type="text" name="fatherName" required value={formData.fatherName} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.field}>
            <label>মায়ের নাম *</label>
            <input type="text" name="motherName" required value={formData.motherName} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.field}>
            <label>গ্রাম *</label>
            <input type="text" name="village" required value={formData.village} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.field}>
            <label>ক্লাস *</label>
            <select name="class" required value={formData.class} onChange={handleInputChange} style={styles.select}>
              <option value="">নির্বাচন করুন</option>
              <option value="প্লে">প্লে</option>
              <option value="১ম">১ম</option>
              <option value="২য়">২য়</option>
              <option value="৩য়">৩য়</option>
              <option value="৪র্থ">৪র্থ</option>
              <option value="৫ম">৫ম</option>
            </select>
          </div>

          <div style={styles.field}>
            <label>রোল (ঐচ্ছিক, ১-৩ এর মধ্যে)</label>
            <input type="number" name="roll" min="1" max="3" value={formData.roll} onChange={handleInputChange} style={styles.input} placeholder="১-৩" />
          </div>

          <div style={styles.field}>
            <label>ছবি * (ক্যামেরা থেকে তুলুন)</label>
            <input type="file" accept="image/*" capture="environment" required onChange={handleFileChange} style={styles.fileInput} />
          </div>

          <div style={styles.field}>
            <label>ইমেইল *</label>
            <input type="email" name="email" required value={formData.email} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={onBack} style={styles.backBtn}>পিছনে</button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? '⏳ জমা দিচ্ছি...' : '✅ সাইন ইন'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div style={styles.otpContainer}>
          <h2 style={styles.otpHeading}>📧 ইমেইল ভেরিফিকেশন</h2>
          <p style={styles.otpText}>আপনার ইমেইলে ৬ ডিজিটের কোড পাঠানো হয়েছে।</p>
          <p style={styles.otpSubText}>📩 আপনার ইমেইল চেক করুন।</p>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleVerifyOtp} style={styles.otpForm}>
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
              {loading ? '⏳ ভেরিফাই করছি...' : '✅ কনফার্ম'}
            </button>
            <button type="button" onClick={onBack} style={styles.backBtn}>পিছনে</button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  heading: { fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' },
  select: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' },
  fileInput: { padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' },
  buttonGroup: { display: 'flex', gap: '10px', marginTop: '8px' },
  backBtn: { 
    background: '#f1f5f9', border: 'none', padding: '10px', 
    borderRadius: '8px', flex: 1, cursor: 'pointer', fontWeight: '600'
  },
  submitBtn: { 
    background: '#16a34a', color: 'white', border: 'none', padding: '10px', 
    borderRadius: '8px', flex: 2, cursor: 'pointer', fontWeight: '600'
  },
  error: { 
    background: '#fee2e2', color: '#991b1b', padding: '8px 12px', 
    borderRadius: '6px', fontSize: '13px', borderLeft: '3px solid #dc2626'
  },
  otpContainer: { textAlign: 'center', padding: '20px 0' },
  otpHeading: { fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  otpText: { fontSize: '14px', color: '#64748b', marginBottom: '4px' },
  otpSubText: { fontSize: '12px', color: '#94a3b8', marginBottom: '16px' },
  otpForm: { display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' },
  otpInput: { 
    width: '200px', padding: '12px', fontSize: '24px', letterSpacing: '8px', 
    textAlign: 'center', border: '2px solid #cbd5e1', borderRadius: '12px',
    outline: 'none'
  },
  otpBtn: {
    background: '#2563eb', color: 'white', border: 'none', padding: '10px 32px',
    borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
  }
};
