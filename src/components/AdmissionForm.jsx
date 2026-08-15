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

  const uploadFile = async (file, folder) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('admission-files')
      .upload(filePath, file);

    if (error) throw error;
    return data.path;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setError('');
    
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
      const studentPhotoPath = await uploadFile(formData.studentPhoto, 'student-photos');
      const birthCertPath = await uploadFile(formData.birthCertPhoto, 'birth-certs');
      const fatherNidPath = await uploadFile(formData.fatherNidPhoto, 'nid-photos');

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
      if (formData.otp === '12345') {
        setStep(3);
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
            <h2 style={styles.heading}>📝 ভর্তি আবেদন ফরম</h2>
            {error && <p style={styles.error}>{error}</p>}
            
            <div style={styles.field}>
              <label>ছাত্র/ছাত্রীর নাম *</label>
              <input type="text" required value={formData.studentName} 
                onChange={(e) => setFormData({...formData, studentName: e.target.value})} />
            </div>

            <div style={styles.field}>
              <label>কোন ক্লাসে ভর্তি? *</label>
              <select required value={formData.classToAdmit} 
                onChange={(e) => setFormData({...formData, classToAdmit: e.target.value})}>
                <option value="">সিলেক্ট করুন</option>
                <option value="১ম">১ম শ্রেণী</option>
                <option value="২য়">২য় শ্রেণী</option>
                <option value="৩য়">৩য় শ্রেণী</option>
                <option value="৪র্থ">৪র্থ শ্রেণী</option>
                <option value="৫ম">৫ম শ্রেণী</option>
              </select>
            </div>

            <div style={styles.field}>
              <label>ছাত্র/ছাত্রীর ছবি (লাইভ ক্যামেরা) *</label>
              <input type="file" ref={studentPhotoInput} accept="image/*" capture="environment" 
                onChange={(e) => handleFileCapture(e, 'studentPhoto')} required />
              {formData.studentPhoto && <span>✅ ছবি নির্বাচিত</span>}
            </div>

            <div style={styles.field}>
              <label>জন্ম নিবন্ধনের ছবি (লাইভ ক্যামেরা) *</label>
              <input type="file" ref={birthCertInput} accept="image/*" capture="environment" 
                onChange={(e) => handleFileCapture(e, 'birthCertPhoto')} required />
            </div>

            <div style={styles.field}>
              <label>বাবার NID কার্ডের ছবি (লাইভ ক্যামেরা) *</label>
              <input type="file" ref={fatherNidInput} accept="image/*" capture="environment" 
                onChange={(e) => handleFileCapture(e, 'fatherNidPhoto')} required />
            </div>

            <div style={styles.field}>
              <label>বাবার নাম *</label>
              <input type="text" required value={formData.fatherName} 
                onChange={(e) => setFormData({...formData, fatherName: e.target.value})} />
            </div>

            <div style={styles.field}>
              <label>মায়ের নাম *</label>
              <input type="text" required value={formData.motherName} 
                onChange={(e) => setFormData({...formData, motherName: e.target.value})} />
            </div>

            <div style={styles.field}>
              <label>মোবাইল নাম্বার (01XXXXXXXXX) *</label>
              <input type="tel" required pattern="01[3-9]\d{8}" value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>

            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? 'আপলোড হচ্ছে...' : 'আবেদন জমা দিন'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <h2>📱 OTP ভেরিফিকেশন</h2>
            <p style={{textAlign: 'center'}}>আপনার মোবাইলে পাঠানো ৫ ডিজিটের কোড দিন</p>
            {error && <p style={styles.error}>{error}</p>}
            <div style={styles.field}>
              <input type="text" maxLength="5" placeholder="-----" required 
                value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value})} 
                style={{textAlign: 'center', fontSize: '24px', letterSpacing: '8px'}} />
            </div>
            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? 'ভেরিফাই করছি...' : 'কোড নিশ্চিত করুন'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={styles.success}>
            <div style={{fontSize: '48px'}}>🎉</div>
            <h2>আবেদন সফলভাবে জমা হয়েছে!</h2>
            <p>আপনার আবেদনটি সুপার এডমিনের কাছে পৌঁছেছে।</p>
            <button onClick={onClose} style={styles.btn}>বন্ধ করুন</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px'
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '20px', padding: '24px',
    width: '100%', maxWidth: '520px', maxHeight: '90vh',
    overflowY: 'auto', position: 'relative'
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '12px',
    background: '#f1f5f9', border: 'none', width: '36px', height: '36px',
    borderRadius: '50%', fontSize: '18px', cursor: 'pointer'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  heading: { color: '#166534', textAlign: 'center', margin: '4px 0 10px 0' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  error: { color: '#dc2626', background: '#fee2e2', padding: '8px', borderRadius: '6px', fontSize: '14px' },
  btn: {
    background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white',
    border: 'none', padding: '12px', borderRadius: '10px',
    fontWeight: 'bold', cursor: 'pointer', marginTop: '6px',
    transition: 'all 0.3s ease'
  },
  success: { textAlign: 'center', padding: '20px 0' }
};
