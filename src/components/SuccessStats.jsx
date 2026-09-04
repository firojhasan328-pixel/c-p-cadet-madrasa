import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function SuccessStats() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    passRate: 15,
    experience: 10
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Teachers count function
    const getTeachers = async () => {
      try {
        const { count, error } = await supabase
          .from('teachers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .eq('is_active', true);
        
        if (!error) {
          setStats(prev => ({ ...prev, teachers: count || 0 }));
        }
      } catch (error) {
        console.error('Teacher count error:', error);
      }
    };

    // Students count function
    const getStudents = async () => {
      try {
        const { count, error } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .eq('is_active', true);
        
        if (!error) {
          setStats(prev => ({ ...prev, students: count || 0 }));
        }
      } catch (error) {
        console.error('Student count error:', error);
      }
    };

    // Initial load
    const loadStats = async () => {
      setLoading(true);
      await Promise.all([getTeachers(), getStudents()]);
      setLoading(false);
    };
    
    loadStats();

    // Real-time subscription
    const channel = supabase
      .channel('stats-changes')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'teachers' 
        },
        () => {
          getTeachers();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'students' 
        },
        () => {
          getStudents();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-lg p-6 text-center animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-3xl font-bold text-blue-600 mb-2">
          {stats.students}+
        </div>
        <div className="text-gray-600">ছাত্র-ছাত্রী</div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-3xl font-bold text-green-600 mb-2">
          {stats.teachers}+
        </div>
        <div className="text-gray-600">শিক্ষক-শিক্ষিকা</div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-3xl font-bold text-yellow-600 mb-2">
          {stats.passRate}%
        </div>
        <div className="text-gray-600">পাশের হার</div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-3xl font-bold text-purple-600 mb-2">
          {stats.experience}+
        </div>
        <div className="text-gray-600">বছরের অভিজ্ঞতা</div>
      </div>
    </div>
  );
}
