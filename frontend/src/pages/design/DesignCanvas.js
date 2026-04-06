const DesignCanvas = ({ canvasRef, designConfig, imagePreview, backgroundColor }) => (
  <div className="bg-white rounded-xl p-6 shadow-soft mt-6">
    <h3 className="font-semibold text-slate-900 mb-4">Design-yta</h3>
    <div
      ref={canvasRef}
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
          className="absolute left-1/2 bottom-8 transform -translate-x-1/2"
          style={{
            fontFamily: designConfig.text_font,
            color: designConfig.text_color,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
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

export default DesignCanvas;
