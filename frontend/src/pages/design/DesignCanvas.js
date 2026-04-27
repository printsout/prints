import { useRef, useCallback } from 'react';
import { Download } from 'lucide-react';

const DesignCanvas = ({ canvasRef, designConfig, imagePreview, backgroundColor }) => {
  const innerRef = useRef(null);
  const actualRef = canvasRef || innerRef;

  const handleDownload = useCallback(async () => {
    const el = actualRef.current;
    if (!el) return;

    // Create an offscreen canvas matching the design area
    const canvas = document.createElement('canvas');
    const size = 1200; // High-res export
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Draw image if exists
    if (imagePreview) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imagePreview;
        });

        const scale = designConfig.scale || 1;
        const imgW = img.width * scale;
        const imgH = img.height * scale;
        const maxDim = size * 0.8;
        const ratio = Math.min(maxDim / imgW, maxDim / imgH);
        const drawW = imgW * ratio;
        const drawH = imgH * ratio;

        const posX = (designConfig.position_x / 100) * size;
        const posY = (designConfig.position_y / 100) * size;

        ctx.save();
        ctx.translate(posX, posY);
        ctx.rotate((designConfig.rotation || 0) * Math.PI / 180);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      } catch {
        // Image failed to load
      }
    }

    // Draw text if exists
    if (designConfig.text) {
      const fontSize = Math.round(size * 0.05);
      ctx.font = `bold ${fontSize}px ${designConfig.text_font || 'Arial'}`;
      ctx.fillStyle = designConfig.text_color || '#000000';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetY = 1;
      ctx.fillText(designConfig.text, size / 2, size - fontSize * 1.5);
    }

    // Download
    const link = document.createElement('a');
    link.download = `design_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [actualRef, imagePreview, designConfig, backgroundColor]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-soft mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Design-yta</h3>
        {(imagePreview || designConfig.text) && (
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a9d8f] hover:bg-[#238b7e] text-white text-sm font-medium transition-colors"
            data-testid="download-design"
          >
            <Download className="w-4 h-4" />
            Ladda ner bild
          </button>
        )}
      </div>
      <div
        ref={actualRef}
        className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-slate-200"
        style={{ backgroundColor }}
        data-testid="design-canvas"
      >
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Design"
            className="absolute"
            style={{
              left: `${designConfig.position_x}%`,
              top: `${designConfig.position_y}%`,
              transform: `translate(-50%, -50%) scale(${designConfig.scale}) rotate(${designConfig.rotation}deg)`,
              maxWidth: '80%',
              maxHeight: '80%',
              objectFit: 'contain'
            }}
          />
        )}
        {designConfig.text && (
          <div
            className="absolute left-1/2 bottom-8 transform -translate-x-1/2 whitespace-nowrap"
            style={{
              fontFamily: designConfig.text_font,
              color: designConfig.text_color,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
            data-testid="canvas-text"
          >
            {designConfig.text}
          </div>
        )}
        {!imagePreview && !designConfig.text && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            Ladda upp en bild för att börja
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignCanvas;
