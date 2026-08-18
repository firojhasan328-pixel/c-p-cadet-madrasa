import { supabase } from '../supabaseClient';
import emailjs from '@emailjs/browser';

// =============================================
// EmailJS Credentials
// =============================================
const SERVICE_ID = 'service_vznszfm';
const TEMPLATE_ID = 'template_byuqvor';
const PUBLIC_KEY = 'pucd8tSwEaUYH7Rp_';

// =============================================
// ১. OTP জেনারেট (৬ ডিজিট)
// =============================================
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// =============================================
// ২. OTP ডাটাবেসে সংরক্ষণ
// =============================================
export async function saveOTP(email, otp) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  const { data, error } = await supabase
    .from('otp_verifications')
    .insert([{
      email: email.toLowerCase().trim(),
      otp_code: otp,
      expires_at: expiresAt.toISOString(),
      is_used: false
    }]);

  if (error) {
    console.error('❌ OTP সংরক্ষণে সমস্যা:', error);
    throw error;
  }
  return data;
}

// =============================================
// ৩. OTP ভেরিফাই (সরলীকৃত)
// =============================================
export async function verifyOTP(email, otp) {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedOtp = otp.toString().trim();

  // ১. ডাটাবেস থেকে OTP খুঁজুন
  const { data, error } = await supabase
    .from('otp_verifications')
    .select('*')
    .eq('email', normalizedEmail)
    .eq('otp_code', normalizedOtp)
    .eq('is_used', false)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ ডাটাবেস সমস্যা:', error);
    return { success: false, message: 'ডাটাবেস সমস্যা' };
  }

  // ২. OTP পাওয়া যায়নি
  if (!data || data.length === 0) {
    return { success: false, message: '❌ ভুল কোড বা কোডের মেয়াদ শেষ' };
  }

  const otpData = data[0];

  // ৩. মেয়াদ শেষ চেক
  const now = new Date();
  const expiresAt = new Date(otpData.expires_at);

  if (now > expiresAt) {
    return { success: false, message: '⏳ কোডের মেয়াদ শেষ' };
  }

  // ৪. OTP ব্যবহার করা হয়েছে
  await supabase
    .from('otp_verifications')
    .update({ is_used: true })
    .eq('id', otpData.id);

  return { success: true, message: '✅ কোড সঠিক' };
}

// =============================================
// ৪. EmailJS দিয়ে OTP পাঠান
// =============================================
export async function sendOTPEmail(email, otp) {
  try {
    emailjs.init(PUBLIC_KEY);

    const templateParams = {
      to_email: email,
      otp_code: otp,
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams
    );

    console.log('✅ ইমেইল পাঠানো হয়েছে:', response);
    return { success: true };
  } catch (error) {
    console.error('❌ EmailJS সমস্যা:', error);
    return { success: false, error: error.text || error.message };
  }
}
