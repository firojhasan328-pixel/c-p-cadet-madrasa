import React from 'react';

export default function Footer() {
  const whatsappNumber = "8801918568313"; 
  const phoneNumber = "01918568313";
  const facebookUrl = "https://www.facebook.com/firoj.gaming.chilmari"; 
  const profileImage = "https://i.postimg.cc/667hGYDg/Screenshot-20260727-124259.jpg";

  return (
    <footer id="contact" style={{ backgroundColor: '#090d16', color: '#94a3b8', padding: '50px 20px 20px 20px', marginTop: '60px', borderTop: '2px solid #1e293b' }}>
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
          <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700' }}>চিলমারী প্রি ক্যাডেট মাদ্রাসা</h4>
          <p style={{ fontSize: '14px', margin: '0 0 8px 0', color: '#cbd5e1' }}>📍 ঠিকানা: চিলমারী, কুড়িগ্রাম, বাংলাদেশ</p>
          <p style={{ fontSize: '14px', margin: 0, color: '#38bdf8' }}>
            📞 ভর্তি ও যেকোনো তথ্যের জন্য: <a href="tel:+8801521553003" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}>+880 1521-553003</a>
          </p>
        </div>

        <div className="dev-card">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img 
              src={profileImage} 
              alt="Md Firoj Hasan" 
              className="dev-avatar"
            />
          </div>

          <h3 className="dev-title">Website Designed & Developed by</h3>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', margin: '2px 0 8px 0', letterSpacing: '0.5px' }}>
            Md Firoj Hasan
          </h2>

          <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px dashed #0284c7', padding: '12px', borderRadius: '10px', margin: '14px 0' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#e0f2fe', fontWeight: '600' }}>
              💻 যেকোনো প্রতিষ্ঠানের ও পারসোনাল ওয়েবসাইট বা App বানাতে যোগাযোগ করুন
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="contact-btn" style={{ backgroundColor: '#25D366', color: '#ffffff' }}>
              💬 WhatsApp
            </a>
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="contact-btn" style={{ backgroundColor: '#1877F2', color: '#ffffff' }}>
              🌐 Facebook
            </a>
            <a href={`tel:${phoneNumber}`} className="contact-btn" style={{ backgroundColor: '#0284c7', color: '#ffffff' }}>
              📞 Call Me
            </a>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} চিলমারী প্রি ক্যাডেট মাদ্রাসা। সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>

      </div>
    </footer>
  );
}
