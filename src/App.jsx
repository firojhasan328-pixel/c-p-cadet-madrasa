import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Footer from './components/Footer';
import AdmissionForm from './components/AdmissionForm';
import AdminAdmissions from './components/AdminAdmissions';
import ContentManager from './components/ContentManager';
import TeacherManager from './components/TeacherManager';
import Gallery from './components/Gallery';
import SignInModal from './components/SignInModal';
import StudentList from './components/StudentList';
import { useAuth } from './context/AuthContext';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  
  const [currentView, setCurrentView] = useState('home');

  // =============================================
  // AUTH CONTEXT (Phase 2)
  // =============================================
  const { isSuperAdmin, isAdmin, isTeacher, hasPermission, user, loading } = useAuth();

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState({ canEdit: false, canManageAdmission: false });

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

  const [managedUsers, setManagedUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('teacher');
  const [newUserCanEdit, setNewUserCanEdit] = useState(false);
  const [newUserCanAdmission, setNewUserCanAdmission] = useState(false);

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
    fetchManagedUsers();
    checkUserSession();
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

  const fetchManagedUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (data) setManagedUsers(data);
  };

  const checkUserSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      fetchUserProfile(session.user.id);
    }
  };

  const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setCurrentUser(data);
      setUserRole(data.role);
      setUserPermissions({ canEdit: data.can_edit, canManageAdmission: data.can_manage_admission });
      window.userRole = data.role;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      alert("লগইন ব্যর্থ হয়েছে: " + error.message);
    } else {
      await fetchUserProfile(data.user.id);
      alert("সফলভাবে লগইন হয়েছে! সিস্টেম আপনার রোল স্বয়ংক্রিয়ভাবে নির্ধারণ করেছে।");
      setCurrentView('home');
      setAuthEmail('');
      setAuthPassword('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUserRole(null);
    window.userRole = null;
    setCurrentView('home');
    alert("লগআউট সফল হয়েছে।");
  };

  const handleUpdateSiteContent = async (key, value) => {
    const { error } = await supabase.from('site_contents').upsert({ key, value });
    if (!error) {
      setSiteData(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword || !newUserName) return;

    const { data, error } = await supabase.auth.signUp({
      email: newUserEmail,
      password: newUserPassword,
    });

    if (error) {
      alert("ইউজার তৈরি করা সম্ভব হয়নি: " + error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          name: newUserName,
          role: newUserRole,
          can_edit: newUserCanEdit,
          can_manage_admission: newUserCanAdmission
        }
      ]);

      if (profileError) {
        alert("প্রোফাইল তৈরি ত্রুটি: " + profileError.message);
      } else {
        alert("নতুন ব্যবহারকারী ও পারমিশন সফলভাবে যুক্ত হয়েছে!");
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        fetchManagedUsers();
      }
    }
  };

  const handleUpdateUserPermission = async (id, field, value) => {
    const updateField = field === 'canEdit' ? 'can_edit' : 'can_manage_admission';
    const { error } = await supabase.from('profiles').update({ [updateField]: value }).eq('id', id);
    if (!error) {
      fetchManagedUsers();
    }
  };

  const whatsappNumber = "8801918568313";

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
            
            {/* 🔑 সাইন ইন বাটন */}
            <span className="nav-link" style={{ color: '#2563eb', fontWeight: 'bold' }} onClick={() => { setMobileMenuOpen(false); setIsSignInModalOpen(true); }}>
              🔑 সাইন ইন
            </span>
            
            {/* ব্যবহার পারমিশন অনুযায়ী মেনু দেখানো */}
            {(isTeacher || isAdmin || isSuperAdmin) && (
              <span className="nav-link" style={{ color: '#16a34a', fontWeight: 'bold' }} onClick={() => { setCurrentView('teacherPanel'); setMobileMenuOpen(false); }}>👨‍🏫 টিচার প্যানেল</span>
            )}
            {(isAdmin || isSuperAdmin) && (
              <span className="nav-link" style={{ color: '#0369a1', fontWeight: 'bold' }} onClick={() => { setCurrentView('adminPanel'); setMobileMenuOpen(false); }}>🛠️ এডমিন প্যানেল</span>
            )}
            {isSuperAdmin && (
              <span className="nav-link" style={{ color: '#b45309', fontWeight: 'bold' }} onClick={() => { setCurrentView('superAdminPanel'); setMobileMenuOpen(false); }}>⚙️ সুপার এডমিন প্যানেল</span>
            )}

            <button onClick={() => { setMobileMenuOpen(false); setIsAdmissionModalOpen(true); }} className="btn-primary" style={{ width: '100%', textAlign: 'center', marginTop: '6px' }}>অনলাইন ভর্তি</button>
            
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentUser ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#16a34a' }}>লগইন আছেন: {currentUser.name} ({userRole})</span>
                  <button onClick={handleLogout} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>লগআউট করুন</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>প্যানেল লগইন:</span>
                  <input type="email" placeholder="ইমেল" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  <input type="password" placeholder="পাসওয়ার্ড" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  <button onClick={handleLogin} className="btn-primary" style={{ padding: '6px', fontSize: '12px', justifyContent: 'center' }}>লগইন করুন</button>
                </div>
              )}

              {isSuperAdmin && (
                <button 
                  onClick={() => setIsAdminMode(!isAdminMode)} 
                  style={{ background: '#0f172a', color: '#f8fafc', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', width: '100%', fontWeight: '600', marginTop: '4px' }}
                >
                  {isAdminMode ? '🔒 সুপার এডমিন সেটিংস বন্ধ করুন' : '⚙️ সুপার এডমিন সেটিংস (খুলুন)'}
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* সুপার এডমিন লাইভ কন্ট্রোল প্যানেল */}
      {isAdminMode && isSuperAdmin && (
        <div style={{ background: '#fef3c7', borderBottom: '2px solid #f59e0b', padding: '16px 20px', fontSize: '14px', zIndex: 100, position: 'relative' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <strong>🛠️ সুপার এডমিন লাইভ কন্ট্রোল প্যানেল:</strong>
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
                <input type="text" value={siteData.headmasterName || ""} onChange={(e) => handleUpdateSiteContent('headmaster_name', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d97706' }} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>যোগাযোগ নম্বর:</span>
                <input type="text" value={siteData.contactNumber || ""} onChange={(e) => handleUpdateSiteContent('contact_number', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d97706' }} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>মোট ছাত্র সংখ্যা:</span>
                <input type="text" value={siteData.totalMaleStudents || ""} onChange={(e) => handleUpdateSiteContent('total_male_students', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d97706' }} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>মোট ছাত্রী সংখ্যা:</span>
                <input type="text" value={siteData.totalFemaleStudents || ""} onChange={(e) => handleUpdateSiteContent('total_female_students', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d97706' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600' }}>বন্ধকালীন নোটিশ মেসেজ:</span>
              <input 
                type="text" 
                value={closedMessage} 
                onChange={(e) => { setClosedMessage(e.target.value); handleUpdateSiteContent('closed_message', e.target.value); }}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d97706', width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* হোমপেজ ভিউ */}
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

      {/* প্রধান শিক্ষকের বাণী পেজ */}
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

      {/* শিক্ষক পেজ */}
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

      {/* ছাত্র-ছাত্রী পেজ */}
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

      {/* গ্যালারি ভিউ */}
      {currentView === 'gallery' && <Gallery />}

      {/* টিচার প্যানেল */}
      {currentView === 'teacherPanel' && (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ color: '#166534', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: 0 }}>👨‍🏫 টিচার প্যানেল</h2>
            <p style={{ color: '#334155', fontSize: '15px' }}>স্বাগতম! শিক্ষক হিসেবে আপনার প্যানেল এটি।</p>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {/* এডমিন প্যানেল */}
      {currentView === 'adminPanel' && (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card">
            <h2 style={{ color: '#0369a1', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: 0 }}>🛠️ এডমিন প্যানেল</h2>
            <p style={{ color: '#334155', fontSize: '15px' }}>শিক্ষক ও শিক্ষার্থীদের পারমিশন ম্যানেজ করুন।</p>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {/* সুপার এডমিন প্যানেল */}
      {currentView === 'superAdminPanel' && (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 16px' }}>
          <div className="card" style={{ border: '2px solid #f59e0b' }}>
            <h2 style={{ color: '#b45309', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginTop: 0 }}>⚙️ সুপার এডমিন প্যানেল (A to Z নিয়ন্ত্রণ)</h2>
            <p style={{ color: '#334155', fontSize: '15px' }}>আপনি সুপার এডমিন হিসেবে সর্বময় ক্ষমতার অধিকারী। নতুন ইউজার তৈরি করুন এবং পারমিশন দিন:</p>

            <div style={{ marginTop: '20px', background: '#fef3c7', padding: '16px', borderRadius: '12px', border: '1px solid #f59e0b' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#b45309' }}>নতুন ইউজার ও পারমিশন তৈরি (Supabase Auth):</h4>
              
              <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <input type="text" placeholder="ইউজারের নাম" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d97706' }} />
                <input type="email" placeholder="ইমেল" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d97706' }} />
                <input type="password" placeholder="পাসওয়ার্ড" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d97706' }} />
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d97706' }}>
                  <option value="teacher">টিচার</option>
                  <option value="admin">এডমিন</option>
                  <option value="superAdmin">সুপার এডমিন</option>
                </select>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <label><input type="checkbox" checked={newUserCanEdit} onChange={(e) => setNewUserCanEdit(e.target.checked)} /> এডিট ক্ষমতা</label>
                  <label><input type="checkbox" checked={newUserCanAdmission} onChange={(e) => setNewUserCanAdmission(e.target.checked)} /> ভর্তি ম্যানেজমেন্ট</label>
                </div>
                <button type="submit" className="btn-primary" style={{ background: '#d97706' }}>ইউজার তৈরি করুন</button>
              </form>

              <h4 style={{ margin: '16px 0 8px 0', color: '#b45309' }}>বিদ্যমান ইউজারদের পারমিশন বক্স:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {managedUsers.map((u) => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fcd34d', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong>⚙️ {u.name}</strong> 
                      <span className="badge" style={{ marginLeft: '6px', background: u.role === 'superAdmin' ? '#f59e0b' : '#dcfce7', color: u.role === 'superAdmin' ? 'white' : '#15803d' }}>
                        {u.role}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={u.can_edit} onChange={(e) => handleUpdateUserPermission(u.id, 'canEdit', e.target.checked)} /> এডিট ক্ষমতা
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={u.can_manage_admission} onChange={(e) => handleUpdateUserPermission(u.id, 'canManageAdmission', e.target.checked)} /> ভর্তি ম্যানেজমেন্ট
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '24px', borderTop: '2px solid #f59e0b', paddingTop: '16px' }}>
                <AdminAdmissions />
              </div>
              
              <div style={{ marginTop: '24px', borderTop: '2px solid #f59e0b', paddingTop: '16px' }}>
                <ContentManager />
              </div>
              
              <div style={{ marginTop: '24px', borderTop: '2px solid #f59e0b', paddingTop: '16px' }}>
                <TeacherManager />
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => setCurrentView('home')} className="btn-primary" style={{ backgroundColor: '#64748b' }}>হোম পেজে ফিরে যান</button>
            </div>
          </div>
        </div>
      )}

      {/* সাইন ইন মোডাল */}
      <SignInModal 
        isOpen={isSignInModalOpen} 
        onClose={() => setIsSignInModalOpen(false)} 
      />

      {/* অ্যাডমিশন মোডাল */}
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
