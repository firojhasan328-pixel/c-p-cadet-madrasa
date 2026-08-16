import { supabase } from '../supabaseClient';

export async function sendEmailNotification(to, subject, message) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_email: to,
        title: subject,
        message: message
      }]);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('নোটিফিকেশন পাঠানো ব্যর্থ:', error);
    return { success: false, error: error.message };
  }
}
