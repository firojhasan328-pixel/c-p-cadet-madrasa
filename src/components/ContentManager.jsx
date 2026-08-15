import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ContentManager() {
  const [contents, setContents] = useState({
    notice_text: '',
    about_text: '',
    special_features: '',
    closing_message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    const { data, error } = await supabase
      .from('site_contents')
      .select('*');
    
    if (data) {
      const contentMap = {};
      data.forEach(item => {
        contentMap[item.key] = item.value;
      });
      setContents({
        notice_text: contentMap.notice_text || '',
        about_text: contentMap.about_text || '',
        special_features: contentMap.special_features || '',
        closing_message: contentMap.closing_message || ''
      });
    }
  };

  const handleUpdate = async (key, value) => {
    setLoading(true);
    const { error } = await supabase
      .from('site_contents')
      .upsert({ key, value });
    
    if (!error) {
      setSuccess(`${key} আপডেট করা হয়েছে!`);
      setTimeout(() => setSuccess(''), 3000);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>📝 কন্টেন্ট ম্যানেজার</h3>
      {success && <div style={styles.successBox}>{success}</div>}
      
      <div style={styles.field}>
        <label style={styles.label}>নোটিশ বোর্ড টেক্সট</label>
        <textarea 
          value={contents.notice_text}
          onChange={(e) => setContents({...contents, notice_text: e.target.value})}
          onBlur={() => handleUpdate('notice_text', contents.notice_text)}
          style={styles.textarea}
          placeholder="নোটিশ লিখুন..."
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>প্রধান শিক্ষকের বাণী</label>
        <textarea 
          value={contents.about_text}
          onChange={(e) => setContents({...contents, about_text: e.target.value})}
          onBlur={() => handleUpdate('about_text', contents.about_text)}
          style={styles.textarea}
          placeholder="প্রধান শিক্ষকের বাণী লিখুন..."
          rows="4"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>বিশেষত্ব (কমা দিয়ে আলাদা করুন)</label>
        <input 
          type="text"
          value={contents.special_features}
          onChange={(e) => setContents({...contents, special_features: e.target.value})}
          onBlur={() => handleUpdate('special_features', contents.special_features)}
          style={styles.input}
          placeholder="যেমন: অভিজ্ঞ শিক্ষক, হিফজ প্রশিক্ষণ, কম্পিউটার শিক্ষা"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>ভর্তি বন্ধের বার্তা</label>
        <input 
          type="text"
          value={contents.closing_message}
          onChange={(e) => setContents({...contents, closing_message: e.target.value})}
          onBlur={() => handleUpdate('closing_message', contents.closing_message)}
          style={styles.input}
          placeholder="ভর্তি বন্ধ থাকলে দেখাবে..."
        />
      </div>

      {loading && <p style={styles.loading}>⏳ আপডেট হচ্ছে...</p>}
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
  field: {
    marginBottom: '14px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '4px'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px'
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    minHeight: '80px',
    fontFamily: 'inherit'
  },
  successBox: {
    background: '#dcfce7',
    color: '#15803d',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontWeight: '600'
  },
  loading: {
    color: '#64748b',
    fontSize: '13px',
    marginTop: '8px'
  }
};
