import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function AdmissionForm({ onClose, isOpen }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    studentName: '',
    classToAdmit: '',
    fatherName: '',
    motherName: '',
    phone: '',
    otp: '',
    studentPhoto: null,
    birthCertPhoto: null,
    fatherNidPhoto: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const studentPhotoInput = useRef(null);
  const birthCertInput = useRef(null);
  const fatherNidInput = useRef(null);

  // 📤 প্রাইভেট বাকেটে ছবি আপলোড
  const uploadFile = async (file, folder) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('private-admission-files')  // ← প্রাইভেট বাকেট
      .upload(filePath, file);

    if (error) throw error;
    return data.path;
  };

  // 📸 সাইনড ইউআরএল জেনারেট (শুধু এডমিন দেখতে পাবে)
  const getSignedUrl = async (filePath) => {
    if (!filePath) return null;
    const { data, error } = await supabase.storage
      .from('private-admission-files')
      .createSignedUrl(filePath, 60); // ৬০ সেকেন্ড বৈধ
    
    if (error) return null;
    return data.signedUrl;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setError('');
    
    // ভ্যালিডেশন
    if (!formData.studentName || !formData.classToAdmit || !formData.fatherName || 
        !formData.motherName || !formData.phone || formData.phone.length !== 11) {
      setError('সব ঘর সঠিকভাবে পূরণ করুন এবং ১১ ডিজিটের মোবাইল নম্বর দিন');
      return;
    }

    if (!formData.studentPhoto || !formData.birthCertPhoto || !formData.fatherNidPhoto) {
      setError('সব ছবি আপলোড করুন (ছাত্র/ছাত্রী, জন্ম নিবন্ধন, বাবার এনআইডি)');
      return;
    }

    setLoading(true);
    try {
      // ১. ছবি আপলোড (প্রাইভেট বাকেটে)
      const studentPhotoPath = await uploadFile(formData.studentPhoto, 'student-photos');
      const birthCertPath = await uploadFile(formData.birthCertPhoto, 'birth-certs');
      const fatherNidPath = await uploadFile(formData.fatherNidPhoto, 'nid-photos');

      // ২. ডেটাবেসে ডেটা সংরক্ষণ
      const { data, error } = await supabase
        .from('admissions')
        .insert([{
          student_name: formData.studentName,
          class_to_admit: formData.classToAdmit,
          father_name: formData.fatherName,
          mother_name: formData.motherName,
          phone: formData.phone,
          student_photo: studentPhotoPath,
          birth_cert_photo: birthCertPath,
          father_nid_photo: fatherNidPath,
          status: 'pending'
        }]);

      if (error) throw error;
      
      // ৩. OTP স্টেপে যান (সিমুলেটেড)
      setStep(2);
      alert(`OTP পাঠানো হয়েছে: ১২৩৪৫ (সিমুলেটেড)`);
      
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
      // সিমুলেটেড OTP চেক
      if (formData.otp === '12345') {
        setStep(3);
        // এখানে ডেটাবেসে OTP ভেরিফাইড আপডেট করতে পারেন
      } else {
        setError('ভুল কোড, আবার চেষ্টা করুন');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileCapture = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
        
        {step === 1 && (
          <form onSubmit={handleSubmitForm} style={styles.form}>
            <div style={styles.header}>
              <span style={styles.headerIcon}>📝</span>
              <h2 style={styles.heading}>ভর্তি আবেদন ফরম</h2>
              <p style={styles.subHeading}>আপনার সন্তানের ভবিষ্যৎ শুরু হোক আজই</p>
            </div>
            
            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.field}>
              <label style={styles.label}>👤 ছাত্র/ছাত্রীর নাম <span style={{color: '#ef4444'}}>*</span></label>
              <input type="text" required placeholder="পূর্ণ নাম লিখুন" value={formData.studentName} 
                onChange={(e) => setFormData({...formData, studentName: e.target.value})} style={styles.input} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>📚 কোন ক্লাসে ভর্তি? <span style={{color: '#ef4444'}}>*</span></label>
              <select required value={formData.classToAdmit} 
                onChange={(e) => setFormData({...formData, classToAdmit: e.target.value})} style={styles.select}>
                <option value="">ক্লাস নির্বাচন করুন</option>
                <option value="১ম">১ম শ্রেণী</option>
                <option value="২য়">২য় শ্রেণী</option>
                <option value="৩য়">৩য় শ্রেণী</option>
                <option value="৪র্থ">৪র্থ শ্রেণী</option>
                <option value="৫ম">৫ম শ্রেণী</option>
              </select>
            </div>

            <div style={styles.photoGrid}>
              <div style={styles.field}>
                <label style={styles.label}>📸 ছাত্র/ছাত্রীর ছবি <span style={{color: '#ef4444'}}>*</span></label>
                <div style={styles.fileWrapper}>
                  <input type="file" ref={studentPhotoInput} accept="image/*" capture="environment" 
                    onChange={(e) => handleFileCapture(e, 'studentPhoto')} required style={styles.fileInput} />
                  <span style={styles.filePlaceholder}>{formData.studentPhoto ? '✅ নির্বাচিত' : 'ক্যামেরা দিয়ে ছবি তুলুন'}</span>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>📄 জন্ম নিবন্ধন <span style={{color: '#ef4444'}}>*</span></label>
                <div style={styles.fileWrapper}>
                  <input type="file" ref={birthCertInput} accept="image/*" capture="environment" 
                    onChange={(e) => handleFileCapture(e, 'birthCertPhoto')} required style={styles.fileInput} />
                  <span style={styles.filePlaceholder}>{formData.birthCertPhoto ? '✅ নির্বাচিত' : 'ক্যামেরা দিয়ে ছবি তুলুন'}</span>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>🆔 বাবার NID <span style={{color: '#ef4444'}}>*</span></label>
                <div style={styles.fileWrapper}>
                  <input type="file" ref={fatherNidInput} accept="image/*" capture="environment" 
                    onChange={(e) => handleFileCapture(e, 'fatherNidPhoto')} required style={styles.fileInput} />
                  <span style={styles.filePlaceholder}>{formData.fatherNidPhoto ? '✅ নির্বাচিত' : 'ক্যামেরা দিয়ে ছবি তুলুন'}</span>
                </div>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>👨 বাবার নাম <span style={{color: '#ef4444'}}>*</span></label>
              <input type="text" required placeholder="বাবার পূর্ণ নাম" value={formData.fatherName} 
                onChange={(e) => setFormData({...formData, fatherName: e.target.value})} style={styles.input} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>👩 মায়ের নাম <span style={{color: '#ef4444'}}>*</span></label>
              <input type="text" required placeholder="মায়ের পূর্ণ নাম" value={formData.motherName} 
                onChange={(e) => setFormData({...formData, motherName: e.target.value})} style={styles.input} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>📱 মোবাইল নাম্বার <span style={{color: '#ef4444'}}>*</span></label>
              <input type="tel" required pattern="01[3-9]\d{8}" placeholder="01XXXXXXXXX" value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} style={styles.input} />
            </div>

            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? '⏳ আপলোড হচ্ছে...' : '🚀 আবেদন জমা দিন'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div style={styles.otpContainer}>
            <div style={styles.otpIcon}>📱</div>
            <h2 style={styles.otpHeading}>OTP ভেরিফিকেশন</h2>
            <p style={styles.otpText}>আপনার মোবাইলে পাঠানো ৫ ডিজিটের কোড দিন</p>
            {error && <div style={styles.errorBox}>{error}</div>}
            <form onSubmit={handleVerifyOtp} style={styles.otpForm}>
              <input type="text" maxLength="5" placeholder="— — — — —" required 
                value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value})} 
                style={styles.otpInput} />
              <button type="submit" disabled={loading} style={styles.otpBtn}>
                {loading ? '⏳ ভেরিফাই করছি...' : '✅ কোড নিশ্চিত করুন'}
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div style={styles.successContainer}>
            <div style={styles.successIcon}>🎉</div>
            <h2 style={styles.successHeading}>আবেদন সফলভাবে জমা হয়েছে!</h2>
            <p style={styles.successText}>আপনার আবেদনটি সুপার এডমিনের কাছে পৌঁছেছে।</p>
            <button onClick={onClose} style={styles.successBtn}>✅ ঠিক আছে</button>
          </div>
        )}
      </div>
    </div>
  );
}

// 🎨 প্রিমিয়াম ডিজাইন স্টাইল
const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px', animation: 'fadeIn 0.3s ease'
  },
  modal: {
    backgroundColor: '#ffffff', borderRadius: '28px', padding: '28px',
    width: '100%', maxWidth: '540px', maxHeight: '90vh',
    overflowY: 'auto', position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
  },
  closeBtn: {
    position: 'absolute', top: '16px', right: '16px',
    background: '#f1f5f9', border: 'none', width: '40px', height: '40px',
    borderRadius: '50%', fontSize: '20px', cursor: 'pointer',
    color: '#64748b', transition: 'all 0.2s ease',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  header: { textAlign: 'center', marginBottom: '24px' },
  headerIcon: { fontSize: '36px', display: 'block', marginBottom: '4px' },
  heading: { 
    fontSize: '24px', fontWeight: '800', color: '#0f172a',
    margin: '0 0 4px 0', letterSpacing: '-0.5px'
  },
  subHeading: { 
    fontSize: '14px', color: '#64748b', margin: 0,
    fontWeight: '400'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { 
    fontSize: '13px', fontWeight: '600', color: '#334155',
    display: 'flex', alignItems: 'center', gap: '4px'
  },
  input: {
    padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
    fontSize: '14px', transition: 'all 0.2s ease',
    backgroundColor: '#ffffff', outline: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  select: {
    padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
    fontSize: '14px', transition: 'all 0.2s ease',
    backgroundColor: '#ffffff', outline: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  photoGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
    '@media (max-width: 480px)': { gridTemplateColumns: '1fr' }
  },
  fileWrapper: {
    position: 'relative', borderRadius: '12px',
    border: '1.5px dashed #cbd5e1', padding: '8px 12px',
    backgroundColor: '#f8fafc', transition: 'all 0.2s ease',
    cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center'
  },
  fileInput: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    opacity: 0, cursor: 'pointer'
  },
  filePlaceholder: {
    fontSize: '13px', color: '#64748b', pointerEvents: 'none'
  },
  btn: {
    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    color: 'white', border: 'none', padding: '14px 20px',
    borderRadius: '14px', fontWeight: '700', fontSize: '16px',
    cursor: 'pointer', transition: 'all 0.2s ease',
    boxShadow: '0 6px 20px rgba(22, 163, 74, 0.3)',
    marginTop: '4px'
  },
  errorBox: {
    backgroundColor: '#fee2e2', color: '#991b1b',
    padding: '10px 14px', borderRadius: '10px',
    fontSize: '13px', borderLeft: '4px solid #dc2626'
  },
  otpContainer: { textAlign: 'center', padding: '20px 0' },
  otpIcon: { fontSize: '48px', marginBottom: '8px' },
  otpHeading: { fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '8px 0 4px 0' },
  otpText: { fontSize: '14px', color: '#64748b', marginBottom: '20px' },
  otpForm: { display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' },
  otpInput: {
    width: '200px', textAlign: 'center', padding: '14px',
    fontSize: '28px', letterSpacing: '10px',
    border: '2px solid #e2e8f0', borderRadius: '16px',
    outline: 'none', transition: 'all 0.2s ease',
    backgroundColor: '#f8fafc'
  },
  otpBtn: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: 'white', border: 'none', padding: '12px 32px',
    borderRadius: '14px', fontWeight: '700', fontSize: '15px',
    cursor: 'pointer', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.3)'
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

// গ্লোবাল অ্যানিমেশন
const styleTag = document.createElement('style');
styleTag.textContent = `
  @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  input:focus, select:focus { border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15) !important; }
`;
document.head.appendChild(styleTag);
