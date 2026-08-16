import { supabase } from '../supabaseClient';

// ========================================
// ১. OTP জেনারেট করুন (৬ ডিজিট)
// ========================================
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ========================================
// ২. OTP ডাটাবেসে সংরক্ষণ করুন
// ========================================
export async function saveOTP(emailOrPhone, otp) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // ১০ মিনিট বৈধ

  // ইমেইল নাকি ফোন, তা নির্ধারণ করুন
  const isEmail = emailOrPhone.includes('@');
  const payload = {
    otp_code: otp,
    expires_at: expiresAt.toISOString(),
    is_used: false
  };

  if (isEmail) {
    payload.email = emailOrPhone;
  } else {
    payload.phone = emailOrPhone;
  }

  const { data, error } = await supabase
    .from('otp_verifications')
    .insert([payload]);

  if (error) {
    console.error('OTP সংরক্ষণে সমস্যা:', error);
    throw error;
  }
  return data;
}

// ========================================
// ৩. OTP ভেরিফাই করুন
// ========================================
export async function verifyOTP(emailOrPhone, otp) {
  const isEmail = emailOrPhone.includes('@');
  const matchField = isEmail ? 'email' : 'phone';

  const { data, error } = await supabase
    .from('otp_verifications')
    .select('*')
    .eq(matchField, emailOrPhone)
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

  // OTP ব্যবহার হয়ে গেছে (একবার ব্যবহারযোগ্য)
  await supabase
    .from('otp_verifications')
    .update({ is_used: true })
    .eq('id', otpData.id);

  return { success: true, message: '✅ কোড সঠিক' };
}

// ========================================
// ৪. কাস্টম ইমেইল পাঠান (EmailJS বা অ্যালার্ট)
// ========================================
export async function sendCustomOTPEmail(email, otp) {
  try {
    // EmailJS ব্যবহার করতে চাইলে নিচের কোড আনকমেন্ট করুন
    /*
    const templateParams = {
      to_email: email,
      otp_code: otp,
      subject: '🔐 আপনার OTP কোড',
      message: `আপনার OTP কোড: ${otp}\nএটি ১০ মিনিটের মধ্যে বৈধ।`
    };
    
    const response = await emailjs.send(
      'your_service_id',
      'your_template_id',
      templateParams,
      'your_public_key'
    );
    */

    // বর্তমানে সিমুলেটেড (কনসোলে দেখাবে)
    console.log(`📧 ইমেইল: ${email} - OTP: ${otp}`);
    
    // ডেভেলপমেন্টে অ্যালার্ট দেখান
    alert(`📧 আপনার OTP কোড: ${otp}\n(ইমেইল: ${email})`);
    
    return { success: true, message: '✅ OTP ইমেইল পাঠানো হয়েছে' };
  } catch (error) {
    console.error('ইমেইল পাঠাতে সমস্যা:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// ৫. SMS পাঠান (শিক্ষকদের জন্য)
// ========================================
export async function sendOTPSMS(phone, otp) {
  try {
    // বর্তমানে সিমুলেটেড
    console.log(`📱 ফোন: ${phone} - OTP: ${otp}`);
    alert(`📱 আপনার ফোনে OTP পাঠানো হয়েছে: ${otp}`);
    
    return { success: true, message: '✅ SMS পাঠানো হয়েছে' };
  } catch (error) {
    console.error('SMS পাঠাতে সমস্যা:', error);
    return { success: false, error: error.message };
  }
}
