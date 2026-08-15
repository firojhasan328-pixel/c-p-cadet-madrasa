import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminAdmissions() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      // সাইনড ইউআরএল জেনারেট (শুধু সুপার এডমিন দেখতে পাবে)
      const appsWithUrls = await Promise.all(data.map(async (app) => {
        const studentPhotoUrl = await getSignedUrl(app.student_photo);
        const birthCertUrl = await getSignedUrl(app.birth_cert_photo);
        const fatherNidUrl = await getSignedUrl(app.father_nid_photo);
        
        return {
          ...app,
          studentPhotoUrl,
          birthCertUrl,
          fatherNidUrl
        };
      }));
      setApplications(appsWithUrls);
    }
    setLoading(false);
  };

  // প্রাইভেট বাকেট থেকে সাইনড ইউআরএল তৈরি
  const getSignedUrl = async (filePath) => {
    if (!filePath) return null;
    const { data, error } = await supabase.storage
      .from('private-admission-files')
      .createSignedUrl(filePath, 60); // ৬০ সেকেন্ড বৈধ
    
    if (error) return null;
    return data.signedUrl;
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('admissions')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (!error) fetchApplications();
  };

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ color: '#b45309' }}>📋 ভর্তি আবেদনসমূহ (সুপার এডমিন)</h3>
      {loading ? <p>লোড হচ্ছে...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {applications.map(app => (
            <div key={app.id} style={{ 
              background: '#fef3c7', padding: '14px', borderRadius: '10px',
              border: '1px solid #f59e0b'
            }}>
              <div><strong>{app.student_name}</strong> - {app.class_to_admit} শ্রেণী</div>
              <div style={{ fontSize: '13px', color: '#334155' }}>
                বাবা: {app.father_name}, মোবাইল: {app.phone}
              </div>
              
              {/* ছবি প্রিভিউ (শুধুমাত্র সুপার এডমিন দেখতে পাবে) */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                {app.studentPhotoUrl && (
                  <a href={app.studentPhotoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                    📸 ছাত্র/ছাত্রীর ছবি
                  </a>
                )}
                {app.birthCertUrl && (
                  <a href={app.birthCertUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                    📄 জন্ম নিবন্ধন
                  </a>
                )}
                {app.fatherNidUrl && (
                  <a href={app.fatherNidUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                    🆔 বাবার NID
                  </a>
                )}
              </div>

              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ 
                  padding: '3px 10px', borderRadius: '12px', background: 
                  app.status === 'approved' ? '#dcfce7' : app.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                  color: app.status === 'approved' ? '#15803d' : app.status === 'rejected' ? '#dc2626' : '#854d0e'
                }}>
                  {app.status === 'approved' ? '✅ অনুমোদিত' : app.status === 'rejected' ? '❌ বাতিল' : '⏳ পেন্ডিং'}
                </span>
                {app.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(app.id, 'approved')} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer' }}>অনুমোদন</button>
                    <button onClick={() => updateStatus(app.id, 'rejected')} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer' }}>বাতিল</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
