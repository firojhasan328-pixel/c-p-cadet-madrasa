import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';

export default function ProfilePage({ onBack }) {
  const { userProfile } = usePortal();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userProfile) {
      fetchProfile();
    }
  }, [userProfile]);

  // =============================================
  // ✅ প্রোফাইল ডেটা লোড
  // =============================================
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', userProfile.id)
        .single();

      if (error) throw error;
      
      console.log('✅ প্রোফাইল ডেটা:', data);
      console.log('📸 ছবির URL:', data?.photo_url);
      
      setProfile(data);
      setPreviewImage(data?.photo_url || null);
      
    } catch (error) {
      console.error('❌ প্রোফাইল লোড করতে সমস্যা:', error);
      setErrorMessage('❌ প্রোফাইল লোড করতে সমস্যা');
      setTimeout(() => setErrorMessage(''), 3000);
    }
    setLoading(false);
  };

  // =============================================
  // ✅ ছবি কম্প্রেস (200x200)
  // =============================================
  const compressImage = (file) => {
    return new Promise((resolve) => {
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
            resolve(compressedFile);
          }, 'image/jpeg', 0.7);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // =============================================
  // ✅ ছবি আপলোড (সঠিক সমাধান)
  // =============================================
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('❌ ফাইল সাইজ ৫MB এর বেশি!');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // ১. ছবি কম্প্রেস
      const compressedFile = await compressImage(file);

      // ২. প্রিভিউ দেখান
      const previewUrl = URL.createObjectURL(compressedFile);
      setPreviewImage(previewUrl);

      // ৩. ইউনিক ফাইল নাম
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `profile_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `student-profiles/${fileName}`;

      console.log('📤 আপলোড হচ্ছে:', filePath);

      // ৪. ✅ student-profiles bucket এ আপলোড (public bucket)
      const { error: uploadError } = await supabase.storage
        .from('student-profiles')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('❌ আপলোড এরর:', uploadError);
        throw new Error(uploadError.message);
      }

      // ৫. পাবলিক URL
      const { data: urlData } = supabase.storage
        .from('student-profiles')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('✅ পাবলিক URL:', publicUrl);

      // ৬. students টেবিল আপডেট
      const { error: updateError } = await supabase
        .from('students')
        .update({ photo_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) {
        console.error('❌ আপডেট এরর:', updateError);
        throw new Error(updateError.message);
      }

      // ৭. লোকাল স্টেট আপডেট
      setProfile({ ...profile, photo_url: publicUrl });
      setPreviewImage(publicUrl);
      
      setSuccessMessage('✅ প্রোফাইল ছবি সফলভাবে পরিবর্তন করা হয়েছে!');
      console.log('✅ ছবি আপডেট সম্পূর্ণ!');
      
      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (error) {
      console.error('❌ আপলোড সমস্যা:', error);
      setErrorMessage('❌ ছবি আপলোড করতে সমস্যা: ' + error.message);
      setPreviewImage(profile?.photo_url || null);
      setTimeout(() => setErrorMessage(''), 5000);
    }
    setUploading(false);
    e.target.value = '';
  };

  // =============================================
  // ✅ লোডিং
  // =============================================
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>⏳ লোড হচ্ছে...</p>
      </div>
    );
  }

  // =============================================
  // ✅ রেন্ডার
  // =============================================
  return (
    <div style={styles.container}>
      {/* হেডার */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>
          ⬅ ফিরে যান
        </button>
        <h2 style={styles.headerTitle}>👤 আমার প্রোফাইল</h2>
        <div style={styles.headerSpacer}></div>
      </div>

      {/* পপআপ মেসেজ */}
      {successMessage && (
        <div style={styles.popupSuccess}>
          <span style={styles.popupIcon}>✅</span>
          <span style={styles.popupText}>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} style={styles.popupClose}>✕</button>
        </div>
      )}

      {errorMessage && (
        <div style={styles.popupError}>
          <span style={styles.popupIcon}>⚠️</span>
          <span style={styles.popupText}>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} style={styles.popupClose}>✕</button>
        </div>
      )}

      {/* প্রোফাইল কার্ড */}
      <div style={styles.profileCard}>
        {/* ছবি সেকশন */}
        <div style={styles.photoSection}>
          <div style={styles.photoWrapper}>
            {previewImage ? (
              <img 
                src={previewImage} 
                alt={profile?.name} 
                style={styles.profilePhoto}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.querySelector('.placeholder-fallback').style.display = 'flex';
                }}
              />
            ) : null}
            
            <div 
              className="placeholder-fallback"
              style={{
                ...styles.photoPlaceholder,
                display: previewImage ? 'none' : 'flex',
              }}
            >
              {profile?.name?.charAt(0) || '?'}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              style={styles.editPhotoBtn}
              disabled={uploading}
              title="প্রোফাইল ছবি পরিবর্তন করুন"
            >
              {uploading ? '⏳' : '✏️'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoUpload}
              style={styles.hiddenInput}
              disabled={uploading}
            />
          </div>
          <p style={styles.photoHint}>
            {uploading ? '⏳ আপলোড হচ্ছে...' : '✏️ ছবি পরিবর্তন করতে ক্লিক করুন'}
          </p>
        </div>

        {/* নাম ও ক্লাস */}
        <div style={styles.nameSection}>
          <h2 style={styles.studentName}>{profile?.name}</h2>
          <div style={styles.badgeContainer}>
            <span style={styles.classBadge}>📚 {profile?.class_name || '—'}</span>
            <span style={styles.rollBadge}>🔢 রোল: {profile?.roll_number || '—'}</span>
            <span style={{
              ...styles.statusBadge,
              background: profile?.is_approved ? '#dcfce7' : '#fef3c7',
              color: profile?.is_approved ? '#16a34a' : '#f59e0b',
            }}>
              {profile?.is_approved ? '✅ অনুমোদিত' : '⏳ Pending'}
            </span>
          </div>
        </div>

        <div style={styles.divider}></div>

        {/* তথ্য সেকশন */}
        <div style={styles.infoSection}>
          <h3 style={styles.infoTitle}>📋 ব্যক্তিগত তথ্য</h3>
          
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>👤 নাম</span>
              <span style={styles.infoValue}>{profile?.name}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>📚 ক্লাস</span>
              <span style={styles.infoValue}>{profile?.class_name || '—'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>🔢 রোল নম্বর</span>
              <span style={styles.infoValue}>{profile?.roll_number || '—'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>👨 বাবার নাম</span>
              <span style={styles.infoValue}>{profile?.father_name || '—'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>👩 মায়ের নাম</span>
              <span style={styles.infoValue}>{profile?.mother_name || '—'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>📍 গ্রাম</span>
              <span style={styles.infoValue}>{profile?.village || '—'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>📱 ফোন</span>
              <span style={styles.infoValue}>{profile?.phone || '—'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>📧 ইমেইল</span>
              <span style={styles.infoValue}>{profile?.email}</span>
            </div>
          </div>
        </div>

        <div style={styles.footerNote}>
          <p style={styles.noteText}>
            💡 <strong>শুধুমাত্র প্রোফাইল ছবি পরিবর্তন করা যাবে।</strong> অন্যান্য তথ্য পরিবর্তনের জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================
// 🎨 প্রিমিয়াম স্টাইল
// =============================================
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 16px 40px 16px',
    fontFamily: "'Hind Siliguri', sans-serif",
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #16a34a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '16px',
    fontWeight: '500',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingTop: '12px',
  },
  backBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#64748b',
    transition: 'all 0.2s ease',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  headerSpacer: {
    width: '80px',
  },
  popupSuccess: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
    color: '#166534',
    padding: '16px 24px',
    borderRadius: '14px',
    boxShadow: '0 10px 30px rgba(22, 163, 74, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    animation: 'slideIn 0.5s ease',
    border: '1px solid #86efac',
    maxWidth: '400px',
  },
  popupError: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
    color: '#991b1b',
    padding: '16px 24px',
    borderRadius: '14px',
    boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    animation: 'slideIn 0.5s ease',
    border: '1px solid #fca5a5',
    maxWidth: '400px',
  },
  popupIcon: { fontSize: '24px' },
  popupText: { fontSize: '15px', fontWeight: '600', flex: 1 },
  popupClose: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
  },
  profileCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '32px 24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
  photoSection: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  photoWrapper: {
    position: 'relative',
    display: 'inline-block',
  },
  profilePhoto: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #16a34a',
    boxShadow: '0 8px 24px rgba(22, 163, 74, 0.25)',
    transition: 'all 0.3s ease',
  },
  photoPlaceholder: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    fontWeight: '700',
    border: '4px solid #16a34a',
    boxShadow: '0 8px 24px rgba(22, 163, 74, 0.25)',
  },
  editPhotoBtn: {
    position: 'absolute',
    bottom: '4px',
    right: '4px',
    background: '#16a34a',
    color: 'white',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    fontSize: '18px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: {
    display: 'none',
  },
  photoHint: {
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '10px',
    fontWeight: '500',
  },
  nameSection: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  studentName: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 10px 0',
  },
  badgeContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  classBadge: {
    background: '#dbeafe',
    color: '#2563eb',
    padding: '4px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  rollBadge: {
    background: '#f1f5f9',
    color: '#64748b',
    padding: '4px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  statusBadge: {
    padding: '4px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  divider: {
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)',
    margin: '16px 0 20px 0',
  },
  infoSection: {
    marginTop: '4px',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 16px 0',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '10px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '10px 14px',
    background: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #f1f5f9',
  },
  infoLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
  },
  footerNote: {
    marginTop: '20px',
    padding: '12px 16px',
    background: '#fef3c7',
    borderRadius: '10px',
    borderLeft: '4px solid #f59e0b',
  },
  noteText: {
    fontSize: '13px',
    color: '#92400e',
    margin: 0,
    lineHeight: '1.5',
  },
};

// অ্যানিমেশন
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(styleSheet);
