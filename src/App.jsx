import React, { useState } from 'react';
import Footer from './components/Footer';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  
  // সুপার এডমিন কন্ট্রোল স্টেট (ডিফল্টভাবে হাইড করা থাকবে)
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState("পর্যাপ্ত পরিমাণ ছাত্র-ছাত্রী বুকিং হওয়ায় আর কোনো সিট খালি নাই।");
  const [isAdminMode, setIsAdminMode] = useState(false); // ৩-লাইন মেনু থেকে কন্ট্রোল প্যানেল ওপেন করার জন্য

  // ফরম ও ভেরিফিকেশন স্টেট
  const [formStep, setFormStep] = useState(1); // 1: Form Inputs, 2: OTP Verification, 3: Success
  const [formData, setFormData] = useState({
    studentName: '',
    className: '',
    fatherName: '',
    motherName: '',
    phone: '',
    otp: '',
    studentPhoto: null,
    birthCertPhoto: null,
    fatherNidPhoto: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData({ ...formData, [name]: files[0].name });
    }
  };

  const handleVerifyPhone = (e) => {
    e.preventDefault();
    if (!formData.phone || formData.phone.length < 11) {
      alert("দয়া করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।");
      return;
    }
    setFormStep(2);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (formData.otp.length !== 5) {
      alert("দয়া করে ৫ সংখ্যার সঠিক কোডটি দিন।");
      return;
    }
    setFormStep(3);
  };

  const resetForm = () => {
    setFormStep(1);
    setFormData({
      studentName: '',
      className: '',
      fatherName: '',
      motherName: '',
      phone: '',
      otp: '',
      studentPhoto: null,
      birthCertPhoto: null,
      fatherNidPhoto: null
    });
  };

  const whatsappNumber = "8801918568313";

  return (
    <div style={{ fontFamily: "'Hind Siliguri', 'Segoe UI', sans-serif", backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh', margin: 0, padding: 0, position: 'relative' }}>
      {/* গ্লোবাল স্টাইল */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; scroll-behavior: smooth; }
        .nav-link { color: #334155; text-decoration: none; font-weight: 600; transition: color 0.2s; }
        .nav-link:hover { color: #15803d; }
        .btn-primary { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(22, 163, 74, 0.35); }
        .card { background: #ffffff; border-radius: 18px; padding: 24px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0; }
        .badge { background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-block; }
        
        .live-chat-btn {
          position: fixed;
          bottom: 25px;
          right: 25px;
          background-color: #25D366;
          color: white;
          border-radius: 50px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 20px rgba(37, 211, 102, 0.4);
          text-decoration: none;
          font-weight: bold;
          font-size: 14px;
          z-index: 1000;
          transition: all 0.3s ease;
        }
        .live-chat-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 25px rgba(37, 211, 102, 0.6);
        }
      `}</style>

      {/* টপ কন্টাক্ট বার (স্বচ্ছ ও পরিচ্ছন্ন) */}
      <div style={{ backgroundColor: '#14532d', color: '#f0fdf4', padding: '8px 20px', fontSize: '13px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>📍 চিলমারী, কুড়িগ্রাম, বাংলাদেশ</div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>📞 যোগাযোগ: <a href="tel:+8801521553003" style={{ color: '#ffffff', fontWeight: 'bold', textDecoration: 'none' }}>+880 1521-553003</a></span>
          </div>
        </div>
      </div>

      {/* নেভিগেশন বার */}
      <nav style={{ backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '22px', boxShadow: '0 4px 10px rgba(22, 163, 74, 0.3)' }}>
              চ
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#14532d', margin: 0, lineHeight: 1.2 }}>চিলমারী প্রি ক্যাডেট মাদ্রাসা</h1>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, fontStyle: 'italic' }}>দ্বীন ও আধুনিক শিক্ষার অপূর্ব মেলবন্ধন</p>
            </div>
          </div>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            style={{ background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', color: '#1e293b' }}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* ৩-লাইন মেনুবার ড্রপডাউন (যেখানে সুপার এডমিন প্যানেল সিক্রেটলি রাখা হয়েছে) */}
        {mobileMenuOpen && (
          <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <a href="#home" className="nav-link" onClick={() => setMobileMenuOpen(false)}>হোম</a>
            <a href="#about" className="nav-link" onClick={() => setMobileMenuOpen(false)}>প্রধান শিক্ষকের বাণী</a>
            <a href="#notice" className="nav-link" onClick={() => setMobileMenuOpen(false)}>নোটিশ বোর্ড</a>
            <a href="#contact" className="nav-link" onClick={() => setMobileMenuOpen(false)}>যোগাযোগ</a>
            <button onClick={() => { setMobileMenuOpen(false); setIsAdmissionModalOpen(true); }} className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>অনলাইন ভর্তি</button>
            
            {/* সাধারণ ইউজারদের আড়ালে থাকা সুপার এডমিন কন্ট্রোল বাটন */}
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '4px' }}>
              <button 
                onClick={() => setIsAdminMode(!isAdminMode)} 
                style={{ background: '#0f172a', color: '#f8fafc', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', width: '100%', fontWeight: '600' }}
              >
                {isAdminMode ? '🔒 সুপার এডমিন প্যানেল বন্ধ করুন' : '⚙️ সুপার এডমিন কন্ট্রোল (লগইন)'}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ৩-লাইন মেনুর ভেতরে থাকা সুপার এডমিন কন্ট্রোল প্যানেল ইন্টারফেস */}
      {isAdminMode && (
        <div style={{ background: '#fef3c7', borderBottom: '2px solid #f59e0b', padding: '16px 20px', textAlign: 'center', fontSize: '14px', zIndex: 100, position: 'relative' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <strong>🛠️ সুপার এডমিন কন্ট্রোল প্যানেল (গোপন মেনু):</strong>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isAdmissionOpen} 
                  onChange={(e) => setIsAdmissionOpen(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                ভর্তি ফরম অন রাখুন (Form Open/Close Switch)
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
              <span style={{ fontSize: '12px', fontWeight: '600' }}>বন্ধকালীন নোটিশ মেসেজ এডিট করুন:</span>
              <input 
                type="text" 
                value={closedMessage} 
                onChange={(e) => setClosedMessage(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d97706', width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* হিরো সেকশন */}
      <header id="home" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #14532d 50%, #166534 100%)', color: 'white', padding: '50px 20px 70px 20px', textAlign: 'center', position: 'relative' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff', marginBottom: '16px' }}>
            🎓 নতুন সেশনে ভর্তি চলছে
          </span>
          <h2 style={{ fontSize: '2.1rem', fontWeight: '800', margin: '16px 0', lineHeight: '1.3' }}>
            সুশিক্ষা ও সুন্নাত ভিত্তিক আদর্শ জীবন গড়ার বিশ্বস্ত প্রতিষ্ঠান
          </h2>
          <p style={{ fontSize: '15px', color: '#ecfdf5', lineHeight: '1.7', marginBottom: '28px' }}>
            আমরা দিচ্ছি আধুনিক ক্বওমী ও জেনারেল শিক্ষা ব্যবস্থার এক অনন্য সমন্বয়। অভিজ্ঞ শিক্ষক মণ্ডলীর তত্ত্বাবধানে আপনার সন্তানের দ্বীনি শিক্ষার পথ সুগম করুন।
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { resetForm(); setIsAdmissionModalOpen(true); }} className="btn-primary" style={{ backgroundColor: '#ffffff', color: '#14532d', fontWeight: 'bold' }}>
              ভর্তি আবেদন করুন
            </button>
            <a href="tel:+8801521553003" className="btn-primary" style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
              📞 সরাসরি কল দিন
            </a>
          </div>
        </div>
      </header>

      {/* মূল কন্টেন্ট */}
      <main style={{ maxWidth: '1200px', margin: '-30px auto 40px auto', padding: '0 16px', position: 'relative', zIndex: 10 }}>
        
        {/* প্রধান শিক্ষকের তথ্য ও বাণী সেকশন */}
        <section id="about" style={{ marginBottom: '32px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  src="https://i.postimg.cc/xd8py0DW/1786523361131.jpg" 
                  alt="Arif Ashab Khorshed" 
                  style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #16a34a', boxShadow: '0 6px 16px rgba(0,0,0,0.15)' }}
                />
              </div>
              <h3 style={{ margin: '12px 0 2px 0', fontSize: '20px', color: '#0f172a', fontWeight: '700' }}>Arif Ashab Khorshed</h3>
              <span className="badge">প্রধান শিক্ষক</span>
            </div>
            
            <div style={{ textAlign: 'left', width: '100%' }}>
              <h3 style={{ fontSize: '20px', color: '#166534', marginTop: 0, marginBottom: '12px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
                প্রধান শিক্ষকের বার্তা
              </h3>
              <p style={{ lineHeight: '1.8', color: '#334155', margin: 0, fontSize: '15px' }}>
                "বিসমিল্লাহির রহমানির রহিম। চিলমারী প্রি ক্যাডেট মাদ্রাসায় আপনাকে জানাই আন্তরিক শুভেচ্ছা। আমাদের সুনির্দিষ্ট লক্ষ্য হলো কোমলমতি শিশুদের ধর্মীয় মূল্যবোধ, উত্তম চরিত্র এবং আধুনিক শিক্ষার মাধ্যমে এক আদর্শ সুনাগরিক হিসেবে গড়ে তোলা। অভিজ্ঞ শিক্ষক মণ্ডলীর পরম মমতায় আমরা শিক্ষার্থীদের মেধা ও সুপ্ত প্রতিভার বিকাশে সততার সাথে দায়িত্ব পালন করে যাচ্ছি।"
              </p>
            </div>
          </div>
        </section>

        {/* নোটিশ ও বৈশিষ্ট্য */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          
          {/* নোটিশ বোর্ড */}
          <div id="notice" className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📌 নোটিশ বোর্ড
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: '#f8fafc', borderLeft: '4px solid #16a34a' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>আগামী ১ জানুয়ারি থেকে</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600' }}>২০২৬-২৭ শিক্ষাবর্ষের নতুন ভর্তি ফরম অনলাইন ও অফিসে পাওয়া যাচ্ছে।</p>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', background: '#f8fafc', borderLeft: '4px solid #eab308' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>১০ জানুয়ারি পর্যন্ত</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '600' }}>আবেদন ফরম গ্রহণ চলবে। বিস্তারিত তথ্যের জন্য যোগাযোগ করুন।</p>
              </div>
            </div>
          </div>

          {/* বৈশিষ্ট্যসমূহ */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#166534', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
              🌟 আমাদের বিশেষত্ব
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['অভিজ্ঞ ও দ্বীনদার শিক্ষক মণ্ডলী', 'হিফজ ও বিশুদ্ধ ক্বিরাআত প্রশিক্ষণ', 'কম্পিউটার ও তথ্যপ্রযুক্তি শিক্ষা', 'নিরাপদ ও সিসিটিভি নিয়ন্ত্রিত ক্যাম্পাস', 'সুপরিসর ক্লাসরুম ও মনোরম পরিবেশ'].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#334155' }}>
                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* অনলাইন ভর্তি আবেদন বাটন কার্ড */}
        <section id="admission" className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '35px 24px' }}>
          <span className="badge">সহজ নিয়ম</span>
          <h3 style={{ fontSize: '22px', color: '#166534', margin: '10px 0 6px 0' }}>অনলাইন ভর্তি আবেদন</h3>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0' }}>আপনার সন্তানের ভর্তি নিশ্চিত করতে নিচের বাটনে ক্লিক করে ফরম পূরণ করুন</p>
          <button 
            onClick={() => { resetForm(); setIsAdmissionModalOpen(true); }} 
            className="btn-primary" 
            style={{ fontSize: '16px', padding: '14px 28px', width: '100%', maxWidth: '300px', justifyContent: 'center' }}
          >
            🎓 ভর্তি আবেদন করুন
          </button>
        </section>

      </main>

      {/* ভর্তি ফরম পপআপ মোডাল */}
      {isAdmissionModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            {/* ক্লোজ বাটন */}
            <button 
              onClick={() => setIsAdmissionModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
                fontWeight: 'bold',
                zIndex: 10
              }}
            >
              ✕
            </button>

            {/* ফরমের উপরের নোটিস বোর্ড */}
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px', marginBottom: '16px', fontSize: '13px', color: '#166534', lineHeight: '1.6' }}>
              <div style={{ fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📢</span> বিশেষ নোটিশ:
              </div>
              আগামী ১ জানুয়ারি থেকে ভর্তি চলছে আপনার সন্তানকে আমাদের প্রি ক্যাডেট মাদ্রাসায় ভর্তি করতে এখনি আবেদন করুন। আগামি ১০ জানুয়ারী থেকে আবেদন ফরম বন্ধ হবে।
              <div style={{ marginTop: '8px', textAlign: 'right', fontWeight: '600', fontStyle: 'italic', fontSize: '12px', color: '#14532d' }}>
                আদেশ ক্রমে প্রধান শিক্ষক<br/>
                মো: খোরশেদ ইসলাম
              </div>
            </div>

            {/* যদি ফরম বন্ধ থাকে (সুইচ অফ) */}
            {!isAdmissionOpen ? (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '30px 20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚠️</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>আবেদন ফরম বন্ধ রয়েছে</h4>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>{closedMessage}</p>
              </div>
            ) : (
              <div>
                {/* স্টেপ ১: ফরম ফিলআপ ও লাইভ ক্যামেরা আপলোড */}
                {formStep === 1 && (
                  <form onSubmit={handleVerifyPhone} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                      <span className="badge">অনলাইন ফরম</span>
                      <h3 style={{ fontSize: '18px', color: '#166534', margin: '6px 0 2px 0' }}>ভর্তি আবেদন ফরম</h3>
                      <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>সকল তথ্য বাধ্যতামূলকভাবে পূরণ করুন</p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#334155' }}>শিক্ষার্থীর নাম (বাধ্যতামূলক)</label>
                      <input 
                        type="text" 
                        name="studentName"
                        required 
                        placeholder="শিক্ষার্থীর নাম লিখুন" 
                        value={formData.studentName}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#334155' }}>কোন ক্লাসে ভর্তি (বাধ্যতামূলক)</label>
                      <select 
                        name="className"
                        required 
                        value={formData.className}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
                      >
                        <option value="">শ্রেণী নির্বাচন করুন...</option>
                        <option value="play">প্লে শ্রেণী</option>
                        <option value="nursery">নার্সারি</option>
                        <option value="one">প্রথম শ্রেণী</option>
                        <option value="two">দ্বিতীয় শ্রেণী</option>
                        <option value="three">তৃতীয় শ্রেণি</option>
                        <option value="four">চতুর্থ শ্রেণি</option>
                        <option value="five">পঞ্চম শ্রেণি</option>
                        <option value="hifz">হিফজ বিভাগ</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#334155' }}>বাবার নাম (বাধ্যতামূলক)</label>
                      <input 
                        type="text" 
                        name="fatherName"
                        required 
                        placeholder="বাবার নাম লিখুন" 
                        value={formData.fatherName}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#334155' }}>মায়ের নাম (বাধ্যতামূলক)</label>
                      <input 
                        type="text" 
                        name="motherName"
                        required 
                        placeholder="মায়ের নাম লিখুন" 
                        value={formData.motherName}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                      />
                    </div>

                    {/* লাইভ ক্যামেরা ফটো ক্যাপচার ফিল্ডসমূহ */}
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#1e293b' }}>📷 ছাত্র বা ছাত্রীর ছবি (লাইভ ক্যামেরা দিয়ে তুলুন)</label>
                        <input 
                          type="file" 
                          name="studentPhoto"
                          accept="image/*" 
                          capture="environment"
                          required 
                          onChange={handleFileChange}
                          style={{ fontSize: '12px', width: '100%' }}
                        />
                        {formData.studentPhoto && <span style={{ fontSize: '11px', color: '#16a34a' }}>✓ ছবি সিলেক্ট হয়েছে</span>}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#1e293b' }}>📷 জন্ম নিবন্ধনের ছবি (লাইভ ক্যামেরা দিয়ে তুলুন)</label>
                        <input 
                          type="file" 
                          name="birthCertPhoto"
                          accept="image/*" 
                          capture="environment"
                          required 
                          onChange={handleFileChange}
                          style={{ fontSize: '12px', width: '100%' }}
                        />
                        {formData.birthCertPhoto && <span style={{ fontSize: '11px', color: '#16a34a' }}>✓ ছবি সিলেক্ট হয়েছে</span>}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#1e293b' }}>📷 বাবার NID কার্ডের ছবি (লাইভ ক্যামেরা)</label>
                        <input 
                          type="file" 
                          name="fatherNidPhoto"
                          accept="image/*" 
                          capture="environment"
                          required 
                          onChange={handleFileChange}
                          style={{ fontSize: '12px', width: '100%' }}
                        />
                        {formData.fatherNidPhoto && <span style={{ fontSize: '11px', color: '#16a34a' }}>✓ ছবি সিলেক্ট হয়েছে</span>}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#334155' }}>মোবাইল নাম্বার (ভেরিফিকেশনের জন্য)</label>
                      <input 
                        type="tel" 
                        name="phone"
                        required 
                        placeholder="01XXXXXXXXX" 
                        value={formData.phone}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                      />
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '8px', width: '100%', fontSize: '15px' }}>
                      নম্বর ভেরিফাই করুন (OTP পাঠান)
                    </button>
                  </form>
                )}

                {/* স্টেপ ২: ৫ সংখ্যার ওটিপি কোড ভেরিফিকেশন */}
                {formStep === 2 && (
                  <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '10px 0' }}>
                    <div>
                      <span className="badge">ওটিপি ভেরিফিকেশন</span>
                      <h3 style={{ fontSize: '18px', color: '#166534', margin: '8px 0 4px 0' }}>কোড ইনপুট করুন</h3>
                      <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                        আপনার <strong style={{ color: '#0f172a' }}>{formData.phone}</strong> নম্বরে পাঠানো ৫ সংখ্যার কোডটি নিচে লিখুন (ডেমো কোড: যেকোনো ৫ অঙ্ক যেমন 12345):
                      </p>
                    </div>

                    <div>
                      <input 
                        type="text" 
                        maxLength="5"
                        required 
                        placeholder="-----" 
                        value={formData.otp}
                        onChange={(e) => setFormData({...formData, otp: e.target.value})}
                        style={{ width: '200px', textAlign: 'center', padding: '12px', letterSpacing: '8px', fontSize: '22px', border: '2px solid #16a34a', borderRadius: '10px', outline: 'none', margin: '0 auto' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" onClick={() => setFormStep(1)} style={{ background: '#e2e8f0', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>
                        পেছনে যান
                      </button>
                      <button type="submit" className="btn-primary" style={{ flex: 2, fontSize: '15px' }}>
                        কোড নিশ্চিত করুন ও জমা দিন
                      </button>
                    </div>
                  </form>
                )}

                {/* স্টেপ ৩: সফল সাবমিশন মেসেজ */}
                {formStep === 3 && (
                  <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#14532d', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>আবেদন সফলভাবে ভেরিফাই ও জমা হয়েছে!</h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '13px', lineHeight: '1.6' }}>
                      আপনার আবেদনপত্র সফলভাবে সুপার এডমিন, এডমিন এবং সংশ্লিষ্ট শিক্ষকের প্যানেলে প্রেরিত হয়েছে। আমরা খুব শীঘ্রই আপনার সাথে যোগাযোগ করব।
                    </p>
                    <button 
                      onClick={() => setIsAdmissionModalOpen(false)}
                      className="btn-primary"
                      style={{ fontSize: '14px', padding: '10px 20px' }}
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ভাসমান লাইভ চ্যাট বাটন */}
      <a 
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('হ্যালো ফিরোজ ভাই, ওয়েবসাইট/অ্যাপ বা লাইভ সাপোর্ট সম্পর্কিত সাহায্য প্রয়োজন।')}`} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="live-chat-btn"
      >
        <span>💬</span>
        <span>লাইভ চ্যাট</span>
      </a>

      {/* ফুটার */}
      <Footer />
    </div>
  );
}
