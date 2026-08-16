import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminAdmissions() {
  const [applications, setApplications] = useState([]);
  const [studentRequests, setStudentRequests] = useState([]);
  const [teacherRequests, setTeacherRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    
    const { data: admissions } = await supabase
      .from('admissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('is_approved', false);
    
    const { data: teachers } = await supabase
      .from('teachers')
      .select('*')
      .eq('is_approved', false);
    
    setApplications(admissions || []);
    setStudentRequests(students || []);
    setTeacherRequests(teachers || []);
    setLoading(false);
  };

  const approveStudent = async (id) => {
    await supabase
      .from('students')
      .update({ is_approved: true })
      .eq('id', id);
    fetchAllData();
  };

  const rejectStudent = async (id) => {
    await supabase
      .from('students')
      .delete()
      .eq('id', id);
    fetchAllData();
  };

  const approveTeacher = async (id) => {
    await supabase
      .from('teachers')
      .update({ is_approved: true })
      .eq('id', id);
    fetchAllData();
  };

  const rejectTeacher = async (id) => {
    await supabase
      .from('teachers')
      .delete()
      .eq('id', id);
    fetchAllData();
  };

  // সাইনড ইউআরএল জেনারেট
  const getSignedUrl = async (filePath) => {
    if (!filePath) return null;
    const { data, error } = await supabase.storage
      .from('private-admission-files')
      .createSignedUrl(filePath, 60);
    
    if (error) return null;
    return data.signedUrl;
  };

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ color: '#b45309' }}>📋 সকল রিকোয়েস্ট (সুপার এডমিন)</h3>
      {loading ? <p>লোড হচ্ছে...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* ছাত্র রিকোয়েস্ট */}
          <div>
            <h4>🎓 ছাত্র নিবন্ধন রিকোয়েস্ট</h4>
            {studentRequests.length === 0 ? (
              <p style={{ color: '#64748b' }}>কোনো পেন্ডিং রিকোয়েস্ট নেই</p>
            ) : (
              studentRequests.map(app => (
                <div key={app.id} style={styles.requestCard}>
                  <div><strong>{app.name}</strong> - {app.class_name} শ্রেণী</div>
                  <div style={{ fontSize: '13px', color: '#334155' }}>
                    বাবা: {app.father_name}, গ্রাম: {app.village}
                  </div>
                  <div style={styles.buttonGroup}>
                    <button onClick={() => approveStudent(app.id)} style={styles.approveBtn}>অনুমোদন</button>
                    <button onClick={() => rejectStudent(app.id)} style={styles.rejectBtn}>বাতিল</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* শিক্ষক রিকোয়েস্ট */}
          <div>
            <h4>👨‍🏫 শিক্ষক নিবন্ধন রিকোয়েস্ট</h4>
            {teacherRequests.length === 0 ? (
              <p style={{ color: '#64748b' }}>কোনো পেন্ডিং রিকোয়েস্ট নেই</p>
            ) : (
              teacherRequests.map(app => (
                <div key={app.id} style={styles.requestCard}>
                  <div><strong>{app.name}</strong> - {app.designation}</div>
                  <div style={{ fontSize: '13px', color: '#334155' }}>
                    বিষয়: {app.subject}, মোবাইল: {app.phone}
                  </div>
                  <div style={styles.buttonGroup}>
                    <button onClick={() => approveTeacher(app.id)} style={styles.approveBtn}>অনুমোদন</button>
                    <button onClick={() => rejectTeacher(app.id)} style={styles.rejectBtn}>বাতিল</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* পুরাতন অ্যাডমিশন রিকোয়েস্ট */}
          <div>
            <h4>📝 ভর্তি আবেদনসমূহ</h4>
            {applications.length === 0 ? (
              <p style={{ color: '#64748b' }}>কোনো আবেদন নেই</p>
            ) : (
              applications.map(app => (
                <div key={app.id} style={styles.requestCard}>
                  <div><strong>{app.student_name}</strong> - {app.class_to_admit} শ্রেণী</div>
                  <div style={{ fontSize: '13px', color: '#334155' }}>
                    বাবা: {app.father_name}, মোবাইল: {app.phone}
                  </div>
                  <span style={styles.statusBadge}>
                    {app.status === 'approved' ? '✅ অনুমোদিত' : app.status === 'rejected' ? '❌ বাতিল' : '⏳ পেন্ডিং'}
                  </span>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}

const styles = {
  requestCard: {
    background: '#fef3c7', padding: '14px', borderRadius: '10px',
    border: '1px solid #f59e0b', marginBottom: '10px'
  },
  buttonGroup: { display: 'flex', gap: '8px', marginTop: '8px' },
  approveBtn: { 
    background: '#16a34a', color: 'white', border: 'none', 
    padding: '6px 16px', borderRadius: '6px', cursor: 'pointer',
    fontWeight: '600'
  },
  rejectBtn: { 
    background: '#dc2626', color: 'white', border: 'none', 
    padding: '6px 16px', borderRadius: '6px', cursor: 'pointer',
    fontWeight: '600'
  },
  statusBadge: { 
    display: 'inline-block', padding: '3px 10px', borderRadius: '12px', 
    background: '#fef9c3', color: '#854d0e', marginTop: '6px',
    fontSize: '13px', fontWeight: '600'
  }
};
