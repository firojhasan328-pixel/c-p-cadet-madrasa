import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_approved', true)
        .order('class_name', { ascending: true })
        .order('roll_number', { ascending: true });
      
      if (data) {
        setStudents(data);
        setTotalStudents(data.length);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px', 
        flexWrap: 'wrap',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ 
          padding: '12px 24px', 
          background: '#dcfce7', 
          color: '#14532d', 
          fontWeight: 'bold' 
        }}>
          👦 মোট ছাত্র: {totalStudents} জন
        </div>
      </div>

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
