import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function SuccessStats() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    passRate: 15,  // এটি স্ট্যাটিক থাকবে (শুধু দেখানোর জন্য)
    experience: 10 // এটি স্ট্যাটিক থাকবে (শুধু দেখানোর জন্য)
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ১. শিক্ষকদের রিয়েল-টাইম আপডেট
    const teacherQuery = query(
      collection(db, 'teachers'),
      where('status', '==', 'approved'),  // শুধু অনুমোদিত
      where('isActive', '==', true),      // সক্রিয়
      where('isDeleted', '==', false)     // ডিলিট নয়
    );

    const unsubscribeTeachers = onSnapshot(teacherQuery, (snapshot) => {
      const teacherCount = snapshot.size; // ডকুমেন্ট সংখ্যা
      setStats(prev => ({
        ...prev,
        teachers: teacherCount
      }));
      setLoading(false);
    }, (error) => {
      console.error("Teacher stats error:", error);
      setLoading(false);
    });

    // ২. ছাত্রদের রিয়েল-টাইম আপডেট
    const studentQuery = query(
      collection(db, 'students'),
      where('status', '==', 'approved'),  // শুধু অনুমোদিত
      where('isActive', '==', true),      // সক্রিয়
      where('isDeleted', '==', false)     // ডিলিট নয়
    );

    const unsubscribeStudents = onSnapshot(studentQuery, (snapshot) => {
      const studentCount = snapshot.size;
      setStats(prev => ({
        ...prev,
        students: studentCount
      }));
    }, (error) => {
      console.error("Student stats error:", error);
    });

    // ৩. ক্লিনআপ ফাংশন (অনুষঙ্গী পরিষ্কার)
    return () => {
      unsubscribeTeachers();
      unsubscribeStudents();
    };
  }, []); // খালি array = শুধু একবার রান হবে

  // লোডিং স্টেট
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
      {/* ছাত্র-ছাত্রী */}
      <div className="bg-white rounded-lg shadow-lg p-6 text-center transform transition hover:scale-105 duration-300">
        <div className="text-3xl font-bold text-blue-600 mb-2">
          {stats.students}+
        </div>
        <div className="text-gray-600 font-medium">ছাত্র-ছাত্রী</div>
        <div className="text-xs text-green-500 mt-1">✅ অনুমোদিত</div>
      </div>

      {/* শিক্ষক-শিক্ষিকা */}
      <div className="bg-white rounded-lg shadow-lg p-6 text-center transform transition hover:scale-105 duration-300">
        <div className="text-3xl font-bold text-green-600 mb-2">
          {stats.teachers}+
        </div>
        <div className="text-gray-600 font-medium">শিক্ষক-শিক্ষিকা</div>
        <div className="text-xs text-green-500 mt-1">✅ অনুমোদিত</div>
      </div>

      {/* পাশের হার (স্ট্যাটিক) */}
      <div className="bg-white rounded-lg shadow-lg p-6 text-center transform transition hover:scale-105 duration-300">
        <div className="text-3xl font-bold text-yellow-600 mb-2">
          {stats.passRate}%
        </div>
        <div className="text-gray-600 font-medium">পাশের হার</div>
        <div className="text-xs text-gray-400 mt-1">📊 সর্বশেষ পরীক্ষা</div>
      </div>

      {/* অভিজ্ঞতা (স্ট্যাটিক) */}
      <div className="bg-white rounded-lg shadow-lg p-6 text-center transform transition hover:scale-105 duration-300">
        <div className="text-3xl font-bold text-purple-600 mb-2">
          {stats.experience}+
        </div>
        <div className="text-gray-600 font-medium">বছরের অভিজ্ঞতা</div>
        <div className="text-xs text-gray-400 mt-1">🏆 প্রতিষ্ঠান</div>
      </div>
    </div>
  );
}
