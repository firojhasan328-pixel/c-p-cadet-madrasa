// ✅ সঠিক কনফিগারেশন
const SERVICE_ID = 'service_vznszfm';
const TEMPLATE_ID = 'template_byuqvor';
const PUBLIC_KEY = 'pucd8tSwEaUYH7Rp_';

// EmailJS সঠিকভাবে initialize হচ্ছে কিনা
export async function sendCustomOTPEmail(email, otp) {
  try {
    emailjs.init(PUBLIC_KEY);
    
    const templateParams = {
      to_email: email,
      otp_code: otp,
      reply_to: email,
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams
    );

    console.log('✅ ইমেইল সফল:', response);
    return { success: true };
  } catch (error) {
    console.error('EmailJS এরর:', error);
    return { success: false, error: error.text || error.message };
  }
}
