import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function NotificationSystem() {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(showAll ? 100 : 10);

      if (error) throw error;

      setNotifications(data || []);
      const unread = data?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
    setLoading(false);
  };

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    if (!confirm('এই নোটিফিকেশন ডিলিট করতে চান?')) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'success':
        return { background: '#dcfce7', borderColor: '#16a34a', icon: '✅' };
      case 'warning':
        return { background: '#fef3c7', borderColor: '#f59e0b', icon: '⚠️' };
      case 'error':
        return { background: '#fee2e2', borderColor: '#dc2626', icon: '❌' };
      default:
        return { background: '#dbeafe', borderColor: '#2563eb', icon: 'ℹ️' };
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ color: '#64748b' }}>নোটিফিকেশন দেখতে লগইন করুন</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>🔔 নোটিফিকেশন</h2>
          {unreadCount > 0 && (
            <span style={{
              marginLeft: '8px',
              padding: '2px 10px',
              borderRadius: '12px',
              background: '#dc2626',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {unreadCount} টি অপঠিত
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                background: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              সব পড়া হয়েছে
            </button>
          )}
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              background: '#f1f5f9',
              color: '#334155',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            {showAll ? 'সাম্প্রতিক' : 'সব দেখুন'}
          </button>
          <button
            onClick={loadNotifications}
            style={{
              background: '#f1f5f9',
              color: '#334155',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            🔄 রিফ্রেশ
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px 0' }}>⏳ লোড হচ্ছে...</p>
      ) : notifications.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>📭</div>
          <p style={{ color: '#64748b', fontSize: '16px' }}>কোনো নোটিফিকেশন নেই</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((notification) => {
            const style = getNotificationStyle(notification.type);
            return (
              <div
                key={notification.id}
                style={{
                  background: notification.is_read ? 'white' : style.background,
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: `1.5px solid ${notification.is_read ? '#e2e8f0' : style.borderColor}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                  <span style={{ fontSize: '20px' }}>{style.icon}</span>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: '#0f172a',
                      fontSize: '14px'
                    }}>
                      {notification.title}
                    </div>
                    <div style={{
                      color: '#334155',
                      fontSize: '13px',
                      marginTop: '4px'
                    }}>
                      {notification.message}
                    </div>
                    <div style={{
                      color: '#94a3b8',
                      fontSize: '11px',
                      marginTop: '6px'
                    }}>
                      {new Date(notification.created_at).toLocaleString('bn-BD')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      style={{
                        background: '#dcfce7',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#15803d'
                      }}
                    >
                      পড়া হয়েছে
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    style={{
                      background: '#fee2e2',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#dc2626'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
