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
    
    if (data) setApplications(data);
    setLoading(false);
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
