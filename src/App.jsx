import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Footer from './components/Footer';
import ContactPage from './components/ContactPage';
import SignInModal from './components/SignInModal';
import Gallery from './components/Gallery';
import StudentList from './components/StudentList';
import AdmissionForm from './components/AdmissionForm';

function App() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showAdmission, setShowAdmission] = useState(false);
  const [noticeText, setNoticeText] = useState('আগামী ১ জানুয়ারি থেকে ২০২৬-২৭ শিক্ষাবর্ষের নতুন ভর্তি ফরম পাওয়া যাচ্ছে।');
  
  const [homeContent, setHomeContent] = useState({
    heading: 'সুশিক্ষা ও সুন্নাত ভিত্তিক আদর্শ জীবন গড়ার বিশ্বস্ত প্রতিষ্ঠান',
    subheading: 'আমরা দিচ্ছি আধুনিক ক্বওমী ও জেনারেল শিক্ষা ব্যবস্থার এক অনন্য সমন্বয়।',
    badge: '🎓 নতুন সেশনে ভর্তি চলছে',
    btnText: 'ভর্তি আবেদন করুন'
  });

  useEffect(() => {
    document.title = 'চিলমারী প্রি ক্যাডেট মাদ্রাসা';
    window.scrollTo(0, 0);
  }, []);

  return (
    <Router>
      <div style={styles.app}>
        {/* নেভিগেশন বার */}
        <nav style={styles.navbar}>
          <div style={styles.navContainer}>
            <Link to="/" style={styles.navBrand}>
              <span style={styles.brandIcon}>🏫</span>
              <span style={styles.brandText}>চিলমারী প্রি ক্যাডেট মাদ্রাসা</span>
            </Link>
            
            <div style={styles.navLinks}>
              <Link to="/" style={styles.navLink}>হোম</Link>
              <Link to="/students" style={styles.navLink}>ছাত্র-ছাত্রী</Link>
              <Link to="/gallery" style={styles.navLink}>গ্যালারি</Link>
              <Link to="/contact" style={styles.navLink}>যোগাযোগ</Link>
              <button 
                style={styles.navBtnPrimary}
                onClick={() => setShowAdmission(true)}
              >
                🎓 ভর্তি আবেদন
              </button>
              <button 
                style={styles.navBtnSecondary}
                onClick={() => setShowSignIn(true)}
              >
                লগইন / রেজিস্টার
              </button>
            </div>
          </div>
        </nav>

        {/* মেইন কন্টেন্ট */}
        <main style={styles.mainContent}>
          <Routes>
            <Route path="/" element={
              <HomePage 
                content={homeContent} 
                noticeText={noticeText}
                onAdmissionOpen={() => setShowAdmission(true)}
              />
            } />
            <Route path="/students" element={<StudentList />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </main>

        {/* ফুটার */}
        <Footer />

        {/* মডাল */}
        <SignInModal 
          isOpen={showSignIn} 
          onClose={() => setShowSignIn(false)} 
        />

        <AdmissionForm 
          isOpen={showAdmission} 
          onClose={() => setShowAdmission(false)} 
        />
      </div>
    </Router>
  );
}

// =============================================
// হোম পেজ কম্পোনেন্ট
// =============================================
function HomePage({ content, noticeText, onAdmissionOpen }) {
  const principal = {
    name: 'আরিফ আশহাব খোরশেদ',
    designation: 'প্রধান শিক্ষক ও পরিচালক',
    image: 'https://i.postimg.cc/xd8py0DW/1786523361131.jpg',
    message: 'বিসমিল্লাহির রহমানির রহিম। চিলমারী প্রি ক্যাডেট মাদ্রাসায় আপনাকে জানাই আন্তরিক শুভেচ্ছা। আমাদের লক্ষ্য হলো কোমলমতি শিশুদের ধর্মীয় মূল্যবোধ, উত্তম চরিত্র এবং আধুনিক শিক্ষার মাধ্যমে এক আদর্শ নাগরিক হিসেবে গড়ে তোলা।'
  };

  const features = [
    { icon: '📖', title: 'দ্বীনি শিক্ষা', desc: 'পবিত্র কুরআন, হাদিস ও ইসলামী শিক্ষা' },
    { icon: '🧪', title: 'আধুনিক শিক্ষা', desc: 'বিজ্ঞান, গণিত, ইংরেজি ও কম্পিউটার' },
    { icon: '🏅', title: 'হিফজ প্রশিক্ষণ', desc: 'পেশাদার হাফেজদের তত্ত্বাবধানে' },
    { icon: '💻', title: 'ডিজিটাল লার্নিং', desc: 'স্মার্ট ক্লাসরুম ও ডিজিটাল কন্টেন্ট' },
  ];

  return (
    <div style={styles.homePage}>
      {/* হিরো সেকশন */}
      <section style={styles.heroSection}>
        <div style={styles.heroContent}>
          <span style={styles.heroBadge}>{content.badge}</span>
          <h1 style={styles.heroTitle}>{content.heading}</h1>
          <p style={styles.heroSubtitle}>{content.subheading}</p>
          <button 
            style={styles.heroBtn}
            onClick={onAdmissionOpen}
          >
            {content.btnText} →
          </button>
        </div>
        <div style={styles.heroImage}>
          <div style={styles.heroStats}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>২৫০+</span>
              <span style={styles.statLabel}>ছাত্র</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>২০+</span>
              <span style={styles.statLabel}>শিক্ষক</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>১০+</span>
              <span style={styles.statLabel}>বছর</span>
            </div>
          </div>
        </div>
      </section>

      {/* নোটিশ */}
      <div style={styles.noticeBar}>
        <span style={styles.noticeIcon}>📌</span>
        <p style={styles.noticeText}>{noticeText}</p>
      </div>

      {/* ফিচারস */}
      <section style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>আমাদের বিশেষত্ব</h2>
        <div style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} style={styles.featureCard}>
              <div style={styles.featureIcon}>{feature.icon}</div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureDesc}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* প্রধান শিক্ষক */}
      <section style={styles.principalSection}>
        <div style={styles.principalCard}>
          <div style={styles.principalImage}>
            <img src={principal.image} alt={principal.name} style={styles.principalImg} />
          </div>
          <div style={styles.principalInfo}>
            <h2 style={styles.principalName}>{principal.name}</h2>
            <p style={styles.principalDesignation}>{principal.designation}</p>
            <p style={styles.principalMessage}>"{principal.message}"</p>
          </div>
        </div>
      </section>

      {/* ভর্তি */}
      <section style={styles.admissionSection}>
        <div style={styles.admissionCard}>
          <h2 style={styles.admissionTitle}>🎓 ভর্তি চলছে!</h2>
          <p style={styles.admissionDesc}>২০২৬-২৭ শিক্ষাবর্ষে ভর্তি আবেদন গ্রহণ করা হচ্ছে।</p>
          <button style={styles.admissionBtn} onClick={onAdmissionOpen}>
            ভর্তি আবেদন করুন
          </button>
        </div>
      </section>
    </div>
  );
}

// =============================================
// সমস্ত স্টাইল (ইনলাইন)
// =============================================
const styles = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Hind Siliguri', sans-serif"
  },
  mainContent: {
    flex: 1
  },
  
  // নেভিগেশন
  navbar: {
    background: '#0f172a',
    padding: '16px 20px',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    color: 'white',
    fontWeight: '700',
    fontSize: '18px'
  },
  brandIcon: {
    fontSize: '24px'
  },
  brandText: {
    color: '#f8fafc'
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  navLink: {
    color: '#94a3b8',
    textDecoration: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  },
  navBtnPrimary: {
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    border: 'none',
    padding: '8px 18px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  navBtnSecondary: {
    background: '#1e293b',
    color: '#94a3b8',
    border: '1px solid #334155',
    padding: '8px 16px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  // হোম পেজ
  homePage: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },

  // হিরো
  heroSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    alignItems: 'center',
    minHeight: '400px',
    margin: '40px 0'
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  heroBadge: {
    display: 'inline-block',
    background: '#fef3c7',
    color: '#b45309',
    padding: '4px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    width: 'fit-content'
  },
  heroTitle: {
    fontSize: '38px',
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: '1.2',
    margin: 0
  },
  heroSubtitle: {
    fontSize: '16px',
    color: '#475569',
    lineHeight: '1.8',
    margin: 0
  },
  heroBtn: {
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    border: 'none',
    padding: '14px 32px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    width: 'fit-content',
    transition: 'all 0.3s ease'
  },
  heroImage: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  heroStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    background: 'white',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    width: '100%'
  },
  statItem: {
    textAlign: 'center'
  },
  statNumber: {
    display: 'block',
    fontSize: '32px',
    fontWeight: '800',
    color: '#16a34a'
  },
  statLabel: {
    fontSize: '14px',
    color: '#64748b'
  },

  // নোটিশ
  noticeBar: {
    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    padding: '16px 24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderLeft: '4px solid #f59e0b',
    marginBottom: '40px'
  },
  noticeIcon: {
    fontSize: '20px'
  },
  noticeText: {
    color: '#78350f',
    fontWeight: '500',
    margin: 0
  },

  // ফিচার
  featuresSection: {
    margin: '60px 0'
  },
  sectionTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: '32px'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px'
  },
  featureCard: {
    background: 'white',
    padding: '28px 20px',
    borderRadius: '16px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease'
  },
  featureIcon: {
    fontSize: '40px',
    marginBottom: '12px'
  },
  featureTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '8px'
  },
  featureDesc: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },

  // প্রধান শিক্ষক
  principalSection: {
    margin: '60px 0'
  },
  principalCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    display: 'grid',
    gridTemplateColumns: '200px 1fr',
    gap: '40px',
    alignItems: 'center',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
  },
  principalImage: {
    width: '100%'
  },
  principalImg: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '16px',
    border: '4px solid #f1f5f9'
  },
  principalInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  principalName: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0
  },
  principalDesignation: {
    color: '#16a34a',
    fontWeight: '600',
    margin: '4px 0 8px 0'
  },
  principalMessage: {
    color: '#475569',
    fontSize: '16px',
    lineHeight: '1.8',
    fontStyle: 'italic',
    margin: 0
  },

  // ভর্তি
  admissionSection: {
    margin: '40px 0 60px 0'
  },
  admissionCard: {
    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
    borderRadius: '20px',
    padding: '48px 32px',
    textAlign: 'center',
    color: 'white'
  },
  admissionTitle: {
    fontSize: '32px',
    fontWeight: '800',
    margin: '0 0 8px 0'
  },
  admissionDesc: {
    color: '#94a3b8',
    fontSize: '16px',
    margin: '0 0 20px 0'
  },
  admissionBtn: {
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    border: 'none',
    padding: '14px 40px',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  // রেসপনসিভ
  '@media (max-width: 968px)': {
    heroSection: {
      gridTemplateColumns: '1fr',
      textAlign: 'center'
    },
    heroContent: {
      alignItems: 'center'
    },
    heroBtn: {
      width: '100%',
      textAlign: 'center'
    },
    heroStats: {
      gridTemplateColumns: 'repeat(3, 1fr)',
      padding: '20px'
    },
    principalCard: {
      gridTemplateColumns: '1fr',
      textAlign: 'center',
      padding: '24px'
    },
    principalImg: {
      width: '160px',
      height: '160px',
      margin: '0 auto',
      display: 'block'
    }
  },
  '@media (max-width: 768px)': {
    navLinks: {
      width: '100%',
      justifyContent: 'center',
      gap: '4px'
    },
    navLink: {
      fontSize: '12px',
      padding: '4px 10px'
    },
    navBtnPrimary: {
      fontSize: '11px',
      padding: '6px 12px'
    },
    navBtnSecondary: {
      fontSize: '11px',
      padding: '6px 12px'
    },
    heroTitle: {
      fontSize: '28px'
    },
    heroStats: {
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px',
      padding: '16px'
    },
    statNumber: {
      fontSize: '24px'
    },
    featuresGrid: {
      gridTemplateColumns: '1fr 1fr'
    },
    admissionCard: {
      padding: '32px 20px'
    },
    admissionTitle: {
      fontSize: '24px'
    }
  },
  '@media (max-width: 480px)': {
    featuresGrid: {
      gridTemplateColumns: '1fr'
    },
    heroStats: {
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '8px',
      padding: '12px'
    },
    statNumber: {
      fontSize: '20px'
    },
    statLabel: {
      fontSize: '11px'
    },
    principalCard: {
      padding: '16px'
    },
    principalMessage: {
      fontSize: '14px'
    }
  }
};

export default App;
