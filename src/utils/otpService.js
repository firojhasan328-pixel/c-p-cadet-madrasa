import { supabase } from '../supabaseClient';

// ১. ওটিপি জেনারেট করুন
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ২. ওটিপি সংরক্ষণ করুন
export async function saveOTP(email, otp) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  const { data, error } = await supabase
    .from('otp_verifications')
    .insert([{
      email: email,
      otp_code: otp,
      expires_at: expiresAt.toISOString(),
      is_used: false
    }]);

  if (error) throw error;
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

  if (error) throw error;

  if (data.length === 0) {
    return { success: false, message: 'ভুল কোড বা কোডের মেয়াদ শেষ' };
  }

  const otpData = data[0];
  const now = new Date();
  const expiresAt = new Date(otpData.expires_at);

  if (now > expiresAt) {
    return { success: false, message: 'কোডের মেয়াদ শেষ হয়ে গেছে' };
  }

  await supabase
    .from('otp_verifications')
    .update({ is_used: true })
    .eq('id', otpData.id);

  return { success: true, message: 'কোড সঠিক' };
}

// ৪. ইমেইল পাঠান (সিমুলেটেড)
export async function sendOTPEmail(email, otp) {
  console.log(`📧 ইমেইল: ${email} - ওটিপি: ${otp}`);
  alert(`📧 আপনার ওটিপি কোড: ${otp}\n(ইমেইল: ${email})`);
  return { success: true };
}
