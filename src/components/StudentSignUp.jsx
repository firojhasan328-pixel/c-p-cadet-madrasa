// =============================================
// সাবমিট (OTP পাঠান) - আপডেটেড
// =============================================
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // ১. ছবি আপলোড
    const photoPath = await uploadPhoto();

    // ২. ছাত্র ডেটা ইনসার্ট
    const { data, error } = await supabase
      .from('students')
      .insert([{
        name: formData.name,
        father_name: formData.fatherName,
        mother_name: formData.motherName,
        village: formData.village,
        class_name: formData.class,
        roll_number: formData.roll || null,
        photo_url: photoPath,
        email: formData.email,
        is_verified: false,
        is_approved: false
      }]);

    // 🔍 ডেটাবেস এরর চেক
    if (error) {
      console.error('Insert Error:', error);
      
      // ডুপ্লিকেট ইমেইল এরর
      if (error.code === '23505') {
        setError('❌ এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে। দয়া করে ভিন্ন ইমেইল ব্যবহার করুন।');
      } else {
        setError('ডেটা জমা দিতে সমস্যা: ' + error.message);
      }
      setLoading(false);
      return;
    }

    // ৩. OTP জেনারেট ও ইমেইল পাঠান
    const otp = generateOTP();
    await saveOTP(formData.email, otp);
    
    const emailResult = await sendCustomOTPEmail(formData.email, otp);
    
    if (!emailResult.success) {
      setError('OTP পাঠাতে সমস্যা: ' + emailResult.error);
      setLoading(false);
      return;
    }

    // ✅ সবকিছু ঠিক থাকলে স্টেপ ২-এ যান
    setStep(2);
    alert('✅ আপনার ইমেইলে OTP কোড পাঠানো হয়েছে! চেক করুন (স্প্যাম ফোল্ডারেও দেখুন)');
    
  } catch (err) {
    console.error('Submit Error:', err);
    setError('সাবমিট করতে সমস্যা: ' + err.message);
  } finally {
    setLoading(false);
  }
};
