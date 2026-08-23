import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';
import PortalLayout from './PortalLayout';

export default function StudentDashboard() {
  const { userProfile, logout } = usePortal();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    attendance: [],
    results: [],
    routine: [],
    assignments: [],
    notices: [],
    achievements: [],
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    const studentId = userProfile?.id;

    // Attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    // Results
    const { data: results } = await supabase
      .from('results')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // Routine
    const { data: routine } = await supabase
      .from('class_routines')
      .select('*')
      .eq('class_name', userProfile?.class_name)
      .order('day_of_week');

    // Assignments
    const { data: assignments } = await supabase
      .from('assignments')
      .select('*')
      .eq('class_name', userProfile?.class_name)
      .order('deadline', { ascending: true });

    // Notices
    const { data: notices } = await supabase
      .from('portal_notices')
      .select('*')
      .eq('target_role', 'student')
      .or(`target_class.eq.${userProfile?.class_name},target_class.is.null`)
      .order('created_at', { ascending: false })
      .limit(10);

    // Achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    setData({
      attendance: attendance || [],
      results: results || [],
      routine: routine || [],
      assignments: assignments || [],
      notices: notices || [],
      achievements: achievements || [],
    });
    setLoading(false);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>⏳ লোড হচ্ছে...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'profile':
        return <StudentProfile profile={userProfile} />;
      case 'attendance':
        return <StudentAttendance data={data.attendance} />;
      case 'result':
        return <StudentResult data={data.results} />;
      case 'routine':
        return <StudentRoutine data={data.routine} />;
      case 'assignment':
        return <StudentAssignment data={data.assignments} />;
      case 'notice':
        return <StudentNotice data={data.notices} />;
      case 'idcard':
        return <DigitalIDCard profile={userProfile} />;
      case 'achievement':
        return <StudentAchievement data={data.achievements} />;
      default:
        return <StudentProfile profile={userProfile} />;
    }
  };

  return (
    <PortalLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={logout}
    >
      {renderContent()}
    </PortalLayout>
  );
}

// =============================================
// 🧑‍🎓 Student Profile (শুধু দেখা)
// =============================================
function StudentProfile({ profile }) {
  return (
    <div>
      <h3 style={styles.sectionTitle}>👤 আমার প্রোফাইল</h3>
      <div style={styles.profileCard}>
        <div style={styles.profileHeader}>
          <div style={styles.profileAvatar}>
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt="Profile" style={styles.profileAvatarImg} />
            ) : (
              <span style={styles.profileAvatarText}>{profile?.name?.[0] || 'U'}</span>
            )}
          </div>
          <div>
            <h2 style={styles.profileName}>{profile?.name}</h2>
            <p style={styles.profileRole}>🎓 ছাত্র/ছাত্রী</p>
          </div>
        </div>
        <div style={styles.profileDetails}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>📧 ইমেইল</span>
            <span style={styles.detailValue}>{profile?.email}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>📱 ফোন</span>
            <span style={styles.detailValue}>{profile?.phone || '—'}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>📚 ক্লাস</span>
            <span style={styles.detailValue}>{profile?.class_name || '—'}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>🔢 রোল নম্বর</span>
            <span style={styles.detailValue}>{profile?.roll_number || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// 📊 Student Attendance (শুধু দেখা)
// =============================================
function StudentAttendance({ data }) {
  const total = data.length;
  const present = data.filter(d => d.status === 'present').length;
  const absent = data.filter(d => d.status === 'absent').length;
  const late = data.filter(d => d.status === 'late').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div>
      <h3 style={styles.sectionTitle}>📊 উপস্থিতি</h3>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{percentage}%</div>
          <div style={styles.statLabel}>উপস্থিতি</div>
        </div>
        <div style={{ ...styles.statCard, background: '#dcfce7' }}>
          <div style={{ ...styles.statNumber, color: '#16a34a' }}>{present}</div>
          <div style={styles.statLabel}>✅ উপস্থিত</div>
        </div>
        <div style={{ ...styles.statCard, background: '#fee2e2' }}>
          <div style={{ ...styles.statNumber, color: '#dc2626' }}>{absent}</div>
          <div style={styles.statLabel}>❌ অনুপস্থিত</div>
        </div>
        <div style={{ ...styles.statCard, background: '#fef3c7' }}>
          <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{late}</div>
          <div style={styles.statLabel}>⏰ দেরি</div>
        </div>
      </div>

      {data.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
          এখনো কোনো উপস্থিতি রেকর্ড নেই
        </p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>তারিখ</th>
                <th style={styles.th}>স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 20).map((item, i) => (
                <tr key={i}>
                  <td style={styles.td}>{new Date(item.date).toLocaleDateString('bn-BD')}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: item.status === 'present' ? '#dcfce7' : item.status === 'late' ? '#fef3c7' : '#fee2e2',
                      color: item.status === 'present' ? '#16a34a' : item.status === 'late' ? '#f59e0b' : '#dc2626',
                    }}>
                      {item.status === 'present' ? '✅ উপস্থিত' : item.status === 'late' ? '⏰ দেরি' : '❌ অনুপস্থিত'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================
// 📝 Student Result (শুধু দেখা)
// =============================================
function StudentResult({ data }) {
  return (
    <div>
      <h3 style={styles.sectionTitle}>📝 পরীক্ষার ফলাফল</h3>
      {data.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
          এখনো কোনো ফলাফল প্রকাশিত হয়নি
        </p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>পরীক্ষা</th>
                <th style={styles.th}>বিষয়</th>
                <th style={styles.th}>নম্বর</th>
                <th style={styles.th}>মোট</th>
                <th style={styles.th}>গ্রেড</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i}>
                  <td style={styles.td}>{item.exam_name}</td>
                  <td style={styles.td}>{item.subject}</td>
                  <td style={styles.td}>{item.marks}</td>
                  <td style={styles.td}>{item.total_marks}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.gradeBadge,
                      background: item.grade === 'A+' || item.grade === 'A' ? '#dcfce7' : item.grade === 'B' ? '#fef3c7' : '#fee2e2',
                      color: item.grade === 'A+' || item.grade === 'A' ? '#16a34a' : item.grade === 'B' ? '#f59e0b' : '#dc2626',
                    }}>
                      {item.grade || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================
// 📅 Class Routine (শুধু দেখা)
// =============================================
function StudentRoutine({ data }) {
  const days = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'];

  return (
    <div>
      <h3 style={styles.sectionTitle}>📅 ক্লাস রুটিন</h3>
      {data.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
          এখনো রুটিন আপলোড করা হয়নি
        </p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>দিন</th>
                <th style={styles.th}>বিষয়</th>
                <th style={styles.th}>শিক্ষক</th>
                <th style={styles.th}>সময়</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i}>
                  <td style={styles.td}>{days[item.day_of_week] || item.day_of_week}</td>
                  <td style={styles.td}>{item.subject}</td>
                  <td style={styles.td}>{item.teacher_name}</td>
                  <td style={styles.td}>{item.start_time} - {item.end_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================
// 📚 Assignment (শুধু দেখা)
// =============================================
function StudentAssignment({ data }) {
  return (
    <div>
      <h3 style={styles.sectionTitle}>📚 অ্যাসাইনমেন্ট</h3>
      {data.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
          এখনো কোনো অ্যাসাইনমেন্ট দেওয়া হয়নি
        </p>
      ) : (
        data.map((item, i) => (
          <div key={i} style={styles.assignmentCard}>
            <div style={styles.assignmentHeader}>
              <h4 style={styles.assignmentTitle}>{item.title}</h4>
              <span style={{
                ...styles.deadlineBadge,
                background: new Date(item.deadline) < new Date() ? '#fee2e2' : '#dcfce7',
                color: new Date(item.deadline) < new Date() ? '#dc2626' : '#16a34a',
              }}>
                {new Date(item.deadline) < new Date() ? '⏰ শেষ' : `📅 ${new Date(item.deadline).toLocaleDateString('bn-BD')}`}
              </span>
            </div>
            <p style={styles.assignmentDesc}>{item.description || 'বিবরণ নেই'}</p>
            <div style={styles.assignmentMeta}>
              <span>📚 {item.subject}</span>
              <span>👨‍🏫 {item.teacher_name || 'শিক্ষক'}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// =============================================
// 🔔 Personal Notice (শুধু দেখা)
// =============================================
function StudentNotice({ data }) {
  return (
    <div>
      <h3 style={styles.sectionTitle}>🔔 ব্যক্তিগত নোটিশ</h3>
      {data.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
          এখনো কোনো নোটিশ নেই
        </p>
      ) : (
        data.map((item, i) => (
          <div key={i} style={styles.noticeCard}>
            <div style={styles.noticeHeader}>
              <h4 style={styles.noticeTitle}>{item.title}</h4>
              <span style={styles.noticeDate}>
                {new Date(item.created_at).toLocaleDateString('bn-BD')}
              </span>
            </div>
            <p style={styles.noticeMessage}>{item.message}</p>
          </div>
        ))
      )}
    </div>
  );
}

// =============================================
// 🪪 Digital ID Card (শুধু দেখা)
// =============================================
function DigitalIDCard({ profile }) {
  return (
    <div>
      <h3 style={styles.sectionTitle}>🪪 ডিজিটাল আইডি কার্ড</h3>
      <div style={styles.idCard}>
        <div style={styles.idCardHeader}>
          <span style={styles.idCardLogo}>🏫</span>
          <span style={styles.idCardSchool}>চিলমারী প্রি ক্যাডেট মাদ্রাসা</span>
        </div>
        <div style={styles.idCardBody}>
          <div style={styles.idCardAvatar}>
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt="Profile" style={styles.idCardAvatarImg} />
            ) : (
              <span style={styles.idCardAvatarText}>{profile?.name?.[0] || 'U'}</span>
            )}
          </div>
          <div style={styles.idCardInfo}>
            <div style={styles.idCardName}>{profile?.name}</div>
            <div style={styles.idCardRole}>🎓 ছাত্র/ছাত্রী</div>
            <div style={styles.idCardDetail}>📚 {profile?.class_name || '—'}</div>
            <div style={styles.idCardDetail}>🔢 রোল: {profile?.roll_number || '—'}</div>
          </div>
        </div>
        <div style={styles.idCardFooter}>
          <span>📧 {profile?.email}</span>
          <span>📱 {profile?.phone || '—'}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================
// 🏆 Achievement (শুধু দেখা)
// =============================================
function StudentAchievement({ data }) {
  return (
    <div>
      <h3 style={styles.sectionTitle}>🏆 অর্জন</h3>
      {data.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
          এখনো কোনো অর্জন নেই
        </p>
      ) : (
        data.map((item, i) => (
          <div key={i} style={styles.achievementCard}>
            <div style={styles.achievementIcon}>🏅</div>
            <div>
              <h4 style={styles.achievementTitle}>{item.title}</h4>
              <p style={styles.achievementDesc}>{item.description || 'বিবরণ নেই'}</p>
              <span style={styles.achievementDate}>
                📅 {new Date(item.date).toLocaleDateString('bn-BD')}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// =============================================
// স্টাইলসমূহ
// =============================================
const styles = {
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 20px 0',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '10px',
  },
  // Profile
  profileCard: {
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e2e8f0',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '20px',
  },
  profileAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  profileAvatarText: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#64748b',
  },
  profileName: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  profileRole: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  profileDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '8px 12px',
    background: 'white',
    borderRadius: '8px',
  },
  detailLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a',
  },
  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    textAlign: 'center',
    padding: '16px',
    borderRadius: '12px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
  },
  // Table
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    background: '#f1f5f9',
    padding: '10px 14px',
    textAlign: 'left',
    fontWeight: '700',
    color: '#334155',
    borderBottom: '2px solid #e2e8f0',
  },
  td: {
    padding: '10px 14px',
    borderBottom: '1px solid #f1f5f9',
  },
  statusBadge: {
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  gradeBadge: {
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700',
  },
  // Assignment
  assignmentCard: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid #e2e8f0',
  },
  assignmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  assignmentTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  deadlineBadge: {
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  assignmentDesc: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 8px 0',
  },
  assignmentMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#94a3b8',
  },
  // Notice
  noticeCard: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    borderLeft: '4px solid #16a34a',
  },
  noticeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  noticeTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  noticeDate: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  noticeMessage: {
    fontSize: '14px',
    color: '#475569',
    margin: 0,
  },
  // ID Card
  idCard: {
    maxWidth: '380px',
    margin: '0 auto',
    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
    borderRadius: '20px',
    padding: '24px',
    color: 'white',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  idCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid #334155',
    paddingBottom: '12px',
    marginBottom: '16px',
  },
  idCardLogo: {
    fontSize: '24px',
  },
  idCardSchool: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#f8fafc',
  },
  idCardBody: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  idCardAvatar: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    background: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  idCardAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  idCardAvatarText: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#94a3b8',
  },
  idCardInfo: {
    flex: 1,
  },
  idCardName: {
    fontSize: '18px',
    fontWeight: '700',
  },
  idCardRole: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  idCardDetail: {
    fontSize: '13px',
    color: '#cbd5e1',
  },
  idCardFooter: {
    borderTop: '1px solid #334155',
    paddingTop: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#94a3b8',
  },
  // Achievement
  achievementCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid #e2e8f0',
  },
  achievementIcon: {
    fontSize: '28px',
  },
  achievementTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  achievementDesc: {
    fontSize: '13px',
    color: '#64748b',
    margin: '2px 0',
  },
  achievementDate: {
    fontSize: '11px',
    color: '#94a3b8',
  },
};
