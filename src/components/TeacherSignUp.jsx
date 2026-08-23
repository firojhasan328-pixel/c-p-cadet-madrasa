import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  generateOTP, 
  saveTeacherOTP, 
  verifyTeacherOTP, 
  sendTeacherOTPEmail 
} from '../utils/teacherOtpService';

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
  const photoInputRef = useRef(null);

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

  // OTP পাঠান
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.phone || formData.phone.length < 11) {
      setError('❌ সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন');
      setLoading(false);
      return;
    }

    try {
      // ইমেইল চেক
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

      // ফোন চেক
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

      // OTP জেনারেট ও ইমেইল পাঠান
      const otp = generateOTP();
      await saveTeacherOTP(formData.email, otp);
      
      const emailResult = await sendTeacherOTPEmail(formData.email, otp);
      
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

  // OTP ভেরিফাই ও রেজিস্ট্রেশন
  const handleVerifyAndSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // OTP ভেরিফাই
      const result = await verifyTeacherOTP(formData.email, formData.otp);
      
      if (!result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }

      // ছবি আপলোড
      const photoPath = await uploadPhoto();

      // ডেটা ইনসার্ট
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

      setStep(3);
    } catch (err) {
      setError(err.message || 'সাবমিট করতে সমস্যা');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {step === 1 && (
        <form onSubmit={handleSendOTP} style={styles.form}>
          <div style={styles.header}>
            <span style={styles.headerIcon}>👨‍🏫</span>
            <h2 style={styles.heading}>শিক্ষক নিবন্ধন</h2>
            <p style={styles.subHeading}>আপনার তথ্য দিয়ে ফরম পূরণ করুন</p>
          </div>
          
          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.field}>
            <label style={styles.label}>👤 নাম <span style={{color: '#ef4444'}}>*</span></label>
            <input type="text" name="name" required placeholder="আপনার পূর্ণ নাম" value={formData.name} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>⚥ লিঙ্গ <span style={{color: '#ef4444'}}>*</span></label>
            <select name="gender" required value={formData.gender} onChange={handleInputChange} style={styles.select}>
              <option value="">নির্বাচন করুন</option>
              <option value="male">পুরুষ</option>
              <option value="female">মহিলা</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>💼 পদবি <span style={{color: '#ef4444'}}>*</span></label>
            <input type="text" name="designation" required placeholder="যেমন: হেডমাস্টার" value={formData.designation} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>📚 বিষয় <span style={{color: '#ef4444'}}>*</span></label>
            <input type="text" name="subject" required placeholder="যেমন: বাংলা, ইংরেজি" value={formData.subject} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>📱 মোবাইল নাম্বার <span style={{color: '#ef4444'}}>*</span></label>
            <input type="tel" name="phone" required pattern="01[3-9]\d{8}" placeholder="01XXXXXXXXX" value={formData.phone} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>📧 ইমেইল <span style={{color: '#ef4444'}}>*</span></label>
            <input type="email" name="email" required placeholder="your@email.com" value={formData.email} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>📸 ছবি <span style={{color: '#ef4444'}}>*</span></label>
            <div style={styles.fileWrapper}>
              <input type="file" ref={photoInputRef} accept="image/*" capture="environment" required onChange={handleFileChange} style={styles.fileInput} />
              <span style={styles.filePlaceholder}>{formData.photo ? '✅ নির্বাচিত' : 'ক্যামেরা দিয়ে ছবি তুলুন'}</span>
            </div>
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={onBack} style={styles.backBtn}>⬅ পিছনে</button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? '⏳ OTP পাঠাচ্ছি...' : '📧 OTP পাঠান'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div style={styles.otpContainer}>
          <div style={styles.otpIcon}>📱</div>
          <h2 style={styles.otpHeading}>ইমেইল ভেরিফিকেশন</h2>
          <p style={styles.otpText}>আপনার ইমেইলে ৬ ডিজিটের কোড পাঠানো হয়েছে</p>
          {error && <div style={styles.errorBox}>{error}</div>}
          <form onSubmit={handleVerifyAndSubmit} style={styles.otpForm}>
            <input 
              type="text" 
              maxLength="6" 
              placeholder="— — — — — —" 
              required
              value={formData.otp} 
              onChange={(e) => setFormData({...formData, otp: e.target.value})}
              style={styles.otpInput} 
            />
            <div style={styles.otpButtonGroup}>
              <button type="button" onClick={() => setStep(1)} style={styles.otpBackBtn}>পিছনে</button>
              <button type="submit" disabled={loading} style={styles.otpBtn}>
                {loading ? '⏳ ভেরিফাই করছি...' : '✅ নিশ্চিত করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && (
        <div style={styles.successContainer}>
          <div style={styles.successIcon}>🎉</div>
          <h2 style={styles.successHeading}>রেজিস্ট্রেশন সফল!</h2>
          <p style={styles.successText}>আপনার শিক্ষক অ্যাকাউন্ট তৈরি হয়েছে। এখন লগইন করুন।</p>
          <button onClick={onClose} style={styles.successBtn}>✅ ঠিক আছে</button>
        </div>
      )}
    </div>
  );
}

// =============================================
// প্রিমিয়াম ডিজাইন স্টাইল
// =============================================
const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  header: { textAlign: 'center', marginBottom: '8px' },
  headerIcon: { fontSize: '36px', display: 'block', marginBottom: '4px' },
  heading: { fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' },
  subHeading: { fontSize: '13px', color: '#64748b', margin: 0 },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#334155' },
  input: { 
    padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
    fontSize: '14px', transition: 'all 0.2s ease', outline: 'none',
    backgroundColor: '#ffffff'
  },
  select: { 
    padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
    fontSize: '14px', transition: 'all 0.2s ease', outline: 'none',
    backgroundColor: '#ffffff'
  },
  fileWrapper: {
    position: 'relative', borderRadius: '12px',
    border: '1.5px dashed #cbd5e1', padding: '10px 14px',
    backgroundColor: '#f8fafc', transition: 'all 0.2s ease',
    cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center'
  },
  fileInput: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    opacity: 0, cursor: 'pointer'
  },
  filePlaceholder: { fontSize: '13px', color: '#64748b', pointerEvents: 'none' },
  buttonGroup: { display: 'flex', gap: '10px', marginTop: '4px' },
  backBtn: { 
    background: '#f1f5f9', color: '#64748b', border: 'none', 
    padding: '12px', borderRadius: '12px', flex: 1, 
    cursor: 'pointer', fontWeight: '600', fontSize: '14px'
  },
  submitBtn: { 
    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    color: 'white', border: 'none', padding: '12px', borderRadius: '12px',
    flex: 2, cursor: 'pointer', fontWeight: '700', fontSize: '14px',
    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
  },
  errorBox: {
    backgroundColor: '#fee2e2', color: '#991b1b',
    padding: '10px 14px', borderRadius: '10px',
    fontSize: '13px', borderLeft: '4px solid #dc2626'
  },
  otpContainer: { textAlign: 'center', padding: '20px 0' },
  otpIcon: { fontSize: '48px', marginBottom: '8px' },
  otpHeading: { fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  otpText: { fontSize: '14px', color: '#64748b', marginBottom: '16px' },
  otpForm: { display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' },
  otpInput: {
    width: '200px', textAlign: 'center', padding: '14px',
    fontSize: '28px', letterSpacing: '10px',
    border: '2px solid #e2e8f0', borderRadius: '16px',
    outline: 'none', transition: 'all 0.2s ease',
    backgroundColor: '#f8fafc'
  },
  otpButtonGroup: { display: 'flex', gap: '10px', width: '100%', maxWidth: '300px' },
  otpBackBtn: {
    background: '#f1f5f9', color: '#64748b', border: 'none',
    padding: '12px', borderRadius: '12px', flex: 1,
    cursor: 'pointer', fontWeight: '600'
  },
  otpBtn: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: 'white', border: 'none', padding: '12px',
    borderRadius: '12px', flex: 2, cursor: 'pointer',
    fontWeight: '700', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
  },
  successContainer: { textAlign: 'center', padding: '30px 10px' },
  successIcon: { fontSize: '56px', marginBottom: '12px' },
  successHeading: { fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' },
  successText: { fontSize: '14px', color: '#64748b', marginBottom: '24px' },
  successBtn: {
    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    color: 'white', border: 'none', padding: '12px 40px',
    borderRadius: '14px', fontWeight: '700', fontSize: '15px',
    cursor: 'pointer', boxShadow: '0 6px 20px rgba(22, 163, 74, 0.3)'
  }
};
