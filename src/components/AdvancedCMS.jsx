import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { logActivity, sendNotification } from '../utils/permissionService';

export default function AdvancedCMS() {
  const { user, isSuperAdmin, isAdmin, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSection, setActiveSection] = useState('home');
  const [contents, setContents] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // CMS Sections
  const sections = {
    home: { label: '🏠 হোম পেজ', icon: '🏠' },
    principal: { label: '👨‍🏫 প্রধান শিক্ষক', icon: '👨‍🏫' },
    teachers: { label: '👨‍🏫 শিক্ষক', icon: '👨‍🏫' },
    students: { label: '🎓 ছাত্র', icon: '🎓' },
    notice: { label: '📌 নোটিশ', icon: '📌' },
    gallery: { label: '🖼️ গ্যালারি', icon: '🖼️' },
    admission: { label: '📝 ভর্তি', icon: '📝' },
    contact: { label: '📞 যোগাযোগ', icon: '📞' },
    footer: { label: '📋 ফুটার', icon: '📋' },
    navigation: { label: '🧭 নেভিগেশন', icon: '🧭' },
    settings: { label: '⚙️ সেটিংস', icon: '⚙️' }
  };

  // CMS Fields Configuration
  const fieldConfigs = {
    home: [
      { key: 'home_heading', label: 'হোম হেডিং', type: 'text', default: 'সুশিক্ষা ও সুন্নাত ভিত্তিক আদর্শ জীবন গড়ার বিশ্বস্ত প্রতিষ্ঠান' },
      { key: 'home_subheading', label: 'হোম সাবহেডিং', type: 'text', default: 'আমরা দিচ্ছি আধুনিক ক্বওমী ও জেনারেল শিক্ষা ব্যবস্থার এক অনন্য সমন্বয়।' },
      { key: 'home_badge_text', label: 'ব্যাজ টেক্সট', type: 'text', default: '🎓 নতুন সেশনে ভর্তি চলছে' },
      { key: 'home_button_text', label: 'বাটন টেক্সট', type: 'text', default: 'ভর্তি আবেদন করুন' },
      { key: 'home_hero_image', label: 'হিরো ইমেজ URL', type: 'text', default: '' }
    ],
    principal: [
      { key: 'principal_name', label: 'প্রধান শিক্ষকের নাম', type: 'text', default: 'Arif Ashab Khorshed' },
      { key: 'principal_designation', label: 'পদবী', type: 'text', default: 'প্রধান শিক্ষক ও পরিচালক' },
      { key: 'principal_message', label: 'প্রধান শিক্ষকের বার্তা', type: 'textarea', default: 'বিসমিল্লাহির রহমানির রহিম। চিলমারী প্রি ক্যাডেট মাদ্রাসায় আপনাকে জানাই আন্তরিক শুভেচ্ছা। আমাদের সুনির্দিষ্ট লক্ষ্য হলো কোমলমতি শিশুদের ধর্মীয় মূল্যবোধ, উত্তম চরিত্র এবং আধুনিক শিক্ষার মাধ্যমে এক আদর্শ সুনাগরিক হিসেবে গড়ে তোলা।' },
      { key: 'principal_image', label: 'প্রধান শিক্ষকের ছবি URL', type: 'text', default: 'https://i.postimg.cc/xd8py0DW/1786523361131.jpg' }
    ],
    teachers: [
      { key: 'teachers_title', label: 'পেজ টাইটেল', type: 'text', default: 'মাদ্রাসার শিক্ষক-শিক্ষিকাবৃন্দ' },
      { key: 'teachers_subtitle', label: 'পেজ সাবটাইটেল', type: 'text', default: 'সম্মানিত শিক্ষক মণ্ডলী' }
    ],
    students: [
      { key: 'students_title', label: 'পেজ টাইটেল', type: 'text', default: 'ছাত্র-ছাত্রী ও ক্লাসের শীর্ষ স্থানাধিকারীগণ' },
      { key: 'students_subtitle', label: 'পেজ সাবটাইটেল', type: 'text', default: 'মেধাবী মুখসমূহ' },
      { key: 'students_total_male', label: 'মোট ছাত্র সংখ্যা', type: 'text', default: '২৫০' },
      { key: 'students_total_female', label: 'মোট ছাত্রী সংখ্যা', type: 'text', default: '২২০' }
    ],
    notice: [
      { key: 'notice_title', label: 'নোটিশ টাইটেল', type: 'text', default: '📌 নোটিশ বোর্ড' },
      { key: 'notice_text', label: 'নোটিশ টেক্সট', type: 'textarea', default: 'আগামী ১ জানুয়ারি থেকে ২০২৬-২৭ শিক্ষাবর্ষের নতুন ভর্তি ফরম অনলাইন ও অফিসে পাওয়া যাচ্ছে।' }
    ],
    gallery: [
      { key: 'gallery_title', label: 'গ্যালারি টাইটেল', type: 'text', default: '📸 গ্যালারি' }
    ],
    admission: [
      { key: 'admission_title', label: 'ভর্তি টাইটেল', type: 'text', default: 'অনলাইন ভর্তি আবেদন' },
      { key: 'admission_subtitle', label: 'ভর্তি সাবটাইটেল', type: 'text', default: 'সহজ নিয়ম' },
      { key: 'admission_description', label: 'ভর্তি বিবরণ', type: 'textarea', default: 'আপনার সন্তানের ভর্তি নিশ্চিত করতে নিচের বাটনে ক্লিক করে ফরম পূরণ করুন' },
      { key: 'admission_button_text', label: 'বাটন টেক্সট', type: 'text', default: '🎓 ভর্তি আবেদন করুন' },
      { key: 'admission_closed_message', label: 'ভর্তি বন্ধের বার্তা', type: 'textarea', default: 'পর্যাপ্ত পরিমাণ ছাত্র-ছাত্রী বুকিং হওয়ায় আর কোনো সিট খালি নাই।' }
    ],
    contact: [
      { key: 'contact_title', label: 'যোগাযোগ টাইটেল', type: 'text', default: 'যোগাযোগ' },
      { key: 'contact_phone', label: 'ফোন নম্বর', type: 'text', default: '+8801521-553003' },
      { key: 'contact_email', label: 'ইমেইল', type: 'text', default: 'info@chilmari-madrasa.com' },
      { key: 'contact_address', label: 'ঠিকানা', type: 'text', default: 'চিলমারী, কুড়িগ্রাম, বাংলাদেশ' },
      { key: 'contact_facebook', label: 'Facebook URL', type: 'text', default: 'https://www.facebook.com/firoj.gaming.chilmari' },
      { key: 'contact_whatsapp', label: 'WhatsApp নম্বর', type: 'text', default: '8801918568313' },
      { key: 'contact_image', label: 'প্রোফাইল ইমেজ URL', type: 'text', default: 'https://i.postimg.cc/667hGYDg/Screenshot-20260727-124259.jpg' }
    ],
    footer: [
      { key: 'footer_copyright', label: 'কপিরাইট টেক্সট', type: 'text', default: '© 2024 চিলমারী প্রি ক্যাডেট মাদ্রাসা। সর্বস্বত্ব সংরক্ষিত।' },
      { key: 'footer_address', label: 'ঠিকানা', type: 'text', default: '📍 চিলমারী, কুড়িগ্রাম, বাংলাদেশ' },
      { key: 'footer_designer_name', label: 'ডিজাইনার নাম', type: 'text', default: 'Md Firoj Hasan' },
      { key: 'footer_designer_title', label: 'ডিজাইনার টাইটেল', type: 'text', default: 'Website Designed & Developed by' }
    ],
    navigation: [
      { key: 'nav_home', label: 'হোম', type: 'text', default: 'হোম' },
      { key: 'nav_about', label: 'প্রধান শিক্ষকের বাণী', type: 'text', default: 'প্রধান শিক্ষকের বাণী' },
      { key: 'nav_teachers', label: 'শিক্ষকবৃন্দ', type: 'text', default: 'শিক্ষকবৃন্দ' },
      { key: 'nav_students', label: 'ছাত্র-ছাত্রী', type: 'text', default: 'ছাত্র-ছাত্রী' },
      { key: 'nav_notice', label: 'নোটিশ বোর্ড', type: 'text', default: 'নোটিশ বোর্ড' },
      { key: 'nav_gallery', label: 'গ্যালারি', type: 'text', default: 'গ্যালারি' },
      { key: 'nav_contact', label: 'যোগাযোগ', type: 'text', default: 'যোগাযোগ' }
    ],
    settings: [
      { key: 'site_name', label: 'সাইটের নাম', type: 'text', default: 'চিলমারী প্রি ক্যাডেট মাদ্রাসা' },
      { key: 'site_tagline', label: 'সাইট ট্যাগলাইন', type: 'text', default: 'দ্বীন ও আধুনিক শিক্ষার অপূর্ব মেলবন্ধন' },
      { key: 'site_meta_description', label: 'Meta Description', type: 'textarea', default: 'চিলমারী প্রি ক্যাডেট মাদ্রাসা - দ্বীন ও আধুনিক শিক্ষার অপূর্ব মেলবন্ধন' }
    ]
  };

  useEffect(() => {
    loadAllContents();
  }, []);

  const loadAllContents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_contents')
        .select('*');

      if (error) throw error;

      const contentMap = {};
      data?.forEach(item => {
        contentMap[item.key] = item.value;
      });
      setContents(contentMap);
    } catch (error) {
      console.error('Error loading contents:', error);
      setErrorMsg('কন্টেন্ট লোড করতে সমস্যা: ' + error.message);
    }
    setLoading(false);
  };

  const handleUpdateContent = async (key, value) => {
    try {
      const { error } = await supabase
        .from('site_contents')
        .upsert({ key, value });

      if (error) throw error;

      setContents(prev => ({ ...prev, [key]: value }));
      setSuccessMsg(`✅ ${key} আপডেট করা হয়েছে!`);
      
      await logActivity(user?.id, 'UPDATE_CMS', 'site_contents', key, {
        key: key,
        value: value
      });

      setEditingField(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg('❌ আপডেট করতে সমস্যা: ' + error.message);
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const getFieldValue = (key) => {
    return contents[key] || '';
  };

  const startEditing = (key, currentValue) => {
    setEditingField(key);
    setEditValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEditing = (key) => {
    handleUpdateContent(key, editValue);
  };

  // Permission Checks
  const canEditCMS = isSuperAdmin || (isAdmin && hasPermission('cms.settings.edit'));

  if (!canEditCMS) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
        <h2 style={{ color: '#dc2626' }}>অ্যাক্সেস অস্বীকৃত!</h2>
        <p style={{ color: '#64748b' }}>আপনার CMS এডিট করার অনুমতি নেই।</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 16px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>📝 Advanced CMS</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Website-এর সব কন্টেন্ট এডিট করুন
          </p>
        </div>
        <button
          onClick={loadAllContents}
          style={{
            background: '#f1f5f9',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          🔄 রিফ্রেশ
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{
          background: '#dcfce7',
          color: '#15803d',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '16px',
          fontWeight: '600'
        }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{
          background: '#fee2e2',
          color: '#991b1b',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '16px',
          fontWeight: '600'
        }}>
          {errorMsg}
        </div>
      )}

      {/* Section Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        marginBottom: '24px',
        padding: '8px',
        background: '#f1f5f9',
        borderRadius: '12px'
      }}>
        {Object.keys(sections).map((key) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeSection === key ? '#16a34a' : 'transparent',
              color: activeSection === key ? 'white' : '#334155',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            {sections[key].label}
          </button>
        ))}
      </div>

      {/* Content Editor */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px 0' }}>⏳ লোড হচ্ছে...</p>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>
            {sections[activeSection]?.label || 'কন্টেন্ট এডিটর'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {fieldConfigs[activeSection]?.map((field) => {
              const currentValue = getFieldValue(field.key) || field.default || '';
              const isEditing = editingField === field.key;

              // Check specific permission for this field
              const fieldPermission = `cms.${activeSection}.edit`;
              const canEdit = isSuperAdmin || (isAdmin && hasPermission(fieldPermission));

              return (
                <div
                  key={field.key}
                  style={{
                    padding: '12px 16px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: isEditing ? '8px' : '0'
                  }}>
                    <div>
                      <label style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#334155'
                      }}>
                        {field.label}
                      </label>
                      <div style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        marginTop: '2px'
                      }}>
                        Key: {field.key}
                      </div>
                    </div>
                    {!isEditing && canEdit && (
                      <button
                        onClick={() => startEditing(field.key, currentValue)}
                        style={{
                          background: '#2563eb',
                          color: 'white',
                          border: 'none',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        ✏️ এডিট
                      </button>
                    )}
                    {!isEditing && !canEdit && (
                      <span style={{
                        fontSize: '11px',
                        color: '#94a3b8'
                      }}>
                        🔒 পারমিশন নেই
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          rows="3"
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1.5px solid #e2e8f0',
                            fontSize: '14px',
                            outline: 'none',
                            fontFamily: 'inherit',
                            marginTop: '4px'
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1.5px solid #e2e8f0',
                            fontSize: '14px',
                            outline: 'none',
                            marginTop: '4px'
                          }}
                        />
                      )}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '8px'
                      }}>
                        <button
                          onClick={() => saveEditing(field.key)}
                          style={{
                            background: '#16a34a',
                            color: 'white',
                            border: 'none',
                            padding: '6px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        >
                          💾 সংরক্ষণ
                        </button>
                        <button
                          onClick={cancelEditing}
                          style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            border: 'none',
                            padding: '6px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        >
                          ✕ বাতিল
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '8px',
                      background: 'white',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#0f172a',
                      wordBreak: 'break-word'
                    }}>
                      {currentValue || <span style={{ color: '#94a3b8' }}>— খালি —</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
