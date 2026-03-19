import { useState, useEffect, useRef } from 'react';

// Product Preview with real product images and texture overlay
const ProductPreview3D = ({ modelType = 'mug', color = '#FFFFFF', productImage = null, texture = null }) => {
  const containerRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Product base images - using realistic product photos
  const productImages = {
    mug: 'https://customer-assets.emergentagent.com/job_be645e3c-37b1-47f0-ae1a-5a2a36047627/artifacts/lct9ro0u_hn.jpg',
    tshirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
    hoodie: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600',
    poster: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=600',
    phonecase: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600',
    totebag: 'https://images.unsplash.com/photo-1597633425046-08f5110420b5?w=600'
  };

  // Texture positioning for each product type (percentage-based)
  const texturePositions = {
    mug: { 
      top: '18%', 
      left: '20%', 
      width: '45%', 
      height: '55%',
      borderRadius: '5% / 3%',
      transform: 'perspective(300px) rotateY(-5deg)'
    },
    tshirt: { 
      top: '25%', 
      left: '30%', 
      width: '40%', 
      height: '35%',
      borderRadius: '2%'
    },
    hoodie: { 
      top: '28%', 
      left: '32%', 
      width: '36%', 
      height: '30%',
      borderRadius: '2%'
    },
    poster: { 
      top: '5%', 
      left: '5%', 
      width: '90%', 
      height: '90%',
      borderRadius: '0'
    },
    phonecase: { 
      top: '15%', 
      left: '15%', 
      width: '70%', 
      height: '60%',
      borderRadius: '8px'
    },
    totebag: { 
      top: '25%', 
      left: '25%', 
      width: '50%', 
      height: '40%',
      borderRadius: '2%'
    }
  };

  const baseImage = productImages[modelType] || productImages.mug;
  const texturePos = texturePositions[modelType] || texturePositions.mug;

  // Mouse handlers for rotation
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastX(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastX;
    setRotation(prev => prev + deltaX * 0.3);
    setLastX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(prev => Math.max(0.7, Math.min(1.5, prev + delta)));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Subtle auto-animation when not dragging
  useEffect(() => {
    if (isDragging || !texture) return;
    
    const interval = setInterval(() => {
      setRotation(prev => prev + 0.15);
    }, 50);

    return () => clearInterval(interval);
  }, [isDragging, texture]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full min-h-[400px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden rounded-xl"
      style={{
        background: 'linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%)',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      data-testid="3d-preview"
    >
      {/* Product container with 3D transform */}
      <div 
        className="relative transition-transform duration-100"
        style={{
          transform: `perspective(1000px) rotateY(${rotation}deg) scale(${zoom})`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Base product image */}
        <img 
          src={baseImage}
          alt={`${modelType} preview`}
          className="max-h-[380px] w-auto object-contain drop-shadow-2xl"
          style={{
            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))',
          }}
        />
        
        {/* User's uploaded texture overlay */}
        {texture && (
          <div 
            className="absolute overflow-hidden"
            style={{
              top: texturePos.top,
              left: texturePos.left,
              width: texturePos.width,
              height: texturePos.height,
              borderRadius: texturePos.borderRadius,
              transform: texturePos.transform || 'none',
            }}
          >
            <img 
              src={texture}
              alt="Din design"
              className="w-full h-full object-cover"
              style={{
                mixBlendMode: 'multiply',
                opacity: 0.9,
              }}
            />
            {/* Subtle highlight overlay for realism */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)',
              }}
            />
          </div>
        )}
      </div>

      {/* Interaction hints */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <span className="inline-block px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm text-slate-600 shadow-md">
          {texture 
            ? 'Dra för att rotera • Scrolla för att zooma' 
            : 'Ladda upp en bild för att se den på produkten'
          }
        </span>
      </div>

      {/* Zoom indicator */}
      {zoom !== 1 && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 text-white text-xs rounded-full">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
};

export default ProductPreview3D;
