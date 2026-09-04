import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { generateOTP, saveOTP, verifyOTP, sendOTPEmail } from '../utils/otpService';

export default function TeacherSignUp({ onBack, onClose }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    designation: '',
    subject: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    photo: null,
    otp: '',
    registrationCode: '', // ✅ ইউনিক কোড ফিল্ড
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeMessage, setCodeMessage] = useState('');
  const [codeErrorMessage, setCodeErrorMessage] = useState('');
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
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);
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

  // =============================================
  // ✅ ১. কোড যাচাই ফাংশন (শিক্ষক)
  // =============================================
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setCodeErrorMessage('');
    setCodeMessage('');
    setLoading(true);

    const code = formData.registrationCode.trim().toUpperCase();

    if (!code) {
      setCodeErrorMessage('❌ দয়া করে একটি কোড দিন');
      setLoading(false);
      return;
    }

    if (code.length < 6) {
      setCodeErrorMessage('❌ কোডটি কমপক্ষে ৬ অক্ষরের হতে হবে');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Searching for teacher code:', code);

      // ✅ role = 'teacher' চেক সহ
      const { data, error } = await supabase
        .from('registration_codes')
        .select('*')
        .eq('code', code)
        .eq('role', 'teacher') // ✅ শিক্ষকের কোড চেক
        .maybeSingle();

      console.log('📦 Data:', data);

      if (error) {
        console.error('❌ Database error:', error);
        setCodeErrorMessage('❌ ডেটাবেজ সমস্যা: ' + error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setCodeErrorMessage('❌ এই কোডটি সঠিক নয়। দয়া করে সঠিক শিক্ষক কোড দিন।');
        setLoading(false);
        return;
      }

      if (data.is_used) {
        setCodeErrorMessage('❌ এই কোডটি ইতিমধ্যে ব্যবহার করা হয়েছে।');
        setLoading(false);
        return;
      }

      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      if (now > expiresAt) {
        setCodeErrorMessage('⏰ এই কোডের মেয়াদ শেষ হয়ে গেছে।');
        setLoading(false);
        return;
      }

      setCodeVerified(true);
      setCodeMessage('✅ কোডটি সঠিক! এখন আপনার তথ্য দিন এবং OTP পান।');
      alert('✅ আপনার শিক্ষক কোডটি সঠিক! এখন ফর্ম পূরণ করে OTP নিন।');
      setStep(2);

    } catch (err) {
      console.error('❌ Code verification error:', err);
      setCodeErrorMessage('❌ কোড যাচাই করতে সমস্যা: ' + err.message);
    }
    setLoading(false);
  };

  // =============================================
  // ✅ ২. OTP পাঠান (শিক্ষক)
  // =============================================
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name || !formData.gender || !formData.designation || 
        !formData.subject || !formData.phone || !formData.email) {
      setError('❌ সব ঘর পূরণ করুন');
      setLoading(false);
      return;
    }

    if (formData.phone.length !== 11) {
      setError('❌ ১১ ডিজিটের মোবাইল নাম্বার দিন');
      setLoading(false);
      return;
    }

    if (!formData.photo) {
      setError('❌ ছবি আপলোড করুন');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('❌ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('❌ পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না');
      setLoading(false);
      return;
    }

    try {
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

      const otp = generateOTP();
      await saveOTP(formData.email, otp);
      
      const emailResult = await sendOTPEmail(formData.email, otp);
      
      if (!emailResult.success) {
        setError('OTP পাঠাতে সমস্যা: ' + (emailResult.error || 'অজানা সমস্যা'));
        setLoading(false);
        return;
      }

      setStep(3);

    } catch (err) {
      setError(err.message || 'OTP পাঠাতে সমস্যা');
    }
    setLoading(false);
  };

  // =============================================
  // ✅ ৩. OTP ভেরিফাই ও রেজিস্ট্রেশন (শিক্ষক)
  // =============================================
  const handleVerifyAndSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyOTP(formData.email, formData.otp);
      
      if (!result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: 'teacher'
          }
        }
      });

      if (authError) {
        setError('অথেন্টিকেশন সমস্যা: ' + authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('ইউজার তৈরি করতে সমস্যা হয়েছে');
        setLoading(false);
        return;
      }

      const photoPath = await uploadPhoto();

      const { error: insertError } = await supabase
        .from('teachers')
        .insert([{
          id: authData.user.id,
          name: formData.name,
          gender: formData.gender,
          designation: formData.designation,
          subject: formData.subject,
          phone: formData.phone.trim(),
          email: formData.email.toLowerCase().trim(),
          photo_url: photoPath,
          is_verified: true,
          is_approved: false,
        }]);

      if (insertError) {
        console.error('Insert Error:', insertError);
        if (insertError.code === '23505') {
          setError('❌ এই ইমেইল বা ফোন নাম্বারটি ইতিমধ্যে ব্যবহার করা হয়েছে।');
        } else {
          setError('ডেটা জমা দিতে সমস্যা: ' + insertError.message);
        }
        setLoading(false);
        return;
      }

      // ✅ registration_requests টেবিলে রেকর্ড (role = 'teacher')
      try {
        await supabase
          .from('registration_requests')
          .insert([{
            code: formData.registrationCode.trim().toUpperCase(),
            student_name: formData.name,
            phone: formData.phone || '',
            email: formData.email.toLowerCase().trim(),
            class_name: '—', // শিক্ষকের জন্য ক্লাস নেই
            role: 'teacher', // ✅ role যোগ করুন
            status: 'pending',
            otp_verified: true,
            otp_sent_at: new Date().toISOString(),
          }]);
        console.log('✅ Teacher registration request saved!');
      } catch (reqError) {
        console.error('⚠️ Registration request save error:', reqError);
      }

      // ✅ registration_codes আপডেট
      try {
        await supabase
          .from('registration_codes')
          .update({
            is_used: true,
            used_by: formData.email.toLowerCase().trim(),
            used_at: new Date().toISOString(),
          })
          .eq('code', formData.registrationCode.trim().toUpperCase());
        console.log('✅ Teacher code marked as used!');
      } catch (codeError) {
        console.error('⚠️ Code update error:', codeError);
      }

      // ✅ লগ তৈরি
      try {
        await supabase
          .from('registration_logs')
          .insert([{
            code: formData.registrationCode.trim().toUpperCase(),
            action: 'teacher_verified',
            email: formData.email.toLowerCase().trim(),
          }]);
        console.log('✅ Log created!');
      } catch (logError) {
        console.error('⚠️ Log error:', logError);
      }

      setStep(4);
      setSuccess(true);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'সাবমিট করতে সমস্যা');
    }
    setLoading(false);
  };

  // =============================================
  // ✅ রেন্ডার: স্টেপ ১ - কোড যাচাই
  // =============================================
  if (step === 1) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.headerIcon}>👨‍🏫</span>
          <h2 style={styles.heading}>শিক্ষক রেজিস্ট্রেশন কোড যাচাই</h2>
          <p style={styles.subHeading}>
            আপনার প্রাপ্ত ইউনিক কোডটি দিন। 
            <br />
            <small style={styles.smallText}>কোডটি ৬-৮ অক্ষরের হতে পারে</small>
          </p>
        </div>

        {codeErrorMessage && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>⚠️</span>
            <span>{codeErrorMessage}</span>
          </div>
        )}

        {codeMessage && (
          <div style={styles.successBox}>
            <span style={styles.successIcon}>✅</span>
            <span>{codeMessage}</span>
          </div>
        )}

        <form onSubmit={handleVerifyCode} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>🔢 কোড দিন <span style={{color: '#ef4444'}}>*</span></label>
            <input
              type="text"
              name="registrationCode"
              value={formData.registrationCode}
              onChange={handleInputChange}
              placeholder="যেমন: TCHR2026"
              style={styles.codeInput}
              autoFocus
              disabled={codeVerified}
            />
            <small style={styles.hintText}>
              💡 আপনার অ্যাডমিনের কাছ থেকে প্রাপ্ত কোডটি দিন
            </small>
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={onBack} style={styles.backBtn}>
              ⬅ পিছনে
            </button>
            <button
              type="submit"
              disabled={loading || codeVerified}
              style={{
                ...styles.verifyBtn,
                opacity: (loading || codeVerified) ? 0.6 : 1,
              }}
            >
              {loading ? '⏳ যাচাই করছি...' : codeVerified ? '✅ যাচাইকৃত' : '✅ কোড যাচাই করুন'}
            </button>
          </div>

          {codeVerified && (
            <div style={styles.verifiedNotice}>
              <span style={styles.verifiedIcon}>✅</span>
              <span>কোড সঠিক! এখন আপনার তথ্য দিন এবং OTP পান।</span>
            </div>
          )}
        </form>
      </div>
    );
  }

  // =============================================
  // ✅ রেন্ডার: স্টেপ ২ - ফর্ম + OTP পাঠান
  // =============================================
  if (step === 2) {
    return (
      <form onSubmit={handleSendOTP} style={styles.form}>
        <div style={styles.header}>
          <span style={styles.headerIcon}>👨‍🏫</span>
          <h2 style={styles.heading}>শিক্ষক নিবন্ধন</h2>
          <p style={styles.subHeading}>আপনার তথ্য দিয়ে ফরম পূরণ করুন</p>
          <div style={styles.codeVerifiedBadge}>
            <span>✅ কোড যাচাইকৃত: </span>
            <strong>{formData.registrationCode}</strong>
          </div>
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

        <div style={styles.field}>
          <label style={styles.label}>🔑 পাসওয়ার্ড <span style={{color: '#ef4444'}}>*</span></label>
          <input type="password" name="password" required placeholder="কমপক্ষে ৬ অক্ষর" value={formData.password} onChange={handleInputChange} style={styles.input} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>🔑 কনফার্ম পাসওয়ার্ড <span style={{color: '#ef4444'}}>*</span></label>
          <input type="password" name="confirmPassword" required placeholder="আবার পাসওয়ার্ড দিন" value={formData.confirmPassword} onChange={handleInputChange} style={styles.input} />
        </div>

        <div style={styles.buttonGroup}>
          <button type="button" onClick={() => setStep(1)} style={styles.backBtn}>
            ⬅ পিছনে
          </button>
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? '⏳ OTP পাঠাচ্ছি...' : '📧 OTP পাঠান'}
          </button>
        </div>
      </form>
    );
  }

  // =============================================
  // ✅ রেন্ডার: স্টেপ ৩ - OTP ভেরিফিকেশন
  // =============================================
  if (step === 3) {
    return (
      <div style={styles.otpContainer}>
        <div style={styles.otpIcon}>📱</div>
        <h2 style={styles.otpHeading}>ইমেইল ভেরিফিকেশন</h2>
        <p style={styles.otpText}>
          আপনার ইমেইলে ৬ ডিজিটের কোড পাঠানো হয়েছে
          <br />
          <small style={styles.otpSmall}>📧 {formData.email}</small>
        </p>
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
            <button type="button" onClick={() => setStep(2)} style={styles.otpBackBtn}>
              ⬅ পিছনে
            </button>
            <button type="submit" disabled={loading} style={styles.otpBtn}>
              {loading ? '⏳ ভেরিফাই করছি...' : '✅ নিশ্চিত করুন'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // =============================================
  // ✅ রেন্ডার: স্টেপ ৪ - সাফল্য
  // =============================================
  if (step === 4 && success) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successIcon}>🎉</div>
        <h2 style={styles.successHeading}>আবেদন সফলভাবে জমা হয়েছে!</h2>
        <div style={styles.successMessageBox}>
          <p style={styles.successText}>
            আপনার শিক্ষক রেজিস্ট্রেশন রিকোয়েস্ট <strong>প্রধান শিক্ষকের কাছে</strong> গিয়েছে।
          </p>
          <p style={styles.successSubText}>
            ⏳ অনুমোদনের জন্য অপেক্ষা করুন। অনুমোদন পাওয়ার পর আপনি লগইন করতে পারবেন।
          </p>
          <div style={styles.successBadge}>
            <span>📩 অনুরোধ স্ট্যাটাস: </span>
            <span style={styles.pendingBadge}>⏳ pending</span>
          </div>
        </div>
        <div style={styles.successNote}>
          <p style={styles.noteText}>
            💡 অনুমোদন পেতে ২৪-৪৮ ঘন্টা সময় লাগতে পারে।
            <br />
            আপনার ইমেইল চেক করুন এবং প্রধান শিক্ষকের সাথে যোগাযোগ রাখুন।
          </p>
        </div>
        <button onClick={onClose} style={styles.successBtn}>
          ✅ বুঝতে পেরেছি
        </button>
      </div>
    );
  }

  return null;
}

// =============================================
// 🎨 স্টাইলসমূহ (StudentSignUp এর সাথে একই)
// =============================================
const styles = {
  container: {
    padding: '10px 0',
    fontFamily: "'Hind Siliguri', sans-serif",
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  headerIcon: {
    fontSize: '42px',
    display: 'block',
    marginBottom: '4px',
  },
  heading: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 4px 0',
  },
  subHeading: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0',
    lineHeight: '1.5',
  },
  smallText: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  codeInput: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '4px',
    textAlign: 'center',
    outline: 'none',
    backgroundColor: '#ffffff',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
  },
  hintText: {
    display: 'block',
    color: '#94a3b8',
    fontSize: '12px',
    marginTop: '6px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
  },
  select: {
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
  },
  fileWrapper: {
    position: 'relative',
    borderRadius: '12px',
    border: '1.5px dashed #cbd5e1',
    padding: '10px 14px',
    backgroundColor: '#f8fafc',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
  },
  fileInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
  },
  filePlaceholder: {
    fontSize: '13px',
    color: '#64748b',
    pointerEvents: 'none',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '4px',
  },
  backBtn: {
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    padding: '12px',
    borderRadius: '12px',
    flex: 1,
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  verifyBtn: {
    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '12px',
    flex: 2,
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '14px',
    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
    transition: 'all 0.2s ease',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '12px',
    flex: 2,
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '14px',
    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
    transition: 'all 0.2s ease',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    borderLeft: '4px solid #dc2626',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  errorIcon: { fontSize: '18px' },
  successBox: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    borderLeft: '4px solid #16a34a',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  successIcon: { fontSize: '18px' },
  verifiedNotice: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    borderLeft: '4px solid #16a34a',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
  },
  verifiedIcon: { fontSize: '18px' },
  codeVerifiedBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginTop: '8px',
    display: 'inline-block',
  },
  otpContainer: {
    textAlign: 'center',
    padding: '20px 0',
  },
  otpIcon: {
    fontSize: '48px',
    marginBottom: '8px',
  },
  otpHeading: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 4px 0',
  },
  otpText: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '16px',
    lineHeight: '1.6',
  },
  otpSmall: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  otpForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
  },
  otpInput: {
    width: '200px',
    textAlign: 'center',
    padding: '14px',
    fontSize: '28px',
    letterSpacing: '10px',
    border: '2px solid #e2e8f0',
    borderRadius: '16px',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#f8fafc',
  },
  otpButtonGroup: {
    display: 'flex',
    gap: '10px',
    width: '100%',
    maxWidth: '300px',
  },
  otpBackBtn: {
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    padding: '12px',
    borderRadius: '12px',
    flex: 1,
    cursor: 'pointer',
    fontWeight: '600',
  },
  otpBtn: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '12px',
    flex: 2,
    cursor: 'pointer',
    fontWeight: '700',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
  },
  successContainer: {
    textAlign: 'center',
    padding: '20px 10px',
  },
  successIcon: {
    fontSize: '56px',
    marginBottom: '12px',
  },
  successHeading: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 16px 0',
  },
  successMessageBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid #e2e8f0',
  },
  successText: {
    fontSize: '15px',
    color: '#0f172a',
    margin: '0 0 8px 0',
    lineHeight: '1.6',
  },
  successSubText: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 12px 0',
  },
  successBadge: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#0f172a',
  },
  pendingBadge: {
    background: '#fef3c7',
    color: '#f59e0b',
    padding: '4px 14px',
    borderRadius: '20px',
    fontWeight: '600',
    fontSize: '13px',
  },
  successNote: {
    backgroundColor: '#fef3c7',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '20px',
    borderLeft: '4px solid #f59e0b',
  },
  noteText: {
    fontSize: '13px',
    color: '#92400e',
    margin: 0,
    lineHeight: '1.6',
  },
  successBtn: {
    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 40px',
    borderRadius: '14px',
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(22, 163, 74, 0.3)',
    transition: 'all 0.2s ease',
  },
};
