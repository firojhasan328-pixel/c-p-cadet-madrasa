import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function TeacherManager() {
  const [teachers, setTeachers] = useState([]);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    designation: '',
    phone: '',
    edu: '',
    subject: '',
    photo: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('name', { ascending: true });
    
    if (data) setTeachers(data);
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase
      .from('teachers')
      .insert([newTeacher]);
    
    if (!error) {
      setSuccess('শিক্ষক সফলভাবে যোগ করা হয়েছে!');
      setNewTeacher({ name: '', designation: '', phone: '', edu: '', subject: '', photo: '' });
      fetchTeachers();
      setTimeout(() => setSuccess(''), 3000);
    }
    setLoading(false);
  };

  const handleDeleteTeacher = async (id) => {
    if (confirm('শিক্ষককে মুছে ফেলতে চান?')) {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id);
      
      if (!error) {
        fetchTeachers();
      }
    }
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.heading}>👨‍🏫 শিক্ষক ম্যানেজমেন্ট</h4>
      
      {success && <div style={styles.successBox}>{success}</div>}

      <form onSubmit={handleAddTeacher} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>নাম *</label>
          <input 
            type="text" 
            placeholder="শিক্ষকের নাম" 
            value={newTeacher.name} 
            onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})} 
            required 
            style={styles.input} 
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>পদবী *</label>
          <input 
            type="text" 
            placeholder="পদবী (যেমন: হেডমাস্টার)" 
            value={newTeacher.designation} 
            onChange={(e) => setNewTeacher({...newTeacher, designation: e.target.value})} 
            required 
            style={styles.input} 
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>ফোন</label>
          <input 
            type="text" 
            placeholder="ফোন নম্বর" 
            value={newTeacher.phone} 
            onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})} 
            style={styles.input} 
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>শিক্ষাগত যোগ্যতা</label>
          <input 
            type="text" 
            placeholder="যোগ্যতা" 
            value={newTeacher.edu} 
            onChange={(e) => setNewTeacher({...newTeacher, edu: e.target.value})} 
            style={styles.input} 
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>বিষয়</label>
          <input 
            type="text" 
            placeholder="পড়ানোর বিষয়" 
            value={newTeacher.subject} 
            onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})} 
            style={styles.input} 
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>ছবির URL (ঐচ্ছিক)</label>
          <input 
            type="text" 
            placeholder="https://example.com/photo.jpg" 
            value={newTeacher.photo} 
            onChange={(e) => setNewTeacher({...newTeacher, photo: e.target.value})} 
            style={styles.input} 
          />
        </div>

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? '⏳ যুক্ত হচ্ছে...' : '➕ শিক্ষক যোগ করুন'}
        </button>
      </form>

      <div style={styles.listContainer}>
        <h5 style={styles.listHeading}>বর্তমান শিক্ষকবৃন্দ:</h5>
        {teachers.length === 0 ? (
          <p style={styles.emptyText}>কোনো শিক্ষক নেই</p>
        ) : (
          <ul style={styles.list}>
            {teachers.map(t => (
              <li key={t.id} style={styles.listItem}>
                <span><strong>{t.name}</strong> - {t.designation}</span>
                <button 
                  onClick={() => handleDeleteTeacher(t.id)} 
                  style={styles.deleteBtn}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#f0fdf4',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #bbf7d0',
    marginTop: '16px'
  },
  heading: {
    color: '#166534',
    fontSize: '18px',
    margin: '0 0 16px 0',
    borderBottom: '2px solid #dcfce7',
    paddingBottom: '8px'
  },
  successBox: {
    background: '#dcfce7',
    color: '#15803d',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontWeight: '600'
  },
  form: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155'
  },
  input: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px'
  },
  submitBtn: {
    gridColumn: '1 / -1',
    background: '#16a34a',
    color: 'white',
    border: 'none',
    padding: '10px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  listContainer: {
    marginTop: '16px',
    borderTop: '1px solid #dcfce7',
    paddingTop: '12px'
  },
  listHeading: {
    fontSize: '15px',
    color: '#0f172a',
    margin: '0 0 8px 0'
  },
  emptyText: {
    color: '#64748b',
    fontSize: '14px'
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'white',
    borderRadius: '6px',
    marginBottom: '6px',
    border: '1px solid #e2e8f0'
  },
  deleteBtn: {
    background: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};
