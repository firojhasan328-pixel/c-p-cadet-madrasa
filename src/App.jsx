import React, { useState } from 'react';
import Footer from './components/Footer';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  
  // পেজ নেভিগেশন স্টেট ('home', 'teachers', 'students', 'gallery', 'contact', 'about', 'notice', 'teacherPanel', 'adminPanel', 'superAdminPanel')
  const [currentView, setCurrentView] = useState('home');

  // সুপার এডমিন কন্ট্রোল স্টেট
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState("পর্যাপ্ত পরিমাণ ছাত্র-ছাত্রী বুকিং হওয়ায় আর কোনো সিট খালি নাই।");
  const [isAdminMode, setIsAdminMode] = useState(false);

  // রোল ও পারমিশন ম্যানেজমেন্ট স্টেট
  const [userRole, setUserRole] = useState('superAdmin'); // 'superAdmin', 'admin', 'teacher'
  const [managedUsers, setManagedUsers] = useState([
    { id: 1, name: 'মাওলানা আব্দুল্লাহ আল মামুন', role: 'admin', canEdit: true, canManageAdmission: true },
    { id: 2, name: 'হাফিজ মাওলানা জোবায়ের আহমেদ', role: 'teacher', canEdit: false, canManageAdmission: false },
    { id: 3, name: 'শিক্ষিকা ফাতেমা খাতুন', role: 'teacher', canEdit: false, canManageAdmission: false }
  ]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('teacher');
  const [newUserCanEdit, setNewUserCanEdit] = useState(false);
  const [newUserCanAdmission, setNewUserCanAdmission] = useState(false);

  // সুপার এডমিন দ্বারা পরিবর্তনযোগ্য কনটেন্ট স্টেট
  const [headmasterName, setHeadmasterName] = useState("Arif Ashab Khorshed");
  const [contactNumber, setContactNumber] = useState("+8801521-553003");
  const [totalMaleStudents, setTotalMaleStudents] = useState("২৫০");
  const [totalFemaleStudents, setTotalFemaleStudents] = useState("২২০");

  // ফরম ও ভেরিফিকেশন স্টেট
  const [formStep, setFormStep] = useState(1);
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

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUserName) return;
    if (userRole === 'admin' && newUserRole === 'superAdmin') {
      alert("এডমিন কখনো সুপার এডমিন পদের কাউকে তৈরি করতে পারে না!");
      return;
    }
    setManagedUsers([
      ...managedUsers,
      {
        id: Date.now(),
        name: newUserName,
        role: newUserRole,
        canEdit: newUserCanEdit,
        canManageAdmission: newUserCanAdmission
      }
    ]);
    setNewUserName('');
    setNewUserCanEdit(false);
    setNewUserCanAdmission(false);
    alert("নতুন ব্যবহারকারী সফলভাবে যুক্ত হয়েছে!");
  };

  const handleUpdateUserPermission = (id, field, value) => {
    setManagedUsers(managedUsers.map(user => {
      if (user.id === id) {
        if (user.role === 'superAdmin' && userRole !== 'superAdmin') {
          alert("এডমিন সুপার এডমিনের পারমিশন পরিবর্তন করতে পারে না!");
          return user;
        }
        return { ...user, [field]: value };
      }
      return user;
    }));
  };

  const whatsappNumber = "8801918568313";

  // শিক্ষকবৃন্দের ডেমো ডাটা
  const teachersList = [
    { name: "Arif Ashab Khorshed", phone: "+8801521-553003", designation: "প্রধান শিক্ষক ও পরিচালক", edu: "এম.এ (মাস্টার্স), কামিল", subject: "আল-কুরআন ও হাদিস", photo: "https://i.postimg.cc/xd8py0DW/1786523361131.jpg" },
    { name: "মাওলানা আব্দুল্লাহ আল মামুন", phone: "+8801700-000001", designation: "সহকারী প্রধান শিক্ষক", edu: "বি.এ (অনার্স), দাওরায়ে হাদিস", subject: "আরবি ও আকাইদ", photo: "https://i.postimg.cc/gjktXPpH/1786523361131.jpg" },
    { name: "হাফিজ মাওলানা জোবায়ের আহমেদ", phone: "+8801800-000002", designation: "হিফজ বিভাগ প্রধান", edu: "হাফেজ ও ক্বারী", subject: "হিফজুল কুরআন ও তাজবীদ", photo: "https://i.postimg.cc/gjktXPpH/1786523361131.jpg" },
    { name: "শিক্ষিকা ফাতেমা খাতুন", phone: "+8801900-000003", designation: "সহকারী শিক্ষক", edu: "বি.এস.সি (গণিত)", subject: "গণিত ও ইংরেজি", photo: "https://i.postimg.cc/gjktXPpH/1786523361131.jpg" }
  ];

  // প্লে থেকে ১০ম শ্রেণি তালিকা ও টপ ৩ শিক্ষার্থী
  const classesList = [
    "প্লে শ্রেণি", "নার্সারি", "প্রথম শ্রেণি", "দ্বিতীয় শ্রেণি", "তৃতীয় শ্রেণি", 
    "চতুর্থ শ্রেণি", "পঞ্চম শ্রেণি", "ষষ্ঠ শ্রেণি", "সপ্তম শ্রেণি", "অষ্টম শ্রেণি", "নবম শ্রেণি", "দশম শ্রেণি"
  ];

  // গ্যালারি ফোল্ডারসমূহ
  const galleryFolders = [
    { title: "ক্লাসরুমের ছবি", count: "১২টি ছবি", cover: "https://i.postimg.cc/xd8py0DW/1786523361131.jpg" },
    { title: "বার্ষিক পিকনিক", count: "২৫টি ছবি", cover: "https://i.postimg.cc/xd8py0DW/1786523361131.jpg" },
    { title: "ওয়াজ-মাহফিল", count: "১৮টি ছবি", cover: "https://i.postimg.cc/xd8py0DW/1786523361131.jpg" },
    { title: "সাংস্কৃতিক অনুষ্ঠান", count: "৩০টি ছবি", cover: "https://i.postimg.cc/xd8py0DW/1786523361131.jpg" }
  ];

  return (
    <div style={{ fontFamily: "'Hind Siliguri', 'Segoe UI', sans-serif", backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh', margin: 0, padding: 0, position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; scroll-behavior: smooth; }
        .nav-link { color: #334155; text-decoration: none; font-weight: 600; transition: color 0.2s; cursor: pointer; display: block; padding: 6px 0; }
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
        .premium-badge {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 4px 10px rgba(245, 158, 11, 0.5);
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          border: 2px solid white;
          z-index: 10;
        }
      `}</style>

      {/* টপ কন্টাক্ট বার */}
      <div style={{ backgroundColor: '#14532d', color: '#f0fdf4', padding: '8px 20px', fontSize: '13px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>📍 চিলমারী, কুড়িগ্রাম, বাংলাদেশ</div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>📞 যোগাযোগ: <a href={`tel:${contactNumber}`} style={{ color: '#ffffff', fontWeight: 'bold', textDecoration: 'none' }}>{contactNumber}</a></span>
          </div>
        </div>
      </div>

      {/* নেভিগেশন বার */}
      <nav style={{ backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setCurrentView('home')}>
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

        {/* ৩-লাইন মেনুবার ড্রপডাউন (নতুন অপশনসহ) */}
        {mobileMenuOpen && (
          <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <span className="nav-link" onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}>হোম</span>
            <span className="nav-link" onClick={() => { setCurrentView('about'); setMobileMenuOpen(false); }}>প্রধান শিক্ষকের বাণী</span>
            <span className="nav-link" onClick={() => { setCurrentView('teachers'); setMobileMenuOpen(false); }}>শিক্ষকবৃন্দ</span>
            <span className="nav-link" onClick={() => { setCurrentView('students'); setMobileMenuOpen(false); }}>ছাত্র-ছাত্রী</span>
            <span className="nav-link" onClick={() => { setCurrentView('notice'); setMobileMenuOpen(false); }}>নোটিশ বোর্ড</span>
            <span className="nav-link" onClick={() => { setCurrentView('gallery'); setMobileMenuOpen(false); }}>গ্যালারি</span>
            <span className="nav-link" onClick={() => { setCurrentView('contact'); setMobileMenuOpen(false); }}>যোগাযোগ</span>
            
            {/* নতুন যোগ করা প্যানেলসমূহ (রোল ভিত্তিক ভিজিবিলিটি) */}
            {(userRole === 'teacher' || userRole === 'admin' || userRole === 'superAdmin') && (
              <span className="nav-link" style={{ color: '#16a34a', fontWeight: 'bold' }} onClick={() => { setCurrentView('teacherPanel'); setMobileMenuOpen(false); }}>👨‍🏫 টিচার প্যানেল</span>
            )}
            {(userRole === 'admin' || userRole === 'superAdmin') && (
              <span className="nav-link" style={{ color: '#0369a1', fontWeight: 'bold' }} onClick={() => { setCurrentView('adminPanel'); setMobileMenuOpen(false); }}>🛠️ এডমিন প্যানেল</span>
            )}
            {userRole === 'superAdmin' && (
              <span className="nav-link" style={{ color: '#b45309', fontWeight: 'bold' }} onClick={() => { setCurrentView('superAdminPanel'); setMobileMenuOpen(false); }}>⚙️ সুপার এডমিন প্যানেল</span>
            )}

            <button onClick={() => { setMobileMenuOpen(false); setIsAdmissionModalOpen(true); }} className="btn-primary" style={{ width: '100%', textAlign: 'center', marginTop: '6px' }}>অনলাইন ভর্তি</button>
            
            {/* রোল সিলেকশন ও সুপার এডমিন কন্ট্রোল বাটন */}
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>লগইন রোল পরিবর্তন (সিমুলেশন):</span>
                <select 
                  value={userRole} 
                  onChange={(e) => setUserRole(e.target.value)} 
                  style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#f8fafc', fontWeight: 'bold', marginTop: '2px' }}
                >
                  <option value="superAdmin">সুপার এডমিন (সব ক্ষমতা)</option>
                  <option value="admin">এডমিন (সীমিত ক্ষমতা)</option>
                  <option value="teacher">টিচার (শুধু টিচার প্যানেল)</option>
                </select>
              </div>

              {userRole === 'superAdmin' && (
                <button 
                  onClick={() => setIsAdminMode(!isAdminMode)} 
                  style={{ background: '#0f172a', color: '#f8fafc', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', width: '100%', fontWeight: '600' }}
                >
                  {isAdminMode ? '🔒 সুপার এডমিন সেটিংস বন্ধ করুন' : '⚙️ সুপার এডমিন সেটিংস (খুলুন)'}
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* সুপার এডমিন কন্ট্রোল প্যানেল */}
      {isAdminMode && userRole === 'superAdmin' && (
        <div style={{ background: '#fef3c7', borderBottom: '2px solid #f59e0b', padding: '16px 20px', fontSize: '14px', zIndex: 100, position: 'relative' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <strong>🛠️ সুপার এডমিন কন্ট্রোল প্যানেল (মেনু ও কন্টেন্ট নিয়ন্ত্রণ):</strong>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isAdmissionOpen} 
                  onChange={(e) => setIsAdmissionOpen(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                ভর্তি ফরম অন রাখুন (Form Open/Close)
              </label>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>প্রধান শিক্ষকের নাম:</span>
                <input type="text" value={headmasterName} onChange={(e) => setHeadmasterName(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d97706' }} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>যোগাযোগ নম্বর:</span>
                <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d97706' }} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>মোট ছাত্র সংখ্যা:</span>
                <input type="text" value={totalMaleStudents} onChange={(e) => setTotalMaleStudents(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d97706' }} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>মোট ছাত্রী সংখ্যা:</span>
                <input type="text" value={totalFemaleStudents} onChange={(e) => setTotalFemaleStudents(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d97706' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600' }}>বন্ধকালীন নোটিশ মেসেজ:</span>
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

      {/* রেন্ডারিং পেজ লজিক */}
      {currentView === 'home' && (
        <>
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
                <a href={`tel:${contactNumber}`} className="btn-primary" style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
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
                      alt={headmasterName} 
                      style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #16a34a', boxShadow: '0 6px 16px rgba(0,0,0,0.15)' }}
                    />
                  </div>
                  <h3 style={{ margin: '12px 0 2px 0', fontSize: '20px', color: '#0f172a', fontWeight: '700' }}>{headmasterName}</h3>
                  <span className="badge">প্রধান শিক্ষক ও পরিচালক</span>
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
        </>
      )}

      {/* নতুন পেজ ১: প্রধান শিক্ষকের বাণী */}
      {currentView === 'about' && (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ color: '#14532d', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: 0 }}>প্রধান শিক্ষকের বাণী</h2>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src="https://i.postimg.cc/xd8py0DW/1786523361131.jpg" alt={headmasterName} style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #16a34a' }} />
              <h3 style={{ margin: '10px 0 4px 0' }}>{headmasterName}</h3>
              <span className="badge">প্রধান শিক্ষক ও পরিচালক</span>
            </div>
            <p style={{ lineHeight: '1.8', color: '#334155', fontSize: '15px' }}>
              "বিসমিল্লাহির রহমানির রহিম। চিলমারী প্রি ক্যাডেট মাদ্রাসায় আপনাকে জানাই আন্তরিক শুভেচ্ছা। আমাদের সুনির্দিষ্ট লক্ষ্য হলো কোমলমতি শিশুদের ধর্মীয় মূল্যবোধ, উত্তম চরিত্র এবং আধুনিক শিক্ষার মাধ্যমে এক আদর্শ সুনাগরিক হিসেবে গড়ে তোলা। অভিজ্ঞ শিক্ষক মণ্ডলীর পরম মমতায় আমরা শিক্ষার্থীদের মেধা ও সুপ্ত প্রতিভার বিকাশে সততার সাথে দায়িত্ব পালন করে যাচ্ছি।"
            </p>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {/* নতুন পেজ ২: শিক্ষকবৃন্দ */}
      {currentView === 'teachers' && (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <span className="badge">সম্মানিত শিক্ষক মণ্ডলী</span>
            <h2 style={{ color: '#14532d', margin: '10px 0 6px 0' }}>মাদ্রাসার শিক্ষক-শিক্ষিকাবৃন্দ</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>আমাদের অভিজ্ঞ ও দক্ষ শিক্ষকগণের বিস্তারিত তালিকা</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {teachersList.map((t, index) => (
              <div key={index} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <img 
                  src={t.photo} 
                  alt={t.name} 
                  style={{ width: '120px', height: '120px', borderRadius: '10px', objectFit: 'cover', border: '3px solid #16a34a', marginBottom: '14px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
                />
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>{t.name}</h3>
                <span style={{ color: '#15803d', fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>{t.designation}</span>
                
                <div style={{ width: '100%', textAlign: 'left', borderTop: '1px solid #f1f5f9', paddingTop: '10px', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><strong>📞 নম্বর:</strong> <a href={`tel:${t.phone}`} style={{ color: '#16a34a', textDecoration: 'none' }}>{t.phone}</a></div>
                  <div><strong>🎓 শিক্ষাগত যোগ্যতা:</strong> {t.edu}</div>
                  <div><strong>📚 বিষয়:</strong> {t.subject}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
          </div>
        </div>
      )}

      {/* নতুন পেজ ৩: ছাত্র-ছাত্রী */}
      {currentView === 'students' && (
        <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <span className="badge">মেধাবী মুখসমূহ</span>
            <h2 style={{ color: '#14532d', margin: '10px 0 10px 0' }}>ছাত্র-ছাত্রী ও ক্লাসের শীর্ষ স্থানাধিকারীগণ</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '10px' }}>
              <div className="card" style={{ padding: '12px 24px', background: '#dcfce7', color: '#14532d', fontWeight: 'bold' }}>
                👦 মোট ছাত্র: {totalMaleStudents} জন
              </div>
              <div className="card" style={{ padding: '12px 24px', background: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' }}>
                👧 মোট ছাত্রী: {totalFemaleStudents} জন
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {classesList.map((className, cIndex) => (
              <div key={cIndex} className="card" style={{ borderLeft: '5px solid #16a34a' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#166534', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
                  📚 {className} — (সেরা শীর্ষ ৩ জন শিক্ষার্থী)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                  {[1, 2, 3].map((rank) => (
                    <div key={rank} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', position: 'relative', textAlign: 'center' }}>
                      <div className="premium-badge">{rank}</div>

                      <img 
                        src="https://i.postimg.cc/xd8py0DW/1786523361131.jpg" 
                        alt="Student" 
                        style={{ width: '90px', height: '90px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #cbd5e1', margin: '10px 0' }} 
                      />

                      <div style={{ textAlign: 'left', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div><strong>নাম:</strong> {rank === 1 ? 'রাকিবুল ইসলাম' : rank === 2 ? 'ফাতিমা তুজ জোহরা' : 'আব্দুল্লাহ আল নোমান'}</div>
                        <div><strong>বাবার নাম:</strong> মো. রফিকুল ইসলাম</div>
                        <div><strong>মায়ের নাম:</strong> পারভীন বেগম</div>
                        <div><strong>গ্রাম:</strong> চিলমারী সদর</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
          </div>
        </div>
      )}

      {/* নতুন পেজ ৪: নোটিশ বোর্ড */}
      {currentView === 'notice' && (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ color: '#14532d', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: 0 }}>নোটিশ বোর্ড</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              <div style={{ padding: '16px', borderRadius: '10px', background: '#f8fafc', borderLeft: '4px solid #16a34a' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>আগামী ১ জানুয়ারি থেকে</span>
                <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '600' }}>২০২৬-২৭ শিক্ষাবর্ষের নতুন ভর্তি ফরম অনলাইন ও অফিসে পাওয়া যাচ্ছে।</p>
              </div>
              <div style={{ padding: '16px', borderRadius: '10px', background: '#f8fafc', borderLeft: '4px solid #eab308' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>১০ জানুয়ারি পর্যন্ত</span>
                <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '600' }}>আবেদন ফরম গ্রহণ চলবে। বিস্তারিত তথ্যের জন্য যোগাযোগ করুন।</p>
              </div>
            </div>
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {/* নতুন পেজ ৫: গ্যালারি */}
      {currentView === 'gallery' && (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <span className="badge">ফটো গ্যালারি</span>
            <h2 style={{ color: '#14532d', margin: '10px 0 6px 0' }}>মাদ্রাসার বিভিন্ন কার্যক্রম ও ফোল্ডার</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>আমাদের বিভিন্ন ইভেন্ট ও ক্লাসরুমের ছবিসমূহ</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {galleryFolders.map((folder, index) => (
              <div key={index} className="card" style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📁</div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>{folder.title}</h3>
                <span style={{ color: '#64748b', fontSize: '13px' }}>{folder.count}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
          </div>
        </div>
      )}

      {/* নতুন পেজ ৬: যোগাযোগ */}
      {currentView === 'contact' && (
        <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <img 
              src="https://i.postimg.cc/gjktXPpH/1786523361131.jpg" 
              alt="Headmaster" 
              style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #16a34a', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', margin: '0 auto 20px auto' }} 
            />
            
            <h2 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 6px 0', fontWeight: '800' }}>প্রধান শিক্ষক ও পরিচালক</h2>
            <h3 style={{ fontSize: '18px', color: '#166534', margin: '0 0 16px 0' }}>{headmasterName}</h3>
            
            <p style={{ fontSize: '16px', color: '#334155', margin: '0 0 24px 0' }}>
              নাস্বার: <a href={`tel:${contactNumber}`} style={{ color: '#16a34a', fontWeight: 'bold', textDecoration: 'none' }}>{contactNumber}</a>
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={`tel:${contactNumber}`} className="btn-primary">📞 কল করুন</a>
              <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {/* নতুন প্যানেল ১: টিচার প্যানেল */}
      {currentView === 'teacherPanel' && (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ color: '#166534', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: 0 }}>👨‍🏫 টিচার প্যানেল</h2>
            <p style={{ color: '#334155', fontSize: '15px' }}>স্বাগতম! আপনি শিক্ষক হিসেবে এই প্যানেলটি দেখতে পাচ্ছেন। এখান থেকে আপনি আপনার ক্লাসের উপস্থিতি, সিলেবাস এবং শিক্ষার্থীদের অগ্রগতি দেখতে পারবেন।</p>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#166534' }}>শিক্ষক নির্দেশিকা:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>দৈনিক হাজিরা ও ক্লাস নোট আপডেট করুন।</li>
                <li>নোটিশ বোর্ডে প্রয়োজনীয় তথ্য যুক্ত করুন।</li>
                <li>সুপার এডমিন বা এডমিনের দেওয়া অনুমতি অনুযায়ী কাজ করুন।</li>
              </ul>
            </div>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {/* নতুন প্যানেল ২: এডমিন প্যানেল */}
      {currentView === 'adminPanel' && (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ color: '#0369a1', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: 0 }}>🛠️ এডমিন প্যানেল</h2>
            <p style={{ color: '#334155', fontSize: '15px' }}>এডমিন ড্যাশবোর্ড থেকে আপনি শিক্ষক ও শিক্ষার্থীদের কার্যক্রম পরিচালনা করতে পারেন। আপনি চাইলে যেকোনো ব্যবহারকারীকে টিচার বা এডমিন পারমিশন দিতে পারেন (তবে সুপার এডমিনের ক্ষমতার ওপর হস্তক্ষেপ করতে পারবেন না)।</p>

            <div style={{ marginTop: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#0369a1' }}>ব্যবহারকারী ও শিক্ষক পারমিশন ম্যানেজমেন্ট:</h4>
              <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <input 
                  type="text" 
                  placeholder="ব্যবহারকারীর নাম" 
                  value={newUserName} 
                  onChange={(e) => setNewUserName(e.target.value)} 
                  required
                  style={{ flex: 2, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
                <select 
                  value={newUserRole} 
                  onChange={(e) => setNewUserRole(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  <option value="teacher">টিচার</option>
                  <option value="admin">এডমিন</option>
                </select>
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>যুক্ত করুন</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {managedUsers.map((u) => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong>{u.name}</strong> <span className="badge" style={{ marginLeft: '6px' }}>{u.role === 'admin' ? 'এডমিন' : 'টিচার'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={u.canEdit} 
                          onChange={(e) => handleUpdateUserPermission(u.id, 'canEdit', e.target.checked)} 
                        />
                        এডিট পারমিশন
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={u.canManageAdmission} 
                          onChange={(e) => handleUpdateUserPermission(u.id, 'canManageAdmission', e.target.checked)} 
                        />
                        ভর্তি ম্যানেজমেন্ট
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {/* নতুন প্যানেল ৩: সুপার এডমিন প্যানেল */}
      {currentView === 'superAdminPanel' && (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card" style={{ border: '2px solid #f59e0b' }}>
            <h2 style={{ color: '#b45309', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: 0 }}>⚙️ সুপার এডমিন প্যানেল (A to Z নিয়ন্ত্রণ)</h2>
            <p style={{ color: '#334155', fontSize: '15px' }}>আপনি সুপার এডমিন হিসেবে সিস্টেমের সর্বময় ক্ষমতার অধিকারী। এখান থেকে আপনি যেকোনো ইউজারকে এডমিন বা টিচার রোল দিতে পারবেন এবং নির্দিষ্ট ক্ষমতা (Checkboxes) বা কাজ ভাগ করে দিতে পারবেন। কোনো এডমিন বা টিচার আপনার ক্ষমতার ওপর কোনো প্রভাব ফেলতে পারবে না।</p>

            <div style={{ marginTop: '20px', background: '#fef3c7', padding: '16px', borderRadius: '12px', border: '1px solid #f59e0b' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#b45309' }}>পূর্ণাঙ্গ ইউজার ও পারমিশন ডেলিগেশন (Super Admin Controls):</h4>
              
              <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <input 
                  type="text" 
                  placeholder="নতুন ইউজারের নাম" 
                  value={newUserName} 
                  onChange={(e) => setNewUserName(e.target.value)} 
                  required
                  style={{ flex: 2, padding: '8px', borderRadius: '6px', border: '1px solid #d97706', fontSize: '14px' }}
                />
                <select 
                  value={newUserRole} 
                  onChange={(e) => setNewUserRole(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #d97706', fontSize: '14px' }}
                >
                  <option value="teacher">টিচার</option>
                  <option value="admin">এডমিন</option>
                  <option value="superAdmin">সুপার এডমিন</option>
                </select>
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px', background: '#d97706' }}>ইউজার যুক্ত করুন</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {managedUsers.map((u) => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fcd34d', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong>{u.name}</strong> 
                      <span className="badge" style={{ marginLeft: '6px', background: u.role === 'superAdmin' ? '#f59e0b' : '#dcfce7', color: u.role === 'superAdmin' ? 'white' : '#15803d' }}>
                        {u.role === 'superAdmin' ? 'সুপার এডমিন' : u.role === 'admin' ? 'এডমিন' : 'টিচার'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={u.canEdit} 
                          onChange={(e) => handleUpdateUserPermission(u.id, 'canEdit', e.target.checked)} 
                        />
                        এডিট ক্ষমতা
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={u.canManageAdmission} 
                          onChange={(e) => handleUpdateUserPermission(u.id, 'canManageAdmission', e.target.checked)} 
                        />
                        ভর্তি ম্যানেজমেন্ট
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

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

            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px', marginBottom: '16px', fontSize: '13px', color: '#166534', lineHeight: '1.6' }}>
              <div style={{ fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📢</span> বিশেষ নোটিশ:
              </div>
              আগামী ১ জানুয়ারি থেকে ভর্তি চলছে আপনার সন্তানকে আমাদের প্রি ক্যাডেট মাদ্রাসায় ভর্তি করতে এখনি আবেদন করুন। আগামি ১০ জানুয়ারী থেকে আবেদন ফরম বন্ধ হবে।
              <div style={{ marginTop: '8px', textAlign: 'right', fontWeight: '600', fontStyle: 'italic', fontSize: '12px', color: '#14532d' }}>
                আদেশ ক্রমে প্রধান শিক্ষক<br/>
                {headmasterName}
              </div>
            </div>

            {!isAdmissionOpen ? (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '30px 20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚠️</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>আবেদন ফরম বন্ধ রয়েছে</h4>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>{closedMessage}</p>
              </div>
            ) : (
              <div>
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

                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#1e293b' }}>📷 ছাত্র বা ছাত্রীর ছবি (লাইভ ক্যামেরা দিয়ে তুলুন)</label>
                        <input type="file" name="studentPhoto" accept="image/*" capture="environment" required onChange={handleFileChange} style={{ fontSize: '12px', width: '100%' }} />
                        {formData.studentPhoto && <span style={{ fontSize: '11px', color: '#16a34a' }}>✓ ছবি সিলেক্ট হয়েছে</span>}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#1e293b' }}>📷 জন্ম নিবন্ধনের ছবি (লাইভ ক্যামেরা)</label>
                        <input type="file" name="birthCertPhoto" accept="image/*" capture="environment" required onChange={handleFileChange} style={{ fontSize: '12px', width: '100%' }} />
                        {formData.birthCertPhoto && <span style={{ fontSize: '11px', color: '#16a34a' }}>✓ ছবি সিলেক্ট হয়েছে</span>}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#1e293b' }}>📷 বাবার NID কার্ডের ছবি (লাইভ ক্যামেরা)</label>
                        <input type="file" name="fatherNidPhoto" accept="image/*" capture="environment" required onChange={handleFileChange} style={{ fontSize: '12px', width: '100%' }} />
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

                {formStep === 2 && (
                  <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '10px 0' }}>
                    <div>
                      <span className="badge">ওটিপি ভেরিফিকেশন</span>
                      <h3 style={{ fontSize: '18px', color: '#166534', margin: '8px 0 4px 0' }}>কোড ইনপুট করুন</h3>
                      <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                        আপনার <strong style={{ color: '#0f172a' }}>{formData.phone}</strong> নম্বরে পাঠানো ৫ সংখ্যার কোডটি নিচে লিখুন:
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

                {formStep === 3 && (
                  <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#14532d', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>আবেদন সফলভাবে ভেরিফাই ও জমা হয়েছে!</h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '13px', lineHeight: '1.6' }}>
                      আপনার আবেদনপত্র সফলভাবে সুপার এডমিন, এডমিন এবং সংশ্লিষ্ট শিক্ষকের প্যানেলে প্রেরিত হয়েছে।
                    </p>
                    <button onClick={() => setIsAdmissionModalOpen(false)} className="btn-primary" style={{ fontSize: '14px', padding: '10px 20px' }}>
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
