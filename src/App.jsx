import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Footer from './components/Footer';
import AdmissionForm from './components/AdmissionForm';
import Gallery from './components/Gallery';
import SignInModal from './components/SignInModal';
import StudentList from './components/StudentList';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminPermissionManager from './components/AdminPermissionManager';
import TeacherManagement from './components/TeacherManagement';
import ContactPage from './components/ContactPage';
import NotificationSystem from './components/NotificationSystem';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  
  // =============================================
  // ✅ ডাইরেক্ট সুপার এডমিন চেক - AuthContext ছাড়া
  // =============================================
  const [user, setUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // =============================================
  // ✅ এডমিন লগইন স্টেট
  // =============================================
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);

  const [siteData, setSiteData] = useState({
    headmasterName: "Arif Ashab Khorshed",
    contactNumber: "+8801521-553003",
    totalMaleStudents: "২৫০",
    totalFemaleStudents: "২২০"
  });

  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(true);

  const [isAdmissionOpen, setIsAdmissionOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState("পর্যাপ্ত পরিমাণ ছাত্র-ছাত্রী বুকিং হওয়ায় আর কোনো সিট খালি নাই।");
  const [isAdminMode, setIsAdminMode] = useState(false);

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

  // =============================================
  // ✅ ইউজার রোল চেক ফাংশন (ডাইরেক্ট)
  // =============================================
  const checkUserRole = async (userId) => {
    try {
      // ১. প্রোফাইল চেক
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      setProfile(profileData);

      // ২. রোল চেক
      const { data: roles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId);

      const roleNames = roles?.map(r => r.roles?.name) || [];
      
      console.log('✅ Direct Role Check:', roleNames);
      
      setIsSuperAdmin(roleNames.includes('super_admin'));
      setIsAdmin(roleNames.includes('admin') || roleNames.includes('super_admin'));
      setIsTeacher(roleNames.includes('teacher') || roleNames.includes('admin') || roleNames.includes('super_admin'));

      return true;
    } catch (error) {
      console.error('Role check error:', error);
      return false;
    }
  };

  // =============================================
  // ✅ সেশন চেক
  // =============================================
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        await checkUserRole(session.user.id);
      } else {
        setUser(null);
        setIsSuperAdmin(false);
        setIsAdmin(false);
        setIsTeacher(false);
        setProfile(null);
      }
      setLoading(false);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth Event:', event);
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          await checkUserRole(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsSuperAdmin(false);
          setIsAdmin(false);
          setIsTeacher(false);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // =============================================
  // ✅ অন্যান্য useEffect
  // =============================================
  useEffect(() => {
    fetchSiteContents();
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setTeachersLoading(true);
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('name', { ascending: true });
    
    if (data) setTeachers(data);
    setTeachersLoading(false);
  };

  const fetchSiteContents = async () => {
    const { data, error } = await supabase.from('site_contents').select('*');
    if (data) {
      const formattedData = {};
      data.forEach(item => {
        formattedData[item.key] = item.value;
      });
      setSiteData(prev => ({ ...prev, ...formattedData }));
      if (formattedData.closed_message) setClosedMessage(formattedData.closed_message);
    }
  };

  // =============================================
  // ✅ এডমিন লগইন
  // =============================================
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoginError('');
    setAdminLoginLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

      if (error) {
        setAdminLoginError('❌ লগইন ব্যর্থ: ' + error.message);
        setAdminLoginLoading(false);
        return;
      }

      if (data.user) {
        setUser(data.user);
        await checkUserRole(data.user.id);
        alert("✅ সফলভাবে লগইন হয়েছে!");
        setCurrentView('home');
        setAdminEmail('');
        setAdminPassword('');
        setMobileMenuOpen(false);
      }
    } catch (err) {
      setAdminLoginError('❌ লগইন ব্যর্থ: ' + err.message);
    } finally {
      setAdminLoginLoading(false);
    }
  };

  // =============================================
  // ✅ লগআউট
  // =============================================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsSuperAdmin(false);
    setIsAdmin(false);
    setIsTeacher(false);
    setProfile(null);
    setCurrentView('home');
    alert("লগআউট সফল হয়েছে।");
  };

  const handleUpdateSiteContent = async (key, value) => {
    const { error } = await supabase.from('site_contents').upsert({ key, value });
    if (!error) {
      setSiteData(prev => ({ ...prev, [key]: value }));
    }
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

  // =============================================
  // ✅ রেন্ডার
  // =============================================
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
        .live-chat-btn { position: fixed; bottom: 25px; right: 25px; background-color: #25D366; color: white; border-radius: 50px; padding: 12px 20px; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 20px rgba(37, 211, 102, 0.4); text-decoration: none; font-weight: bold; font-size: 14px; z-index: 1000; transition: all 0.3s ease; }
        .live-chat-btn:hover { transform: scale(1.05); box-shadow: 0 12px 25px rgba(37, 211, 102, 0.6); }
        .teacher-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }
        .teacher-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        .teacher-photo {
          width: 120px;
          height: 120px;
          border-radius: 12px;
          object-fit: cover;
          border: 3px solid #16a34a;
          margin: 0 auto 12px auto;
          display: block;
        }
        .teacher-name { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
        .teacher-designation { color: #15803d; font-weight: 600; font-size: 14px; margin-bottom: 8px; }
        .teacher-details { font-size: 13px; color: #334155; border-top: 1px solid #f1f5f9; padding-top: 10px; margin-top: 8px; }
        .teacher-details div { margin: 2px 0; }
        .admin-login-box {
          background: #f0fdf4;
          border: 2px solid #16a34a;
          border-radius: 12px;
          padding: 16px;
          margin-top: 12px;
        }
        .admin-login-box input {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 13px;
          margin-bottom: 8px;
        }
        .admin-login-box .login-btn {
          background: #16a34a;
          color: white;
          border: none;
          padding: 8px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
        }
        .admin-login-box .login-btn:hover {
          background: #15803d;
        }
        .admin-login-box .error-text {
          color: #dc2626;
          font-size: 12px;
          margin-top: 4px;
        }
        .super-admin-float-btn {
          position: fixed;
          bottom: 90px;
          right: 20px;
          z-index: 9999;
          background: linear-gradient(135deg, #b45309, #92400e);
          color: white;
          padding: 14px 22px;
          border-radius: 50px;
          box-shadow: 0 6px 20px rgba(180, 83, 9, 0.5);
          font-weight: 700;
          cursor: pointer;
          border: none;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }
        .super-admin-float-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(180, 83, 9, 0.7);
        }
      `}</style>

      {/* টপ বার */}
      <div style={{ backgroundColor: '#14532d', color: '#f0fdf4', padding: '8px 20px', fontSize: '13px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>📍 চিলমারী, কুড়িগ্রাম, বাংলাদেশ</div>
          <div><span>📞 যোগাযোগ: <a href={`tel:${siteData.contactNumber}`} style={{ color: '#ffffff', fontWeight: 'bold', textDecoration: 'none' }}>{siteData.contactNumber}</a></span></div>
        </div>
      </div>

      {/* নেভিগেশন */}
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
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', color: '#1e293b' }}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {mobileMenuOpen && (
          <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <span className="nav-link" onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}>হোম</span>
            <span className="nav-link" onClick={() => { setCurrentView('about'); setMobileMenuOpen(false); }}>প্রধান শিক্ষকের বাণী</span>
            <span className="nav-link" onClick={() => { setCurrentView('teachers'); setMobileMenuOpen(false); }}>শিক্ষকবৃন্দ</span>
            <span className="nav-link" onClick={() => { setCurrentView('students'); setMobileMenuOpen(false); }}>ছাত্র-ছাত্রী</span>
            <span className="nav-link" onClick={() => { setCurrentView('gallery'); setMobileMenuOpen(false); }}>গ্যালারি</span>
            <span className="nav-link" onClick={() => { setCurrentView('contact'); setMobileMenuOpen(false); }}>যোগাযোগ</span>
            
            <span className="nav-link" style={{ color: '#2563eb', fontWeight: 'bold' }} onClick={() => { setMobileMenuOpen(false); setIsSignInModalOpen(true); }}>
              📝 ছাত্র/শিক্ষক সাইন ইন
            </span>

            {!user ? (
              <div className="admin-login-box">
                <div style={{ fontWeight: 'bold', color: '#166534', marginBottom: '8px', fontSize: '14px' }}>🔑 এডমিন লগইন</div>
                <form onSubmit={handleAdminLogin}>
                  <input type="email" placeholder="এডমিন ইমেইল" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                  <input type="password" placeholder="পাসওয়ার্ড" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
                  {adminLoginError && <div className="error-text">{adminLoginError}</div>}
                  <button type="submit" className="login-btn" disabled={adminLoginLoading}>
                    {adminLoginLoading ? '⏳ লগইন হচ্ছে...' : '🚀 এডমিন লগইন'}
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#16a34a' }}>
                  👤 {profile?.name || user.email} 
                  <span style={{ marginLeft: '8px', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', background: isSuperAdmin ? '#fef3c7' : '#dcfce7', color: isSuperAdmin ? '#b45309' : '#15803d' }}>
                    {isSuperAdmin ? 'সুপার এডমিন' : isAdmin ? 'এডমিন' : isTeacher ? 'টিচার' : 'ইউজার'}
                  </span>
                </span>
                <span className="nav-link" style={{ color: '#2563eb', fontWeight: 'bold' }} onClick={() => { setCurrentView('notifications'); setMobileMenuOpen(false); }}>🔔 নোটিফিকেশন</span>
                {(isTeacher || isAdmin || isSuperAdmin) && <span className="nav-link" style={{ color: '#16a34a', fontWeight: 'bold' }} onClick={() => { setCurrentView('teacherPanel'); setMobileMenuOpen(false); }}>👨‍🏫 টিচার প্যানেল</span>}
                {(isAdmin || isSuperAdmin) && <span className="nav-link" style={{ color: '#0369a1', fontWeight: 'bold' }} onClick={() => { setCurrentView('adminPanel'); setMobileMenuOpen(false); }}>🛠️ এডমিন প্যানেল</span>}
                {isSuperAdmin && (
                  <>
                    <span className="nav-link" style={{ color: '#b45309', fontWeight: 'bold' }} onClick={() => { setCurrentView('superAdminPanel'); setMobileMenuOpen(false); }}>⚙️ সুপার এডমিন প্যানেল</span>
                    <span className="nav-link" style={{ color: '#7c3aed', fontWeight: 'bold' }} onClick={() => { setCurrentView('adminPermissionManager'); setMobileMenuOpen(false); }}>🛡️ এডমিন পারমিশন</span>
                    <button onClick={() => setIsAdminMode(!isAdminMode)} style={{ background: '#0f172a', color: '#f8fafc', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', width: '100%', fontWeight: '600' }}>
                      {isAdminMode ? '🔒 সুপার এডমিন সেটিংস বন্ধ করুন' : '⚙️ সুপার এডমিন সেটিংস (খুলুন)'}
                    </button>
                  </>
                )}
                <button onClick={handleLogout} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>লগআউট করুন</button>
              </div>
            )}

            <button onClick={() => { setMobileMenuOpen(false); setIsAdmissionModalOpen(true); }} className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>অনলাইন ভর্তি</button>
          </div>
        )}
      </nav>

      {/* সুপার এডমিন কন্ট্রোল */}
      {isAdminMode && isSuperAdmin && (
        <div style={{ background: '#fef3c7', borderBottom: '2px solid #f59e0b', padding: '16px 20px', fontSize: '14px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <strong>🛠️ সুপার এডমিন লাইভ কন্ট্রোল:</strong>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              <input type="checkbox" checked={isAdmissionOpen} onChange={(e) => setIsAdmissionOpen(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              ভর্তি ফরম অন রাখুন
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div><span style={{ fontSize: '11px', fontWeight: 'bold' }}>প্রধান শিক্ষকের নাম:</span>
                <input type="text" value={siteData.headmasterName || ""} onChange={(e) => handleUpdateSiteContent('headmaster_name', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d97706' }} />
              </div>
              <div><span style={{ fontSize: '11px', fontWeight: 'bold' }}>যোগাযোগ নম্বর:</span>
                <input type="text" value={siteData.contactNumber || ""} onChange={(e) => handleUpdateSiteContent('contact_number', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d97706' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ সুপার এডমিন ফ্লোটিং বাটন */}
      {user && isSuperAdmin && (
        <button className="super-admin-float-btn" onClick={() => setCurrentView('superAdminPanel')}>
          ⚙️ সুপার এডমিন
        </button>
      )}

      {/* হোমপেজ */}
      {currentView === 'home' && (
        <>
          <header style={{ background: 'linear-gradient(135deg, #064e3b 0%, #14532d 50%, #166534 100%)', color: 'white', padding: '50px 20px 70px 20px', textAlign: 'center' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>🎓 নতুন সেশনে ভর্তি চলছে</span>
              <h2 style={{ fontSize: '2.1rem', fontWeight: '800', margin: '16px 0' }}>সুশিক্ষা ও সুন্নাত ভিত্তিক আদর্শ জীবন গড়ার বিশ্বস্ত প্রতিষ্ঠান</h2>
              <p style={{ fontSize: '15px', color: '#ecfdf5', lineHeight: '1.7', marginBottom: '28px' }}>আমরা দিচ্ছি আধুনিক ক্বওমী ও জেনারেল শিক্ষা ব্যবস্থার এক অনন্য সমন্বয়।</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => { resetForm(); setIsAdmissionModalOpen(true); }} className="btn-primary" style={{ backgroundColor: '#ffffff', color: '#14532d', fontWeight: 'bold' }}>ভর্তি আবেদন করুন</button>
                <a href={`tel:${siteData.contactNumber}`} className="btn-primary" style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>📞 সরাসরি কল দিন</a>
              </div>
            </div>
          </header>

          <main style={{ maxWidth: '1200px', margin: '-30px auto 40px auto', padding: '0 16px', position: 'relative', zIndex: 10 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <img src="https://i.postimg.cc/xd8py0DW/1786523361131.jpg" alt={siteData.headmasterName} style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #16a34a' }} />
                <h3 style={{ margin: '12px 0 2px 0', fontSize: '20px', color: '#0f172a', fontWeight: '700' }}>{siteData.headmasterName}</h3>
                <span className="badge">প্রধান শিক্ষক ও পরিচালক</span>
              </div>
              <div style={{ textAlign: 'left', width: '100%' }}>
                <h3 style={{ fontSize: '20px', color: '#166534', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>প্রধান শিক্ষকের বার্তা</h3>
                <p style={{ lineHeight: '1.8', color: '#334155' }}>"বিসমিল্লাহির রহমানির রহিম। চিলমারী প্রি ক্যাডেট মাদ্রাসায় আপনাকে জানাই আন্তরিক শুভেচ্ছা।"</p>
              </div>
            </div>
          </main>
        </>
      )}

      {/* অন্যান্য ভিউ */}
      {currentView === 'about' && (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ color: '#14532d', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>প্রধান শিক্ষকের বাণী</h2>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src="https://i.postimg.cc/xd8py0DW/1786523361131.jpg" alt={siteData.headmasterName} style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #16a34a' }} />
              <h3>{siteData.headmasterName}</h3>
              <span className="badge">প্রধান শিক্ষক ও পরিচালক</span>
            </div>
            <p style={{ lineHeight: '1.8', color: '#334155' }}>"বিসমিল্লাহির রহমানির রহিম। চিলমারী প্রি ক্যাডেট মাদ্রাসায় আপনাকে জানাই আন্তরিক শুভেচ্ছা। আমাদের সুনির্দিষ্ট লক্ষ্য হলো কোমলমতি শিশুদের ধর্মীয় মূল্যবোধ, উত্তম চরিত্র এবং আধুনিক শিক্ষার মাধ্যমে এক আদর্শ সুনাগরিক হিসেবে গড়ে তোলা।"</p>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'teachers' && (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <span className="badge">সম্মানিত শিক্ষক মণ্ডলী</span>
            <h2 style={{ color: '#14532d' }}>মাদ্রাসার শিক্ষক-শিক্ষিকাবৃন্দ</h2>
          </div>
          {teachersLoading ? <p>⏳ লোড হচ্ছে...</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px', justifyItems: 'center' }}>
              {teachers.map((teacher, index) => (
                <div key={index} className="teacher-card">
                  <img src={teacher.photo || 'https://i.postimg.cc/gjktXPpH/1786523361131.jpg'} alt={teacher.name} className="teacher-photo" />
                  <h3 className="teacher-name">{teacher.name}</h3>
                  <div className="teacher-designation">{teacher.designation || 'শিক্ষক'}</div>
                  <div className="teacher-details">
                    <div>📞 {teacher.phone}</div>
                    <div>🎓 {teacher.edu || '—'}</div>
                    <div>📚 {teacher.subject || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
          </div>
        </div>
      )}

      {currentView === 'students' && (
        <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <span className="badge">মেধাবী মুখসমূহ</span>
            <h2 style={{ color: '#14532d' }}>ছাত্র-ছাত্রী</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '10px' }}>
              <div className="card" style={{ padding: '12px 24px', background: '#dcfce7', color: '#14532d', fontWeight: 'bold' }}>👦 মোট ছাত্র: {siteData.totalMaleStudents} জন</div>
              <div className="card" style={{ padding: '12px 24px', background: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' }}>👧 মোট ছাত্রী: {siteData.totalFemaleStudents} জন</div>
            </div>
          </div>
          <StudentList />
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
          </div>
        </div>
      )}

      {currentView === 'gallery' && <Gallery />}
      {currentView === 'contact' && <ContactPage />}
      {currentView === 'notifications' && <NotificationSystem />}

      {currentView === 'teacherPanel' && (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ color: '#166534', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>👨‍🏫 টিচার প্যানেল</h2>
            <p style={{ color: '#334155' }}>স্বাগতম! শিক্ষক হিসেবে আপনার প্যানেল এটি।</p>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'adminPanel' && (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ color: '#0369a1', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>🛠️ এডমিন প্যানেল</h2>
            <p style={{ color: '#334155' }}>শিক্ষক ও শিক্ষার্থীদের পারমিশন ম্যানেজ করুন।</p>
            <div style={{ marginTop: '20px' }}>
              <TeacherManagement />
            </div>
          </div>
        </div>
      )}

      {currentView === 'superAdminPanel' && <SuperAdminDashboard />}
      {currentView === 'adminPermissionManager' && <AdminPermissionManager />}

      <SignInModal isOpen={isSignInModalOpen} onClose={() => setIsSignInModalOpen(false)} />
      {isAdmissionModalOpen && <AdmissionForm isOpen={isAdmissionModalOpen} onClose={() => setIsAdmissionModalOpen(false)} />}

      <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('হ্যালো ফিরোজ ভাই, সাহায্য প্রয়োজন।')}`} target="_blank" rel="noopener noreferrer" className="live-chat-btn">
        <span>💬</span><span>লাইভ চ্যাট</span>
      </a>

      <Footer />
    </div>
  );
}
