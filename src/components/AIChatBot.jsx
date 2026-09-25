import React, { useState, useEffect, useRef } from 'react';
import {
  sendChatMessage,
  buildWhatsAppUrl,
  loadChatHistory,
  clearChatHistory,
} from '../utils/chatService';
import { supabase } from '../supabaseClient';

// ============================================
// 🎨 থিম
// ============================================
const THEME = {
  gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
};

// ডিফল্ট হেডার ডেটা
const DEFAULT_HEADER = {
  logo: 'https://i.postimg.cc/667hGYDg/Screenshot-20260727-124259.jpg',
  title: 'চিলমারী প্রি ক্যাডেট মাদ্রাসা',
  subtitle: 'অনলাইন • সাথে সাথে উত্তর',
};

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [hasUnread, setHasUnread] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // হেডার ডাইনামিক
  const [headerData, setHeaderData] = useState(DEFAULT_HEADER);

  const messagesEndRef = useRef(null);

  // ============================================
  // 🌙 ডার্ক মোড
  // ============================================
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ============================================
  // 🎨 হেডার ডেটা লোড (CMS থেকে)
  // ============================================
  useEffect(() => {
    const loadHeader = async () => {
      try {
        const { data } = await supabase
          .from('ai_chat_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['chat_bot_logo_url', 'chat_bot_title', 'chat_bot_subtitle']);

        if (data) {
          const map = {};
          data.forEach((s) => {
            if (s.setting_value) map[s.setting_key] = s.setting_value;
          });

          setHeaderData({
            logo: map.chat_bot_logo_url || DEFAULT_HEADER.logo,
            title: map.chat_bot_title || DEFAULT_HEADER.title,
            subtitle: map.chat_bot_subtitle || DEFAULT_HEADER.subtitle,
          });
        }
      } catch (err) {
        console.warn('Header load failed:', err);
      }
    };

    loadHeader();

    // রিয়েল-টাইম আপডেট
    const channel = supabase
      .channel('ai-header-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_chat_settings' },
        () => loadHeader()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ============================================
  // 💾 হিস্টোরি লোড
  // ============================================
  useEffect(() => {
    const load = async () => {
      try {
        const history = await loadChatHistory();
        if (history && history.length > 0) {
          setMessages(
            history.map((m) => ({
              role: m.role,
              content: m.content,
              timestamp: new Date(m.created_at),
            }))
          );
          setShowQuickQuestions(false);
        }
      } catch (e) {
        console.warn('History load failed', e);
      }
      setHistoryLoaded(true);
    };
    load();
  }, []);

  // ============================================
  // 👋 প্রথম greeting
  // ============================================
  useEffect(() => {
    if (isOpen && historyLoaded && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            'আসসালামু আলাইকুম! 🌟\n\nআমি চিলমারী প্রি ক্যাডেট মাদ্রাসার AI সহকারী। আপনাকে কীভাবে সাহায্য করতে পারি?',
          timestamp: new Date(),
        },
      ]);
      setHasUnread(false);
    }
  }, [isOpen, historyLoaded, messages.length]);

  // ============================================
  // Auto scroll
  // ============================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ============================================
  // 📤 মেসেজ পাঠাও
  // ============================================
  const handleSend = async (customText) => {
    const text = (customText || inputValue).trim();
    if (!text || isTyping) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    setShowQuickQuestions(false);

    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    const result = await sendChatMessage(text, history);

    setIsTyping(false);

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: result.reply,
        timestamp: new Date(),
        shouldTransfer: result.shouldTransferToWhatsApp,
        whatsappNumber: result.whatsappNumber,
        whatsappMessage: result.whatsappMessage,
      },
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleWhatsApp = (msg) => {
    const url = buildWhatsAppUrl(msg.whatsappNumber, msg.whatsappMessage);
    window.open(url, '_blank');
  };

  const handleClear = async () => {
    if (!confirm('সম্পূর্ণ চ্যাট ডিলিট করতে চান?')) return;
    await clearChatHistory();
    setMessages([]);
    setShowQuickQuestions(true);
    setTimeout(() => {
      setMessages([
        {
          role: 'assistant',
          content: 'নতুন চ্যাট শুরু! 😊 কীভাবে সাহায্য করতে পারি?',
          timestamp: new Date(),
        },
      ]);
    }, 300);
  };

  const quickQuestions = [
    { emoji: '🎓', text: 'ভর্তি সম্পর্কে জানতে চাই' },
    { emoji: '💰', text: 'মাসিক ফি কত?' },
    { emoji: '📞', text: 'যোগাযোগের নম্বর কী?' },
    { emoji: '⏰', text: 'ক্লাসের সময় কখন?' },
    { emoji: '👨‍🏫', text: 'শিক্ষকদের তথ্য' },
    { emoji: '📍', text: 'মাদ্রাসা কোথায়?' },
  ];

  const c = {
    bg: isDark ? '#0f172a' : '#ffffff',
    bodyBg: isDark ? '#0f172a' : '#f8fafc',
    aiBubble: isDark ? '#1e293b' : '#ffffff',
    aiBubbleText: isDark ? '#f1f5f9' : '#0f172a',
    inputBg: isDark ? '#1e293b' : '#ffffff',
    inputText: isDark ? '#f1f5f9' : '#0f172a',
    inputBorder: isDark ? '#334155' : '#e2e8f0',
    quickBtnBg: isDark ? '#1e293b' : '#ffffff',
    quickBtnText: isDark ? '#cbd5e1' : '#334155',
    quickBtnBorder: isDark ? '#334155' : '#e2e8f0',
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.floatingBtn,
          background: isOpen ? THEME.danger : THEME.gradient,
          boxShadow: isOpen
            ? '0 10px 30px rgba(239, 68, 68, 0.4)'
            : '0 10px 30px rgba(99, 102, 241, 0.4)',
        }}
      >
        <span style={styles.floatingBtnIcon}>{isOpen ? '✕' : '💬'}</span>
        <span style={styles.floatingBtnText}>
          {isOpen ? 'বন্ধ করুন' : 'AI চ্যাট'}
        </span>
        {!isOpen && hasUnread && <span style={styles.unreadDot}></span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            ...styles.chatWindow,
            backgroundColor: c.bg,
            boxShadow: isDark
              ? '0 25px 60px rgba(0, 0, 0, 0.7)'
              : '0 25px 60px rgba(99, 102, 241, 0.25)',
          }}
        >
          {/* ============================================
              হেডার — ডাইনামিক (CMS থেকে লোগো, টাইটেল, সাবটাইটেল)
              ============================================ */}
          <div style={{ ...styles.header, background: THEME.gradient }}>
            <div style={styles.headerLeft}>
              <div style={styles.avatar}>
                {headerData.logo ? (
                  <img
                    src={headerData.logo}
                    alt="Logo"
                    style={styles.avatarLogo}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = '🏫';
                    }}
                  />
                ) : (
                  '🏫'
                )}
                <span style={styles.avatarOnline}></span>
              </div>
              <div style={styles.headerTexts}>
                <div style={styles.headerTitle}>{headerData.title}</div>
                <div style={styles.headerStatus}>
                  <span style={styles.onlineDot}></span>
                  {headerData.subtitle}
                </div>
              </div>
            </div>
            <div style={styles.headerActions}>
              <button onClick={handleClear} style={styles.headerBtn} title="চ্যাট ক্লিয়ার">
                🗑️
              </button>
              <button onClick={() => setIsOpen(false)} style={styles.headerBtn} title="বন্ধ">
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{ ...styles.body, backgroundColor: c.bodyBg }}
            className="ai-chat-scroll"
          >
            {messages.map((msg, i) => (
              <div key={i} style={styles.messageRow}>
                <div
                  style={{
                    ...styles.bubble,
                    ...(msg.role === 'user'
                      ? { ...styles.userBubble, background: THEME.gradient }
                      : {
                          ...styles.aiBubble,
                          background: c.aiBubble,
                          color: c.aiBubbleText,
                          border: isDark
                            ? '1px solid #334155'
                            : '1px solid #e2e8f0',
                        }),
                  }}
                >
                  <div style={styles.bubbleText}>{msg.content}</div>

                  {msg.shouldTransfer && (
                    <button
                      onClick={() => handleWhatsApp(msg)}
                      style={styles.whatsappBtn}
                    >
                      💬 WhatsApp-এ যোগাযোগ করুন
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={styles.messageRow}>
                <div
                  style={{
                    ...styles.aiBubble,
                    background: c.aiBubble,
                    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                  }}
                >
                  <div style={styles.typingIndicator}>
                    <span style={styles.dot}></span>
                    <span style={styles.dot}></span>
                    <span style={styles.dot}></span>
                  </div>
                </div>
              </div>
            )}

            {showQuickQuestions && messages.length <= 1 && !isTyping && (
              <div style={styles.quickQuestions}>
                <div
                  style={{
                    ...styles.quickTitle,
                    color: isDark ? '#94a3b8' : '#64748b',
                  }}
                >
                  💡 দ্রুত প্রশ্ন:
                </div>
                <div style={styles.quickGrid}>
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q.text)}
                      style={{
                        ...styles.quickBtn,
                        background: c.quickBtnBg,
                        color: c.quickBtnText,
                        borderColor: c.quickBtnBorder,
                      }}
                    >
                      <span>{q.emoji}</span>
                      <span>{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              ...styles.inputArea,
              backgroundColor: c.bg,
              borderTop: `1px solid ${c.inputBorder}`,
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="আপনার প্রশ্ন লিখুন..."
              disabled={isTyping}
              style={{
                ...styles.input,
                backgroundColor: c.inputBg,
                color: c.inputText,
                border: `1.5px solid ${c.inputBorder}`,
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              style={{
                ...styles.sendBtn,
                background: THEME.gradient,
                opacity: !inputValue.trim() || isTyping ? 0.4 : 1,
                cursor: !inputValue.trim() || isTyping ? 'not-allowed' : 'pointer',
              }}
            >
              ➤
            </button>
          </div>

          <div
            style={{
              ...styles.privacyNote,
              background: isDark ? '#0f172a' : '#f8fafc',
              borderTop: `1px solid ${c.inputBorder}`,
            }}
          >
            🔒 আপনার কথোপকথন গোপন রাখা হয়
          </div>
        </div>
      )}

      <style>{`
        @keyframes aiChatFadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes aiChatTyping {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes aiChatPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        @keyframes aiChatOnlinePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          50% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
        }
        .ai-chat-scroll::-webkit-scrollbar { width: 6px; }
        .ai-chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .ai-chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 3px;
        }
        .ai-chat-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </>
  );
}

// ============================================
// স্টাইল
// ============================================
const styles = {
  floatingBtn: {
    position: 'fixed',
    bottom: '25px',
    right: '25px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 22px',
    borderRadius: '50px',
    border: 'none',
    color: 'white',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    zIndex: 1000,
    transition: 'all 0.3s ease',
    fontFamily: "'Hind Siliguri', sans-serif",
  },
  floatingBtnIcon: { fontSize: '20px' },
  floatingBtnText: { fontSize: '15px', fontWeight: '700' },
  unreadDot: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: '#ef4444',
    animation: 'aiChatPulse 1.5s infinite',
    boxShadow: '0 0 0 3px white',
  },
  chatWindow: {
    position: 'fixed',
    bottom: '90px',
    right: '25px',
    width: '380px',
    maxWidth: 'calc(100vw - 30px)',
    height: '580px',
    maxHeight: 'calc(100vh - 120px)',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1001,
    overflow: 'hidden',
    animation: 'aiChatFadeIn 0.3s ease',
    fontFamily: "'Hind Siliguri', sans-serif",
  },
  header: {
    padding: '14px 16px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    gap: '10px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    position: 'relative',
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarLogo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarOnline: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#22c55e',
    border: '2px solid white',
    animation: 'aiChatOnlinePulse 2s infinite',
  },
  headerTexts: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  headerStatus: {
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '3px',
    opacity: 0.95,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  onlineDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#4ade80',
    display: 'inline-block',
    flexShrink: 0,
  },
  headerActions: { display: 'flex', gap: '6px', flexShrink: 0 },
  headerBtn: {
    background: 'rgba(255, 255, 255, 0.15)',
    border: 'none',
    color: 'white',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    fontSize: '15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '18px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageRow: { display: 'flex', justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '85%',
    padding: '11px 15px',
    borderRadius: '16px',
    fontSize: '14px',
    lineHeight: '1.65',
    wordBreak: 'break-word',
  },
  userBubble: {
    marginLeft: 'auto',
    borderBottomRightRadius: '4px',
    color: 'white',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  aiBubble: {
    marginRight: 'auto',
    borderBottomLeftRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  bubbleText: { whiteSpace: 'pre-wrap' },
  typingIndicator: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
    padding: '4px 2px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#6366f1',
    display: 'inline-block',
    animation: 'aiChatTyping 1.4s infinite',
  },
  whatsappBtn: {
    marginTop: '12px',
    width: '100%',
    background: 'linear-gradient(135deg, #25D366, #128C7E)',
    color: 'white',
    border: 'none',
    padding: '11px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
  },
  quickQuestions: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' },
  quickTitle: {
    fontSize: '12px',
    fontWeight: '700',
    marginBottom: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  quickGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  quickBtn: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1.5px solid',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: "'Hind Siliguri', sans-serif",
  },
  inputArea: {
    padding: '12px 14px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '12px 18px',
    borderRadius: '24px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  sendBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  privacyNote: {
    padding: '8px 16px',
    textAlign: 'center',
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '500',
    flexShrink: 0,
  },
};
