import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function AuditLog() {
  const { user, isSuperAdmin, isAdmin, hasPermission } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isSuperAdmin || (isAdmin && hasPermission('audit.view'))) {
      loadLogs();
    }
  }, [isSuperAdmin, isAdmin]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          profiles:user_id (name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('action', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
    setLoading(false);
  };

  const getActionColor = (action) => {
    const colors = {
      'ASSIGN_ROLE': '#8b5cf6',
      'UPDATE_PERMISSION': '#2563eb',
      'UPDATE_CMS': '#16a34a',
      'ADD_TEACHER': '#059669',
      'DELETE_TEACHER': '#dc2626',
      'UPDATE_TEACHER_PERMISSION': '#2563eb',
      'SEND_NOTIFICATION': '#f59e0b',
      'REMOVE_ADMIN': '#dc2626',
      'UPDATE_ADMIN_PERMISSION': '#2563eb',
      'LOGIN': '#06b6d4',
      'LOGOUT': '#64748b'
    };
    return colors[action] || '#64748b';
  };

  const getActionLabel = (action) => {
    const labels = {
      'ASSIGN_ROLE': 'রোল অ্যাসাইন',
      'UPDATE_PERMISSION': 'পারমিশন আপডেট',
      'UPDATE_CMS': 'CMS আপডেট',
      'ADD_TEACHER': 'শিক্ষক যোগ',
      'DELETE_TEACHER': 'শিক্ষক ডিলিট',
      'UPDATE_TEACHER_PERMISSION': 'শিক্ষক পারমিশন',
      'SEND_NOTIFICATION': 'নোটিফিকেশন',
      'REMOVE_ADMIN': 'এডমিন রিমুভ',
      'UPDATE_ADMIN_PERMISSION': 'এডমিন পারমিশন',
      'LOGIN': 'লগইন',
      'LOGOUT': 'লগআউট'
    };
    return labels[action] || action;
  };

  const canView = isSuperAdmin || (isAdmin && hasPermission('audit.view'));

  if (!canView) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
        <h2 style={{ color: '#dc2626' }}>অ্যাক্সেস অস্বীকৃত!</h2>
        <p style={{ color: '#64748b' }}>আপনার অডিট লগ দেখার অনুমতি নেই।</p>
      </div>
    );
  }

  const filteredLogs = logs.filter(log =>
    log.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>📋 অডিট লগ</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            সকল কার্যকলাপের ইতিহাস
          </p>
        </div>
        <button
          onClick={loadLogs}
          style={{
            background: '#f1f5f9',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          🔄 রিফ্রেশ
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '16px'
      }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '13px',
            background: 'white'
          }}
        >
          <option value="all">সব অ্যাক্টিভিটি</option>
          <option value="ASSIGN_ROLE">রোল অ্যাসাইন</option>
          <option value="UPDATE_PERMISSION">পারমিশন আপডেট</option>
          <option value="UPDATE_CMS">CMS আপডেট</option>
          <option value="ADD_TEACHER">শিক্ষক যোগ</option>
          <option value="DELETE_TEACHER">শিক্ষক ডিলিট</option>
          <option value="SEND_NOTIFICATION">নোটিফিকেশন</option>
        </select>

        <input
          type="text"
          placeholder="🔍 খুঁজুন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '13px',
            outline: 'none'
          }}
        />
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px 0' }}>⏳ লোড হচ্ছে...</p>
      ) : filteredLogs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>📭</div>
          <p style={{ color: '#64748b', fontSize: '16px' }}>কোনো লগ পাওয়া যায়নি</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              style={{
                background: 'white',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: getActionColor(log.action),
                  color: 'white'
                }}>
                  {getActionLabel(log.action)}
                </span>
                <div>
                  <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>
                    {log.profiles?.name || 'Unknown'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {log.profiles?.email || ''}
                  </div>
                </div>
                {log.entity_type && (
                  <span style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    padding: '2px 8px',
                    background: '#f1f5f9',
                    borderRadius: '4px'
                  }}>
                    {log.entity_type}
                  </span>
                )}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#94a3b8',
                textAlign: 'right'
              }}>
                {new Date(log.created_at).toLocaleString('bn-BD')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
