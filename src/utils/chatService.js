// ============================================
// 🤖 AI Chat Service
// Edge Function কল করার জন্য
// ============================================

import { supabase } from '../supabaseClient';

// ============================================
// Edge Function URL (আপনার আসল URL)
// ============================================
const EDGE_FUNCTION_URL =
  'https://wgkcedpinnhvpotuivdqg.supabase.co/functions/v1/quick-handler';

// ============================================
// সেশন টোকেন তৈরি (localStorage-এ সেভ থাকবে)
// ============================================
export function getOrCreateSessionToken() {
  const STORAGE_KEY = 'ai_chat_session_token';

  let token = localStorage.getItem(STORAGE_KEY);

  if (!token) {
    // নতুন টোকেন তৈরি
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
// AI-তে মেসেজ পাঠানো
// ============================================
export async function sendChatMessage(message, conversationHistory = []) {
  try {
    // ✅ Session টোকেন
    const sessionToken = getOrCreateSessionToken();

    // ✅ Supabase session থেকে access token নেওয়া (অপশনাল)
    let accessToken = '';
    try {
      const session = await supabase.auth.getSession();
      accessToken = session?.data?.session?.access_token || '';
    } catch (e) {
      // লগইন করা না থাকলে সমস্যা নেই
    }

    // ✅ Edge Function-এ কল
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        message: message,
        session_token: sessionToken,
        conversation_history: conversationHistory.slice(-6), // শেষ ৬টি
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge Function error:', errorText);
      throw new Error('AI উত্তর দিতে পারছে না');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'অজানা সমস্যা');
    }

    return {
      success: true,
      reply: data.reply,
      shouldTransferToWhatsApp: data.shouldTransferToWhatsApp || false,
      whatsappNumber: data.whatsappNumber || '8801918568313',
      whatsappMessage:
        data.whatsappMessage ||
        'আসসালামু আলাইকুম, আমি ওয়েবসাইট থেকে চ্যাট করছি।',
      sessionId: data.sessionId,
    };
  } catch (error) {
    console.error('❌ Chat service error:', error);

    return {
      success: false,
      error: error.message || 'সংযোগে সমস্যা হয়েছে',
      reply:
        'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে আমাদের সাথে সরাসরি যোগাযোগ করুন।',
    };
  }
}

// ============================================
// WhatsApp URL তৈরি (প্রি-ফিল মেসেজ সহ)
// ============================================
export function buildWhatsAppUrl(
  phoneNumber,
  message,
  conversationContext = ''
) {
  // ফোন নাম্বার পরিষ্কার
  const cleanNumber = (phoneNumber || '8801918568313').replace(/\D/g, '');

  // মেসেজ তৈরি
  const fullMessage = conversationContext
    ? `${message}\n\n--- আগের কথা ---\n${conversationContext}`
    : message;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    fullMessage
  )}`;
}

// ============================================
// চ্যাট হিস্ট্রি ক্লিয়ার (নতুন সেশন)
// ============================================
export function resetChatSession() {
  localStorage.removeItem('ai_chat_session_token');
}
