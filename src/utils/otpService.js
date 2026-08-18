import { supabase } from '../supabaseClient';
import emailjs from '@emailjs/browser';

// =============================================
// EmailJS Credentials (আপনার তথ্য)
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
// ২. OTP ডাটাবেসে সংরক্ষণ (আপডেটেড)
// =============================================
export async function saveOTP(email, otp) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    console.log('💾 OTP সংরক্ষণ:', { 
      email: normalizedEmail, 
      otp, 
      expiresAt: expiresAt.toISOString() 
    });

    const { data, error } = await supabase
      .from('otp_verifications')
      .insert([{
        email: normalizedEmail,
        otp_code: otp.toString(),
        expires_at: expiresAt.toISOString(),
        is_used: false
      }]);

    if (error) {
      console.error('❌ OTP সংরক্ষণে সমস্যা:', error);
      throw error;
    }
    
    console.log('✅ OTP সংরক্ষিত!', data);
    return data;
  } catch (error) {
    console.error('❌ OTP সংরক্ষণে অনাকাঙ্ক্ষিত সমস্যা:', error);
    throw error;
  }
}

// =============================================
// ৩. OTP ভেরিফাই (সম্পূর্ণ আপডেটেড)
// =============================================
export async function verifyOTP(email, otp) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedOtp = otp.toString().trim();

    console.log('🔍 ভেরিফাই করার চেষ্টা:', { 
      email: normalizedEmail, 
      otp: normalizedOtp 
    });

    const { data, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('otp_code', normalizedOtp)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ OTP ভেরিফাইতে সমস্যা:', error);
      return { success: false, message: 'ডাটাবেস সমস্যা: ' + error.message };
    }

    console.log('📦 ডাটাবেস থেকে পাওয়া ডেটা:', data);

    if (!data || data.length === 0) {
      // ডিবাগ: সব OTP দেখুন
      const { data: allOtps } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('email', normalizedEmail)
        .order('created_at', { ascending: false });
      
      console.log('📋 এই ইমেইলের সব OTP:', allOtps);
      
      return { success: false, message: '❌ ভুল কোড বা কোডের মেয়াদ শেষ' };
    }

    const otpData = data[0];
    
    const now = new Date();
    const expiresAt = new Date(otpData.expires_at);
    
    console.log('⏳ এখন (UTC):', now.toISOString());
    console.log('⏳ মেয়াদ (UTC):', expiresAt.toISOString());
    console.log('⏳ মেয়াদ পার হয়েছে?', now > expiresAt);

    if (now > expiresAt) {
      return { success: false, message: '⏳ কোডের মেয়াদ শেষ হয়ে গেছে' };
    }

    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ is_used: true })
      .eq('id', otpData.id);

    if (updateError) {
      console.error('❌ OTP আপডেটে সমস্যা:', updateError);
      return { success: false, message: 'আপডেট সমস্যা: ' + updateError.message };
    }

    console.log('✅ OTP সফলভাবে ভেরিফাইড!');
    return { success: true, message: '✅ কোড সঠিক' };

  } catch (error) {
    console.error('❌ OTP ভেরিফাইতে অনাকাঙ্ক্ষিত সমস্যা:', error);
    return { success: false, message: 'সার্ভার সমস্যা: ' + error.message };
  }
}

// =============================================
// ৪. EmailJS দিয়ে OTP ইমেইল পাঠান
// =============================================
export async function sendCustomOTPEmail(email, otp) {
  try {
    emailjs.init(PUBLIC_KEY);

    const templateParams = {
      to_email: email.toLowerCase().trim(),
      otp_code: otp.toString(),
      reply_to: email.toLowerCase().trim(),
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams
    );

    console.log('✅ ইমেইল সফলভাবে পাঠানো হয়েছে:', response);
    return { success: true, message: '✅ OTP ইমেইল পাঠানো হয়েছে' };
  } catch (error) {
    console.error('EmailJS ইমেইল পাঠাতে সমস্যা:', error);
    return { success: false, error: error.text || error.message };
  }
}
