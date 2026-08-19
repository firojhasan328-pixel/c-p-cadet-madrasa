import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ContactPage() {
  const [contactData, setContactData] = useState({
    title: 'যোগাযোগ',
    phone: '+8801521-553003',
    email: 'info@chilmari-madrasa.com',
    address: 'চিলমারী, কুড়িগ্রাম, বাংলাদেশ',
    facebook: 'https://www.facebook.com/firoj.gaming.chilmari',
    whatsapp: '8801918568313',
    image: 'https://i.postimg.cc/667hGYDg/Screenshot-20260727-124259.jpg',
    designation: 'প্রধান শিক্ষক ও পরিচালক'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContactData();
  }, []);

  const loadContactData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_contents')
        .select('*')
        .in('key', [
          'contact_title', 'contact_phone', 'contact_email', 
          'contact_address', 'contact_facebook', 'contact_whatsapp',
          'contact_image', 'contact_designation'
        ]);

      if (error) throw error;

      const contentMap = {};
      data?.forEach(item => {
        contentMap[item.key] = item.value;
      });

      setContactData({
        title: contentMap.contact_title || 'যোগাযোগ',
        phone: contentMap.contact_phone || '+8801521-553003',
        email: contentMap.contact_email || 'info@chilmari-madrasa.com',
        address: contentMap.contact_address || 'চিলমারী, কুড়িগ্রাম, বাংলাদেশ',
        facebook: contentMap.contact_facebook || 'https://www.facebook.com/firoj.gaming.chilmari',
        whatsapp: contentMap.contact_whatsapp || '8801918568313',
        image: contentMap.contact_image || 'https://i.postimg.cc/667hGYDg/Screenshot-20260727-124259.jpg',
        designation: contentMap.contact_designation || 'প্রধান শিক্ষক ও পরিচালক'
      });
    } catch (error) {
      console.error('Error loading contact data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p>⏳ লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
      <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <h2 style={{ color: '#14532d', marginTop: 0, fontSize: '28px' }}>
          {contactData.title}
        </h2>

        {/* Profile Image */}
        <div style={{ margin: '20px 0' }}>
          <img 
            src={contactData.image} 
            alt="প্রধান শিক্ষক" 
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '4px solid #16a34a',
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
            }}
          />
        </div>

        {/* Designation */}
        <h3 style={{ 
          color: '#0f172a', 
          fontSize: '22px', 
          margin: '0 0 4px 0',
          fontWeight: '700'
        }}>
          {contactData.designation}
        </h3>

        {/* Contact Details */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          marginTop: '20px',
          textAlign: 'left',
          maxWidth: '400px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '12px 16px',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <span style={{ fontSize: '20px' }}>📞</span>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>ফোন</div>
              <a href={`tel:${contactData.phone}`} style={{ 
                color: '#16a34a', 
                textDecoration: 'none', 
                fontWeight: '600',
                fontSize: '16px'
              }}>
                {contactData.phone}
              </a>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '12px 16px',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <span style={{ fontSize: '20px' }}>✉️</span>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>ইমেইল</div>
              <a href={`mailto:${contactData.email}`} style={{ 
                color: '#16a34a', 
                textDecoration: 'none', 
                fontWeight: '600',
                fontSize: '16px'
              }}>
                {contactData.email}
              </a>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '12px 16px',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <span style={{ fontSize: '20px' }}>📍</span>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>ঠিকানা</div>
              <div style={{ fontWeight: '600', fontSize: '16px', color: '#0f172a' }}>
                {contactData.address}
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          justifyContent: 'center',
          marginTop: '24px',
          flexWrap: 'wrap'
        }}>
          <a 
            href={`https://wa.me/${contactData.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#25D366',
              color: 'white',
              padding: '10px 24px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            💬 WhatsApp
          </a>
          <a 
            href={contactData.facebook}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#1877F2',
              color: 'white',
              padding: '10px 24px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🌐 Facebook
          </a>
          <a 
            href={`tel:${contactData.phone}`}
            style={{
              background: '#0284c7',
              color: 'white',
              padding: '10px 24px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📞 কল করুন
          </a>
        </div>

        {/* Back Button */}
        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={() => window.history.back()}
            className="btn-primary"
            style={{ backgroundColor: '#64748b' }}
          >
            ⬅ ফিরে যান
          </button>
        </div>
      </div>
    </div>
  );
}
