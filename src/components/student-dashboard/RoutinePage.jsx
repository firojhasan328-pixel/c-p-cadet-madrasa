import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePortal } from '../../context/PortalContext';

export default function RoutinePage({ onBack }) {
  const { userProfile } = usePortal();
  const [routine, setRoutine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState('day');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cmsSettings, setCmsSettings] = useState({
    showTeacher: true,
    showRoom: true,
    defaultColor: '#3b82f6',
    weekStart: 'শনিবার',
  });

  // ✅ সঠিক দিনের নাম + বাংলাদেশ সময় (GMT+6)
  const dayNames = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'];
  const monthNames = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

  // =============================================
  // ✅ বাংলাদেশ সময় (GMT+6) ফাংশন
  // =============================================
  const getBangladeshTime = (date = new Date()) => {
    const bdTime = new Date(date.getTime() + (6 * 60 * 60 * 1000));
    return bdTime;
  };

  // ✅ বর্তমান বাংলাদেশ সময়
  const bdNow = getBangladeshTime();
  const todayIndex = bdNow.getDay(); // 0=শনিবার, 1=রবিবার...
  const todayName = dayNames[todayIndex];

  // ✅ ফরম্যাট করা সময়
  const formatTime = (date) => {
    const bd = getBangladeshTime(date);
    return bd.toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date) => {
    const bd = getBangladeshTime(date);
    return `${bd.getDate()} ${monthNames[bd.getMonth()]} ${bd.getFullYear()}`;
  };

  // =============================================
  // ✅ লাইভ টাইম আপডেট (প্রতি সেকেন্ড)
  // =============================================
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const bd = getBangladeshTime(now);
      setCurrentTime(bd);
      
      // ✅ রাত ১২টায় দিন পরিবর্তন হলে সিলেক্টেড ডে আপডেট
      const newDayIndex = bd.getDay();
      if (newDayIndex !== selectedDay && selectedDay !== null) {
        const hasRoutine = routine.some(r => r.day === dayNames[newDayIndex]);
        if (hasRoutine) {
          setSelectedDay(newDayIndex);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedDay, routine]);

  // =============================================
  // ✅ CMS সেটিংস লোড
  // =============================================
  useEffect(() => {
    loadCMSSettings();
  }, []);

  const loadCMSSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_values')
        .select(`
          value,
          cms_fields (field_key)
        `)
        .in('cms_fields.field_key', [
          'routine_show_teacher',
          'routine_show_room',
          'routine_default_color',
          'routine_week_start'
        ]);

      if (error) throw error;

      if (data) {
        const settings = {};
        data.forEach(item => {
          if (item.cms_fields) {
            settings[item.cms_fields.field_key] = item.value;
          }
        });
        setCmsSettings({
          showTeacher: settings.routine_show_teacher !== 'false',
          showRoom: settings.routine_show_room !== 'false',
          defaultColor: settings.routine_default_color || '#3b82f6',
          weekStart: settings.routine_week_start || 'শনিবার',
        });
      }
    } catch (error) {
      console.error('❌ CMS সেটিংস লোড করতে সমস্যা:', error);
    }
  };

  // =============================================
  // ✅ রুটিন ডেটা ফেচ
  // =============================================
  useEffect(() => {
    if (userProfile) {
      fetchRoutine();
    }
  }, [userProfile]);

  const fetchRoutine = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('class_routines')
        .select('*')
        .eq('class_name', userProfile.class_name)
        .eq('is_active', true)
        .order('day')
        .order('start_time');

      if (error) throw error;
      setRoutine(data || []);
      
      if (data && data.length > 0) {
        // ✅ আজকের দিনের রুটিন চেক
        const todayRoutine = data.filter(r => r.day === todayName);
        if (todayRoutine.length > 0) {
          setSelectedDay(todayIndex);
        } else {
          // আজকের রুটিন না থাকলে প্রথম দিনটি সিলেক্ট করো
          const firstDayName = data[0].day;
          const firstDayIndex = dayNames.indexOf(firstDayName);
          setSelectedDay(firstDayIndex >= 0 ? firstDayIndex : 0);
        }
      }
    } catch (error) {
      console.error('❌ রুটিন লোড করতে সমস্যা:', error);
    }
    setLoading(false);
  };

  // =============================================
  // ✅ দিনের রুটিন ফিল্টার
  // =============================================
  const getDayRoutine = (dayIndex) => {
    const dayName = dayNames[dayIndex];
    return routine.filter(r => r.day === dayName);
  };

  // =============================================
  // ✅ বর্তমান ক্লাস চেক (BDT অনুযায়ী)
  // =============================================
  const getCurrentClass = (dayRoutine) => {
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    for (const cls of dayRoutine) {
      if (!cls.start_time || !cls.end_time) continue;
      const [startHour, startMinute] = cls.start_time.split(':').map(Number);
      const [endHour, endMinute] = cls.end_time.split(':').map(Number);
      const startTotal = startHour * 60 + startMinute;
      const endTotal = endHour * 60 + endMinute;

      if (currentTimeMinutes >= startTotal && currentTimeMinutes <= endTotal) {
        return { ...cls, isCurrent: true };
      }
    }
    return null;
  };

  // =============================================
  // ✅ পরবর্তী ক্লাস চেক
  // =============================================
  const getNextClass = (dayRoutine) => {
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    for (const cls of dayRoutine) {
      if (!cls.start_time) continue;
      const [startHour, startMinute] = cls.start_time.split(':').map(Number);
      const startTotal = startHour * 60 + startMinute;
      if (startTotal > currentTimeMinutes) {
        return cls;
      }
    }
    return null;
  };

  // =============================================
  // ✅ রঙ নির্ধারণ
  // =============================================
  const getSubjectColor = (subject) => {
    const colors = {
      'বাংলা': '#16a34a',
      'ইংরেজি': '#2563eb',
      'গণিত': '#f59e0b',
      'বিজ্ঞান': '#8b5cf6',
      'ইসলাম': '#06b6d4',
      'আরবি': '#ec4899',
      'কম্পিউটার': '#14b8a6',
      'শারীরিক': '#f97316',
    };
    return colors[subject] || cmsSettings.defaultColor;
  };

  // =============================================
  // ✅ লোডিং
  // =============================================
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>⏳ লোড হচ্ছে...</p>
      </div>
    );
  }

  const selectedDayRoutine = getDayRoutine(selectedDay);
  const currentClass = getCurrentClass(selectedDayRoutine);
  const nextClass = getNextClass(selectedDayRoutine);

  // ✅ লাইভ সময় ও তারিখ
  const liveTime = formatTime(currentTime);
  const liveDate = formatDate(currentTime);
  const liveDay = dayNames[currentTime.getDay()];

  return (
    <div style={styles.container}>
      {/* হেডার */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>⬅ ফিরে যান</button>
        <h2 style={styles.headerTitle}>📅 ক্লাস রুটিন</h2>
        <div style={styles.headerSpacer}></div>
      </div>

      {/* ✅ লাইভ টাইম উইজেট */}
      <div style={styles.liveWidget}>
        <div style={styles.liveClock}>
          <span style={styles.clockIcon}>🕐</span>
          <span style={styles.clockTime}>{liveTime}</span>
        </div>
        <div style={styles.liveDate}>
          <span style={styles.dateDay}>{liveDay}</span>
          <span style={styles.dateText}>{liveDate}</span>
        </div>
        <div style={styles.liveBadge}>
          <span style={styles.liveDot}></span>
          লাইভ
        </div>
      </div>

      {/* ক্লাস তথ্য */}
      <div style={styles.classInfo}>
        <span style={styles.classBadge}>📚 {userProfile.class_name} শ্রেণী</span>
        <span style={styles.weekBadge}>🕐 সপ্তাহ {Math.ceil((new Date() - new Date(new Date().getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))}</span>
        <span style={styles.todayBadge}>📌 আজ: {todayName}</span>
      </div>

      {/* ডে সিলেক্টর */}
      <div style={styles.daySelector}>
        {dayNames.map((day, index) => {
          const hasRoutine = getDayRoutine(index).length > 0;
          const isToday = index === todayIndex;
          const isSelected = index === selectedDay;
          return (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              style={{
                ...styles.dayBtn,
                ...(isSelected ? styles.dayBtnActive : {}),
                ...(isToday ? styles.dayBtnToday : {}),
                opacity: hasRoutine ? 1 : 0.4,
              }}
            >
              {day}
              {isToday && <span style={styles.todayBadgeSmall}>আজ</span>}
            </button>
          );
        })}
      </div>

      {/* ভিউ টগল */}
      <div style={styles.viewToggle}>
        <button
          onClick={() => setViewMode('day')}
          style={{
            ...styles.viewBtn,
            ...(viewMode === 'day' ? styles.viewBtnActive : {}),
          }}
        >
          📅 দৈনিক
        </button>
        <button
          onClick={() => setViewMode('week')}
          style={{
            ...styles.viewBtn,
            ...(viewMode === 'week' ? styles.viewBtnActive : {}),
          }}
        >
          📋 সাপ্তাহিক
        </button>
      </div>

      {/* =============================================
          দৈনিক ভিউ
          ============================================= */}
      {viewMode === 'day' && (
        <>
          {/* বর্তমান ও পরবর্তী ক্লাস */}
          {selectedDayRoutine.length > 0 && (
            <div style={styles.nowNextContainer}>
              {currentClass && (
                <div style={styles.nowCard}>
                  <div style={styles.nowHeader}>
                    <span style={styles.nowDot}>🟢</span>
                    <span style={styles.nowLabel}>বর্তমান ক্লাস</span>
                  </div>
                  <div style={styles.nowContent}>
                    <span style={styles.nowSubject}>{currentClass.subject}</span>
                    <span style={styles.nowTime}>
                      {currentClass.start_time} - {currentClass.end_time}
                    </span>
                  </div>
                  {cmsSettings.showTeacher && currentClass.teacher_name && (
                    <div style={styles.teacherInfo}>
                      👨‍🏫 {currentClass.teacher_name}
                      {currentClass.teacher_phone && ` 📞 ${currentClass.teacher_phone}`}
                    </div>
                  )}
                  {cmsSettings.showRoom && currentClass.room_number && (
                    <div style={styles.roomInfo}>🏠 রুম: {currentClass.room_number}</div>
                  )}
                </div>
              )}

              {nextClass && !currentClass && (
                <div style={styles.nextCard}>
                  <div style={styles.nextHeader}>
                    <span style={styles.nextDot}>⏳</span>
                    <span style={styles.nextLabel}>পরবর্তী ক্লাস</span>
                  </div>
                  <div style={styles.nextContent}>
                    <span style={styles.nextSubject}>{nextClass.subject}</span>
                    <span style={styles.nextTime}>
                      {nextClass.start_time} - {nextClass.end_time}
                    </span>
                  </div>
                  {cmsSettings.showTeacher && nextClass.teacher_name && (
                    <div style={styles.teacherInfo}>
                      👨‍🏫 {nextClass.teacher_name}
                      {nextClass.teacher_phone && ` 📞 ${nextClass.teacher_phone}`}
                    </div>
                  )}
                  {cmsSettings.showRoom && nextClass.room_number && (
                    <div style={styles.roomInfo}>🏠 রুম: {nextClass.room_number}</div>
                  )}
                </div>
              )}

              {!currentClass && !nextClass && (
                <div style={styles.noClassCard}>
                  <span>📭</span>
                  <p>আজকের জন্য আর কোনো ক্লাস নেই</p>
                </div>
              )}
            </div>
          )}

          {/* দিনের রুটিন লিস্ট */}
          <div style={styles.dayRoutineList}>
            <h3 style={styles.dayTitle}>
              📌 {dayNames[selectedDay]}বারের রুটিন
              {selectedDay === todayIndex && <span style={styles.todayTag}> (আজ)</span>}
            </h3>

            {selectedDayRoutine.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📭</span>
                <p>এই দিনে কোনো ক্লাস নেই</p>
              </div>
            ) : (
              selectedDayRoutine.map((cls, index) => {
                const isCurrent = currentClass?.id === cls.id;
                const color = getSubjectColor(cls.subject);
                return (
                  <div
                    key={index}
                    style={{
                      ...styles.routineItem,
                      ...(isCurrent ? styles.routineItemCurrent : {}),
                      borderLeftColor: color,
                    }}
                  >
                    <div style={styles.routineTime}>
                      <span style={styles.startTime}>{cls.start_time}</span>
                      <span style={styles.timeSeparator}>—</span>
                      <span style={styles.endTime}>{cls.end_time}</span>
                    </div>
                    <div style={styles.routineContent}>
                      <div style={styles.routineSubject}>
                        <span style={{
                          ...styles.subjectDot,
                          backgroundColor: color,
                        }}></span>
                        <span style={styles.subjectName}>{cls.subject}</span>
                        {isCurrent && <span style={styles.currentBadge}>🟢 চলমান</span>}
                      </div>
                      {cmsSettings.showTeacher && cls.teacher_name && (
                        <div style={styles.routineTeacher}>
                          👨‍🏫 {cls.teacher_name}
                          {cls.teacher_phone && ` 📞 ${cls.teacher_phone}`}
                        </div>
                      )}
                      {cmsSettings.showRoom && cls.room_number && (
                        <div style={styles.routineRoom}>🏠 রুম: {cls.room_number}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* =============================================
          সাপ্তাহিক ভিউ
          ============================================= */}
      {viewMode === 'week' && (
        <div style={styles.weekView}>
          <h3 style={styles.weekTitle}>📋 পুরো সপ্তাহের রুটিন</h3>
          <div style={styles.weekTableWrapper}>
            <table style={styles.weekTable}>
              <thead>
                <tr>
                  <th style={styles.weekTh}>দিন</th>
                  {routine.length > 0 && routine
                    .filter(r => r.day === dayNames[selectedDay])
                    .map((_, index) => (
                      <th key={index} style={styles.weekTh}>
                        পিরিয়ড {index + 1}
                      </th>
                    ))
                  }
                </tr>
              </thead>
              <tbody>
                {dayNames.map((day, dayIndex) => {
                  const dayRoutine = getDayRoutine(dayIndex);
                  const isToday = dayIndex === todayIndex;
                  return (
                    <tr key={dayIndex} style={{
                      ...styles.weekTr,
                      ...(isToday ? styles.weekTrToday : {}),
                    }}>
                      <td style={styles.weekTd}>
                        {day}
                        {isToday && <span style={styles.todayBadgeSmall}>আজ</span>}
                      </td>
                      {dayRoutine.length > 0 ? (
                        dayRoutine.map((cls, idx) => (
                          <td key={idx} style={styles.weekTd}>
                            <span style={{
                              ...styles.weekSubject,
                              backgroundColor: getSubjectColor(cls.subject) + '20',
                              color: getSubjectColor(cls.subject),
                            }}>
                              {cls.subject}
                            </span>
                          </td>
                        ))
                      ) : (
                        <td style={styles.weekTdEmpty}>—</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ফুটার নোট */}
      <div style={styles.footerNote}>
        <p>💡 রুটিন পরিবর্তন হলে এখানে আপডেট দেখাবে।</p>
      </div>
    </div>
  );
}

// =============================================
// 🎨 প্রিমিয়াম স্টাইল
// =============================================
const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '0 16px 40px 16px',
    fontFamily: "'Hind Siliguri', sans-serif",
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #16a34a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingTop: '12px',
  },
  backBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#64748b',
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  headerSpacer: {
    width: '80px',
  },
  // ✅ লাইভ উইজেট
  liveWidget: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
    borderRadius: '14px',
    marginBottom: '16px',
    color: 'white',
    border: '1px solid #334155',
  },
  liveClock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  clockIcon: {
    fontSize: '24px',
  },
  clockTime: {
    fontSize: '24px',
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#38bdf8',
    letterSpacing: '1px',
  },
  liveDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dateDay: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#16a34a',
  },
  dateText: {
    fontSize: '14px',
    color: '#94a3b8',
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#16a34a',
    background: 'rgba(22, 163, 74, 0.15)',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#16a34a',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  classInfo: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px',
    padding: '12px 16px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  classBadge: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a',
  },
  weekBadge: {
    fontSize: '14px',
    color: '#64748b',
  },
  todayBadge: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2563eb',
    background: '#dbeafe',
    padding: '2px 12px',
    borderRadius: '12px',
  },
  daySelector: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
    gap: '8px',
    marginBottom: '16px',
  },
  dayBtn: {
    padding: '10px 8px',
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  dayBtnActive: {
    borderColor: '#16a34a',
    background: '#f0fdf4',
    color: '#16a34a',
  },
  dayBtnToday: {
    borderColor: '#2563eb',
    background: '#eff6ff',
  },
  todayBadgeSmall: {
    display: 'block',
    fontSize: '9px',
    color: '#2563eb',
    fontWeight: '700',
    marginTop: '2px',
  },
  viewToggle: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    justifyContent: 'center',
  },
  viewBtn: {
    padding: '8px 24px',
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
    transition: 'all 0.2s ease',
  },
  viewBtnActive: {
    borderColor: '#16a34a',
    background: '#f0fdf4',
    color: '#16a34a',
  },
  nowNextContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  },
  nowCard: {
    background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
    borderRadius: '14px',
    padding: '16px 20px',
    border: '1px solid #86efac',
  },
  nowHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  nowDot: { fontSize: '16px' },
  nowLabel: { fontSize: '13px', fontWeight: '700', color: '#15803d' },
  nowContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  nowSubject: { fontSize: '18px', fontWeight: '700', color: '#0f172a' },
  nowTime: { fontSize: '14px', color: '#64748b' },
  nextCard: {
    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    borderRadius: '14px',
    padding: '16px 20px',
    border: '1px solid #93c5fd',
  },
  nextHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  nextDot: { fontSize: '16px' },
  nextLabel: { fontSize: '13px', fontWeight: '700', color: '#2563eb' },
  nextContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  nextSubject: { fontSize: '18px', fontWeight: '700', color: '#0f172a' },
  nextTime: { fontSize: '14px', color: '#64748b' },
  teacherInfo: {
    fontSize: '13px',
    color: '#475569',
    marginTop: '4px',
  },
  roomInfo: {
    fontSize: '13px',
    color: '#475569',
    marginTop: '2px',
  },
  noClassCard: {
    background: '#f8fafc',
    borderRadius: '14px',
    padding: '24px',
    textAlign: 'center',
    color: '#94a3b8',
    border: '1px dashed #cbd5e1',
  },
  dayRoutineList: {
    background: 'white',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  dayTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 16px 0',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '10px',
  },
  todayTag: {
    color: '#2563eb',
    fontWeight: '600',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 0',
    color: '#94a3b8',
  },
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '8px' },
  routineItem: {
    display: 'flex',
    gap: '16px',
    padding: '12px 16px',
    borderLeft: '4px solid #3b82f6',
    borderRadius: '8px',
    background: '#f8fafc',
    marginBottom: '10px',
    transition: 'all 0.2s ease',
  },
  routineItemCurrent: {
    background: '#f0fdf4',
    borderLeftWidth: '6px',
  },
  routineTime: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '70px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
  },
  startTime: { color: '#0f172a' },
  timeSeparator: { color: '#94a3b8', fontSize: '12px' },
  endTime: { color: '#0f172a' },
  routineContent: { flex: 1 },
  routineSubject: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
  },
  subjectDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  subjectName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
  },
  currentBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#16a34a',
    background: '#dcfce7',
    padding: '2px 10px',
    borderRadius: '12px',
  },
  routineTeacher: {
    fontSize: '13px',
    color: '#64748b',
  },
  routineRoom: {
    fontSize: '13px',
    color: '#64748b',
  },
  weekView: {
    background: 'white',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  weekTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 16px 0',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '10px',
  },
  weekTableWrapper: {
    overflowX: 'auto',
  },
  weekTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  weekTh: {
    padding: '10px 12px',
    background: '#f8fafc',
    fontWeight: '700',
    color: '#334155',
    borderBottom: '2px solid #e2e8f0',
    textAlign: 'center',
  },
  weekTr: {
    borderBottom: '1px solid #f1f5f9',
  },
  weekTrToday: {
    background: '#f0fdf4',
  },
  weekTd: {
    padding: '10px 12px',
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  weekTdEmpty: {
    padding: '10px 12px',
    textAlign: 'center',
    color: '#cbd5e1',
  },
  weekSubject: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  },
  footerNote: {
    marginTop: '20px',
    padding: '12px 16px',
    background: '#fef3c7',
    borderRadius: '10px',
    borderLeft: '4px solid #f59e0b',
    textAlign: 'center',
  },
};

// অ্যানিমেশন
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;
document.head.appendChild(styleSheet);
