import { useState, useEffect, useRef } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

// Product Preview with real product images and texture overlay
const ProductPreview3D = ({ 
  modelType = 'mug', 
  color = '#FFFFFF', 
  productImage = null, 
  texture = null,
  designConfig = null 
}) => {
  const containerRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  // Default design config
  const config = designConfig || {
    position_x: 50,
    position_y: 50,
    scale: 1,
    rotation: 0
  };

  // Product base images - using realistic product photos
  const productImages = {
    mug: 'https://static.prod-images.emergentagent.com/jobs/cd68a842-19ed-45bc-a36c-2389ae41c63e/images/5873ed5acaeb522542d8481578b5d918c617c0025ae609a5088862d7374e4318.png',
    tshirt: 'https://static.prod-images.emergentagent.com/jobs/cd68a842-19ed-45bc-a36c-2389ae41c63e/images/d60fb33f6192fec66526af917d04b6feb30e9199596ef2fe9dff6989050a50b9.png',
    hoodie: 'https://static.prod-images.emergentagent.com/jobs/cd68a842-19ed-45bc-a36c-2389ae41c63e/images/f87b9b809a4adfebf0b5999e3bbf45b194a60be0474d3fe7b92a066a1448d811.png',
    poster: 'https://static.prod-images.emergentagent.com/jobs/cd68a842-19ed-45bc-a36c-2389ae41c63e/images/f8098c64534fa9bcee11f896b75494d3de0342fa8e94566d05fe95c61d14bbc6.png',
    phonecase: 'https://static.prod-images.emergentagent.com/jobs/cd68a842-19ed-45bc-a36c-2389ae41c63e/images/85a45f02a7e9178632d56b673ee19b1c5ee40cbb0d3c4c37dd4c5ea35eaaf2e4.png',
    totebag: 'https://static.prod-images.emergentagent.com/jobs/cd68a842-19ed-45bc-a36c-2389ae41c63e/images/402ace3c28503c6ce3f64ec8a4a0aec70e0dbdc01db985f79f7ef08898bc5973.png',
    calendar: 'https://static.prod-images.emergentagent.com/jobs/cd68a842-19ed-45bc-a36c-2389ae41c63e/images/73ab1b12f8b3c2e29854c9bac9986efe2365b62e7046bef4f997ba996a49989a.png'
  };

  // Texture area bounds for each product (the printable area on the product)
  const textureAreas = {
    mug: { 
      top: 18, 
      left: 8, 
      width: 55, 
      height: 60,
      containerWidth: 55,
      containerHeight: 60
    },
    tshirt: { 
      top: 22, 
      left: 28, 
      width: 44, 
      height: 40,
      containerWidth: 44,
      containerHeight: 40
    },
    hoodie: { 
      top: 25, 
      left: 30, 
      width: 40, 
      height: 35,
      containerWidth: 40,
      containerHeight: 35
    },
    poster: { 
      top: 5, 
      left: 5, 
      width: 90, 
      height: 90,
      containerWidth: 90,
      containerHeight: 90
    },
    phonecase: { 
      top: 8, 
      left: 10, 
      width: 65, 
      height: 75,
      containerWidth: 65,
      containerHeight: 75
    },
    totebag: { 
      top: 20, 
      left: 22, 
      width: 56, 
      height: 50,
      containerWidth: 56,
      containerHeight: 50
    },
    calendar: { 
      top: 8, 
      left: 10, 
      width: 80, 
      height: 55,
      containerWidth: 80,
      containerHeight: 55
    }
  };

  const baseImage = productImages[modelType] || productImages.mug;
  const textureArea = textureAreas[modelType] || textureAreas.mug;

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

  const handleReset = () => {
    setRotation(0);
    setZoom(1);
  };

  const toggleAutoRotate = () => {
    setIsAutoRotating(prev => !prev);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Auto-rotation when enabled
  useEffect(() => {
    if (!isAutoRotating || isDragging) return;
    
    const interval = setInterval(() => {
      setRotation(prev => prev + 0.5);
    }, 30);

    return () => clearInterval(interval);
  }, [isAutoRotating, isDragging]);

  // Calculate image position within the printable area based on designConfig
  const getImageStyle = () => {
    const scale = config.scale || 1;
    const posX = config.position_x || 50;
    const posY = config.position_y || 50;
    const rot = config.rotation || 0;

    return {
      position: 'absolute',
      width: `${100 * scale}%`,
      height: `${100 * scale}%`,
      left: `${posX}%`,
      top: `${posY}%`,
      transform: `translate(-50%, -50%) rotate(${rot}deg)`,
      objectFit: 'contain',
      mixBlendMode: 'multiply',
      opacity: 0.9,
      borderRadius: '2px',
    };
  };

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
      {/* Control buttons */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <button
          onClick={toggleAutoRotate}
          className={`p-2 rounded-full shadow-md transition-all ${
            isAutoRotating 
              ? 'bg-primary text-white' 
              : 'bg-white/90 text-slate-600 hover:bg-white'
          }`}
          title={isAutoRotating ? 'Stoppa rotation' : 'Starta rotation'}
          data-testid="toggle-rotation-btn"
        >
          {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={handleReset}
          className="p-2 rounded-full bg-white/90 text-slate-600 hover:bg-white shadow-md transition-all"
          title="Återställ vy"
          data-testid="reset-view-btn"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

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
        
        {/* Printable area container - clips the user's image */}
        {texture && (
          <div 
            className="absolute overflow-hidden"
            style={{
              top: `${textureArea.top}%`,
              left: `${textureArea.left}%`,
              width: `${textureArea.width}%`,
              height: `${textureArea.height}%`,
              borderRadius: '2%',
            }}
          >
            {/* User's uploaded image with position/scale/rotation from designConfig */}
            <img 
              src={texture}
              alt="Din design"
              style={getImageStyle()}
            />
            {/* Subtle highlight overlay for realism */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: modelType === 'mug' 
                  ? 'linear-gradient(90deg, rgba(0,0,0,0.08) 0%, rgba(255,255,255,0.12) 30%, transparent 50%, rgba(0,0,0,0.06) 85%, rgba(0,0,0,0.12) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.08) 100%)',
                borderRadius: modelType === 'mug' ? '8% / 2%' : '2%',
              }}
            />
          </div>
        )}
      </div>

      {/* Interaction hints */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <span className="inline-block px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm text-slate-600 shadow-md">
          {texture 
            ? 'Använd Justera-fliken för att positionera bilden' 
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
