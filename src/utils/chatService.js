// ============================================
// 🤖 AI Chat Service — Direct Groq API
// ============================================

import { supabase } from '../supabaseClient';

// ============================================
// ⚠️ Groq API Key
// ============================================
const GROQ_API_KEY =
  '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';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
// ডাটাবেস থেকে FAQ লোড
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
// System Prompt তৈরি
// ============================================
function buildSystemPrompt(faqs, teachers, settingsMap) {
  const faqText = faqs
    .map(
      (f, i) =>
        `${i + 1}. প্রশ্ন: ${f.question}\n   উত্তর: ${f.answer}`
    )
    .join('\n\n');

  const teacherText = teachers
    .map(
      (t) =>
        `- ${t.name} (${t.designation || 'শিক্ষক'}, বিষয়: ${
          t.subject || '—'
        })`
    )
    .join('\n');

  const contactPhone =
    settingsMap.contact_phone || '+8801521-553003';

  return `তুমি "চিলমারী প্রি ক্যাডেট মাদ্রাসা" ওয়েবসাইটের একজন আন্তরিক, বিনয়ী ও সহায়ক AI সহকারী।

তোমার কাজ:
- অভিভাবক ও ছাত্রদের প্রশ্নের উত্তর দেওয়া
- ভদ্র, বিনয়ী ও শালীন ভাষায় কথা বলা
- বাংলায় উত্তর দেওয়া (ইউজার ইংরেজিতে লিখলে ইংরেজিতেও)
- সর্বোচ্চ ৩-৪ লাইনে সংক্ষিপ্ত উত্তর দেওয়া
- প্রয়োজনে ইমোজি ব্যবহার করা (😊, ✅, 📞)

📞 প্রতিষ্ঠানের তথ্য:
- নাম: চিলমারী প্রি ক্যাডেট মাদ্রাসা
- ফোন: ${contactPhone}
- ঠিকানা: চিলমারী, কুড়িগ্রাম, বাংলাদেশ

🎓 শিক্ষক মণ্ডলী (${teachers.length} জন):
${teacherText || '(কোনো তালিকা নেই)'}

📚 গুরুত্বপূর্ণ প্রশ্ন-উত্তর (FAQ):
${faqText || '(কোনো FAQ নেই)'}

⚠️ নিয়মাবলী:
১. তুমি AI — কখনো বলবে না "আমি মানুষ"
২. ব্যক্তিগত তথ্য, পাসওয়ার্ড, বা গোপন তথ্য দেবে না
৩. জটিল প্রশ্ন হলে বলো: "এই বিষয়ে সঠিক তথ্য দিতে আমাদের প্রধান শিক্ষকের সাথে কথা বলা ভালো হবে। আমি আপনাকে WhatsApp-এ পাঠিয়ে দিচ্ছি।"
৪. মিথ্যা তথ্য বানিয়ে বলবে না

এখন ইউজারের প্রশ্নের উত্তর দাও।`;
}

// ============================================
// মূল ফাংশন — AI-তে মেসেজ পাঠানো
// ============================================
export async function sendChatMessage(
  message,
  conversationHistory = []
) {
  try {
    if (
      !GROQ_API_KEY ||
      GROQ_API_KEY.includes('YOUR_GROQ_API_KEY_HERE')
    ) {
      return {
        success: false,
        reply:
          'সিস্টেমে সমস্যা আছে (API key সেট করা হয়নি)। অ্যাডমিনের সাথে যোগাযোগ করুন।',
      };
    }

    const sessionToken = getOrCreateSessionToken();

    const [faqs, teachers, settings] = await Promise.all([
      loadFAQs(),
      loadTeachers(),
      loadSettings(),
    ]);

    const whatsappNumber =
      settings.whatsapp_number || '8801918568313';
    const whatsappMessage =
      settings.whatsapp_default_message ||
      'আসসালামু আলাইকুম, আমি ওয়েবসাইট থেকে চ্যাট করছি।';
    const aiModel =
      settings.ai_model || 'llama-3.3-70b-versatile';

    const systemPrompt = buildSystemPrompt(faqs, teachers, settings);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6),
      { role: 'user', content: message },
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error:', errText);
      throw new Error('Groq API error: ' + errText);
    }

    const data = await response.json();
    const aiAnswer =
      data.choices?.[0]?.message?.content ||
      'দুঃখিত, আমি উত্তর দিতে পারছি না।';

    const answerLower = aiAnswer.toLowerCase();
    const shouldTransfer =
      answerLower.includes('whatsapp') ||
      answerLower.includes('হোয়াটসঅ্যাপ') ||
      answerLower.includes('প্রধান শিক্ষকের সাথে') ||
      answerLower.includes('সরাসরি কথা') ||
      answerLower.includes('যোগাযোগ করুন');

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
            message_count:
              (existingSession.message_count || 0) + 2,
            updated_at: new Date().toISOString(),
            is_transferred_to_whatsapp:
              shouldTransfer ||
              existingSession.is_transferred_to_whatsapp,
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
          {
            session_id: sessionId,
            role: 'user',
            content: message,
          },
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
      whatsappMessage:
        'আসসালামু আলাইকুম, আমি ওয়েবসাইট থেকে চ্যাট করছি।',
    };
  }
}

// ============================================
// WhatsApp URL তৈরি
// ============================================
export function buildWhatsAppUrl(
  phoneNumber,
  message,
  conversationContext = ''
) {
  const cleanNumber = (phoneNumber || '8801918568313').replace(
    /\D/g,
    ''
  );
  const fullMessage = conversationContext
    ? `${message}\n\n--- আগের কথা ---\n${conversationContext}`
    : message;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    fullMessage
  )}`;
}

// ============================================
// সেশন রিসেট
// ============================================
export function resetChatSession() {
  localStorage.removeItem('ai_chat_session_token');
}
