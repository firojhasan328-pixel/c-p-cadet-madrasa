import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function SuccessStats() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    passRate: '৯৫%',
    experience: '১০+'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    // ✅ রিয়েল টাইম আপডেটের জন্য Subscription
    const studentChannel = supabase
      .channel('student-count-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'students' 
      }, () => {
        fetchStats();
      })
      .subscribe();

    const teacherChannel = supabase
      .channel('teacher-count-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'teachers' 
      }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(studentChannel);
      supabase.removeChannel(teacherChannel);
    };
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // ✅ students কাউন্ট
      const { count: studentCount, error: studentError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      if (studentError) {
        console.error('Student count error:', studentError);
      }

      // ✅ teachers কাউন্ট
      const { count: teacherCount, error: teacherError } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });

      if (teacherError) {
        console.error('Teacher count error:', teacherError);
      }

      setStats({
        students: studentCount || 0,
        teachers: teacherCount || 0,
        passRate: '৯৫%',
        experience: '১০+'
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {[1, 2, 3, 4].map((_, index) => (
          <div key={index} style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px 16px',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '24px', color: '#94a3b8' }}>⏳</div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>লোড হচ্ছে...</div>
          </div>
        ))}
      </div>
    );
  }

  const statsData = [
    { number: `${stats.students}+`, label: 'ছাত্র-ছাত্রী', icon: '👨‍🎓' },
    { number: `${stats.teachers}+`, label: 'শিক্ষক-শিক্ষিকা', icon: '👨‍🏫' },
    { number: stats.passRate, label: 'পাসের হার', icon: '📈' },
    { number: stats.experience, label: 'বছরের অভিজ্ঞতা', icon: '🏆' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
      marginBottom: '32px'
    }}>
      {statsData.map((stat, index) => (
        <div key={index} style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px 16px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>{stat.icon}</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#14532d' }}>{stat.number}</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
