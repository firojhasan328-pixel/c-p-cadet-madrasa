import emailjs from '@emailjs/browser';

// ============================================
// ✅ আপনার EmailJS Credentials দিন
// ============================================
const SERVICE_ID = 'service_rh68xfe';        // ← আপনার Service ID
const TEMPLATE_ID = 'template_5k4c498';      // ← আপনার Template ID
const PUBLIC_KEY = 'pucd8tSwEaUYH7Rp_';      // ← আপনার Public Key

// ============================================
// 📧 অটো রিপ্লাই ইমেইল পাঠান
// ============================================
export async function sendAutoReplyEmail(toEmail, formNumber, studentName) {
  try {
    // EmailJS Initialize
    emailjs.init(PUBLIC_KEY);

    const templateParams = {
      to_email: toEmail,                    // ← ইউজারের ইমেইল
      student_name: studentName,            // ← ইউজারের নাম
      form_number: formNumber,              // ← ফর্ম নাম্বার
      reply_to: 'firojhasan328@gmail.com',  // ← আপনার ইমেইল (রিপ্লাই যাবে)
      contact: '+8801521-553003'            // ← যোগাযোগের নম্বর
    };

    console.log('📧 Sending email to:', toEmail);
    console.log('📧 Form Number:', formNumber);

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams
    );

    console.log('✅ অটো রিপ্লাই ইমেইল পাঠানো হয়েছে:', response);
    return { success: true, response };

  } catch (error) {
    console.error('❌ ইমেইল পাঠাতে সমস্যা:', error);
    return { 
      success: false, 
      error: error.text || error.message,
      details: error
    };
  }
}

// ============================================
// 📧 টেস্ট ইমেইল পাঠান (চেক করার জন্য)
// ============================================
export async function sendTestEmail() {
  try {
    emailjs.init(PUBLIC_KEY);

    const templateParams = {
      to_email: 'firojhasan328@gmail.com',  // ← আপনার ইমেইল
      student_name: 'টেস্ট ইউজার',
      form_number: 'CPCM-2026-0001',
      reply_to: 'firojhasan328@gmail.com',
      contact: '+8801521-553003'
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams
    );

    console.log('✅ টেস্ট ইমেইল পাঠানো হয়েছে:', response);
    return { success: true, response };

  } catch (error) {
    console.error('❌ টেস্ট ইমেইল পাঠাতে সমস্যা:', error);
    return { success: false, error: error.text || error.message };
  }
}
