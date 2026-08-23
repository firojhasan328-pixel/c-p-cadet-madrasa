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

    const studentChannel = supabase
      .channel('student-count-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchStats();
      })
      .subscribe();

    const teacherChannel = supabase
      .channel('teacher-count-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, () => {
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
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      const { count: teacherCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });

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
      <div style={styles.grid}>
        {[1, 2, 3, 4].map((_, i) => (
          <div key={i} style={styles.card}>
            <div style={{ fontSize: '20px', color: '#94a3b8' }}>⏳</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>লোড...</div>
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
    <div style={styles.grid}>
      {statsData.map((stat, index) => (
        <div key={index} style={styles.card}>
          <div style={styles.icon}>{stat.icon}</div>
          <div style={styles.number}>{stat.number}</div>
          <div style={styles.label}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '28px'
  },
  card: {
    background: 'white',
    borderRadius: '14px',
    padding: '14px 10px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
  },
  icon: {
    fontSize: '24px',
    marginBottom: '2px'
  },
  number: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#14532d',
    lineHeight: '1.2'
  },
  label: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px'
  }
};
