// ============================================
// 🤖 AI Chat Service (Groq + Edge Function)
// ============================================

import { supabase } from '../supabaseClient';

// ============================================
// Edge Function URL
// ============================================
const EDGE_URL = 'https://wgkcedpinnhvpotuivdqg.supabase.co/functions/v1/chat-ai';

// ============================================
// সেশন টোকেন (প্রতি ভিজিটরের জন্য ইউনিক)
// ============================================
const STORAGE_KEY = 'ai_chat_session_token';

export function getOrCreateSessionToken() {
  let token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    token = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}

export function resetChatSession() {
  localStorage.removeItem(STORAGE_KEY);
}

// ============================================
// 📚 FAQ লোড
// ============================================
async function loadFAQs() {
  try {
    const { data, error } = await supabase
      .from('ai_chat_faqs')
      .select('question, answer, keywords, category')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('⚠️ FAQ load error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('⚠️ FAQ load failed:', err);
    return [];
  }
}

// ============================================
// ⚙️ Settings লোড
// ============================================
async function loadSettings() {
  try {
    const { data, error } = await supabase
      .from('ai_chat_settings')
      .select('setting_key, setting_value');

    if (error) {
      console.warn('⚠️ Settings load error:', error.message);
      return {};
    }

    const map = {};
    (data || []).forEach((s) => {
      map[s.setting_key] = s.setting_value;
    });
    return map;
  } catch (err) {
    console.warn('⚠️ Settings load failed:', err);
    return {};
  }
}

// ============================================
// 👨‍🏫 Teachers লোড
// ============================================
async function loadTeachers() {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('name, designation, subject')
      .eq('is_approved', true)
      .order('name');

    if (error) {
      console.warn('⚠️ Teachers load error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('⚠️ Teachers load failed:', err);
    return [];
  }
}

// ============================================
// 🎯 মূল ফাংশন — মেসেজ পাঠাও
// ============================================
export async function sendChatMessage(message, conversationHistory = []) {
  try {
    const sessionToken = getOrCreateSessionToken();

    // ============================================
    // ডাটাবেস থেকে তথ্য লোড (parallel)
    // ============================================
    const [faqs, teachers, settings] = await Promise.all([
      loadFAQs(),
      loadTeachers(),
      loadSettings(),
    ]);

    // ============================================
    // Edge Function কল
    // ============================================
    const startTime = Date.now();

    const response = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        faqs: faqs,
        teachers: teachers,
        settings: settings,
        conversationHistory: conversationHistory,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Edge error:', errText);
      throw new Error('Edge function error: ' + response.status);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }

    const aiAnswer = data.reply || 'দুঃখিত, উত্তর তৈরি করতে পারিনি।';
    const shouldTransfer = data.shouldTransferToWhatsApp || false;
    const whatsappNumber = data.whatsappNumber || '8801918568313';
    const whatsappMessage =
      data.whatsappMessage || 'আসসালামু আলাইকুম, আমি ওয়েবসাইট থেকে চ্যাট করছি।';
    const usedModel = data.model || 'unknown';
    const responseTimeMs = data.responseTimeMs || Date.now() - startTime;
    const tokensUsed = data.tokensUsed || 0;

    // ============================================
    // 📁 ডাটাবেসে সেভ (silent — error হলেও চলবে)
    // ============================================
    try {
      await saveChatToDatabase({
        sessionToken,
        userMessage: message,
        aiAnswer,
        shouldTransfer,
        usedModel,
        responseTimeMs,
        tokensUsed,
      });
    } catch (dbError) {
      console.warn('⚠️ DB save warning:', dbError);
      // silent fail — chat তবুও কাজ করবে
    }

    // ============================================
    // সফল Response
    // ============================================
    return {
      success: true,
      reply: aiAnswer,
      shouldTransferToWhatsApp: shouldTransfer,
      whatsappNumber: whatsappNumber,
      whatsappMessage: whatsappMessage,
      model: usedModel,
      responseTimeMs: responseTimeMs,
      tokensUsed: tokensUsed,
    };

  } catch (error) {
    console.error('❌ Chat error:', error);
    return {
      success: false,
      reply:
        'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে আমাদের সাথে সরাসরি যোগাযোগ করুন।',
      shouldTransferToWhatsApp: true,
      whatsappNumber: '8801918568313',
      whatsappMessage: 'আসসালামু আলাইকুম, আমি ওয়েবসাইট থেকে চ্যাট করছি।',
    };
  }
}

// ============================================
// 💾 ডাটাবেসে সেভ (session + messages)
// ============================================
async function saveChatToDatabase({
  sessionToken,
  userMessage,
  aiAnswer,
  shouldTransfer,
  usedModel,
  responseTimeMs,
  tokensUsed,
}) {
  let sessionId = null;

  // ১. আগের সেশন আছে কি না চেক
  const { data: existingSession } = await supabase
    .from('ai_chat_sessions')
    .select('id, message_count')
    .eq('session_token', sessionToken)
    .maybeSingle();

  if (existingSession) {
    // ২. আপডেট করো
    sessionId = existingSession.id;
    await supabase
      .from('ai_chat_sessions')
      .update({
        message_count: (existingSession.message_count || 0) + 2,
        updated_at: new Date().toISOString(),
        last_message: userMessage.substring(0, 200),
        is_transferred_to_whatsapp:
          shouldTransfer || false,
      })
      .eq('id', sessionId);
  } else {
    // ৩. নতুন সেশন তৈরি করো
    const { data: newSession } = await supabase
      .from('ai_chat_sessions')
      .insert([
        {
          session_token: sessionToken,
          message_count: 2,
          last_message: userMessage.substring(0, 200),
          is_transferred_to_whatsapp: shouldTransfer,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        },
      ])
      .select()
      .single();

    sessionId = newSession?.id || null;
  }

  // ৪. মেসেজ সেভ করো (user + assistant)
  if (sessionId) {
    await supabase.from('ai_chat_messages').insert([
      {
        session_id: sessionId,
        role: 'user',
        content: userMessage,
      },
      {
        session_id: sessionId,
        role: 'assistant',
        content: aiAnswer,
        triggered_whatsapp: shouldTransfer,
        ai_model: usedModel,
        response_time_ms: responseTimeMs,
        tokens_used: tokensUsed,
      },
    ]);
  }
}

// ============================================
// 🔗 WhatsApp URL তৈরি
// ============================================
export function buildWhatsAppUrl(phoneNumber, message, conversationContext = '') {
  const cleanNumber = (phoneNumber || '8801918568313').replace(/\D/g, '');

  const fullMessage = conversationContext
    ? `${message}\n\n--- আগের কথা ---\n${conversationContext}`
    : message;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(fullMessage)}`;
}

// ============================================
// 📜 ভিজিটরের নিজের চ্যাট হিস্টোরি লোড
// ============================================
export async function loadChatHistory() {
  try {
    const sessionToken = getOrCreateSessionToken();

    // ১. সেশন আইডি বের করো
    const { data: session } = await supabase
      .from('ai_chat_sessions')
      .select('id')
      .eq('session_token', sessionToken)
      .maybeSingle();

    if (!session) return [];

    // ২. মেসেজ লোড করো
    const { data: messages } = await supabase
      .from('ai_chat_messages')
      .select('role, content, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })
      .limit(50);

    return messages || [];
  } catch (err) {
    console.warn('⚠️ History load failed:', err);
    return [];
  }
}

// ============================================
// 🗑️ ভিজিটরের সেশন ক্লিয়ার
// ============================================
export async function clearChatHistory() {
  try {
    const sessionToken = getOrCreateSessionToken();

    const { data: session } = await supabase
      .from('ai_chat_sessions')
      .select('id')
      .eq('session_token', sessionToken)
      .maybeSingle();

    if (session) {
      await supabase
        .from('ai_chat_messages')
        .delete()
        .eq('session_id', session.id);
    }

    resetChatSession();
  } catch (err) {
    console.warn('⚠️ Clear history failed:', err);
  }
}
