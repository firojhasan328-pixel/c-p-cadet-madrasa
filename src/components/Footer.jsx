import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Footer() {
  const [footerData, setFooterData] = useState({
    title: 'চিলমারী প্রি ক্যাডেট মাদ্রাসা',
    copyright: '© 2026 চিলমারী প্রি ক্যাডেট মাদ্রাসা। সর্বস্বত্ব সংরক্ষিত।',
    address: 'চিলমারী, কুড়িগ্রাম, বাংলাদেশ',
    phone: '+8801521-553003',
    email: 'info@chilmari-madrasa.com',
    dev_image: 'https://i.postimg.cc/667hGYDg/Screenshot-20260727-124259.jpg',
    dev_name: 'Md Firoj Hasan',
    dev_tagline: '💻 যেকোনো প্রতিষ্ঠানের ও পারসোনাল ওয়েবসাইট বা App বানাতে যোগাযোগ করুন',
    dev_subtitle: 'Website Designed & Developed by',
    whatsapp: '8801918568313',
    facebook: 'https://www.facebook.com/firoj.gaming.chilmari',
    call: '01918568313',
    whatsapp_label: '💬 WhatsApp',
    facebook_label: '🌐 Facebook',
    call_label: '📞 Call Me',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFooterData();

    const footerChannel = supabase
      .channel('footer-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cms_values',
      }, () => {
        loadFooterData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(footerChannel);
    };
  }, []);

  const loadFooterData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cms_values')
        .select(`
          value,
          cms_fields (
            field_key
          )
        `)
        .in('cms_fields.field_key', [
          'footer_title',
          'footer_copyright', 'footer_address', 'footer_phone', 'footer_email',
          'footer_dev_image', 'footer_dev_name', 'footer_dev_tagline', 'footer_dev_subtitle',
          'footer_whatsapp', 'footer_facebook', 'footer_call',
          'footer_whatsapp_label', 'footer_facebook_label', 'footer_call_label'
        ]);

      if (error) throw error;

      if (data) {
        const formatted = {};
        data.forEach(item => {
          if (item.cms_fields) {
            formatted[item.cms_fields.field_key] = item.value;
          }
        });
        setFooterData({
          title: formatted.footer_title || 'চিলমারী প্রি ক্যাডেট মাদ্রাসা',
          copyright: formatted.footer_copyright || '© 2026 চিলমারী প্রি ক্যাডেট মাদ্রাসা। সর্বস্বত্ব সংরক্ষিত।',
          address: formatted.footer_address || 'চিলমারী, কুড়িগ্রাম, বাংলাদেশ',
          phone: formatted.footer_phone || '+8801521-553003',
          email: formatted.footer_email || 'info@chilmari-madrasa.com',
          dev_image: formatted.footer_dev_image || 'https://i.postimg.cc/667hGYDg/Screenshot-20260727-124259.jpg',
          dev_name: formatted.footer_dev_name || 'Md Firoj Hasan',
          dev_tagline: formatted.footer_dev_tagline || '💻 যেকোনো প্রতিষ্ঠানের ও পারসোনাল ওয়েবসাইট বা App বানাতে যোগাযোগ করুন',
          dev_subtitle: formatted.footer_dev_subtitle || 'Website Designed & Developed by',
          whatsapp: formatted.footer_whatsapp || '8801918568313',
          facebook: formatted.footer_facebook || 'https://www.facebook.com/firoj.gaming.chilmari',
          call: formatted.footer_call || '01918568313',
          whatsapp_label: formatted.footer_whatsapp_label || '💬 WhatsApp',
          facebook_label: formatted.footer_facebook_label || '🌐 Facebook',
          call_label: formatted.footer_call_label || '📞 Call Me',
        });
      }
    } catch (error) {
      console.error('Load error:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <footer style={{ backgroundColor: '#090d16', color: '#94a3b8', padding: '40px 20px', textAlign: 'center' }}>
        <p>⏳ লোড হচ্ছে...</p>
      </footer>
    );
  }

  return (
    <footer style={{ backgroundColor: '#090d16', color: '#94a3b8', padding: '50px 20px 20px 20px', marginTop: '60px', borderTop: '2px solid #1e293b' }}>
      <style>{`
        .dev-card {
          background: linear-gradient(145deg, #1e293b, #0f172a);
          border: 1px solid #334155;
          border-radius: 20px;
          padding: 24px;
          max-width: 600px;
          margin: 0 auto 40px auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          text-align: center;
        }
        .dev-avatar {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #10b981;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
        }
        .dev-title {
          font-size: 20px;
          font-weight: 800;
          background: linear-gradient(135deg, #38bdf8, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 12px 0 4px 0;
        }
        .contact-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: transform 0.2s;
        }
        .contact-btn:hover {
          transform: translateY(-2px);
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px', borderBottom: '1px solid #1e293b', paddingBottom: '25px' }}>
          <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700' }}>
            {footerData.title}
          </h4>
          <p style={{ fontSize: '14px', margin: '0 0 8px 0', color: '#cbd5e1' }}>📍 {footerData.address}</p>
          <p style={{ fontSize: '14px', margin: 0, color: '#38bdf8' }}>
            📞 {footerData.phone}
          </p>
        </div>

        <div className="dev-card">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={footerData.dev_image} alt={footerData.dev_name} className="dev-avatar" />
          </div>

          <h3 className="dev-title">{footerData.dev_subtitle}</h3>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', margin: '2px 0 8px 0', letterSpacing: '0.5px' }}>
            {footerData.dev_name}
          </h2>

          <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px dashed #0284c7', padding: '12px', borderRadius: '10px', margin: '14px 0' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#e0f2fe', fontWeight: '600' }}>
              {footerData.dev_tagline}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
            <a href={`https://wa.me/${footerData.whatsapp}`} target="_blank" rel="noopener noreferrer" className="contact-btn" style={{ backgroundColor: '#25D366', color: '#ffffff' }}>
              {footerData.whatsapp_label}
            </a>
            <a href={footerData.facebook} target="_blank" rel="noopener noreferrer" className="contact-btn" style={{ backgroundColor: '#1877F2', color: '#ffffff' }}>
              {footerData.facebook_label}
            </a>
            <a href={`tel:${footerData.call}`} className="contact-btn" style={{ backgroundColor: '#0284c7', color: '#ffffff' }}>
              {footerData.call_label}
            </a>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
          <p style={{ margin: 0 }}>{footerData.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
