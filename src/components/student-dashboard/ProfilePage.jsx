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

  // =============================================
  // প্রোফাইল ডেটা লোড
  // =============================================
  useEffect(() => {
    if (userProfile) {
      fetchProfile();
    }
  }, [userProfile]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', userProfile.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setPreviewImage(data?.photo_url || null);
    } catch (error) {
      console.error('❌ প্রোফাইল লোড করতে সমস্যা:', error);
    }
    setLoading(false);
  };

  // =============================================
  // ছবি কম্প্রেস (200x200)
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
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.7);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // =============================================
  // ✅ ছবি আপলোড (profile_images Bucket)
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
      const filePath = `profile_images/${fileName}`;

      console.log('📤 আপলোড হচ্ছে:', filePath);

      // ৪. ✅ profile_images Bucket এ আপলোড (Public Bucket)
      const { error: uploadError } = await supabase.storage
        .from('profile_images')  // ✅ নতুন Bucket নাম
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
        .from('profile_images')
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
      
      setSuccessMessage('✅ প্রোফাইল ছবি পরিবর্তন করা হয়েছে!');
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
  // লোডিং
  // =============================================
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>⏳ লোড হচ্ছে...</p>
      </div>
    );
  }

  // =============================================
  // রেন্ডার
  // =============================================
  return (
    <div style={styles.container}>
      {/* হেডার */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>⬅ ফিরে যান</button>
        <h2 style={styles.headerTitle}>👤 আমার প্রোফাইল</h2>
      </div>

      {/* মেসেজ */}
      {successMessage && (
        <div style={styles.popupSuccess}>
          <span>✅</span> {successMessage}
          <button onClick={() => setSuccessMessage('')} style={styles.popupClose}>✕</button>
        </div>
      )}
      {errorMessage && (
        <div style={styles.popupError}>
          <span>⚠️</span> {errorMessage}
          <button onClick={() => setErrorMessage('')} style={styles.popupClose}>✕</button>
        </div>
      )}

      {/* প্রোফাইল কার্ড */}
      <div style={styles.profileCard}>
        {/* ছবি */}
        <div style={styles.photoSection}>
          <div style={styles.photoWrapper}>
            {previewImage ? (
              <img src={previewImage} alt={profile?.name} style={styles.profilePhoto} />
            ) : (
              <div style={styles.photoPlaceholder}>
                {profile?.name?.charAt(0) || '?'}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={styles.editPhotoBtn}
              disabled={uploading}
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

        {/* নাম */}
        <h2 style={styles.studentName}>{profile?.name}</h2>

        {/* ব্যাজ */}
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

        <div style={styles.divider}></div>

        {/* তথ্য */}
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
            <span style={styles.infoLabel}>🔢 রোল</span>
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

        <div style={styles.footerNote}>
          <p>💡 <strong>শুধুমাত্র প্রোফাইল ছবি পরিবর্তন করা যাবে।</strong></p>
        </div>
      </div>
    </div>
  );
}

// =============================================
// স্টাইল
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
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  popupSuccess: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    background: '#dcfce7',
    color: '#166534',
    padding: '12px 20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid #86efac',
    maxWidth: '400px',
  },
  popupError: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    background: '#fee2e2',
    color: '#991b1b',
    padding: '12px 20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid #fca5a5',
    maxWidth: '400px',
  },
  popupClose: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    marginLeft: 'auto',
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
    marginBottom: '16px',
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
  studentName: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    margin: '0 0 10px 0',
  },
  badgeContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '16px',
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
    textAlign: 'center',
  },
};

// অ্যানিমেশন
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
