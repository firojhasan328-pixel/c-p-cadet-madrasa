import React from 'react';

export default function ImageCompressor({ file, onCompressed }) {
  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // রেজুলেশন কমানো (৫০% কম)
        canvas.width = img.width / 2;
        canvas.height = img.height / 2;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // ১০KB এর নিচে কম্প্রেস
        let quality = 0.5;
        let blob = null;
        
        const tryCompress = (q) => {
          canvas.toBlob((b) => {
            if (b.size > 10 * 1024 && q > 0.1) {
              tryCompress(q - 0.05);
            } else {
              const compressedFile = new File([b], file.name, { type: 'image/jpeg' });
              callback(compressedFile);
            }
          }, 'image/jpeg', q);
        };
        
        tryCompress(quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return null;
}
