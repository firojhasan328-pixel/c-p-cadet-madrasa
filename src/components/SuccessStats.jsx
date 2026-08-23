import React from 'react';

export default function SuccessStats() {
  const stats = [
    { number: '৫০০+', label: 'ছাত্র-ছাত্রী', icon: '👨‍🎓' },
    { number: '২৫+', label: 'শিক্ষক-শিক্ষিকা', icon: '👨‍🏫' },
    { number: '৯৫%', label: 'পাসের হার', icon: '📈' },
    { number: '১০+', label: 'বছরের অভিজ্ঞতা', icon: '🏆' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
      marginBottom: '32px'
    }}>
      {stats.map((stat, index) => (
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
