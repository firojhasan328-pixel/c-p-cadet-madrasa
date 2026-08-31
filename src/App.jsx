import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { PortalProvider, usePortal } from './context/PortalContext';
import Footer from './components/Footer';
import AdmissionForm from './components/AdmissionForm';
import Gallery from './components/Gallery';
import SignInModal from './components/SignInModal';
import StudentList from './components/StudentList';
import ContactPage from './components/ContactPage';
import SuccessStats from './components/SuccessStats';
import PortalLogin from './components/auth/PortalLogin';
import PortalRegister from './components/auth/PortalRegister';
import StudentDashboard from './components/student-dashboard/StudentDashboard';
import TeacherDashboard from './components/portal/TeacherDashboard';
import ResetPassword from './components/ResetPassword';

// =============================================
// মেইন App
// =============================================
function App() {
  return (
    <PortalProvider>
      <MainApp />
    </PortalProvider>
  );
}

function MainApp() {
  const { isAuthenticated, userRole, logout, userProfile } = usePortal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [isResetPassword, setIsResetPassword] = useState(false);

  const [siteData, setSiteData] = useState({
    headmasterName: "Arif Ashab Khorshed",
    contactNumber: "+8801521-553003",
    totalMaleStudents: "০",
    totalFemaleStudents: "০"
  });

  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(true);

  // =============================================
  // ✅ নোটিশ স্টেট (NEW)
  // =============================================
  const [notices, setNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  // =============================================
  // ✅ নোটিশ ফেচ ফাংশন (শুধু is_featured = true)
  // =============================================
  const fetchNotices = async () => {
    setNoticesLoading(true);
    try {
      const { data, error } = await supabase
        .from('portal_notices')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (err) {
      console.error('নোটিশ লোড করতে সমস্যা:', err);
    } finally {
      setNoticesLoading(false);
    }
  };

  // =============================================
  // শিক্ষক ফেচ
  // =============================================
  const fetchTeachers = async () => {
    setTeachersLoading(true);
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('name', { ascending: true });
      
      if (data) {
        setTeachers(data);
      } else {
        console.error('শিক্ষক ডেটা লোড করতে সমস্যা:', error);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
    setTeachersLoading(false);
  };

  // =============================================
  // CMS ডেটা ফেচ
  // =============================================
  const fetchCMSData = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_values')
        .select(`
          value,
          cms_fields (
            field_key
          )
        `);

      if (error) {
        console.error('CMS ডেটা লোড করতে সমস্যা:', error);
        return;
      }

      if (data) {
        const formattedData = {};
        data.forEach(item => {
          if (item.cms_fields) {
            formattedData[item.cms_fields.field_key] = item.value;
          }
        });
        
        console.log('✅ CMS ডেটা লোড হয়েছে:', formattedData);
        setSiteData(prev => ({ ...prev, ...formattedData }));
      }
    } catch (err) {
      console.error('CMS ডেটা লোড করতে সমস্যা:', err);
    }
  };

  // =============================================
  // পুরানো site_contents ডেটা ফেচ
  // =============================================
  const fetchSiteContents = async () => {
    try {
      const { data, error } = await supabase.from('site_contents').select('*');
      if (data) {
        const formattedData = {};
        data.forEach(item => {
          formattedData[item.key] = item.value;
        });
        setSiteData(prev => ({ ...prev, ...formattedData }));
      }
    } catch (err) {
      console.error('Error fetching site contents:', err);
    }
  };

  // =============================================
  // ⭐ useEffect (সব ডেটা + রিয়েল-টাইম)
  // =============================================
  useEffect(() => {
    // ✅ URL থেকে reset-password চেক করুন
    const path = window.location.pathname;
    if (path.includes('/reset-password') || path.includes('/rest-password')) {
      setIsResetPassword(true);
    }

    // প্রাথমিক ডেটা লোড
    fetchCMSData();
    fetchSiteContents();
    fetchTeachers();
    fetchNotices(); // ✅ নোটিশ লোড

    // ⭐ Realtime subscription for CMS
    const cmsChannel = supabase
      .channel('cms-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'cms_values' 
      }, () => {
        fetchCMSData();
      })
      .subscribe();

    // পুরানো site_contents রিয়েলটাইম
    const siteChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_contents' }, () => {
        fetchSiteContents();
      })
      .subscribe();

    // ✅ নোটিশ রিয়েল-টাইম সাবস্ক্রিপশন (NEW)
    const noticeChannel = supabase
      .channel('notice-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'portal_notices',
      }, () => {
        fetchNotices(); // রিফ্রেশ ছাড়াই আপডেট
      })
      .subscribe();

    return () => {
      supabase.removeChannel(cmsChannel);
      supabase.removeChannel(siteChannel);
      supabase.removeChannel(noticeChannel); // ✅ ক্লিনআপ
    };
  }, []);

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

  const handleOpenSignIn = () => {
    setIsSignInModalOpen(true);
  };

  const handleCloseSignIn = () => {
    setIsSignInModalOpen(false);
  };

  const handleOpenLogin = () => {
    setIsSignInModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleOpenRegister = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  const handleCloseAuth = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(false);
    setIsSignInModalOpen(false);
  };

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

  const renderDashboard = () => {
    if (!isAuthenticated) return null;
    
    if (userRole === 'student') {
      return <StudentDashboard />;
    }
    
    if (userRole === 'teacher') {
      return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ color: '#14532d', margin: 0 }}>
                  👋 স্বাগতম, {userProfile?.name || 'ইউজার'}!
                </h2>
                <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
                  👨‍🏫 শিক্ষক ড্যাশবোর্ড
                </p>
              </div>
              <button 
                onClick={logout}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                লগআউট
              </button>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '20px',
              marginTop: '24px'
            }}>
              <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#166534' }}>📊 প্রোফাইল</h4>
                <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>নাম:</strong> {userProfile?.name}</p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>ইমেইল:</strong> {userProfile?.email}</p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>পদবি:</strong> {userProfile?.designation || 'নাই'}</p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>বিষয়:</strong> {userProfile?.subject || 'নাই'}</p>
              </div>
            </div>
            
            <button 
              onClick={() => setCurrentView('home')}
              style={{
                background: '#64748b',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              ⬅ হোম পেজে ফিরে যান
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // ✅ Reset Password View
  if (isResetPassword) {
    return (
      <div style={{ fontFamily: "'Hind Siliguri', 'Segoe UI', sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh', margin: 0, padding: 0 }}>
        <ResetPassword />
      </div>
    );
  }

  // =============================================
  // ✅ ফিচার্ড নোটিশ নির্বাচন (প্রথমটি)
  // =============================================
  const featuredNotice = notices.length > 0 ? notices[0] : null;

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
        .portal-btn {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .portal-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* টপ কন্টাক্ট বার */}
      <div style={{ backgroundColor: '#14532d', color: '#f0fdf4', padding: '8px 20px', fontSize: '13px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>📍 চিলমারী, কুড়িগ্রাম, বাংলাদেশ</div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>📞 যোগাযোগ: <a href={`tel:${siteData.contactNumber}`} style={{ color: '#ffffff', fontWeight: 'bold', textDecoration: 'none' }}>{siteData.contactNumber}</a></span>
          </div>
        </div>
      </div>

      {/* নেভিগেশন বার */}
      <nav style={{ backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => { setCurrentView('home'); }}>
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
            style={{ background: '#f1f5f9', border: 'none', padding: '10px 14px', borderRadius: '10px', fontSize: '22px', cursor: 'pointer', color: '#1e293b' }}
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

            {isAuthenticated ? (
              <>
                <span className="nav-link" style={{ color: '#16a34a', fontWeight: 'bold' }} onClick={() => { setCurrentView('portal'); setMobileMenuOpen(false); }}>
                  🎓 পোর্টালে যান
                </span>
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                  লগআউট করুন
                </button>
              </>
            ) : (
              <button 
                onClick={() => { setMobileMenuOpen(false); handleOpenSignIn(); }} 
                style={{ 
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                  width: '100%'
                }}
              >
                🎓 Student & Teacher Portal
              </button>
            )}

            <button onClick={() => { setMobileMenuOpen(false); setIsAdmissionModalOpen(true); }} className="btn-primary" style={{ width: '100%', textAlign: 'center', marginTop: '4px' }}>অনলাইন ভর্তি</button>
          </div>
        )}
      </nav>

      {/* পোর্টাল ভিউ */}
      {currentView === 'portal' && isAuthenticated && renderDashboard()}

      {/* হোমপেজ ভিউ */}
      {currentView === 'home' && !(currentView === 'portal' && isAuthenticated) && (
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
            <SuccessStats />

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
              {/* =============================================
                  📌 নোটিশ বোর্ড (আপডেটেড)
                  ============================================= */}
              <div id="notice" className="card">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '16px', 
                  borderBottom: '2px solid #f1f5f9', 
                  paddingBottom: '10px' 
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '18px', 
                    color: '#166534', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px' 
                  }}>
                    📌 নোটিশ বোর্ড
                  </h3>
                </div>

                {noticesLoading ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '12px 0' }}>⏳ লোড হচ্ছে...</p>
                ) : featuredNotice ? (
                  <div style={{ 
                    padding: '12px', 
                    borderRadius: '10px', 
                    background: '#f8fafc', 
                    borderLeft: '4px solid #16a34a' 
                  }}>
                    <span style={{ 
                      fontSize: '11px', 
                      color: '#64748b', 
                      fontWeight: 'bold' 
                    }}>
                      📢 গুরুত্বপূর্ণ
                    </span>
                    <p style={{ 
                      margin: '4px 0 0 0', 
                      fontSize: '14px', 
                      fontWeight: '600' 
                    }}>
                      {featuredNotice.message}
                    </p>
                  </div>
                ) : (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: '#94a3b8', 
                    fontSize: '14px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px dashed #cbd5e1'
                  }}>
                    ⚠️ বর্তমানে কোনো নোটিশ নেই
                  </div>
                )}
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

      {/* অন্যান্য ভিউ */}
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
                    src={teacher.photo_url || 'https://i.postimg.cc/gjktXPpH/1786523361131.jpg'} 
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
          </div>
          
          <StudentList />
          
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
          </div>
        </div>
      )}

      {currentView === 'notice' && (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ color: '#14532d', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: 0 }}>📌 নোটিশ বোর্ড</h2>
            <div style={{ marginTop: '16px' }}>
              {noticesLoading ? (
                <p>⏳ লোড হচ্ছে...</p>
              ) : featuredNotice ? (
                <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', borderLeft: '4px solid #16a34a' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>📢 গুরুত্বপূর্ণ</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '15px', fontWeight: '600' }}>{featuredNotice.message}</p>
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                  ⚠️ বর্তমানে কোনো নোটিশ নেই
                </div>
              )}
            </div>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'gallery' && <Gallery />}
      {currentView === 'contact' && <ContactPage />}

      {/* মডালসমূহ */}
      <SignInModal 
        isOpen={isSignInModalOpen} 
        onClose={handleCloseSignIn} 
      />

      {isLoginModalOpen && (
        <PortalLogin
          onSwitchToRegister={handleOpenRegister}
          onClose={handleCloseAuth}
        />
      )}

      {isRegisterModalOpen && (
        <PortalRegister
          onSwitchToLogin={handleOpenLogin}
          onClose={handleCloseAuth}
        />
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

export default App;
