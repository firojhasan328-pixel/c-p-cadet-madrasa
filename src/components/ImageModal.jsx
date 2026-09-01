import React, { useState, useEffect, useRef } from 'react';

export default function ImageModal({ images, currentIndex, onClose }) {
  const [index, setIndex] = useState(currentIndex);
  const [scale, setScale] = useState(1);
  const [touchStart, setTouchStart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const currentImage = images[index];

  // ✅ কীবোর্ড শর্টকাট (ডেস্কটপের জন্য)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, images.length]);

  // ✅ জুম রিসেট করুন যখন ছবি পরিবর্তন হয়
  useEffect(() => {
    setScale(1);
  }, [index]);

  // =============================================
  // ✅ নেভিগেশন
  // =============================================
  const goToPrev = (e) => {
    e?.stopPropagation();
    setIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = (e) => {
    e?.stopPropagation();
    setIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // =============================================
  // ✅ জুম কন্ট্রোল (পিনচ জুম)
  // =============================================
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      setTouchStart(distance);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStart) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      const newScale = Math.min(Math.max((distance / touchStart) * scale, 0.5), 3);
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  // ✅ মাউস হুইল দিয়ে জুম (ডেস্কটপ)
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.min(Math.max(prev + delta, 0.5), 3));
  };

  // =============================================
  // ✅ ডাউনলোড ফাংশন
  // =============================================
  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!currentImage?.display_url) return;

    try {
      const response = await fetch(currentImage.display_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = currentImage.title || 'gallery-image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('ডাউনলোড করতে সমস্যা হয়েছে');
    }
  };

  // =============================================
  // ✅ ৩ ডট মেনু
  // =============================================
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  // =============================================
  // ✅ রেন্ডার
  // =============================================
  return (
    <div
      style={styles.overlay}
      onClick={onClose}
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ✅ ব্যাকগ্রাউন্ড ব্লার */}
      <div style={styles.blurBg}></div>

      {/* ✅ ছবি কন্টেইনার */}
      <div
        style={{
          ...styles.imageContainer,
          transform: `scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {currentImage?.display_url ? (
          <img
            src={currentImage.display_url}
            alt={currentImage.title || 'Gallery Image'}
            style={styles.image}
            draggable={false}
          />
        ) : (
          <div style={styles.placeholder}>🖼️</div>
        )}
      </div>

      {/* ✅ ক্যাপশন */}
      <div style={styles.caption} onClick={(e) => e.stopPropagation()}>
        {currentImage?.title || 'ছবি'}
      </div>

      {/* ✅ ৩ ডট মেনু (উপরে ডান কোণায়) */}
      <div style={styles.menuContainer} onClick={(e) => e.stopPropagation()}>
        <button onClick={toggleMenu} style={styles.menuBtn}>
          ⋮
        </button>

        {showMenu && (
          <div style={styles.menuDropdown}>
            <button onClick={handleDownload} style={styles.menuItem}>
              <span>📥</span> ডাউনলোড করুন
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                onClose();
              }}
              style={styles.menuItem}
            >
              <span>✕</span> বন্ধ করুন
            </button>
          </div>
        )}
      </div>

      {/* ✅ বন্ধ বাটন (ক্রস) */}
      <button onClick={onClose} style={styles.closeBtn}>
        ✕
      </button>

      {/* ✅ নেভিগেশন বাটন (ডেস্কটপের জন্য) */}
      {images.length > 1 && (
        <>
          <button onClick={goToPrev} style={{ ...styles.navBtn, left: '16px' }}>
            ‹
          </button>
          <button onClick={goToNext} style={{ ...styles.navBtn, right: '16px' }}>
            ›
          </button>

          {/* ✅ ছবি কাউন্টার */}
          <div style={styles.counter}>
            {index + 1} / {images.length}
          </div>
        </>
      )}

      {/* ✅ সোয়াইপ ইন্ডিকেটর (মোবাইলের জন্য) */}
      {images.length > 1 && (
        <div style={styles.dotsContainer}>
          {images.map((_, i) => (
            <span
              key={i}
              style={{
                ...styles.dot,
                opacity: i === index ? 1 : 0.3,
                width: i === index ? '24px' : '8px',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================
// 🎨 প্রিমিয়াম স্টাইল
// =============================================
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    animation: 'fadeIn 0.3s ease',
    touchAction: 'none',
    overflow: 'hidden',
  },
  blurBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  imageContainer: {
    position: 'relative',
    maxWidth: '92vw',
    maxHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'none',
    zIndex: 10,
  },
  image: {
    maxWidth: '92vw',
    maxHeight: '80vh',
    objectFit: 'contain',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
  },
  placeholder: {
    fontSize: '64px',
    color: 'white',
    opacity: 0.5,
  },
  caption: {
    position: 'absolute',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    background: 'rgba(0,0,0,0.5)',
    padding: '8px 20px',
    borderRadius: '20px',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 10,
    maxWidth: '80%',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    fontSize: '22px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    transition: 'all 0.2s ease',
    zIndex: 20,
  },
  menuContainer: {
    position: 'absolute',
    top: '16px',
    right: '70px',
    zIndex: 20,
  },
  menuBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    transition: 'all 0.2s ease',
  },
  menuDropdown: {
    position: 'absolute',
    top: '50px',
    right: '0',
    background: 'rgba(30, 30, 30, 0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '12px',
    padding: '8px 0',
    minWidth: '180px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
    animation: 'slideDown 0.2s ease',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 18px',
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    fontSize: '28px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    transition: 'all 0.2s ease',
    zIndex: 10,
  },
  counter: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    fontWeight: '500',
    background: 'rgba(0,0,0,0.4)',
    padding: '4px 14px',
    borderRadius: '12px',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 10,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '8px',
    zIndex: 10,
  },
  dot: {
    height: '8px',
    borderRadius: '4px',
    background: 'white',
    transition: 'all 0.3s ease',
  },
};

// ✅ অ্যানিমেশন Inject
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;
document.head.appendChild(styleSheet);
