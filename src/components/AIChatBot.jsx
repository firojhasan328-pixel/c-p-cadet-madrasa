import React, { useState, useEffect, useRef } from 'react';
import {
  sendChatMessage,
  buildWhatsAppUrl,
  getOrCreateSessionToken,
  resetChatSession,
  loadChatHistory,
  clearChatHistory,
} from '../utils/chatService';

// ============================================
// 🎨 প্রিমিয়াম নীল/বেগুনি থিম
// ============================================
const THEME = {
  primary: '#6366f1',      // Indigo
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  accent: '#8b5cf6',       // Violet
  accentDark: '#7c3aed',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  gradientHover: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  whatsapp: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
  danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
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

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ============================================
  // 🌙 ডার্ক মোড ডিটেকশন
  // ============================================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    const handleChange = (e) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // ============================================
  // 💾 আগের চ্যাট হিস্টোরি লোড
  // ============================================
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await loadChatHistory();
        if (history && history.length > 0) {
          setMessages(
            history.map((m) => ({
              role: m.role,
              content: m.content,
              timestamp: new Date(m.created_at),
              fromHistory: true,
            }))
          );
          setShowQuickQuestions(false);
        }
      } catch (err) {
        console.warn('History load failed:', err);
      }
      setHistoryLoaded(true);
    };

    loadHistory();
  }, []);

  // ============================================
  // 🎯 চ্যাট প্রথমবার খুললে greeting দেখাও
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
  // 📜 Auto scroll
  // ============================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ============================================
  // 📤 মেসেজ পাঠাও
  // ============================================
  const handleSend = async (messageText) => {
    const text = (messageText || inputValue).trim();
    if (!text || isTyping) return;

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setShowQuickQuestions(false);

    const history = messages
      .filter((m) => !m.fromHistory)
      .map((m) => ({ role: m.role, content: m.content }));

    const result = await sendChatMessage(text, history);

    setIsTyping(false);

    const assistantMessage = {
      role: 'assistant',
      content: result.reply,
      timestamp: new Date(),
      shouldTransfer: result.shouldTransferToWhatsApp,
      whatsappNumber: result.whatsappNumber,
      whatsappMessage: result.whatsappMessage,
      success: result.success,
    };

    setMessages((prev) => [...prev, assistantMessage]);
  };

  // ============================================
  // ⌨️ Enter কী হ্যান্ডেল
  // ============================================
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ============================================
  // 📱 WhatsApp ট্রান্সফার
  // ============================================
  const handleWhatsAppTransfer = (msg) => {
    const conversationContext = messages
      .slice(-6)
      .map((m) => `${m.role === 'user' ? '👤' : '🤖'} ${m.content}`)
      .join('\n');

    const url = buildWhatsAppUrl(
      msg.whatsappNumber,
      msg.whatsappMessage,
      conversationContext
    );
    window.open(url, '_blank');
  };

  // ============================================
  // 🗑️ চ্যাট ক্লিয়ার
  // ============================================
  const handleClearChat = async () => {
    if (!confirm('সম্পূর্ণ চ্যাট ডিলিট করতে চান?')) return;

    await clearChatHistory();
    resetChatSession();
    setMessages([]);
    setShowQuickQuestions(true);

    setTimeout(() => {
      setMessages([
        {
          role: 'assistant',
          content: 'নতুন চ্যাট শুরু হয়েছে! 😊 কীভাবে সাহায্য করতে পারি?',
          timestamp: new Date(),
        },
      ]);
    }, 300);
  };

  // ============================================
  // 🎯 কুইক প্রশ্ন
  // ============================================
  const quickQuestions = [
    { emoji: '🎓', text: 'ভর্তি সম্পর্কে জানতে চাই' },
    { emoji: '💰', text: 'মাসিক ফি কত?' },
    { emoji: '📞', text: 'যোগাযোগের নম্বর কী?' },
    { emoji: '⏰', text: 'ক্লাসের সময় কখন?' },
    { emoji: '👨‍🏫', text: 'শিক্ষকদের তথ্য' },
    { emoji: '📍', text: 'মাদ্রাসা কোথায়?' },
  ];

  // ============================================
  // 🎨 কালার স্কিম (Dark/Light)
  // ============================================
  const colors = {
    bg: isDark ? '#0f172a' : '#ffffff',
    headerBg: THEME.gradient,
    bodyBg: isDark ? '#0f172a' : '#f8fafc',
    userBubble: THEME.gradient,
    userBubbleText: '#ffffff',
    aiBubble: isDark ? '#1e293b' : '#ffffff',
    aiBubbleText: isDark ? '#f1f5f9' : '#0f172a',
    inputBg: isDark ? '#1e293b' : '#ffffff',
    inputText: isDark ? '#f1f5f9' : '#0f172a',
    inputBorder: isDark ? '#334155' : '#e2e8f0',
    quickBtnBg: isDark ? '#1e293b' : '#ffffff',
    quickBtnText: isDark ? '#cbd5e1' : '#334155',
    quickBtnBorder: isDark ? '#334155' : '#e2e8f0',
  };

  // ============================================
  // 🎨 রেন্ডার
  // ============================================
  return (
    <>
      {/* ফ্লোটিং চ্যাট বাটন */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.floatingBtn,
          background: isOpen ? THEME.danger : THEME.gradient,
          boxShadow: isOpen
            ? '0 10px 30px rgba(239, 68, 68, 0.4)'
            : '0 10px 30px rgba(99, 102, 241, 0.4)',
        }}
        aria-label="Live Chat"
      >
        <span style={styles.floatingBtnIcon}>{isOpen ? '✕' : '💬'}</span>
        <span style={styles.floatingBtnText}>
          {isOpen ? 'বন্ধ করুন' : 'AI চ্যাট'}
        </span>
        {!isOpen && hasUnread && <span style={styles.unreadDot}></span>}
      </button>

      {/* চ্যাট উইন্ডো */}
      {isOpen && (
        <div
          style={{
            ...styles.chatWindow,
            backgroundColor: colors.bg,
            boxShadow: isDark
              ? '0 25px 60px rgba(0, 0, 0, 0.7)'
              : '0 25px 60px rgba(99, 102, 241, 0.25)',
          }}
        >
          {/* হেডার */}
          <div style={{ ...styles.header, background: colors.headerBg }}>
            <div style={styles.headerLeft}>
              <div style={styles.avatar}>
                <span style={styles.avatarIcon}>🤖</span>
                <span style={styles.avatarOnline}></span>
              </div>
              <div>
                <div style={styles.headerTitle}>AI সহকারী</div>
                <div style={styles.headerStatus}>
                  <span style={styles.onlineDot}></span>
                  অনলাইন • সাথে সাথে উত্তর
                </div>
              </div>
            </div>
            <div style={styles.headerActions}>
              <button
                onClick={handleClearChat}
                style={styles.headerBtn}
                title="চ্যাট ক্লিয়ার"
              >
                🗑️
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={styles.headerBtn}
                title="বন্ধ করুন"
              >
                ✕
              </button>
            </div>
          </div>

          {/* মেসেজ এরিয়া */}
          <div
            style={{ ...styles.body, backgroundColor: colors.bodyBg }}
            className="chat-scroll"
          >
            {messages.map((msg, idx) => (
              <div key={idx} style={styles.messageRow}>
                <div
                  style={{
                    ...styles.bubble,
                    ...(msg.role === 'user'
                      ? {
                          ...styles.userBubble,
                          background: colors.userBubble,
                          color: colors.userBubbleText,
                        }
                      : {
                          ...styles.aiBubble,
                          background: colors.aiBubble,
                          color: colors.aiBubbleText,
                          border: isDark
                            ? '1px solid #334155'
                            : '1px solid #e2e8f0',
                        }),
                  }}
                >
                  <div style={styles.bubbleText}>{msg.content}</div>

                  {msg.shouldTransfer && (
                    <button
                      onClick={() => handleWhatsAppTransfer(msg)}
                      style={styles.whatsappBtn}
                    >
                      💬 WhatsApp-এ যোগাযোগ করুন
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* টাইপিং ইন্ডিকেটর */}
            {isTyping && (
              <div style={styles.messageRow}>
                <div
                  style={{
                    ...styles.aiBubble,
                    background: colors.aiBubble,
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

            {/* কুইক প্রশ্ন */}
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
                        background: colors.quickBtnBg,
                        color: colors.quickBtnText,
                        borderColor: colors.quickBtnBorder,
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

          {/* ইনপুট এরিয়া */}
          <div
            style={{
              ...styles.inputArea,
              backgroundColor: colors.bg,
              borderTop: `1px solid ${colors.inputBorder}`,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="আপনার প্রশ্ন লিখুন..."
              disabled={isTyping}
              style={{
                ...styles.input,
                backgroundColor: colors.inputBg,
                color: colors.inputText,
                border: `1.5px solid ${colors.inputBorder}`,
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
              aria-label="Send"
            >
              ➤
            </button>
          </div>

          {/* প্রাইভেসি নোট */}
          <div
            style={{
              ...styles.privacyNote,
              background: isDark ? '#0f172a' : '#f8fafc',
              borderTop: `1px solid ${colors.inputBorder}`,
            }}
          >
            🔒 আপনার কথোপকথন গোপন রাখা হয়
          </div>
        </div>
      )}

      {/* Animations */}
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
        .chat-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .chat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 3px;
        }
        .chat-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </>
  );
}

// ============================================
// 🎨 স্টাইল
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
  floatingBtnIcon: {
    fontSize: '20px',
  },
  floatingBtnText: {
    fontSize: '15px',
    fontWeight: '700',
  },
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
    padding: '16px 18px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
  },
  avatarIcon: {
    fontSize: '22px',
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
  headerTitle: {
    fontSize: '16px',
    fontWeight: '700',
    letterSpacing: '0.3px',
  },
  headerStatus: {
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '3px',
    opacity: 0.95,
  },
  onlineDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#4ade80',
    display: 'inline-block',
  },
  headerActions: {
    display: 'flex',
    gap: '6px',
  },
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
    transition: 'all 0.2s ease',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '18px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageRow: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
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
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  aiBubble: {
    marginRight: 'auto',
    borderBottomLeftRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  bubbleText: {
    whiteSpace: 'pre-wrap',
  },
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
    transition: 'all 0.2s ease',
  },
  quickQuestions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '10px',
  },
  quickTitle: {
    fontSize: '12px',
    fontWeight: '700',
    marginBottom: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
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
    transition: 'all 0.2s ease',
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
    transition: 'border 0.2s ease',
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
    transition: 'all 0.2s ease',
  },
  privacyNote: {
    padding: '8px 16px',
    textAlign: 'center',
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '500',
    letterSpacing: '0.3px',
    flexShrink: 0,
  },
};
