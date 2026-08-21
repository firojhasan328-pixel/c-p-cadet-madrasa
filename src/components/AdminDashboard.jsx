import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PermissionManager from './PermissionManager';

export default function AdminDashboard() {
  const { user, logout, hasPermission, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // মেনু আইটেম - পারমিশন অনুযায়ী দেখাবে
  const menuItems = [
    { id: 'dashboard', label: '📊 ড্যাশবোর্ড', permission: '*' },
    { id: 'permissions', label: '🛡️ পারমিশন ম্যানেজ', permission: 'manage_permissions' },
    { id: 'settings', label: '⚙️ সাইট সেটিংস', permission: 'edit_settings' },
  ];

  // পারমিশন অনুযায়ী মেনু ফিল্টার
  const visibleMenu = menuItems.filter(item => {
    if (isSuperAdmin) return true;
    if (item.permission === '*') return true;
    return hasPermission(item.permission);
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardHome />;
      case 'permissions': return <PermissionManager />;
      case 'settings': return <SettingsManager />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      {/* সাইডবার */}
      <div style={{
        width: '260px',
        background: '#0f172a',
        color: 'white',
        padding: '20px 0',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        flexShrink: 0
      }}>
        <div style={{ padding: '0 20px 20px 20px', borderBottom: '1px solid #1e293b' }}>
          <h2 style={{ fontSize: '18px', margin: 0, color: '#f8fafc' }}>⚙️ এডমিন প্যানেল</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            {user?.name || user?.email}
          </p>
          {isSuperAdmin && (
            <span style={{
              display: 'inline-block',
              marginTop: '4px',
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '10px',
              background: '#fef3c7',
              color: '#b45309'
            }}>
              ⭐ সুপার এডমিন
            </span>
          )}
        </div>

        <nav style={{ padding: '12px 0' }}>
          {visibleMenu.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                padding: '10px 20px',
                cursor: 'pointer',
                background: activeTab === item.id ? '#1e293b' : 'transparent',
                borderLeft: activeTab === item.id ? '3px solid #16a34a' : '3px solid transparent',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                color: activeTab === item.id ? '#ffffff' : '#94a3b8'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== item.id) {
                  e.target.style.background = '#1e293b';
                  e.target.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.id) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#94a3b8';
                }
              }}
            >
              {item.label}
            </div>
          ))}
        </nav>

        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #1e293b',
          marginTop: 'auto'
        }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: '#dc2626',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => e.target.style.background = '#b91c1c'}
            onMouseLeave={(e) => e.target.style.background = '#dc2626'}
          >
            🚪 লগআউট
          </button>
        </div>
      </div>

      {/* কন্টেন্ট এলাকা */}
      <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        {renderContent()}
      </div>
    </div>
  );
}

// =============================================
// ড্যাশবোর্ড হোম
// =============================================
function DashboardHome() {
  return (
    <div>
      <h2 style={{ color: '#0f172a', marginTop: 0 }}>📊 ড্যাশবোর্ড</h2>
      <p style={{ color: '#64748b' }}>স্বাগতম! এখান থেকে পুরো ওয়েবসাইট কন্ট্রোল করুন।</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginTop: '24px'
      }}>
        <StatCard icon="👨‍🏫" label="মোট শিক্ষক" value="০" color="#16a34a" />
        <StatCard icon="🎓" label="মোট ছাত্র" value="০" color="#2563eb" />
        <StatCard icon="📌" label="মোট নোটিশ" value="০" color="#f59e0b" />
        <StatCard icon="📄" label="মোট পেজ" value="৭" color="#8b5cf6" />
      </div>

      <div style={{
        marginTop: '30px',
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>📋 শিক্ষক বিন্দু</h3>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          যারা শিক্ষক হিসেবে সাইন আপ করেছেন, তাদের এখানে দেখা যাবে।
        </p>
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#94a3b8',
          background: '#f8fafc',
          borderRadius: '10px'
        }}>
          🔄 শীঘ্রই শিক্ষক তালিকা দেখা যাবে...
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '16px',
      textAlign: 'center',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <div style={{ fontSize: '32px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color: color || '#0f172a' }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#64748b' }}>{label}</div>
    </div>
  );
}

// =============================================
// সেটিংস ম্যানেজার
// =============================================
function SettingsManager() {
  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ marginTop: 0, color: '#0f172a' }}>⚙️ সাইট সেটিংস</h3>
      <p style={{ color: '#94a3b8' }}>সাইটের নাম, লোগো, ফেভিকন পরিবর্তন করুন।</p>
      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px' }}>
        🔄 শীঘ্রই আসছে...
      </div>
    </div>
  );
}
