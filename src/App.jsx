import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Footer from './components/Footer';
import AdmissionForm from './components/AdmissionForm';
import Gallery from './components/Gallery';
import StudentList from './components/StudentList';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminPermissionManager from './components/AdminPermissionManager';
import TeacherManagement from './components/TeacherManagement';
import ContactPage from './components/ContactPage';
import NotificationSystem from './components/NotificationSystem';
import AuditLog from './components/AuditLog';
import ContentManager from './components/ContentManager';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');

  // =============================================
  // অথ স্টেট
  // =============================================
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // লগইন মোডাল
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // =============================================
  // প্রোফাইল ফেচ
  // =============================================
  const fetchUserProfile = async (userId) => {
    if (!userId) {
      setUserRole(null);
      setUserName('');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile Error:', error);
        setUserRole(null);
        setUserName('');
        return;
      }

      if (data) {
        setUserName(data.name || '');
        setUserRole(data.role || null);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      setUserRole(null);
      setUserName('');
    }
  };

  // =============================================
  // অথ চেক
  // =============================================
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserRole(null);
        setUserName('');
      }
      setLoading(false);
    };
    
    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
        setLoading(false);
        setShowLoginModal(false);
        setLoginRole(null);
        alert('✅ লগইন সফল!');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRole(null);
        setUserName('');
        setLoading(false);
        setCurrentView('home');
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // =============================================
  // রোল চেক
  // =============================================
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'superadmin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;
  const isTeacher = userRole === 'teacher' || isAdmin;

  // =============================================
  // লগইন ফাংশন
  // =============================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      setLoginError(error.message);
      setLoading(false);
    } else {
      setAuthEmail('');
      setAuthPassword('');
      setLoginError('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    setUserName('');
    setCurrentView('home');
    alert("লগআউট সফল");
  };

  // =============================================
  // লগইন মোডাল খোলা
  // =============================================
  const openLoginModal = (role) => {
    setLoginRole(role);
    setShowLoginModal(true);
    setAuthEmail('');
    setAuthPassword('');
    setLoginError('');
    setMobileMenuOpen(false);
  };

  // =============================================
  // এডমিন সিলেক্ট মেনু
  // =============================================
  const handleAdminSelect = () => {
    setMobileMenuOpen(false);
    setCurrentView('adminSelect');
  };

  // =============================================
  // বাকি স্টেট
  // =============================================
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState("পর্যাপ্ত পরিমাণ ছাত্র-ছাত্রী বুকিং হওয়ায় আর কোনো সিট খালি নাই।");
  const [isAdminMode, setIsAdminMode] = useState(false);

  const [siteData, setSiteData] = useState({
    headmasterName: "Arif Ashab Khorshed",
    contactNumber: "+8801521-553003",
    totalMaleStudents: "২৫০",
    totalFemaleStudents: "২২০"
  });

  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(true);

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

  const fetchTeachers = async () => {
    setTeachersLoading(true);
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('name', { ascending: true });
    
    if (data) {
      setTeachers(data);
    } else {
      console.error('শিক্ষক ডেটা লোড করতে সমস্যা:', error);
    }
    setTeachersLoading(false);
  };

  useEffect(() => {
    fetchSiteContents();
    fetchTeachers();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_contents' }, (payload) => {
        fetchSiteContents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const isLoggedIn = !!user;

  console.log('🔍 App State:', { user: user?.email, userRole, isSuperAdmin, isAdmin, isTeacher });

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
        .auth-loading { 
          display: inline-block; 
          width: 16px; 
          height: 16px; 
          border: 2px solid #e2e8f0; 
          border-top: 2px solid #16a34a; 
          border-radius: 50%; 
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .role-select-btn {
          background: white;
          border: 2px solid #e2e8f0;
          padding: 20px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          flex: 1;
          min-width: 150px;
        }
        .role-select-btn:hover {
          border-color: #1d4ed8;
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }
        .role-select-btn .icon {
          font-size: 40px;
          display: block;
          margin-bottom: 8px;
        }
        .role-select-btn .title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }
        .role-select-btn .sub {
          font-size: 12px;
          color: #64748b;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-box {
          background: white;
          border-radius: 28px;
          padding: 32px;
          max-width: 420px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 25px 50px rgba(0,0,0,0.25);
        }
        .modal-close {
          position: absolute;
          top: 12px;
          right: 16px;
          background: #f1f5f9;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 18px;
          cursor: pointer;
        }
        .login-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          font-size: 14px;
          outline: none;
          margin-top: 4px;
        }
        .login-input:focus {
          border-color: #1d4ed8;
          box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.15);
        }
        .login-btn {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: none;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
          color: white;
          transition: all 0.3s ease;
        }
        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(29, 78, 216, 0.3);
        }
        .login-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 12px;
          border-left: 4px solid #dc2626;
        }
        .admin-menu-item {
          color: #1d4ed8;
          font-weight: 700;
          border-bottom: 2px solid #dbeafe;
          padding-bottom: 4px;
        }
        .admin-menu-item:hover {
          color: #1e40af;
        }
      `}</style>

      {/* টপ কন্টাক্ট বার */}
      <div style={{ backgroundColor: '#14532d', color: '#f0fdf4', padding: '8px 20px', fontSize: '13px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>📍 চিলমারী, কুড়িগ্রাম, বাংলাদেশ</div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>📞 যোগাযোগ: <a href={`tel:${siteData.contactNumber}`} style={{ color: '#ffffff', fontWeight: 'bold', textDecoration: 'none' }}>{siteData.contactNumber}</a></span>
            {isLoggedIn && (
              <button onClick={handleLogout} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                লগআউট
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =============================================
          নেভিগেশন বার - এডমিন প্যানেল মেনুতে
          ============================================= */}
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

        {mobileMenuOpen && (
          <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <span className="nav-link" onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}>হোম</span>
            <span className="nav-link" onClick={() => { setCurrentView('about'); setMobileMenuOpen(false); }}>প্রধান শিক্ষকের বাণী</span>
            <span className="nav-link" onClick={() => { setCurrentView('teachers'); setMobileMenuOpen(false); }}>শিক্ষকবৃন্দ</span>
            <span className="nav-link" onClick={() => { setCurrentView('students'); setMobileMenuOpen(false); }}>ছাত্র-ছাত্রী</span>
            <span className="nav-link" onClick={() => { setCurrentView('notice'); setMobileMenuOpen(false); }}>নোটিশ বোর্ড</span>
            <span className="nav-link" onClick={() => { setCurrentView('gallery'); setMobileMenuOpen(false); }}>গ্যালারি</span>
            <span className="nav-link" onClick={() => { setCurrentView('contact'); setMobileMenuOpen(false); }}>যোগাযোগ</span>
            
            {/* =============================================
                🔥 এডমিন প্যানেল - মেনুতে
                ============================================= */}
            <span className="nav-link admin-menu-item" onClick={handleAdminSelect}>
              ⚙️ এডমিন প্যানেল
            </span>
            
            {isLoggedIn && (
              <span className="nav-link" style={{ color: '#2563eb', fontWeight: 'bold' }} onClick={() => { setCurrentView('notifications'); setMobileMenuOpen(false); }}>🔔 নোটিফিকেশন</span>
            )}

            {/* লগইন থাকলে এবং পারমিশন থাকলে প্যানেল দেখাবে */}
            {isSuperAdmin && (
              <>
                <span className="nav-link" style={{ color: '#b45309', fontWeight: 'bold' }} onClick={() => { setCurrentView('superAdminPanel'); setMobileMenuOpen(false); }}>⚙️ সুপার এডমিন প্যানেল</span>
                <span className="nav-link" style={{ color: '#7c3aed', fontWeight: 'bold' }} onClick={() => { setCurrentView('adminPermissionManager'); setMobileMenuOpen(false); }}>🛡️ এডমিন পারমিশন</span>
              </>
            )}
            
            {isAdmin && !isSuperAdmin && (
              <span className="nav-link" style={{ color: '#0369a1', fontWeight: 'bold' }} onClick={() => { setCurrentView('adminPanel'); setMobileMenuOpen(false); }}>🛠️ এডমিন প্যানেল</span>
            )}
            
            {isTeacher && !isAdmin && !isSuperAdmin && (
              <span className="nav-link" style={{ color: '#16a34a', fontWeight: 'bold' }} onClick={() => { setCurrentView('teacherPanel'); setMobileMenuOpen(false); }}>👨‍🏫 টিচার প্যানেল</span>
            )}

            {(isAdmin || isSuperAdmin) && (
              <span className="nav-link" style={{ color: '#64748b', fontWeight: 'bold' }} onClick={() => { setCurrentView('auditLog'); setMobileMenuOpen(false); }}>📋 অডিট লগ</span>
            )}

            <button onClick={() => { setMobileMenuOpen(false); setIsAdmissionModalOpen(true); }} className="btn-primary" style={{ width: '100%', textAlign: 'center', marginTop: '6px' }}>অনলাইন ভর্তি</button>
            
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '4px' }}>
              {isLoggedIn ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#16a34a' }}>
                    👤 {userName || user?.email}
                    <span style={{ 
                      marginLeft: '8px',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      background: isSuperAdmin ? '#fef3c7' : isAdmin ? '#dbeafe' : isTeacher ? '#dcfce7' : '#f1f5f9',
                      color: isSuperAdmin ? '#b45309' : isAdmin ? '#1d4ed8' : isTeacher ? '#15803d' : '#64748b'
                    }}>
                      {isSuperAdmin ? 'সুপার এডমিন' : isAdmin ? 'এডমিন' : isTeacher ? 'শিক্ষক' : 'ইউজার'}
                    </span>
                  </span>
                  <button onClick={handleLogout} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>লগআউট করুন</button>
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: '#64748b' }}>🔒 লগইন করুন</span>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* =============================================
          হোমপেজ
          ============================================= */}
      {currentView === 'home' && (
        <>
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
                <a href={`tel:${siteData.contactNumber}`} className="btn-primary" style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
                  📞 সরাসরি কল দিন
                </a>
              </div>
            </div>
          </header>

          <main style={{ maxWidth: '1200px', margin: '-30px auto 40px auto', padding: '0 16px', position: 'relative', zIndex: 10 }}>
            <section id="about" style={{ marginBottom: '32px' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <img 
                    src="https://i.postimg.cc/xd8py0DW/1786523361131.jpg" 
                    alt={siteData.headmasterName} 
                    style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #16a34a', boxShadow: '0 6px 16px rgba(0,0,0,0.15)' }}
                  />
                  <h3 style={{ margin: '12px 0 2px 0', fontSize: '20px', color: '#0f172a', fontWeight: '700' }}>{siteData.headmasterName}</h3>
                  <span className="badge">প্রধান শিক্ষক ও পরিচালক</span>
                </div>
                
                <div style={{ textAlign: 'left', width: '100%' }}>
                  <h3 style={{ fontSize: '20px', color: '#166534', marginTop: 0, marginBottom: '12px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
                    প্রধান শিক্ষকের বার্তা
                  </h3>
                  <p style={{ lineHeight: '1.8', color: '#334155', margin: 0, fontSize: '15px' }}>
                    "বিসমিল্লাহির রহমানির রহিম। চিলমারী প্রি ক্যাডেট মাদ্রাসায় আপনাকে জানাই আন্তরিক শুভেচ্ছা। আমাদের সুনির্দিষ্ট লক্ষ্য হলো কোমলমতি শিশুদের ধর্মীয় মূল্যবোধ, উত্তম চরিত্র এবং আধুনিক শিক্ষার মাধ্যমে এক আদর্শ সুনাগরিক হিসেবে গড়ে তোলা।"
                  </p>
                </div>
              </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
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
                </div>
              </div>

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

      {/* =============================================
          এডমিন সিলেক্ট পেজ - ৩টি অপশন
          ============================================= */}
      {currentView === 'adminSelect' && (
        <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 16px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <h2 style={{ color: '#0f172a', fontSize: '28px', margin: '0 0 8px 0' }}>⚙️ এডমিন প্যানেল</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>আপনার রোল নির্বাচন করুন</p>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* সুপার এডমিন */}
              <div className="role-select-btn" onClick={() => openLoginModal('super_admin')}>
                <span className="icon">⭐</span>
                <div className="title">সুপার এডমিন</div>
                <div className="sub">সম্পূর্ণ কন্ট্রোল</div>
              </div>

              {/* এডমিন */}
              <div className="role-select-btn" onClick={() => openLoginModal('admin')}>
                <span className="icon">🛡️</span>
                <div className="title">এডমিন</div>
                <div className="sub">সীমিত কন্ট্রোল</div>
              </div>

              {/* টিচার */}
              <div className="role-select-btn" onClick={() => openLoginModal('teacher')}>
                <span className="icon">👨‍🏫</span>
                <div className="title">টিচার</div>
                <div className="sub">শিক্ষক প্যানেল</div>
              </div>
            </div>

            <button 
              onClick={() => setCurrentView('home')} 
              style={{ marginTop: '30px', background: '#f1f5f9', border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}
            >
              ⬅ হোম পেজে ফিরে যান
            </button>
          </div>
        </div>
      )}

      {/* =============================================
          লগইন মোডাল
          ============================================= */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => { setShowLoginModal(false); setLoginRole(null); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setShowLoginModal(false); setLoginRole(null); }}>✕</button>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '48px', display: 'block' }}>
                {loginRole === 'super_admin' ? '⭐' : loginRole === 'admin' ? '🛡️' : '👨‍🏫'}
              </span>
              <h3 style={{ margin: '8px 0 4px 0', color: '#0f172a' }}>
                {loginRole === 'super_admin' ? 'সুপার এডমিন' : loginRole === 'admin' ? 'এডমিন' : 'টিচার'} লগইন
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>আপনার অ্যাকাউন্ট দিয়ে লগইন করুন</p>
            </div>

            {loginError && <div className="login-error">{loginError}</div>}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>ইমেইল</label>
                <input 
                  type="email" 
                  className="login-input" 
                  value={authEmail} 
                  onChange={(e) => setAuthEmail(e.target.value)} 
                  placeholder="your@email.com" 
                  required 
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>পাসওয়ার্ড</label>
                <input 
                  type="password" 
                  className="login-input" 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                />
              </div>
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? '⏳ লগইন হচ্ছে...' : '🔑 লগইন করুন'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button 
                onClick={() => { setShowLoginModal(false); setLoginRole(null); }} 
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}
              >
                বাতিল করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================
          অন্যান্য পেজ ভিউ
          ============================================= */}
      {currentView === 'about' && (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ color: '#14532d', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: 0 }}>প্রধান শিক্ষকের বাণী</h2>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src="https://i.postimg.cc/xd8py0DW/1786523361131.jpg" alt={siteData.headmasterName} style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #16a34a' }} />
              <h3 style={{ margin: '10px 0 4px 0' }}>{siteData.headmasterName}</h3>
              <span className="badge">প্রধান শিক্ষক ও পরিচালক</span>
            </div>
            <p style={{ lineHeight: '1.8', color: '#334155', fontSize: '15px' }}>
              "বিসমিল্লাহির রহমানির রহিম। চিলমারী প্রি ক্যাডেট মাদ্রাসায় আপনাকে জানাই আন্তরিক শুভেচ্ছা।"
            </p>
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
            <h2 style={{ color: '#14532d', margin: '10px 0 6px 0' }}>মাদ্রাসার শিক্ষক-শিক্ষিকাবৃন্দ</h2>
          </div>
          
          {teachersLoading ? (
            <p style={{ textAlign: 'center' }}>⏳ লোড হচ্ছে...</p>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
              gap: '24px',
              justifyItems: 'center'
            }}>
              {teachers.map((teacher, index) => (
                <div key={index} className="teacher-card">
                  <img 
                    src={teacher.photo || 'https://i.postimg.cc/gjktXPpH/1786523361131.jpg'} 
                    alt={teacher.name} 
                    className="teacher-photo"
                  />
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
            <h2 style={{ color: '#14532d', margin: '10px 0 10px 0' }}>ছাত্র-ছাত্রী ও ক্লাসের শীর্ষ স্থানাধিকারীগণ</h2>
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
      {currentView === 'auditLog' && <AuditLog />}

      {/* প্যানেল ভিউ - শুধুমাত্র পারমিশন থাকলে */}
      {currentView === 'teacherPanel' && isTeacher && (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ color: '#166534', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: 0 }}>👨‍🏫 টিচার প্যানেল</h2>
            <p style={{ color: '#334155', fontSize: '15px' }}>স্বাগতম! শিক্ষক হিসেবে আপনার প্যানেল এটি।</p>
            <div style={{ marginTop: '20px' }}>
              <ContentManager />
            </div>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'adminPanel' && isAdmin && (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ color: '#0369a1', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: 0 }}>🛠️ এডমিন প্যানেল</h2>
            <p style={{ color: '#334155', fontSize: '15px' }}>শিক্ষক ও শিক্ষার্থীদের পারমিশন ম্যানেজ করুন।</p>
            <div style={{ marginTop: '20px' }}>
              <TeacherManagement />
              <ContentManager />
            </div>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'superAdminPanel' && isSuperAdmin && (
        <SuperAdminDashboard />
      )}

      {currentView === 'adminPermissionManager' && isSuperAdmin && (
        <AdminPermissionManager />
      )}

      {isAdmissionModalOpen && (
        <AdmissionForm 
          isOpen={isAdmissionModalOpen} 
          onClose={() => setIsAdmissionModalOpen(false)} 
        />
      )}

      <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('হ্যালো ফিরোজ ভাই, সাহায্য প্রয়োজন।')}`} target="_blank" rel="noopener noreferrer" className="live-chat-btn">
        <span>💬</span><span>লাইভ চ্যাট</span>
      </a>

      <Footer />
    </div>
  );
}
