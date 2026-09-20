// ============================================
// 🤖 AI Chat Service — Supabase Edge Function
// ============================================

import { supabase } from '../supabaseClient';

// ============================================
// Edge Function URL
// ============================================
const EDGE_URL = 'https://wgkcedpinnhvpotuivdqg.supabase.co/functions/v1/chat-ai';

// ============================================
// সেশন টোকেন
// ============================================
export function getOrCreateSessionToken() {
  const STORAGE_KEY = 'ai_chat_session_token';
  let token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    token =
      'sess_' +
      Date.now() +
      '_' +
      Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}

// ============================================
// FAQ লোড
// ============================================
async function loadFAQs() {
  try {
    const { data, error } = await supabase
      .from('ai_chat_faqs')
      .select('question, answer, keywords, category')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

// ============================================
// Settings লোড
// ============================================
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

// ============================================
// শিক্ষক লোড
// ============================================
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
// মূল ফাংশন
// ============================================
export async function sendChatMessage(message, conversationHistory = []) {
  try {
    const sessionToken = getOrCreateSessionToken();

    // ডাটাবেস থেকে তথ্য
    const [faqs, teachers, settings] = await Promise.all([
      loadFAQs(),
      loadTeachers(),
      loadSettings(),
    ]);

    // Edge Function কল
    const response = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        faqs: faqs,
        teachers: teachers,
        settings: settings,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Edge error:', errText);
      throw new Error('Edge function error');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }

    const aiAnswer = data.reply;
    const shouldTransfer = data.shouldTransferToWhatsApp || false;
    const whatsappNumber = data.whatsappNumber || '8801918568313';
    const whatsappMessage = data.whatsappMessage || 'আসসালামু আলাইকুম, আমি ওয়েবসাইট থেকে চ্যাট করছি।';

    // ডাটাবেসে সেভ (silent)
    try {
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
            is_transferred_to_whatsapp:
              shouldTransfer || existingSession.is_transferred_to_whatsapp,
          })
          .eq('id', sessionId);
      } else {
        const { data: newSession } = await supabase
          .from('ai_chat_sessions')
          .insert([
            {
              session_token: sessionToken,
              message_count: 2,
              is_transferred_to_whatsapp: shouldTransfer,
            },
          ])
          .select()
          .single();
        sessionId = newSession?.id || null;
      }

      if (sessionId) {
        await supabase.from('ai_chat_messages').insert([
          { session_id: sessionId, role: 'user', content: message },
          {
            session_id: sessionId,
            role: 'assistant',
            content: aiAnswer,
            triggered_whatsapp: shouldTransfer,
          },
        ]);
      }
    } catch (dbError) {
      console.warn('DB save warning:', dbError);
    }

    return {
      success: true,
      reply: aiAnswer,
      shouldTransferToWhatsApp: shouldTransfer,
      whatsappNumber: whatsappNumber,
      whatsappMessage: whatsappMessage,
    };
  } catch (error) {
    console.error('Chat error:', error);
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
// WhatsApp URL
// ============================================
export function buildWhatsAppUrl(phoneNumber, message, conversationContext = '') {
  const cleanNumber = (phoneNumber || '8801918568313').replace(/\D/g, '');
  const fullMessage = conversationContext
    ? `${message}\n\n--- আগের কথা ---\n${conversationContext}`
    : message;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(fullMessage)}`;
}

// ============================================
// Session reset
// ============================================
export function resetChatSession() {
  localStorage.removeItem('ai_chat_session_token');
}
