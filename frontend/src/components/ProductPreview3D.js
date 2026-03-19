import { useState, useEffect, useRef } from 'react';

// 3D Product Preview with CSS transforms and texture overlay
const ProductPreview3D = ({ modelType = 'mug', color = '#FFFFFF', productImage = null, texture = null }) => {
  const containerRef = useRef(null);
  const [rotation, setRotation] = useState({ x: -15, y: 25 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Product type configurations
  const productConfigs = {
    mug: {
      shape: 'cylinder',
      width: 180,
      height: 200,
      textureArea: { top: 30, height: 140, wrap: true }
    },
    tshirt: {
      shape: 'flat',
      width: 220,
      height: 260,
      textureArea: { top: 60, left: 60, width: 100, height: 100 }
    },
    hoodie: {
      shape: 'flat',
      width: 240,
      height: 280,
      textureArea: { top: 70, left: 70, width: 100, height: 100 }
    },
    poster: {
      shape: 'flat',
      width: 200,
      height: 280,
      textureArea: { top: 20, left: 20, width: 160, height: 240 }
    },
    phonecase: {
      shape: 'rounded',
      width: 120,
      height: 240,
      textureArea: { top: 20, left: 15, width: 90, height: 180 }
    },
    totebag: {
      shape: 'flat',
      width: 200,
      height: 240,
      textureArea: { top: 40, left: 40, width: 120, height: 120 }
    }
  };

  const config = productConfigs[modelType] || productConfigs.mug;

  // Mouse drag handlers for rotation
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastPosition.x;
    const deltaY = e.clientY - lastPosition.y;
    
    setRotation(prev => ({
      x: Math.max(-45, Math.min(45, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
    
    setLastPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Auto-rotate when not dragging
  useEffect(() => {
    if (isDragging) return;
    
    const interval = setInterval(() => {
      setRotation(prev => ({
        ...prev,
        y: prev.y + 0.3
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [isDragging]);

  const renderMug = () => (
    <div 
      className="mug-3d"
      style={{
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
        transformStyle: 'preserve-3d',
        width: config.width,
        height: config.height,
      }}
    >
      {/* Mug body - cylinder effect */}
      <div 
        className="mug-body"
        style={{
          width: config.width,
          height: config.height,
          background: `linear-gradient(90deg, 
            ${adjustColor(color, -30)} 0%, 
            ${color} 25%, 
            ${adjustColor(color, 20)} 50%, 
            ${color} 75%, 
            ${adjustColor(color, -30)} 100%)`,
          borderRadius: '50% / 10%',
          position: 'relative',
          boxShadow: 'inset 0 -20px 30px rgba(0,0,0,0.1), 0 10px 30px rgba(0,0,0,0.2)',
        }}
      >
        {/* Top rim */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%) rotateX(80deg)',
            width: config.width - 10,
            height: 30,
            background: `linear-gradient(180deg, ${adjustColor(color, 10)}, ${color})`,
            borderRadius: '50%',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)',
          }}
        />
        
        {/* Texture/Image overlay */}
        {texture && (
          <div 
            className="texture-wrap"
            style={{
              position: 'absolute',
              top: config.textureArea.top,
              left: '10%',
              width: '80%',
              height: config.textureArea.height,
              overflow: 'hidden',
              borderRadius: '50% / 5%',
            }}
          >
            <img 
              src={texture}
              alt="Design"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.95,
                mixBlendMode: 'multiply',
              }}
            />
          </div>
        )}
        
        {/* Handle */}
        <div 
          style={{
            position: 'absolute',
            right: -25,
            top: '30%',
            width: 25,
            height: 70,
            background: `linear-gradient(90deg, ${color}, ${adjustColor(color, -20)})`,
            borderRadius: '0 20px 20px 0',
            boxShadow: '3px 3px 10px rgba(0,0,0,0.2)',
            transform: 'rotateY(-20deg)',
          }}
        />
      </div>
    </div>
  );

  const renderTshirt = () => (
    <div 
      className="tshirt-3d"
      style={{
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
        transformStyle: 'preserve-3d',
        width: config.width,
        height: config.height,
      }}
    >
      <svg viewBox="0 0 220 260" width={config.width} height={config.height}>
        {/* T-shirt shape */}
        <path 
          d="M60 0 L0 50 L30 60 L30 260 L190 260 L190 60 L220 50 L160 0 L140 30 Q110 50 80 30 Z"
          fill={color}
          stroke={adjustColor(color, -30)}
          strokeWidth="2"
        />
        {/* Collar */}
        <ellipse cx="110" cy="25" rx="30" ry="15" fill={adjustColor(color, -10)} />
        
        {/* Texture/Image */}
        {texture && (
          <foreignObject x="60" y="60" width="100" height="100">
            <img 
              src={texture}
              alt="Design"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 4,
              }}
            />
          </foreignObject>
        )}
      </svg>
    </div>
  );

  const renderPoster = () => (
    <div 
      className="poster-3d"
      style={{
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
        transformStyle: 'preserve-3d',
        width: config.width,
        height: config.height,
        background: color,
        border: '8px solid #1a1a1a',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
      }}
    >
      {texture ? (
        <img 
          src={texture}
          alt="Design"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div className="text-slate-400 text-center">
          <p>Din design här</p>
        </div>
      )}
    </div>
  );

  const renderPhoneCase = () => (
    <div 
      className="phonecase-3d"
      style={{
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
        transformStyle: 'preserve-3d',
        width: config.width,
        height: config.height,
        background: `linear-gradient(135deg, ${color}, ${adjustColor(color, -20)})`,
        borderRadius: 20,
        boxShadow: '0 15px 30px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Camera cutout */}
      <div 
        style={{
          position: 'absolute',
          top: 15,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 50,
          height: 50,
          background: '#111',
          borderRadius: 10,
        }}
      />
      
      {/* Texture area */}
      {texture && (
        <div 
          style={{
            position: 'absolute',
            top: 80,
            left: 15,
            right: 15,
            bottom: 20,
            overflow: 'hidden',
            borderRadius: 10,
          }}
        >
          <img 
            src={texture}
            alt="Design"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}
    </div>
  );

  const renderHoodie = () => (
    <div 
      className="hoodie-3d"
      style={{
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
        transformStyle: 'preserve-3d',
        width: config.width,
        height: config.height,
      }}
    >
      <svg viewBox="0 0 240 280" width={config.width} height={config.height}>
        {/* Hoodie body */}
        <path 
          d="M50 60 L0 80 L20 90 L20 280 L220 280 L220 90 L240 80 L190 60 L170 40 Q120 20 70 40 Z"
          fill={color}
          stroke={adjustColor(color, -30)}
          strokeWidth="2"
        />
        {/* Hood */}
        <ellipse cx="120" cy="35" rx="50" ry="25" fill={adjustColor(color, -15)} />
        {/* Pocket */}
        <rect x="60" y="180" width="120" height="50" rx="5" fill={adjustColor(color, -10)} />
        
        {/* Texture/Image */}
        {texture && (
          <foreignObject x="70" y="70" width="100" height="100">
            <img 
              src={texture}
              alt="Design"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 4,
              }}
            />
          </foreignObject>
        )}
      </svg>
    </div>
  );

  const renderToteBag = () => (
    <div 
      className="totebag-3d"
      style={{
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
        transformStyle: 'preserve-3d',
        width: config.width,
        height: config.height,
      }}
    >
      <svg viewBox="0 0 200 240" width={config.width} height={config.height}>
        {/* Bag body */}
        <rect x="10" y="40" width="180" height="190" rx="5" fill={color} stroke={adjustColor(color, -30)} strokeWidth="2" />
        {/* Handles */}
        <path d="M50 40 Q50 10 80 10 L80 40" fill="none" stroke={adjustColor(color, -20)} strokeWidth="8" />
        <path d="M150 40 Q150 10 120 10 L120 40" fill="none" stroke={adjustColor(color, -20)} strokeWidth="8" />
        
        {/* Texture/Image */}
        {texture && (
          <foreignObject x="40" y="60" width="120" height="120">
            <img 
              src={texture}
              alt="Design"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 4,
              }}
            />
          </foreignObject>
        )}
      </svg>
    </div>
  );

  const renderProduct = () => {
    switch (modelType) {
      case 'mug': return renderMug();
      case 'tshirt': return renderTshirt();
      case 'hoodie': return renderHoodie();
      case 'poster': return renderPoster();
      case 'phonecase': return renderPhoneCase();
      case 'totebag': return renderToteBag();
      default: return renderMug();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full min-h-[400px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
        perspective: '1000px',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      data-testid="3d-preview"
    >
      {/* Floor reflection */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-20"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.05))',
        }}
      />
      
      {/* 3D Product */}
      <div 
        style={{
          transformStyle: 'preserve-3d',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        {renderProduct()}
      </div>

      {/* Interaction hint */}
      {!texture && (
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span className="inline-block px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm text-slate-600 shadow-md">
            Ladda upp en bild för att se den på produkten
          </span>
        </div>
      )}
    </div>
  );
};

// Helper function to adjust color brightness
function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

export default ProductPreview3D;
