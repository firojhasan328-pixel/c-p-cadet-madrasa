import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function TeacherSignUp({ onBack, onClose }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gender: '', designation: '', subject: '', name: '', phone: '', photo: null, otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, (compressedFile) => {
        setFormData({ ...formData, photo: compressedFile });
      });
    }
  };

  const uploadPhoto = async () => {
    if (!formData.photo) return null;
    const fileExt = formData.photo.name.split('.').pop();
    const fileName = `teacher_${Date.now()}.${fileExt}`;
    const filePath = `teacher-photos/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('private-admission-files')
      .upload(filePath, formData.photo);
    
    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const photoPath = await uploadPhoto();

      const { data, error } = await supabase
        .from('teachers')
        .insert([{
          name: formData.name,
          gender: formData.gender,
          designation: formData.designation,
          subject: formData.subject,
          phone: formData.phone,
          photo_url: photoPath,
          is_verified: false,
          is_approved: false
        }]);

      if (error) throw error;

      setStep(2);
      alert('আপনার মোবাইলে ৬ ডিজিটের কোড পাঠানো হয়েছে (123456)');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.otp === '123456') {
        alert('আপনার রিকোয়েস্ট সুপার এডমিনের কাছে পাঠানো হয়েছে।');
        onClose();
      } else {
        setError('ভুল কোড। অনুগ্রহ করে সঠিক কোড দিন।');
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
            <label>ছবি *</label>
            <input type="file" accept="image/*" capture="environment" required onChange={handleFileChange} style={styles.fileInput} />
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={onBack} style={styles.backBtn}>পিছনে</button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? '⏳...' : 'কনফার্ম'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div style={styles.otpContainer}>
          <h2>📱 মোবাইল ভেরিফিকেশন</h2>
          <p>আপনার মোবাইলে ৬ ডিজিটের কোড পাঠানো হয়েছে।</p>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleVerifyOtp}>
            <input type="text" maxLength="6" placeholder="------" required
              value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value})}
              style={styles.otpInput} />
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? '⏳ ভেরিফাই করছি...' : '✅ কনফার্ম'}
            </button>
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
  backBtn: { background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '8px', flex: 1, cursor: 'pointer' },
  submitBtn: { background: '#16a34a', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', flex: 2, cursor: 'pointer' },
  error: { background: '#fee2e2', color: '#991b1b', padding: '8px', borderRadius: '6px', fontSize: '13px' },
  otpContainer: { textAlign: 'center', padding: '20px 0' },
  otpInput: { width: '200px', padding: '12px', fontSize: '24px', letterSpacing: '8px', textAlign: 'center', border: '2px solid #cbd5e1', borderRadius: '12px', marginBottom: '16px' }
};
