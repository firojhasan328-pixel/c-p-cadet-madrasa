import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Gallery() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gallery_categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (data) setCategories(data);
    setLoading(false);
  };

  const fetchImages = async (categoryId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });
    
    if (data) {
      const imagesWithUrls = data.map((img) => {
        const { data: publicUrlData } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(img.image_path);
        
        return { ...img, url: publicUrlData.publicUrl };
      });
      setImages(imagesWithUrls);
    }
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

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${selectedCategory.name}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('gallery_images')
          .insert([{
            category_id: selectedCategory.id,
            image_path: filePath,
            title: file.name
          }]);

        if (dbError) throw dbError;
      }
      
      alert('ছবি আপলোড সফল!');
      fetchImages(selectedCategory.id);
    } catch (err) {
      alert('আপলোড ব্যর্থ: ' + err.message);
    } finally {
      setUploading(false);
    }
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

          {window.userRole === 'superAdmin' && (
            <div style={styles.uploadArea}>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleImageUpload} 
                disabled={uploading}
                style={styles.fileInput}
              />
              <span style={styles.uploadLabel}>
                {uploading ? '⏳ আপলোড হচ্ছে...' : '📤 ছবি আপলোড করুন (একাধিক)'}
              </span>
            </div>
          )}

          {loading ? (
            <p>লোড হচ্ছে...</p>
          ) : (
            <div style={styles.imageGrid}>
              {images.map(img => (
                <div key={img.id} style={styles.imageCard}>
                  {img.url ? (
                    <img src={img.url} alt={img.title} style={styles.image} />
                  ) : (
                    <div style={styles.imagePlaceholder}>🖼️</div>
                  )}
                  <p style={styles.imageTitle}>{img.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 16px'
  },
  heading: {
    color: '#14532d',
    fontSize: '28px',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: '30px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease'
  },
  cardIcon: { fontSize: '36px', marginBottom: '8px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '8px 0 4px 0' },
  cardDesc: { fontSize: '13px', color: '#64748b', margin: 0 },
  backBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '16px'
  },
  subHeading: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#166534',
    marginBottom: '16px'
  },
  uploadArea: {
    background: '#f0fdf4',
    border: '2px dashed #16a34a',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    marginBottom: '20px',
    position: 'relative',
    cursor: 'pointer'
  },
  fileInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer'
  },
  uploadLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#16a34a'
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  imageCard: {
    background: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
  },
  image: {
    width: '100%',
    height: '180px',
    objectFit: 'cover',
    display: 'block'
  },
  imagePlaceholder: {
    width: '100%',
    height: '180px',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    color: '#94a3b8'
  },
  imageTitle: {
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#334155',
    margin: 0,
    textAlign: 'center'
  }
};
