import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';
import PortalLayout from './PortalLayout';

export default function TeacherDashboard() {
  const { userProfile, logout } = usePortal();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    routine: [],
    attendance: [],
    results: [],
    assignments: [],
    notices: [],
    students: [],
    performance: [],
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    const teacherId = userProfile?.id;

    // Routine
    const { data: routine } = await supabase
      .from('class_routines')
      .select('*')
      .eq('teacher_name', userProfile?.name)
      .order('day_of_week');

    // Attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false })
      .limit(50);

    // Results
    const { data: results } = await supabase
      .from('results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // Assignments
    const { data: assignments } = await supabase
      .from('assignments')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('deadline', { ascending: true });

    // Notices
    const { data: notices } = await supabase
      .from('portal_notices')
      .select('*')
      .eq('created_by', teacherId)
      .order('created_at', { ascending: false });

    // Students
    const { data: students } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('name');

    // Performance
    const { data: performance } = await supabase
      .from('results')
      .select('*')
      .order('created_at', { ascending: false });

    setData({
      routine: routine || [],
      attendance: attendance || [],
      results: results || [],
      assignments: assignments || [],
      notices: notices || [],
      students: students || [],
      performance: performance || [],
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
        return <TeacherProfile profile={userProfile} />;
      case 'teaching_routine':
        return <TeacherRoutine data={data.routine} />;
      case 'attendance':
        return <TeacherAttendance data={data.attendance} />;
      case 'result_entry':
        return <TeacherResultEntry data={data.results} onRefresh={fetchAllData} />;
      case 'assignment':
        return <TeacherAssignment data={data.assignments} onRefresh={fetchAllData} teacherId={userProfile?.id} />;
      case 'class_notice':
        return <TeacherNotice data={data.notices} onRefresh={fetchAllData} teacherId={userProfile?.id} />;
      case 'student_list':
        return <TeacherStudentList data={data.students} />;
      case 'class_performance':
        return <TeacherPerformance data={data.performance} />;
      default:
        return <TeacherProfile profile={userProfile} />;
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
// 👤 Teacher Profile (শুধু দেখা)
// =============================================
function TeacherProfile({ profile }) {
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
            <p style={styles.profileRole}>👨‍🏫 {profile?.designation || 'শিক্ষক'}</p>
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
            <span style={styles.detailLabel}>📋 পদবী</span>
            <span style={styles.detailValue}>{profile?.designation || '—'}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>📚 বিষয়</span>
            <span style={styles.detailValue}>{profile?.subject || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// 📅 Teaching Routine (শুধু দেখা)
// =============================================
function TeacherRoutine({ data }) {
  const days = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'];

  return (
    <div>
      <h3 style={styles.sectionTitle}>📅 শিক্ষাদানের রুটিন</h3>
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
                <th style={styles.th}>ক্লাস</th>
                <th style={styles.th}>বিষয়</th>
                <th style={styles.th}>সময়</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i}>
                  <td style={styles.td}>{days[item.day_of_week] || item.day_of_week}</td>
                  <td style={styles.td}>{item.class_name}</td>
                  <td style={styles.td}>{item.subject}</td>
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
// ✅ Attendance (দেওয়া)
// =============================================
function TeacherAttendance({ data }) {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('name');
    setStudents(data || []);
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData({ ...attendanceData, [studentId]: status });
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      alert('দয়া করে ক্লাস নির্বাচন করুন');
      return;
    }

    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    for (const [studentId, status] of Object.entries(attendanceData)) {
      if (status) {
        await supabase
          .from('attendance')
          .insert([{
            student_id: studentId,
            class_name: selectedClass,
            date: today,
            status: status,
          }]);
      }
    }

    setSuccess('✅ উপস্থিতি সফলভাবে সংরক্ষণ করা হয়েছে!');
    setAttendanceData({});
    setTimeout(() => setSuccess(''), 3000);
    setLoading(false);
  };

  const filteredStudents = students.filter(s => s.class_name === selectedClass);

  return (
    <div>
      <h3 style={styles.sectionTitle}>✅ উপস্থিতি</h3>

      {success && <div style={styles.successBox}>{success}</div>}

      <form onSubmit={handleSubmitAttendance} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>📚 ক্লাস নির্বাচন করুন</label>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setAttendanceData({});
            }}
            required
            style={styles.input}
          >
            <option value="">নির্বাচন করুন</option>
            <option value="প্লে">প্লে</option>
            <option value="১ম">১ম শ্রেণী</option>
            <option value="২য়">২য় শ্রেণী</option>
            <option value="৩য়">৩য় শ্রেণী</option>
            <option value="৪র্থ">৪র্থ শ্রেণী</option>
            <option value="৫ম">৫ম শ্রেণী</option>
          </select>
        </div>

        {selectedClass && filteredStudents.length > 0 && (
          <div>
            <p style={{ marginBottom: '12px', fontWeight: '600' }}>
              👥 {filteredStudents.length} জন ছাত্র
            </p>
            {filteredStudents.map((student) => (
              <div key={student.id} style={styles.attendanceRow}>
                <span style={styles.studentName}>{student.name}</span>
                <div style={styles.attendanceOptions}>
                  <label style={styles.attendanceLabel}>
                    <input
                      type="radio"
                      name={`attendance_${student.id}`}
                      value="present"
                      checked={attendanceData[student.id] === 'present'}
                      onChange={() => handleAttendanceChange(student.id, 'present')}
                    />
                    ✅ উপস্থিত
                  </label>
                  <label style={styles.attendanceLabel}>
                    <input
                      type="radio"
                      name={`attendance_${student.id}`}
                      value="absent"
                      checked={attendanceData[student.id] === 'absent'}
                      onChange={() => handleAttendanceChange(student.id, 'absent')}
                    />
                    ❌ অনুপস্থিত
                  </label>
                  <label style={styles.attendanceLabel}>
                    <input
                      type="radio"
                      name={`attendance_${student.id}`}
                      value="late"
                      checked={attendanceData[student.id] === 'late'}
                      onChange={() => handleAttendanceChange(student.id, 'late')}
                    />
                    ⏰ দেরি
                  </label>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? '⏳ সংরক্ষণ হচ্ছে...' : '💾 উপস্থিতি সংরক্ষণ করুন'}
            </button>
          </div>
        )}

        {selectedClass && filteredStudents.length === 0 && (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
            এই ক্লাসে কোনো ছাত্র নেই
          </p>
        )}
      </form>
    </div>
  );
}

// =============================================
// 📝 Result Entry (দেওয়া)
// =============================================
function TeacherResultEntry({ data, onRefresh }) {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [examName, setExamName] = useState('');
  const [subject, setSubject] = useState('');
  const [marksData, setMarksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('name');
    setStudents(data || []);
  };

  const handleMarksChange = (studentId, marks) => {
    setMarksData({ ...marksData, [studentId]: marks });
  };

  const handleSubmitResults = async (e) => {
    e.preventDefault();
    if (!selectedClass || !examName || !subject) {
      alert('দয়া করে সব তথ্য দিন');
      return;
    }

    setLoading(true);

    for (const [studentId, marks] of Object.entries(marksData)) {
      if (marks !== '' && marks !== undefined) {
        await supabase
          .from('results')
          .insert([{
            student_id: studentId,
            class_name: selectedClass,
            exam_name: examName,
            subject: subject,
            marks: parseFloat(marks),
            total_marks: 100,
            grade: getGrade(parseFloat(marks)),
          }]);
      }
    }

    setSuccess('✅ ফলাফল সফলভাবে সংরক্ষণ করা হয়েছে!');
    setMarksData({});
    onRefresh();
    setTimeout(() => setSuccess(''), 3000);
    setLoading(false);
  };

  const getGrade = (marks) => {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B';
    if (marks >= 60) return 'C';
    if (marks >= 40) return 'D';
    return 'F';
  };

  const filteredStudents = students.filter(s => s.class_name === selectedClass);

  return (
    <div>
      <h3 style={styles.sectionTitle}>📝 ফলাফল প্রদান</h3>

      {success && <div style={styles.successBox}>{success}</div>}

      <form onSubmit={handleSubmitResults} style={styles.form}>
        <div style={styles.formRow}>
          <div style={styles.field}>
            <label style={styles.label}>📚 ক্লাস *</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setMarksData({});
              }}
              required
              style={styles.input}
            >
              <option value="">নির্বাচন করুন</option>
              <option value="প্লে">প্লে</option>
              <option value="১ম">১ম শ্রেণী</option>
              <option value="২য়">২য় শ্রেণী</option>
              <option value="৩য়">৩য় শ্রেণী</option>
              <option value="৪র্থ">৪র্থ শ্রেণী</option>
              <option value="৫ম">৫ম শ্রেণী</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>📝 পরীক্ষার নাম *</label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="যেমন: অর্ধ-বার্ষিক"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>📚 বিষয় *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="যেমন: বাংলা"
              required
              style={styles.input}
            />
          </div>
        </div>

        {selectedClass && filteredStudents.length > 0 && (
          <div>
            <p style={{ marginBottom: '12px', fontWeight: '600' }}>
              👥 {filteredStudents.length} জন ছাত্র
            </p>
            {filteredStudents.map((student) => (
              <div key={student.id} style={styles.marksRow}>
                <span style={styles.studentName}>{student.name}</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="নম্বর"
                  value={marksData[student.id] || ''}
                  onChange={(e) => handleMarksChange(student.id, e.target.value)}
                  style={styles.marksInput}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? '⏳ সংরক্ষণ হচ্ছে...' : '💾 ফলাফল সংরক্ষণ করুন'}
            </button>
          </div>
        )}

        {selectedClass && filteredStudents.length === 0 && (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
            এই ক্লাসে কোনো ছাত্র নেই
          </p>
        )}
      </form>
    </div>
  );
}

// =============================================
// 📚 Assignment (দেওয়া)
// =============================================
function TeacherAssignment({ data, onRefresh, teacherId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    class_name: '',
    subject: '',
    title: '',
    description: '',
    deadline: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.class_name || !formData.title || !formData.deadline) {
      alert('দয়া করে সব প্রয়োজনীয় তথ্য দিন');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('assignments')
      .insert([{
        teacher_id: teacherId,
        class_name: formData.class_name,
        subject: formData.subject || '—',
        title: formData.title,
        description: formData.description || '',
        deadline: formData.deadline,
        teacher_name: (await supabase.from('profiles').select('name').eq('id', teacherId).single()).data?.name || 'শিক্ষক',
      }]);

    if (!error) {
      setSuccess('✅ অ্যাসাইনমেন্ট সফলভাবে তৈরি করা হয়েছে!');
      setFormData({ class_name: '', subject: '', title: '', description: '', deadline: '' });
      setShowForm(false);
      onRefresh();
      setTimeout(() => setSuccess(''), 3000);
    }
    setLoading(false);
  };

  return (
    <div>
      <h3 style={styles.sectionTitle}>📚 অ্যাসাইনমেন্ট</h3>

      {success && <div style={styles.successBox}>{success}</div>}

      <button
        onClick={() => setShowForm(!showForm)}
        style={styles.primaryBtn}
      >
        {showForm ? '✕ বন্ধ করুন' : '➕ নতুন অ্যাসাইনমেন্ট'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ ...styles.form, marginTop: '16px' }}>
          <div style={styles.formRow}>
            <div style={styles.field}>
              <label style={styles.label}>📚 ক্লাস *</label>
              <select
                name="class_name"
                value={formData.class_name}
                onChange={handleChange}
                required
                style={styles.input}
              >
                <option value="">নির্বাচন করুন</option>
                <option value="প্লে">প্লে</option>
                <option value="১ম">১ম শ্রেণী</option>
                <option value="২য়">২য় শ্রেণী</option>
                <option value="৩য়">৩য় শ্রেণী</option>
                <option value="৪র্থ">৪র্থ শ্রেণী</option>
                <option value="৫ম">৫ম শ্রেণী</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>📚 বিষয়</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="বিষয়"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>📝 শিরোনাম *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="অ্যাসাইনমেন্টের শিরোনাম"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>📄 বিবরণ</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="অ্যাসাইনমেন্টের বিবরণ"
              rows="3"
              style={{ ...styles.input, minHeight: '80px' }}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>📅 শেষ তারিখ *</label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={styles.submitBtn}
          >
            {loading ? '⏳ তৈরি হচ্ছে...' : '✅ অ্যাসাইনমেন্ট তৈরি করুন'}
          </button>
        </form>
      )}

      <div style={{ marginTop: '20px' }}>
        {data.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
            এখনো কোনো অ্যাসাইনমেন্ট তৈরি করেননি
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
                <span>📚 {item.class_name} | {item.subject}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// =============================================
// 🔔 Class Notice (দেওয়া)
// =============================================
function TeacherNotice({ data, onRefresh, teacherId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_class: '',
    target_role: 'both',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      alert('দয়া করে শিরোনাম ও বার্তা দিন');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('portal_notices')
      .insert([{
        title: formData.title,
        message: formData.message,
        target_role: formData.target_role,
        target_class: formData.target_class || null,
        created_by: teacherId,
      }]);

    if (!error) {
      setSuccess('✅ নোটিশ সফলভাবে তৈরি করা হয়েছে!');
      setFormData({ title: '', message: '', target_class: '', target_role: 'both' });
      setShowForm(false);
      onRefresh();
      setTimeout(() => setSuccess(''), 3000);
    }
    setLoading(false);
  };

  return (
    <div>
      <h3 style={styles.sectionTitle}>🔔 ক্লাস নোটিশ</h3>

      {success && <div style={styles.successBox}>{success}</div>}

      <button
        onClick={() => setShowForm(!showForm)}
        style={styles.primaryBtn}
      >
        {showForm ? '✕ বন্ধ করুন' : '➕ নতুন নোটিশ'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ ...styles.form, marginTop: '16px' }}>
          <div style={styles.field}>
            <label style={styles.label}>📝 শিরোনাম *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="নোটিশের শিরোনাম"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>📄 বার্তা *</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="নোটিশের বিবরণ"
              rows="4"
              required
              style={{ ...styles.input, minHeight: '100px' }}
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.field}>
              <label style={styles.label}>🎯 লক্ষ্য</label>
              <select
                name="target_role"
                value={formData.target_role}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="both">সকলকে</option>
                <option value="student">শুধু ছাত্র</option>
                <option value="teacher">শুধু শিক্ষক</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>📚 নির্দিষ্ট ক্লাস</label>
              <select
                name="target_class"
                value={formData.target_class}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">সব ক্লাস</option>
                <option value="প্লে">প্লে</option>
                <option value="১ম">১ম শ্রেণী</option>
                <option value="২য়">২য় শ্রেণী</option>
                <option value="৩য়">৩য় শ্রেণী</option>
                <option value="৪র্থ">৪র্থ শ্রেণী</option>
                <option value="৫ম">৫ম শ্রেণী</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={styles.submitBtn}
          >
            {loading ? '⏳ তৈরি হচ্ছে...' : '✅ নোটিশ তৈরি করুন'}
          </button>
        </form>
      )}

      <div style={{ marginTop: '20px' }}>
        {data.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
            এখনো কোনো নোটিশ তৈরি করেননি
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
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                🎯 {item.target_role === 'both' ? 'সকলকে' : item.target_role === 'student' ? 'ছাত্র' : 'শিক্ষক'}
                {item.target_class && ` | 📚 ${item.target_class}`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// =============================================
// 👥 Student List (শুধু দেখা)
// =============================================
function TeacherStudentList({ data }) {
  const [selectedClass, setSelectedClass] = useState('');
  const filtered = selectedClass ? data.filter(s => s.class_name === selectedClass) : data;

  const classes = [...new Set(data.map(s => s.class_name).filter(Boolean))];

  return (
    <div>
      <h3 style={styles.sectionTitle}>👥 ছাত্রদের তালিকা</h3>

      <div style={styles.field}>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={styles.input}
        >
          <option value="">সব ক্লাস</option>
          {classes.map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
          কোনো ছাত্র পাওয়া যায়নি
        </p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>নাম</th>
                <th style={styles.th}>ক্লাস</th>
                <th style={styles.th}>রোল</th>
                <th style={styles.th}>ফোন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student, i) => (
                <tr key={i}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#64748b',
                      }}>
                        {student.name?.[0] || 'U'}
                      </div>
                      {student.name}
                    </div>
                  </td>
                  <td style={styles.td}>{student.class_name || '—'}</td>
                  <td style={styles.td}>{student.roll_number || '—'}</td>
                  <td style={styles.td}>{student.phone || '—'}</td>
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
// 📊 Class Performance (শুধু দেখা)
// =============================================
function TeacherPerformance({ data }) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  const classes = [...new Set(data.map(r => r.class_name).filter(Boolean))];
  const exams = [...new Set(data.map(r => r.exam_name).filter(Boolean))];

  let filteredData = data;
  if (selectedClass) filteredData = filteredData.filter(r => r.class_name === selectedClass);
  if (selectedExam) filteredData = filteredData.filter(r => r.exam_name === selectedExam);

  // Calculate class average
  const avgMarks = filteredData.length > 0
    ? (filteredData.reduce((sum, r) => sum + parseFloat(r.marks || 0), 0) / filteredData.length).toFixed(1)
    : 0;

  // Grade distribution
  const gradeDistribution = {
    'A+': filteredData.filter(r => r.grade === 'A+').length,
    'A': filteredData.filter(r => r.grade === 'A').length,
    'B': filteredData.filter(r => r.grade === 'B').length,
    'C': filteredData.filter(r => r.grade === 'C').length,
    'D': filteredData.filter(r => r.grade === 'D').length,
    'F': filteredData.filter(r => r.grade === 'F').length,
  };

  return (
    <div>
      <h3 style={styles.sectionTitle}>📊 ক্লাস পারফরম্যান্স</h3>

      <div style={styles.formRow}>
        <div style={styles.field}>
          <label style={styles.label}>📚 ক্লাস</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={styles.input}
          >
            <option value="">সব ক্লাস</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>📝 পরীক্ষা</label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            style={styles.input}
          >
            <option value="">সব পরীক্ষা</option>
            {exams.map((exam) => (
              <option key={exam} value={exam}>{exam}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{filteredData.length}</div>
          <div style={styles.statLabel}>মোট ফলাফল</div>
        </div>
        <div style={{ ...styles.statCard, background: '#dcfce7' }}>
          <div style={{ ...styles.statNumber, color: '#16a34a' }}>{avgMarks}</div>
          <div style={styles.statLabel}>গড় নম্বর</div>
        </div>
        <div style={{ ...styles.statCard, background: '#fef3c7' }}>
          <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{gradeDistribution['A+'] + gradeDistribution['A']}</div>
          <div style={styles.statLabel}>A+ বা A</div>
        </div>
        <div style={{ ...styles.statCard, background: '#fee2e2' }}>
          <div style={{ ...styles.statNumber, color: '#dc2626' }}>{gradeDistribution['F']}</div>
          <div style={styles.statLabel}>F (ফেল)</div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
          কোনো ফলাফল পাওয়া যায়নি
        </p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ছাত্র</th>
                <th style={styles.th}>বিষয়</th>
                <th style={styles.th}>নম্বর</th>
                <th style={styles.th}>গ্রেড</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, i) => (
                <tr key={i}>
                  <td style={styles.td}>
                    {item.student_name || (() => {
                      const student = supabase.from('profiles').select('name').eq('id', item.student_id).single();
                      return student?.data?.name || '—';
                    })()}
                  </td>
                  <td style={styles.td}>{item.subject}</td>
                  <td style={styles.td}>{item.marks}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.gradeBadge,
                      background: item.grade === 'A+' || item.grade === 'A' ? '#dcfce7' : item.grade === 'B' ? '#fef3c7' : item.grade === 'C' ? '#fef9c3' : '#fee2e2',
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
// কমন স্টাইলসমূহ (পূর্বের মতো)
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#f8fafc',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '4px',
  },
  primaryBtn: {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
  },
  successBox: {
    background: '#dcfce7',
    color: '#15803d',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '16px',
    fontWeight: '600',
    borderLeft: '4px solid #16a34a',
  },
  attendanceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '6px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  attendanceOptions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  attendanceLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  studentName: {
    fontWeight: '600',
    color: '#0f172a',
    fontSize: '14px',
  },
  marksRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '6px',
  },
  marksInput: {
    width: '80px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    textAlign: 'center',
  },
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
  noticeCard: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    borderLeft: '4px solid #2563eb',
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
  '@media (max-width: 768px)': {
    profileDetails: { gridTemplateColumns: '1fr' },
    formRow: { gridTemplateColumns: '1fr' },
    attendanceRow: { flexDirection: 'column', alignItems: 'flex-start' },
    marksRow: { flexDirection: 'column', gap: '8px' },
  },
};
