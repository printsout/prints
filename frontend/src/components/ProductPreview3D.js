import { useState, useEffect } from 'react';

// Simple 2D Preview Component (fallback for 3D)
const ProductPreview3D = ({ modelType = 'mug', color = '#FFFFFF', productImage = null }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Map model types to placeholder images
  const modelImages = {
    mug: 'https://images.unsplash.com/photo-1627807461786-081fc0e1215c?w=600',
    tshirt: 'https://images.unsplash.com/photo-1593733926335-bdec7f12acfd?w=600',
    hoodie: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600',
    poster: 'https://images.unsplash.com/photo-1571164860029-856acbc24b4a?w=600',
    phonecase: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600',
    totebag: 'https://images.unsplash.com/photo-1597633244018-0201d0158aec?w=600'
  };
  
  const imageUrl = productImage || modelImages[modelType] || modelImages.mug;
  
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [imageUrl]);
  
  return (
    <div 
      className="relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 h-full min-h-[400px] flex items-center justify-center shadow-inner" 
      data-testid="3d-preview"
    >
      {!imageError ? (
        <div className="relative w-full h-full">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="spinner"></div>
            </div>
          )}
          <img 
            src={imageUrl}
            alt={`${modelType} förhandsvisning`}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {/* Color tint overlay */}
          {color !== '#FFFFFF' && (
            <div 
              className="absolute inset-0 mix-blend-color opacity-40 pointer-events-none"
              style={{ backgroundColor: color }}
            />
          )}
        </div>
      ) : (
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🖼️</div>
          <p className="text-slate-600 font-medium">Produktförhandsvisning</p>
          <p className="text-sm text-slate-400 mt-2">Välj färg och designa din produkt</p>
        </div>
      )}
      
      {/* Interaction hint */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <span className="inline-block px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm text-slate-600 shadow-md">
          Klicka på "Designa med egen bild" för att anpassa
        </span>
      </div>
    </div>
  );
};

export default ProductPreview3D;
