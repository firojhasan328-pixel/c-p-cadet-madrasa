import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ImageModal from './ImageModal';

export default function Gallery() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  useEffect(() => {
    fetchCategories();

    const galleryChannel = supabase
      .channel('gallery-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gallery_images',
      }, () => {
        if (selectedCategory) {
          fetchImages(selectedCategory.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(galleryChannel);
    };
  }, [selectedCategory]);

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('gallery_categories')
      .select('*')
      .order('name');
    setCategories(data || []);
    setLoading(false);
  };

  const fetchImages = async (categoryId) => {
    setLoading(true);
    const { data } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    const imagesWithUrls = await Promise.all((data || []).map(async (img) => {
      if (img.image_path) {
        const { data: urlData } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(img.image_path);
        return { ...img, display_url: urlData.publicUrl };
      }
      return { ...img, display_url: img.image_url || null };
    }));

    setImages(imagesWithUrls);
    setLoading(false);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    fetchImages(category.id);
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setImages([]);
  };

  // ✅ ছবিতে ক্লিক করলে Modal খুলবে
  const handleImageClick = (index) => {
    setModalIndex(index);
    setModalOpen(true);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📸 গ্যালারি</h2>

      {!selectedCategory ? (
        <div style={styles.grid}>
          {categories.map(cat => (
            <div key={cat.id} style={styles.card} onClick={() => handleCategoryClick(cat)}>
              <div style={styles.cardIcon}>📁</div>
              <h3 style={styles.cardTitle}>{cat.name}</h3>
              <p style={styles.cardDesc}>{cat.description || 'ক্লিক করে দেখুন'}</p>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button onClick={handleBack} style={styles.backBtn}>⬅ ফিরে যান</button>
          <h3 style={styles.subHeading}>{selectedCategory.name}</h3>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px 0' }}>⏳ লোড হচ্ছে...</p>
          ) : images.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>🖼️</span>
              <p>এই ক্যাটাগরিতে কোনো ছবি নেই</p>
            </div>
          ) : (
            <div style={styles.imageGrid}>
              {images.map((img, index) => (
                <div
                  key={img.id}
                  style={styles.imageCard}
                  onClick={() => handleImageClick(index)}
                >
                  {img.display_url ? (
                    <img src={img.display_url} alt={img.title} style={styles.image} />
                  ) : (
                    <div style={styles.imagePlaceholder}>🖼️</div>
                  )}
                  <p style={styles.imageTitle}>{img.title || 'ছবি'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✅ ইমেজ মোডাল */}
      {modalOpen && (
        <ImageModal
          images={images}
          currentIndex={modalIndex}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px', margin: '40px auto', padding: '0 16px' },
  heading: { color: '#14532d', fontSize: '28px', fontWeight: '800', textAlign: 'center', marginBottom: '30px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
  card: {
    background: '#ffffff', borderRadius: '16px', padding: '24px', textAlign: 'center',
    cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
  },
  cardIcon: { fontSize: '36px', marginBottom: '8px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '8px 0 4px 0' },
  cardDesc: { fontSize: '13px', color: '#64748b', margin: 0 },
  backBtn: { background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginBottom: '16px' },
  subHeading: { fontSize: '22px', fontWeight: '700', color: '#166534', marginBottom: '16px' },
  emptyState: { textAlign: 'center', padding: '40px 0', color: '#94a3b8' },
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '8px' },
  imageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  imageCard: {
    background: '#ffffff', borderRadius: '12px', overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, boxShadow 0.2s ease',
  },
  image: { width: '100%', height: '180px', objectFit: 'cover', display: 'block' },
  imagePlaceholder: { width: '100%', height: '180px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', color: '#94a3b8' },
  imageTitle: { padding: '8px 12px', fontSize: '13px', fontWeight: '500', color: '#334155', margin: 0, textAlign: 'center' },
};
