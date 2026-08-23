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
// ২. OTP ডাটাবেসে সংরক্ষণ (শিক্ষক)
// =============================================
export async function saveTeacherOTP(email, otp) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  console.log('📝 Saving Teacher OTP for:', email, 'OTP:', otp);

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
  
  console.log('✅ Teacher OTP saved successfully');
  return data;
}

// =============================================
// ৩. OTP ভেরিফাই (শিক্ষক)
// =============================================
export async function verifyTeacherOTP(email, otp) {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedOtp = otp.toString().trim();

  console.log('🔍 Verifying Teacher OTP for:', normalizedEmail, 'OTP:', normalizedOtp);

  try {
    // সব রেকর্ড দেখুন (ডিবাগের জন্য)
    const { data: allData, error: allError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', normalizedEmail)
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ ডাটাবেস সমস্যা:', allError);
      return { success: false, message: 'ডাটাবেস সমস্যা' };
    }

    console.log('📋 All OTP records for this email:', allData);

    // সঠিক OTP খুঁজুন
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

    console.log('🔍 Found OTP record:', data);

    if (!data || data.length === 0) {
      // চেক করুন কোডটি ইতিমধ্যে ব্যবহার করা হয়েছে কিনা
      const { data: usedData } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('otp_code', normalizedOtp)
        .eq('is_used', true);

      if (usedData && usedData.length > 0) {
        return { success: false, message: '❌ এই কোড ইতিমধ্যে ব্যবহার করা হয়েছে।' };
      }

      return { success: false, message: '❌ ভুল কোড বা কোডের মেয়াদ শেষ' };
    }

    const otpData = data[0];
    const now = new Date();
    const expiresAt = new Date(otpData.expires_at);

    console.log('⏰ Current time:', now);
    console.log('⏰ Expires at:', expiresAt);

    if (now > expiresAt) {
      return { success: false, message: '⏳ কোডের মেয়াদ শেষ' };
    }

    // OTP ব্যবহার করা হয়েছে মার্ক করুন
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ is_used: true })
      .eq('id', otpData.id);

    if (updateError) {
      console.error('❌ Update error:', updateError);
    }

    console.log('✅ Teacher OTP verified successfully!');
    return { success: true, message: '✅ কোড সঠিক' };
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return { success: false, message: err.message || 'ভেরিফাই করতে সমস্যা' };
  }
}

// =============================================
// ৪. EmailJS দিয়ে OTP পাঠান (শিক্ষক)
// =============================================
export async function sendTeacherOTPEmail(email, otp) {
  try {
    emailjs.init(PUBLIC_KEY);

    const templateParams = {
      to_email: email,
      otp_code: otp,
    };

    console.log('📧 Sending teacher email to:', email, 'OTP:', otp);

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams
    );

    console.log('✅ শিক্ষক OTP ইমেইল পাঠানো হয়েছে:', response);
    return { success: true };
  } catch (error) {
    console.error('❌ EmailJS সমস্যা:', error);
    
    // রেট লিমিট এরর হ্যান্ডলিং
    if (error.text && error.text.includes('rate limit')) {
      console.log(`📧 Teacher OTP for ${email}: ${otp}`);
      alert(`⚠️ ইমেইল সীমা অতিক্রম! আপনার OTP: ${otp}`);
      return { success: true, isTestMode: true };
    }
    
    return { success: false, error: error.text || error.message };
  }
}
