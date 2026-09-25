// ============================================
// 🤖 AI Chat Service (Supabase SDK version)
// ============================================

import { supabase } from '../supabaseClient';

// ============================================
// সেশন টোকেন
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
// ডাটা লোড
// ============================================
async function loadFAQs() {
  try {
    const { data } = await supabase
      .from('ai_chat_faqs')
      .select('question, answer, keywords, category')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    return data || [];
  } catch {
    return [];
  }
}

async function loadSettings() {
  try {
    const { data } = await supabase
      .from('ai_chat_settings')
      .select('setting_key, setting_value');
    const map = {};
    (data || []).forEach((s) => {
      map[s.setting_key] = s.setting_value;
    });
    return map;
  } catch {
    return {};
  }
}

async function loadTeachers() {
  try {
    const { data } = await supabase
      .from('teachers')
      .select('name, designation, subject')
      .eq('is_approved', true)
      .order('name');
    return data || [];
  } catch {
    return [];
  }
}

// ============================================
// 🎯 মূল ফাংশন — supabase.functions.invoke() দিয়ে
// ============================================
export async function sendChatMessage(message, conversationHistory = []) {
  try {
    const sessionToken = getOrCreateSessionToken();

    // ডাটা লোড
    const [faqs, teachers, settings] = await Promise.all([
      loadFAQs(),
      loadTeachers(),
      loadSettings(),
    ]);

    console.log('📤 Calling Edge Function with:', {
      messageLength: message.length,
      faqsCount: faqs.length,
      teachersCount: teachers.length,
    });

    // ============================================
    // ✅ Supabase SDK দিয়ে Edge Function কল
    // ============================================
    const { data, error } = await supabase.functions.invoke('chat-ai', {
      body: {
        message: message,
        faqs: faqs,
        teachers: teachers,
        settings: settings,
        conversationHistory: conversationHistory,
      },
    });

    if (error) {
      console.error('❌ Edge Function error:', error);
      throw new Error(error.message || 'Edge function error');
    }

    console.log('✅ Edge Function response:', data);

    if (!data || !data.success) {
      throw new Error(data?.error || 'Unknown error from function');
    }

    const aiAnswer = data.reply || 'দুঃখিত, উত্তর তৈরি করতে পারিনি।';
    const shouldTransfer = data.shouldTransferToWhatsApp || false;
    const whatsappNumber = data.whatsappNumber || '8801918568313';
    const whatsappMessage =
      data.whatsappMessage || 'আসসালামু আলাইকুম, আমি ওয়েবসাইট থেকে চ্যাট করছি।';

    // ডাটাবেসে সেভ (silent)
    try {
      await saveChatToDatabase({
        sessionToken,
        userMessage: message,
        aiAnswer,
        shouldTransfer,
        usedModel: data.model || 'unknown',
        responseTimeMs: data.responseTimeMs || 0,
        tokensUsed: data.tokensUsed || 0,
      });
    } catch (dbError) {
      console.warn('⚠️ DB save warning:', dbError);
    }

    return {
      success: true,
      reply: aiAnswer,
      shouldTransferToWhatsApp: shouldTransfer,
      whatsappNumber: whatsappNumber,
      whatsappMessage: whatsappMessage,
    };

  } catch (error) {
    console.error('❌ sendChatMessage error:', error);
    return {
      success: false,
      reply:
        'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে সরাসরি যোগাযোগ করুন।',
      shouldTransferToWhatsApp: true,
      whatsappNumber: '8801918568313',
      whatsappMessage: 'আসসালামু আলাইকুম, আমি ওয়েবসাইট থেকে চ্যাট করছি।',
      error: error.message,
    };
  }
}

// ============================================
// ডাটাবেসে সেভ
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

  const { data: existingSession } = await supabase
    .from('ai_chat_sessions')
    .select('id, message_count')
    .eq('session_token', sessionToken)
    .maybeSingle();

  if (existingSession) {
    sessionId = existingSession.id;
    await supabase
      .from('ai_chat_sessions')
      .update({
        message_count: (existingSession.message_count || 0) + 2,
        updated_at: new Date().toISOString(),
        last_message: userMessage.substring(0, 200),
        is_transferred_to_whatsapp: shouldTransfer || false,
      })
      .eq('id', sessionId);
  } else {
    const { data: newSession } = await supabase
      .from('ai_chat_sessions')
      .insert([
        {
          session_token: sessionToken,
          message_count: 2,
          last_message: userMessage.substring(0, 200),
          is_transferred_to_whatsapp: shouldTransfer,
        },
      ])
      .select()
      .single();
    sessionId = newSession?.id || null;
  }

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
// WhatsApp URL
// ============================================
export function buildWhatsAppUrl(phoneNumber, message) {
  const cleanNumber = (phoneNumber || '8801918568313').replace(/\D/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

// ============================================
// চ্যাট হিস্টোরি লোড
// ============================================
export async function loadChatHistory() {
  try {
    const sessionToken = getOrCreateSessionToken();
    const { data: session } = await supabase
      .from('ai_chat_sessions')
      .select('id')
      .eq('session_token', sessionToken)
      .maybeSingle();

    if (!session) return [];

    const { data: messages } = await supabase
      .from('ai_chat_messages')
      .select('role, content, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })
      .limit(50);

    return messages || [];
  } catch {
    return [];
  }
}

// ============================================
// চ্যাট ক্লিয়ার
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
      await supabase.from('ai_chat_messages').delete().eq('session_id', session.id);
      await supabase.from('ai_chat_sessions').delete().eq('id', session.id);
    }
    resetChatSession();
  } catch (err) {
    console.warn('Clear failed:', err);
  }
}
