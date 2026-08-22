import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function AdvancedCMS() {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [contents, setContents] = useState({});

  // সব কন্টেন্টের ফিল্ড ডিফাইন
  const sections = {
    home: {
      label: '🏠 হোম পেজ',
      fields: [
        { key: 'home_heading', label: 'হোম হেডিং', type: 'text', default: 'সুশিক্ষা ও সুন্নাত ভিত্তিক আদর্শ জীবন গড়ার বিশ্বস্ত প্রতিষ্ঠান' },
        { key: 'home_subheading', label: 'হোম সাবহেডিং', type: 'textarea', default: 'আমরা দিচ্ছি আধুনিক ক্বওমী ও জেনারেল শিক্ষা ব্যবস্থার এক অনন্য সমন্বয়।' },
        { key: 'home_badge', label: 'ব্যাজ টেক্সট', type: 'text', default: '🎓 নতুন সেশনে ভর্তি চলছে' },
        { key: 'home_btn_text', label: 'ভর্তি বাটন টেক্সট', type: 'text', default: 'ভর্তি আবেদন করুন' }
      ]
    },
    principal: {
      label: '👨‍🏫 প্রধান শিক্ষক',
      fields: [
        { key: 'principal_name', label: 'নাম', type: 'text', default: 'আরিফ আশহাব খোরশেদ' },
        { key: 'principal_designation', label: 'পদবী', type: 'text', default: 'প্রধান শিক্ষক ও পরিচালক' },
        { key: 'principal_message', label: 'বার্তা', type: 'textarea', default: 'বিসমিল্লাহির রহমানির রহিম। চিলমারী প্রি ক্যাডেট মাদ্রাসায় আপনাকে জানাই আন্তরিক শুভেচ্ছা। আমাদের লক্ষ্য হলো কোমলমতি শিশুদের ধর্মীয় মূল্যবোধ, উত্তম চরিত্র এবং আধুনিক শিক্ষার মাধ্যমে এক আদর্শ নাগরিক হিসেবে গড়ে তোলা।' },
        { key: 'principal_image', label: 'ছবি URL', type: 'text', default: 'https://i.postimg.cc/xd8py0DW/1786523361131.jpg' }
      ]
    },
    teachers: {
      label: '👨‍🏫 শিক্ষক',
      fields: [
        { key: 'teachers_title', label: 'পেজ টাইটেল', type: 'text', default: 'শিক্ষক-শিক্ষিকাবৃন্দ' },
        { key: 'teachers_subtitle', label: 'পেজ সাবটাইটেল', type: 'text', default: 'সম্মানিত শিক্ষক মণ্ডলী' }
      ]
    },
    students: {
      label: '🎓 ছাত্র',
      fields: [
        { key: 'students_title', label: 'পেজ টাইটেল', type: 'text', default: 'ছাত্র-ছাত্রী' },
        { key: 'students_subtitle', label: 'পেজ সাবটাইটেল', type: 'text', default: 'মেধাবী মুখসমূহ' },
        { key: 'students_male', label: 'মোট ছাত্র সংখ্যা', type: 'text', default: '২৫০' },
        { key: 'students_female', label: 'মোট ছাত্রী সংখ্যা', type: 'text', default: '২২০' }
      ]
    },
    notice: {
      label: '📌 নোটিশ',
      fields: [
        { key: 'notice_title', label: 'টাইটেল', type: 'text', default: '📌 নোটিশ বোর্ড' },
        { key: 'notice_text', label: 'নোটিশ টেক্সট', type: 'textarea', default: 'আগামী ১ জানুয়ারি থেকে ২০২৬-২৭ শিক্ষাবর্ষের নতুন ভর্তি ফরম পাওয়া যাচ্ছে।' }
      ]
    },
    gallery: {
      label: '🖼️ গ্যালারি',
      fields: [
        { key: 'gallery_title', label: 'টাইটেল', type: 'text', default: '📸 গ্যালারি' }
      ]
    },
    admission: {
      label: '📝 ভর্তি',
      fields: [
        { key: 'admission_title', label: 'টাইটেল', type: 'text', default: 'অনলাইন ভর্তি আবেদন' },
        { key: 'admission_subtitle', label: 'সাবটাইটেল', type: 'text', default: 'সহজ নিয়ম' },
        { key: 'admission_desc', label: 'বিবরণ', type: 'textarea', default: 'আপনার সন্তানের ভর্তি নিশ্চিত করতে ফরম পূরণ করুন' },
        { key: 'admission_btn', label: 'বাটন টেক্সট', type: 'text', default: '🎓 ভর্তি আবেদন করুন' },
        { key: 'admission_closed', label: 'ভর্তি বন্ধের বার্তা', type: 'textarea', default: 'পর্যাপ্ত পরিমাণ ছাত্র-ছাত্রী বুকিং হওয়ায় আর কোনো সিট খালি নাই।' }
      ]
    },
    contact: {
      label: '📞 যোগাযোগ',
      fields: [
        { key: 'contact_phone', label: 'ফোন', type: 'text', default: '+৮৮০১৫২১-৫৫৩০০৩' },
        { key: 'contact_email', label: 'ইমেইল', type: 'text', default: 'info@chilmari-madrasa.com' },
        { key: 'contact_address', label: 'ঠিকানা', type: 'text', default: 'চিলমারী, কুড়িগ্রাম, বাংলাদেশ' },
        { key: 'contact_facebook', label: 'Facebook URL', type: 'text', default: 'https://www.facebook.com/' },
        { key: 'contact_whatsapp', label: 'WhatsApp', type: 'text', default: '৮৮০১৯১৮৫৬৮৩১৩' }
      ]
    },
    footer: {
      label: '📋 ফুটার',
      fields: [
        { key: 'footer_copyright', label: 'কপিরাইট', type: 'text', default: '© ২০২৪ চিলমারী প্রি ক্যাডেট মাদ্রাসা' },
        { key: 'footer_address', label: 'ঠিকানা', type: 'text', default: '📍 চিলমারী, কুড়িগ্রাম, বাংলাদেশ' },
        { key: 'footer_designer', label: 'ডিজাইনার নাম', type: 'text', default: 'মোঃ ফিরোজ হাসান' }
      ]
    },
    settings: {
      label: '⚙️ সেটিংস',
      fields: [
        { key: 'site_name', label: 'সাইটের নাম', type: 'text', default: 'চিলমারী প্রি ক্যাডেট মাদ্রাসা' },
        { key: 'site_tagline', label: 'ট্যাগলাইন', type: 'text', default: 'দ্বীন ও আধুনিক শিক্ষার অপূর্ব মেলবন্ধন' },
        { key: 'site_meta', label: 'Meta Description', type: 'textarea', default: 'চিলমারী প্রি ক্যাডেট মাদ্রাসা - দ্বীন ও আধুনিক শিক্ষা' }
      ]
    }
  };

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('site_contents').select('*');
      if (error) throw error;

      const contentMap = {};
      data?.forEach(item => {
        contentMap[item.key] = item.value;
      });
      setContents(contentMap);
    } catch (err) {
      setError('কন্টেন্ট লোড করতে সমস্যা: ' + err.message);
    }
    setLoading(false);
  };

  const handleSave = async (key, value) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_contents')
        .upsert({ key, value });

      if (error) throw error;

      setContents(prev => ({ ...prev, [key]: value }));
      setSuccess('✅ ' + key + ' আপডেট করা হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('❌ আপডেট করতে সমস্যা: ' + err.message);
      setTimeout(() => setError(''), 3000);
    }
    setSaving(false);
  };

  const getValue = (key) => {
    return contents[key] || '';
  };

  const canEdit = isSuperAdmin || (isAdmin && user?.permissions?.includes('cms.edit'));

  if (!canEdit) {
    return (
      <div style={styles.accessDenied}>
        <div style={styles.accessDeniedIcon}>🚫</div>
        <h2>অ্যাক্সেস অস্বীকৃত!</h2>
        <p>আপনার CMS এডিট করার অনুমতি নেই।</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📝 কন্টেন্ট ম্যানেজমেন্ট সিস্টেম</h2>
          <p style={styles.subtitle}>ওয়েবসাইটের সব কন্টেন্ট লাইভ এডিট করুন</p>
        </div>
        <button onClick={loadContents} style={styles.refreshBtn}>
          🔄 রিফ্রেশ
        </button>
      </div>

      {success && <div style={styles.successBox}>{success}</div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.tabs}>
        {Object.keys(sections).map(key => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              ...styles.tab,
              background: activeTab === key ? '#16a34a' : 'transparent',
              color: activeTab === key ? 'white' : '#334155'
            }}
          >
            {sections[key].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.loading}>⏳ লোড হচ্ছে...</div>
      ) : (
        <div style={styles.editor}>
          <h3 style={styles.sectionTitle}>{sections[activeTab]?.label}</h3>
          
          {sections[activeTab]?.fields.map((field) => {
            const value = getValue(field.key) || field.default || '';
            
            return (
              <div key={field.key} style={styles.fieldGroup}>
                <label style={styles.label}>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={value}
                    onChange={(e) => handleSave(field.key, e.target.value)}
                    style={styles.textarea}
                    rows={3}
                    disabled={saving}
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleSave(field.key, e.target.value)}
                    style={styles.input}
                    disabled={saving}
                  />
                )}
                <div style={styles.fieldMeta}>
                  <span style={styles.fieldKey}>Key: {field.key}</span>
                  {saving && <span style={styles.savingText}>⏳ সেভ হচ্ছে...</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px 16px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0'
  },
  refreshBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155'
  },
  successBox: {
    background: '#dcfce7',
    color: '#15803d',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '16px',
    fontWeight: '600',
    borderLeft: '4px solid #16a34a'
  },
  errorBox: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '16px',
    fontWeight: '600',
    borderLeft: '4px solid #dc2626'
  },
  tabs: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    padding: '8px',
    background: '#f1f5f9',
    borderRadius: '12px',
    marginBottom: '20px'
  },
  tab: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s ease'
  },
  loading: {
    textAlign: 'center',
    padding: '40px 0',
    color: '#64748b'
  },
  editor: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 20px 0',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '10px'
  },
  fieldGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '4px'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    background: '#f8fafc'
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    background: '#f8fafc',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px'
  },
  fieldMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '4px',
    fontSize: '11px',
    color: '#94a3b8'
  },
  fieldKey: {
    fontFamily: 'monospace'
  },
  savingText: {
    color: '#2563eb',
    fontWeight: '600'
  },
  accessDenied: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  accessDeniedIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  }
};
