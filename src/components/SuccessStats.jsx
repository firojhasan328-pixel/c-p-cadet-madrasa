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

  // =============================================
  // ✅ রিয়েল টাইম ডেটা ফেচ (শুধু অনুমোদিত)
  // =============================================
  const fetchStats = async () => {
    setLoading(true);
    try {
      // ✅ শুধু is_approved = true (অনুমোদিত) ছাত্র
      const { count: studentCount, error: studentError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);

      if (studentError) console.error('Student count error:', studentError);

      // ✅ শুধু is_approved = true (অনুমোদিত) শিক্ষক
      const { count: teacherCount, error: teacherError } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);

      if (teacherError) console.error('Teacher count error:', teacherError);

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

  // =============================================
  // ✅ রিফ্রেশ ছাড়াই আপডেট (Realtime Subscription)
  // =============================================
  useEffect(() => {
    // ১. প্রথমবার ডেটা লোড
    fetchStats();

    // ২. students টেবিলের পরিবর্তন শুনুন
    const studentChannel = supabase
      .channel('student-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE সব শুনবে
          schema: 'public',
          table: 'students',
        },
        () => {
          console.log('🔄 Student stats updated (realtime)');
          fetchStats(); // রিফ্রেশ ছাড়াই আপডেট
        }
      )
      .subscribe();

    // ৩. teachers টেবিলের পরিবর্তন শুনুন
    const teacherChannel = supabase
      .channel('teacher-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teachers',
        },
        () => {
          console.log('🔄 Teacher stats updated (realtime)');
          fetchStats();
        }
      )
      .subscribe();

    // ৪. Cleanup: কম্পোনেন্ট আনমাউন্টে চ্যানেল বন্ধ করুন
    return () => {
      supabase.removeChannel(studentChannel);
      supabase.removeChannel(teacherChannel);
    };
  }, []);

  // =============================================
  // ✅ লোডিং স্টেট
  // =============================================
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

  // =============================================
  // ✅ ডেটা দেখান (ডিজাইন অপরিবর্তিত)
  // =============================================
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

// =============================================
// 🎨 ডিজাইন (আগের মতোই অপরিবর্তিত)
// =============================================
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
