import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';

export default function ProfilePage() {
  const { userProfile } = usePortal();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
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
    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMessage('❌ প্রোফাইল লোড করতে সমস্যা');
    }
    setLoading(false);
  };

  // =============================================
  // ✅ ছবি আপলোড ফাংশন
  // =============================================
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // ১. ছবি কম্প্রেস করুন
      const compressedFile = await compressImage(file);

      // ২. স্টোরেজে আপলোড
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `profile_${Date.now()}.${fileExt}`;
      const filePath = `student-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('private-admission-files')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      // ৩. পাবলিক URL পেতে
      const { data: urlData } = supabase.storage
        .from('private-admission-files')
        .getPublicUrl(filePath);

      // ৪. students টেবিল আপডেট
      const { error: updateError } = await supabase
        .from('students')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // ৫. লোকাল স্টেট আপডেট
      setProfile({ ...profile, photo_url: urlData.publicUrl });
      setSuccessMessage('✅ প্রোফাইল ছবি সফলভাবে পরিবর্তন করা হয়েছে!');
      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage('❌ ছবি আপলোড করতে সমস্যা: ' + error.message);
    }
    setUploading(false);
    e.target.value = '';
  };

  // =============================================
  // ✅ ছবি কম্প্রেস ফাংশন
  // =============================================
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const size = 400;
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

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>⏳ লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* হেডার */}
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>👤 আমার প্রোফাইল</h2>
        <button onClick={() => window.history.back()} style={styles.backBtn}>
          ⬅ ফিরে যান
        </button>
      </div>

      {/* পপআপ মেসেজ */}
      {successMessage && (
        <div style={styles.popupSuccess}>
          <span>✅</span>
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} style={styles.popupClose}>✕</button>
        </div>
      )}

      {errorMessage && (
        <div style={styles.popupError}>
          <span>⚠️</span>
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} style={styles.popupClose}>✕</button>
        </div>
      )}

      {/* প্রোফাইল কার্ড */}
      <div style={styles.profileCard}>
        {/* ছবি সেকশন */}
        <div style={styles.photoSection}>
          <div style={styles.photoWrapper}>
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt={profile.name} style={styles.profilePhoto} />
            ) : (
              <div style={styles.photoPlaceholder}>
                {profile?.name?.charAt(0) || '?'}
              </div>
            )}
            {/* এডিট বাটন */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={styles.editPhotoBtn}
              disabled={uploading}
              title="প্রোফাইল ছবি পরিবর্তন করুন"
            >
              ✏️
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoUpload}
              style={styles.hiddenInput}
            />
          </div>
          <p style={styles.photoHint}>
            {uploading ? '⏳ আপলোড হচ্ছে...' : 'প্রোফাইল ছবি পরিবর্তন করুন'}
          </p>
        </div>

        {/* তথ্য সেকশন */}
        <div style={styles.infoSection}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>👤 নাম</span>
            <span style={styles.infoValue}>{profile?.name}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>📚 ক্লাস</span>
            <span style={styles.infoValue}>{profile?.class_name || '—'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>🔢 রোল নম্বর</span>
            <span style={styles.infoValue}>{profile?.roll_number || '—'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>👨 বাবার নাম</span>
            <span style={styles.infoValue}>{profile?.father_name || '—'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>👩 মায়ের নাম</span>
            <span style={styles.infoValue}>{profile?.mother_name || '—'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>📍 গ্রাম</span>
            <span style={styles.infoValue}>{profile?.village || '—'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>📱 ফোন</span>
            <span style={styles.infoValue}>{profile?.phone || '—'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>📧 ইমেইল</span>
            <span style={styles.infoValue}>{profile?.email}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>📌 স্ট্যাটাস</span>
            <span style={{
              ...styles.statusBadge,
              background: profile?.is_approved ? '#dcfce7' : '#fef3c7',
              color: profile?.is_approved ? '#16a34a' : '#f59e0b',
            }}>
              {profile?.is_approved ? '✅ অনুমোদিত' : '⏳ Pending'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 16px',
    fontFamily: "'Hind Siliguri', sans-serif",
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px 0',
    color: '#64748b',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #16a34a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
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
  popupSuccess: {
    background: '#dcfce7',
    color: '#166534',
    padding: '12px 16px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    borderLeft: '4px solid #16a34a',
  },
  popupError: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    borderLeft: '4px solid #dc2626',
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
    borderRadius: '18px',
    padding: '28px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
  },
  photoSection: {
    textAlign: 'center',
    marginBottom: '24px',
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
    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
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
    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
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
    boxShadow: '0 4px 12px rgba(22,163,74,0.4)',
    transition: 'all 0.2s ease',
  },
  hiddenInput: {
    display: 'none',
  },
  photoHint: {
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '8px',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: '#f8fafc',
    borderRadius: '10px',
    borderBottom: '1px solid #f1f5f9',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#64748b',
    fontSize: '14px',
  },
  infoValue: {
    fontWeight: '500',
    color: '#0f172a',
    fontSize: '14px',
  },
  statusBadge: {
    padding: '2px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
