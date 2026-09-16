import React, { useState, useEffect, useRef } from 'react';
import {
  sendChatMessage,
  buildWhatsAppUrl,
  getOrCreateSessionToken,
} from '../utils/chatService';

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [hasUnread, setHasUnread] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ============================================
  // ডার্ক মোড ডিটেকশন
  // ============================================
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    const handleChange = (e) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // ============================================
  // গ্রিটিং মেসেজ
  // ============================================
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            'আসসালামু আলাইকুম! 😊\n\nআমি চিলমারী প্রি ক্যাডেট মাদ্রাসার AI সহকারী। আপনাকে কীভাবে সাহায্য করতে পারি?',
          timestamp: new Date(),
        },
      ]);
      setHasUnread(false);
    }
  }, [isOpen, messages.length]);

  // ============================================
  // অটো scroll to bottom
  // ============================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ============================================
  // মেসেজ পাঠানো
  // ============================================
  const handleSend = async (messageText) => {
    const text = (messageText || inputValue).trim();
    if (!text || isTyping) return;

    // ইউজারের মেসেজ যোগ
    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setShowQuickQuestions(false);

    // Conversation history তৈরি
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // AI-তে পাঠানো
    const result = await sendChatMessage(text, history);

    setIsTyping(false);

    // AI-এর রেসপন্স
    const assistantMessage = {
      role: 'assistant',
      content: result.reply,
      timestamp: new Date(),
      shouldTransfer: result.shouldTransferToWhatsApp,
      whatsappNumber: result.whatsappNumber,
      whatsappMessage: result.whatsappMessage,
    };

    setMessages((prev) => [...prev, assistantMessage]);
  };

  // ============================================
  // Enter চাপলে পাঠানো
  // ============================================
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ============================================
  // WhatsApp-এ পাঠানো
  // ============================================
  const handleWhatsAppTransfer = (msg) => {
    const url = buildWhatsAppUrl(
      msg.whatsappNumber,
      msg.whatsappMessage,
      ''
    );
    window.open(url, '_blank');
  };

  // ============================================
  // দ্রুত প্রশ্নসমূহ
  // ============================================
  const quickQuestions = [
    { emoji: '🎓', text: 'ভর্তি সম্পর্কে জানতে চাই' },
    { emoji: '💰', text: 'মাসিক ফি কত?' },
    { emoji: '📞', text: 'যোগাযোগের নম্বর কী?' },
    { emoji: '⏰', text: 'ক্লাসের সময় কখন?' },
    { emoji: '📚', text: 'শিক্ষকদের তথ্য' },
    { emoji: '🏫', text: 'মাদ্রাসা কোথায়?' },
  ];

  // ============================================
  // ডার্ক মোড অনুযায়ী রঙ
  // ============================================
  const colors = {
    bg: isDark ? '#0f172a' : '#ffffff',
    headerBg: isDark ? '#1e293b' : '#16a34a',
    bodyBg: isDark ? '#0f172a' : '#f8fafc',
    userBubble: '#16a34a',
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

  return (
    <>
      {/* ============================================
          ফ্লোটিং চ্যাট বাটন
          ============================================ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.floatingBtn,
          background: isOpen
            ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
            : 'linear-gradient(135deg, #16a34a, #15803d)',
        }}
        aria-label="AI Chat"
      >
        {isOpen ? '✕' : '💬'}
        {!isOpen && hasUnread && <span style={styles.unreadDot}></span>}
      </button>

      {/* ============================================
          চ্যাট উইন্ডো
          ============================================ */}
      {isOpen && (
        <div
          style={{
            ...styles.chatWindow,
            backgroundColor: colors.bg,
            boxShadow: isDark
              ? '0 20px 60px rgba(0,0,0,0.8)'
              : '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          {/* হেডার */}
          <div
            style={{
              ...styles.header,
              background: colors.headerBg,
            }}
          >
            <div style={styles.headerLeft}>
              <div style={styles.avatar}>🤖</div>
              <div>
                <div style={styles.headerTitle}>AI সহকারী</div>
                <div style={styles.headerStatus}>
                  <span style={styles.onlineDot}></span> অনলাইন
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={styles.closeBtn}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* মেসেজ এরিয়া */}
          <div
            style={{
              ...styles.body,
              backgroundColor: colors.bodyBg,
            }}
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

                  {/* WhatsApp ট্রান্সফার বাটন */}
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
                    border: isDark
                      ? '1px solid #334155'
                      : '1px solid #e2e8f0',
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

            {/* দ্রুত প্রশ্ন */}
            {showQuickQuestions && messages.length <= 1 && !isTyping && (
              <div style={styles.quickQuestions}>
                <div
                  style={{
                    ...styles.quickTitle,
                    color: isDark ? '#94a3b8' : '#64748b',
                  }}
                >
                  দ্রুত প্রশ্ন:
                </div>
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
                    <span>{q.emoji}</span> {q.text}
                  </button>
                ))}
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
                opacity: !inputValue.trim() || isTyping ? 0.5 : 1,
              }}
              aria-label="Send"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* অ্যানিমেশন */}
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
    bottom: '90px',
    right: '25px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: 'none',
    color: 'white',
    fontSize: '26px',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(22, 163, 74, 0.5)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  unreadDot: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#dc2626',
    animation: 'aiChatPulse 1.5s infinite',
    boxShadow: '0 0 0 3px white',
  },
  chatWindow: {
    position: 'fixed',
    bottom: '160px',
    right: '25px',
    width: '360px',
    maxWidth: 'calc(100vw - 30px)',
    height: '540px',
    maxHeight: 'calc(100vh - 200px)',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    overflow: 'hidden',
    animation: 'aiChatFadeIn 0.3s ease',
  },
  header: {
    padding: '14px 18px',
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
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
  },
  headerTitle: {
    fontSize: '15px',
    fontWeight: '700',
  },
  headerStatus: {
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '2px',
    opacity: 0.9,
  },
  onlineDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#4ade80',
    display: 'inline-block',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: 'white',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
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
    padding: '10px 14px',
    borderRadius: '16px',
    fontSize: '14px',
    lineHeight: '1.6',
    wordBreak: 'break-word',
  },
  userBubble: {
    marginLeft: 'auto',
    borderBottomRightRadius: '4px',
  },
  aiBubble: {
    marginRight: 'auto',
    borderBottomLeftRadius: '4px',
  },
  bubbleText: {
    whiteSpace: 'pre-wrap',
  },
  typingIndicator: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    padding: '4px 0',
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#16a34a',
    display: 'inline-block',
    animation: 'aiChatTyping 1.2s infinite',
  },
  whatsappBtn: {
    marginTop: '10px',
    width: '100%',
    background: 'linear-gradient(135deg, #25D366, #128C7E)',
    color: 'white',
    border: 'none',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  quickQuestions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '8px',
  },
  quickTitle: {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  quickBtn: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  inputArea: {
    padding: '12px 14px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '11px 16px',
    borderRadius: '24px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  sendBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(22,163,74,0.4)',
  },
};
