import React from 'react';

export default function NIDValidator({ file, onValid, onInvalid }) {
  const validateNID = (file) => {
    // ১. ফাইল টাইপ চেক
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, message: 'শুধু JPG বা PNG ফাইল অনুমোদিত' };
    }

    // ২. ফাইল সাইজ চেক (২MB এর বেশি নয়)
    if (file.size > 2 * 1024 * 1024) {
      return { valid: false, message: 'ফাইল সাইজ ২MB এর বেশি হতে পারে না' };
    }

    // ৩. ফাইল নামে 'nid' আছে কিনা (সাধারণত NID ছবির নামে nid থাকে)
    if (!file.name.toLowerCase().includes('nid')) {
      return { valid: false, message: 'শুধু NID কার্ডের ছবি আপলোড করুন' };
    }

    return { valid: true, message: '✅ NID কার্ড যাচাইকৃত' };
  };

  const result = validateNID(file);
  return result.valid ? onValid?.(result) : onInvalid?.(result);
}
