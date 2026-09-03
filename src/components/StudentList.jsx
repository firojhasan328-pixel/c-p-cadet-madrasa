import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('is_approved', true)
      .in('roll_number', [1, 2, 3])
      .order('class_name');

    if (!error) setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
    const channel = supabase
      .channel('students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, fetchStudents)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  if (loading) return <p style={{ textAlign: 'center', padding: '40px' }}>⏳ লোড হচ্ছে...</p>;

  if (students.length === 0) {
    return <p style={{ textAlign: 'center', padding: '40px' }}>📭 কোনো ছাত্র পাওয়া যায়নি</p>;
  }

  const grouped = {};
  students.forEach(s => {
    const cls = s.class_name || 'অনির্ধারিত';
    if (!grouped[cls]) grouped[cls] = [];
    grouped[cls].push(s);
  });

  const classOrder = ['প্লে', '১ম', '২য়', '৩য়', '৪র্থ', '৫ম'];
  const sorted = Object.keys(grouped).sort((a, b) => classOrder.indexOf(a) - classOrder.indexOf(b));

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
      <div style={{ background: '#14532d', color: 'white', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '28px' }}>{students.length} জন</h2>
        <p style={{ margin: 0, opacity: 0.8 }}>মেধাবী ছাত্র-ছাত্রী</p>
      </div>

      {sorted.map(cls => (
        <div key={cls} style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#14532d' }}>📚 {cls}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>ছবি</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>নাম</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>বাবা</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>মা</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>রোল</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>গ্রাম</th>
                </tr>
              </thead>
              <tbody>
                {grouped[cls].map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px' }}>
                      {s.photo_url ? (
                        <img src={s.photo_url} alt={s.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                          {s.name?.[0] || '?'}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px', fontWeight: '600' }}>{s.name}</td>
                    <td style={{ padding: '10px' }}>{s.father_name || '—'}</td>
                    <td style={{ padding: '10px' }}>{s.mother_name || '—'}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ background: '#dbeafe', padding: '2px 12px', borderRadius: '20px', fontWeight: '700', color: '#2563eb' }}>
                        #{s.roll_number}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>{s.village || s.address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
