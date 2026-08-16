import { supabase } from '../supabaseClient';

// ১. ওটিপি জেনারেট করুন
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ২. ওটিপি সংরক্ষণ করুন (ডাটাবেসে)
export async function saveOTP(email, otp) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // ১০ মিনিট বৈধ

  const { data, error } = await supabase
    .from('otp_verifications')
    .insert([{
      email: email,
      otp_code: otp,
      expires_at: expiresAt.toISOString(),
      is_used: false
    }]);

  if (error) {
    console.error('OTP সংরক্ষণে সমস্যা:', error);
    throw error;
  }
  return data;
}

// ৩. ওটিপি ভেরিফাই করুন
export async function verifyOTP(email, otp) {
  const { data, error } = await supabase
    .from('otp_verifications')
    .select('*')
    .eq('email', email)
    .eq('otp_code', otp)
    .eq('is_used', false)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('OTP ভেরিফাইতে সমস্যা:', error);
    throw error;
  }

  if (data.length === 0) {
    return { success: false, message: '❌ ভুল কোড বা কোডের মেয়াদ শেষ' };
  }

  const otpData = data[0];
  const now = new Date();
  const expiresAt = new Date(otpData.expires_at);

  if (now > expiresAt) {
    return { success: false, message: '⏳ কোডের মেয়াদ শেষ হয়ে গেছে' };
  }

  // ওটিপি ইউজ করে ফেলুন
  await supabase
    .from('otp_verifications')
    .update({ is_used: true })
    .eq('id', otpData.id);

  return { success: true, message: '✅ কোড সঠিক' };
}

// ৪. ইমেইল পাঠান (সুপাবেস অথ সার্ভিস ব্যবহার করে)
export async function sendOTPEmail(email, otp) {
  try {
    // সুপাবেসের রিসেট পাসওয়ার্ড ফাংশন ব্যবহার (OTP হিসেবে)
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/update-password',
    });

    if (error) throw error;

    // ওটিপি ডাটাবেসে সংরক্ষণ করুন
    await saveOTP(email, otp);

    return { success: true, message: '✅ ইমেইল পাঠানো হয়েছে' };
  } catch (error) {
    console.error('ইমেইল পাঠাতে সমস্যা:', error);
    return { success: false, error: error.message };
  }
}
