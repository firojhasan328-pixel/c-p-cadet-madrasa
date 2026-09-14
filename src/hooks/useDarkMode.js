import { useEffect, useState } from 'react';

// ============================================
// 🎨 useDarkMode Hook — অটো ডিভাইস সেটিং ফলো
// ডিভাইসে ডার্ক মোড চালু করলে সাইট অটো ডার্ক হবে
// ডিভাইসে লাইট মোড চালু থাকলে সাইট লাইট থাকবে
// ============================================

export function useDarkMode() {
  // ব্রাউজার থেকে ইনিশিয়াল সেটিং পড়া
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // ✅ ইনিশিয়াল সেট
    const applyDarkMode = (matches) => {
      setIsDark(matches);

      if (matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.style.backgroundColor = '#0f172a';
        document.body.style.color = '#f1f5f9';
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.style.backgroundColor = '#f8fafc';
        document.body.style.color = '#0f172a';
      }
    };

    applyDarkMode(mediaQuery.matches);

    // ✅ লাইভ পরিবর্তন শোনা
    const handleChange = (e) => {
      applyDarkMode(e.matches);
    };

    // আধুনিক ব্রাউজার
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // পুরোনো ব্রাউজার (Safari < 14)
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return isDark;
}
