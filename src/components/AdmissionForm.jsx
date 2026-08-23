import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import FormPreview from './FormPreview';
import FormProgress from './FormProgress';
import FormSuccess from './FormSuccess';
import Captcha from './Captcha';
import { generateFormNumber } from '../utils/formNumberGenerator';
import { sendAutoReplyEmail } from '../utils/emailService';

export default function AdmissionForm({ onClose, isOpen }) {
  // =============================================
  // State
  // =============================================
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formNumber, setFormNumber] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  
  const [formData, setFormData] = useState({
    studentName: '',
    classToAdmit: '',
    fatherName: '',
    motherName: '',
    phone: '',
    email: '',
    studentPhoto: null,
    birthCertPhoto: null,
    fatherNidPhoto: null
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // =============================================
  // Refs - Camera
  // =============================================
  const studentPhotoCamera = useRef(null);
  const birthCertCamera = useRef(null);
  const fatherNidCamera = useRef(null);

  // =============================================
  // Refs - Gallery/File
  // =============================================
  const studentPhotoGallery = useRef(null);
  const birthCertGallery = useRef(null);
  const fatherNidGallery = useRef(null);

  // =============================================
  // Progress Update
  // =============================================
  useEffect(() => {
    const filledFields = Object.values(formData).filter(v => v !== '' && v !== null).length;
    const totalFields = 8;
    setProgress(Math.round((filledFields / totalFields) * 100));
  }, [formData]);

  // =============================================
  // Handle Input Change
  // =============================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // =============================================
  // 🖼️ Image Compressor (10KB এর নিচে)
  // =============================================
  const compressImage = (file, callback) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        
        if (width > 800) {
          height = (height / width) * 800;
          width = 800;
        }
        if (height > 800) {
          width = (width / height) * 800;
          height = 800;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        let quality = 0.7;
        
        const tryCompress = (q) => {
          canvas.toBlob((b) => {
            if (b.size > 10 * 1024 && q > 0.05) {
              tryCompress(q - 0.05);
            } else {
              const compressedFile = new File([b], file.name, { type: 'image/jpeg' });
              callback(compressedFile);
            }
          }, 'image/jpeg', q);
        };
        
        tryCompress(quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // =============================================
  // 📸 Handle File Capture
  // =============================================
  const handleFileCapture = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // NID Validation
    if (field === 'fatherNidPhoto') {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, fatherNidPhoto: 'শুধু JPG বা PNG ফাইল অনুমোদিত' });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setErrors({ ...errors, fatherNidPhoto: 'ফাইল সাইজ ২MB এর বেশি হতে পারে না' });
        return;
      }
    }

    compressImage(file, (compressedFile) => {
      setFormData({ ...formData, [field]: compressedFile });
      if (errors[field]) {
        setErrors({ ...errors, [field]: '' });
      }
    });
  };

  // =============================================
  // Validate Form
  // =============================================
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.studentName) newErrors.studentName = 'ছাত্র/ছাত্রীর নাম দিন';
    if (!formData.classToAdmit) newErrors.classToAdmit = 'ক্লাস নির্বাচন করুন';
    if (!formData.fatherName) newErrors.fatherName = 'বাবার নাম দিন';
    if (!formData.motherName) newErrors.motherName = 'মায়ের নাম দিন';
    if (!formData.phone || formData.phone.length !== 11) {
      newErrors.phone = 'সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন';
    }
    if (!formData.studentPhoto) newErrors.studentPhoto = 'ছাত্র/ছাত্রীর ছবি দিন';
    if (!formData.birthCertPhoto) newErrors.birthCertPhoto = 'জন্ম নিবন্ধন দিন';
    if (!formData.fatherNidPhoto) newErrors.fatherNidPhoto = 'বাবার NID দিন';
    if (!captchaVerified) newErrors.captcha = 'ক্যাপচা ভেরিফাই করুন';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =============================================
  // Submit Form
  // =============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowPreview(true);
  };

  // =============================================
  // Confirm Submit
  // =============================================
  const handleConfirmSubmit = async () => {
    setShowPreview(false);
    setIsSubmitting(true);
    setLoading(true);
    setError('');

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
          email: formData.email || null,
          student_photo: studentPhotoPath,
          birth_cert_photo: birthCertPath,
          father_nid_photo: fatherNidPath,
          status: 'pending'
        }])
        .select();

      if (error) throw error;

      const formNumber = data[0]?.form_number || generateFormNumber();
      setFormNumber(formNumber);

      if (formData.email) {
        await sendAutoReplyEmail(formData.email, formNumber, formData.studentName);
      }

      setIsSuccess(true);
      setIsSubmitting(false);

    } catch (err) {
      console.error('Submit Error:', err);
      setError(err.message || 'সাবমিট করতে সমস্যা');
      setIsSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // Upload File to Storage
  // =============================================
  const uploadFile = async (file, folder) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('private-admission-files')
      .upload(filePath, file);
    if (error) throw error;
    return data.path;
  };

  // =============================================
  // Render
  // =============================================
  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <FormSuccess 
        formNumber={formNumber}
        studentName={formData.studentName}
        onClose={onClose}
      />
    );
  }

  if (showPreview) {
    return (
      <FormPreview
        formData={formData}
        onBack={() => setShowPreview(false)}
        onConfirm={handleConfirmSubmit}
        loading={loading}
        isSubmitting={isSubmitting}
      />
    );
  }

  // =============================================
  // Main Form
  // =============================================
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>

        <div style={styles.header}>
          <span style={styles.headerIcon}>📝</span>
          <h2 style={styles.heading}>ভর্তি আবেদন ফরম</h2>
          <p style={styles.subHeading}>আপনার সন্তানের ভবিষ্যৎ শুরু হোক আজই</p>
        </div>

        <FormProgress progress={progress} />

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Student Name */}
          <div style={styles.field}>
            <label style={styles.label}>👤 ছাত্র/ছাত্রীর নাম <span style={{color: '#ef4444'}}>*</span></label>
            <input
              type="text"
              name="studentName"
              required
              placeholder="পূর্ণ নাম লিখুন"
              value={formData.studentName}
              onChange={handleInputChange}
              style={{ ...styles.input, borderColor: errors.studentName ? '#ef4444' : '#e2e8f0' }}
            />
            {errors.studentName && <span style={styles.errorText}>{errors.studentName}</span>}
          </div>

          {/* Class */}
          <div style={styles.field}>
            <label style={styles.label}>📚 কোন ক্লাসে ভর্তি? <span style={{color: '#ef4444'}}>*</span></label>
            <select
              name="classToAdmit"
              required
              value={formData.classToAdmit}
              onChange={handleInputChange}
              style={{ ...styles.select, borderColor: errors.classToAdmit ? '#ef4444' : '#e2e8f0' }}
            >
              <option value="">ক্লাস নির্বাচন করুন</option>
              <option value="প্লে">প্লে</option>
              <option value="১ম">১ম শ্রেণী</option>
              <option value="২য়">২য় শ্রেণী</option>
              <option value="৩য়">৩য় শ্রেণী</option>
              <option value="৪র্থ">৪র্থ শ্রেণী</option>
              <option value="৫ম">৫ম শ্রেণী</option>
            </select>
            {errors.classToAdmit && <span style={styles.errorText}>{errors.classToAdmit}</span>}
          </div>

          {/* =============================================
              📸 Photos with separate Camera + Gallery
              ============================================= */}
          
          {/* Student Photo */}
          <div style={styles.field}>
            <label style={styles.label}>📸 ছাত্র/ছাত্রীর ছবি <span style={{color: '#ef4444'}}>*</span></label>
            <div style={styles.fileWrapper}>
              {/* Camera Input */}
              <input
                type="file"
                ref={studentPhotoCamera}
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileCapture(e, 'studentPhoto')}
                style={styles.hiddenInput}
              />
              {/* Gallery Input */}
              <input
                type="file"
                ref={studentPhotoGallery}
                accept="image/*"
                onChange={(e) => handleFileCapture(e, 'studentPhoto')}
                style={styles.hiddenInput}
              />
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => studentPhotoCamera.current?.click()}
                  style={styles.cameraBtn}
                >
                  📷 ক্যামেরা
                </button>
                <button
                  type="button"
                  onClick={() => studentPhotoGallery.current?.click()}
                  style={styles.galleryBtn}
                >
                  🖼️ গ্যালারি
                </button>
              </div>
              <span style={styles.fileStatus}>
                {formData.studentPhoto ? '✅ নির্বাচিত' : 'ছবি নির্বাচন করুন'}
              </span>
            </div>
            {errors.studentPhoto && <span style={styles.errorText}>{errors.studentPhoto}</span>}
          </div>

          {/* Birth Certificate */}
          <div style={styles.field}>
            <label style={styles.label}>📄 জন্ম নিবন্ধন <span style={{color: '#ef4444'}}>*</span></label>
            <div style={styles.fileWrapper}>
              <input
                type="file"
                ref={birthCertCamera}
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileCapture(e, 'birthCertPhoto')}
                style={styles.hiddenInput}
              />
              <input
                type="file"
                ref={birthCertGallery}
                accept="image/*"
                onChange={(e) => handleFileCapture(e, 'birthCertPhoto')}
                style={styles.hiddenInput}
              />
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => birthCertCamera.current?.click()}
                  style={styles.cameraBtn}
                >
                  📷 ক্যামেরা
                </button>
                <button
                  type="button"
                  onClick={() => birthCertGallery.current?.click()}
                  style={styles.galleryBtn}
                >
                  🖼️ গ্যালারি
                </button>
              </div>
              <span style={styles.fileStatus}>
                {formData.birthCertPhoto ? '✅ নির্বাচিত' : 'ছবি নির্বাচন করুন'}
              </span>
            </div>
            {errors.birthCertPhoto && <span style={styles.errorText}>{errors.birthCertPhoto}</span>}
          </div>

          {/* Father NID */}
          <div style={styles.field}>
            <label style={styles.label}>🆔 বাবার NID <span style={{color: '#ef4444'}}>*</span></label>
            <div style={styles.fileWrapper}>
              <input
                type="file"
                ref={fatherNidCamera}
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileCapture(e, 'fatherNidPhoto')}
                style={styles.hiddenInput}
              />
              <input
                type="file"
                ref={fatherNidGallery}
                accept="image/*"
                onChange={(e) => handleFileCapture(e, 'fatherNidPhoto')}
                style={styles.hiddenInput}
              />
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => fatherNidCamera.current?.click()}
                  style={styles.cameraBtn}
                >
                  📷 ক্যামেরা
                </button>
                <button
                  type="button"
                  onClick={() => fatherNidGallery.current?.click()}
                  style={styles.galleryBtn}
                >
                  🖼️ গ্যালারি
                </button>
              </div>
              <span style={styles.fileStatus}>
                {formData.fatherNidPhoto ? '✅ নির্বাচিত' : 'NID কার্ড নির্বাচন করুন'}
              </span>
            </div>
            {errors.fatherNidPhoto && <span style={styles.errorText}>{errors.fatherNidPhoto}</span>}
          </div>

          {/* Father Name */}
          <div style={styles.field}>
            <label style={styles.label}>👨 বাবার নাম <span style={{color: '#ef4444'}}>*</span></label>
            <input
              type="text"
              name="fatherName"
              required
              placeholder="বাবার পূর্ণ নাম"
              value={formData.fatherName}
              onChange={handleInputChange}
              style={{ ...styles.input, borderColor: errors.fatherName ? '#ef4444' : '#e2e8f0' }}
            />
            {errors.fatherName && <span style={styles.errorText}>{errors.fatherName}</span>}
          </div>

          {/* Mother Name */}
          <div style={styles.field}>
            <label style={styles.label}>👩 মায়ের নাম <span style={{color: '#ef4444'}}>*</span></label>
            <input
              type="text"
              name="motherName"
              required
              placeholder="মায়ের পূর্ণ নাম"
              value={formData.motherName}
              onChange={handleInputChange}
              style={{ ...styles.input, borderColor: errors.motherName ? '#ef4444' : '#e2e8f0' }}
            />
            {errors.motherName && <span style={styles.errorText}>{errors.motherName}</span>}
          </div>

          {/* Phone */}
          <div style={styles.field}>
            <label style={styles.label}>📱 মোবাইল নাম্বার <span style={{color: '#ef4444'}}>*</span></label>
            <input
              type="tel"
              name="phone"
              required
              pattern="01[3-9]\d{8}"
              placeholder="01XXXXXXXXX"
              value={formData.phone}
              onChange={handleInputChange}
              style={{ ...styles.input, borderColor: errors.phone ? '#ef4444' : '#e2e8f0' }}
            />
            {errors.phone && <span style={styles.errorText}>{errors.phone}</span>}
          </div>

          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label}>📧 ইমেইল (ঐচ্ছিক)</label>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleInputChange}
              style={styles.input}
            />
          </div>

          {/* Captcha */}
          <Captcha onVerify={() => setCaptchaVerified(true)} />

          {/* Submit */}
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? '⏳ প্রস্তুত হচ্ছে...' : '🚀 আবেদন জমা দিন'}
          </button>

          <p style={styles.note}>
            ⚠️ আবেদন জমা দেওয়ার আগে সব তথ্য ভালো করে চেক করে নিন।
          </p>
        </form>
      </div>
    </div>
  );
}

// =============================================
// Styles
// =============================================
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
    padding: '28px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: '#f1f5f9',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  headerIcon: {
    fontSize: '40px',
    display: 'block',
    marginBottom: '4px'
  },
  heading: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 4px 0'
  },
  subHeading: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155'
  },
  input: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    transition: 'border 0.2s'
  },
  select: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff'
  },
  fileWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    borderRadius: '12px',
    border: '1.5px dashed #cbd5e1',
    backgroundColor: '#f8fafc'
  },
  hiddenInput: {
    display: 'none'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px'
  },
  cameraBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    border: 'none',
    padding: '10px 0',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
  },
  galleryBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    border: 'none',
    padding: '10px 0',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
  },
  fileStatus: {
    fontSize: '13px',
    color: '#64748b',
    textAlign: 'center',
    padding: '4px 0'
  },
  btn: {
    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    color: 'white',
    border: 'none',
    padding: '14px 20px',
    borderRadius: '14px',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(22,163,74,0.3)',
    transition: 'all 0.2s'
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    borderLeft: '4px solid #dc2626'
  },
  errorText: {
    fontSize: '12px',
    color: '#ef4444',
    marginTop: '2px'
  },
  note: {
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'center',
    margin: '4px 0 0 0'
  }
};
