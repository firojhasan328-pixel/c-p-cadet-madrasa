import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('is_approved', true)
      .order('class_name', { ascending: true })
      .order('roll_number', { ascending: true });
    
    if (data) setStudents(data);
    setLoading(false);
  };

  if (loading) return <p>⏳ লোড হচ্ছে...</p>;

  const groupedStudents = students.reduce((acc, student) => {
    if (!acc[student.class_name]) acc[student.class_name] = [];
    acc[student.class_name].push(student);
    return acc;
  }, {});

  return (
    <div>
      {Object.keys(groupedStudents).map(className => (
        <div key={className} style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#166534', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
            📚 {className} শ্রেণী
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {groupedStudents[className].map(student => (
              <div key={student.id} style={{ background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                {student.photo_url && (
                  <img src={student.photo_url} alt={student.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px auto', display: 'block' }} />
                )}
                <h4 style={{ margin: '4px 0' }}>{student.name}</h4>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>রোল: {student.roll_number || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
