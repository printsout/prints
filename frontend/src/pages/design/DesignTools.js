import {
  Upload, RotateCcw, Type, Trash2, Palette, Move, ZoomIn
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Slider } from '../../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const FONTS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Comic Sans MS', label: 'Comic Sans' },
  { value: 'Impact', label: 'Impact' }
];

const COLOR_HEX_MAP = {
  'Vit': '#FFFFFF', 'Svart': '#1a1a1a', 'Grå': '#6b7280',
  'Beige': '#d4c4a8', 'Marinblå': '#1e3a5f', 'Naturvit': '#f5f5dc', 'Transparent': '#e5e5e5'
};

export { COLOR_HEX_MAP };

const DesignTools = ({
  activeTab, setActiveTab, designConfig, onConfigChange, imagePreview,
  uploadedImage, onClearImage, onReset, getRootProps, getInputProps, isDragActive,
  product, selectedColor, setSelectedColor, selectedSize, setSelectedSize
}) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-soft">
      {/* Tabs */}
      <div className="flex border-b mb-6">
        {[
          { id: 'upload', label: 'Ladda upp', icon: Upload },
          { id: 'adjust', label: 'Justera', icon: Move },
          { id: 'text', label: 'Text', icon: Type },
          { id: 'color', label: 'Färg', icon: Palette }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'upload' && <UploadTab designConfig={designConfig} onConfigChange={onConfigChange} imagePreview={imagePreview} uploadedImage={uploadedImage} onClearImage={onClearImage} getRootProps={getRootProps} getInputProps={getInputProps} isDragActive={isDragActive} />}
      {activeTab === 'adjust' && <AdjustTab designConfig={designConfig} onConfigChange={onConfigChange} imagePreview={imagePreview} onReset={onReset} />}
      {activeTab === 'text' && <TextTab designConfig={designConfig} onConfigChange={onConfigChange} />}
      {activeTab === 'color' && <ColorTab designConfig={designConfig} onConfigChange={onConfigChange} product={product} selectedColor={selectedColor} setSelectedColor={setSelectedColor} selectedSize={selectedSize} setSelectedSize={setSelectedSize} />}
    </div>
  );
};

const UploadTab = ({ designConfig, onConfigChange, imagePreview, uploadedImage, onClearImage, getRootProps, getInputProps, isDragActive }) => (
  <div className="space-y-4">
    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} data-testid="dropzone">
      <input {...getInputProps()} data-testid="file-input" />
      <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
      <p className="text-slate-600 font-medium">{isDragActive ? 'Släpp bilden här' : 'Dra och släpp din bild här'}</p>
      <p className="text-sm text-slate-400 mt-2">eller klicka för att välja fil</p>
      <p className="text-xs text-slate-400 mt-4">JPG, PNG, GIF &bull; Max 10MB</p>
    </div>
    {imagePreview && (
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
        <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-700">Bild uppladdad</p>
          <p className="text-xs text-slate-500">{uploadedImage?.name}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClearImage} data-testid="clear-image"><Trash2 className="w-4 h-4 text-red-500" /></Button>
      </div>
    )}
    <div className="mt-6 pt-6 border-t border-slate-200">
      <label className="block text-sm font-medium text-slate-700 mb-2">Placeringsönskemål (valfritt)</label>
      <textarea value={designConfig.placement_notes} onChange={(e) => onConfigChange('placement_notes', e.target.value)} placeholder="Beskriv var du vill ha bilden..." className="w-full p-3 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" rows={3} data-testid="placement-notes" />
      <p className="text-xs text-slate-400 mt-1">Skriv eventuella önskemål om bildplacering</p>
    </div>
  </div>
);

const AdjustTab = ({ designConfig, onConfigChange, imagePreview, onReset }) => (
  <div className="space-y-6">
    {imagePreview && (
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Beskärningsförhandsvisning</label>
        <div className="relative w-full aspect-square bg-slate-100 rounded-lg overflow-hidden border-2 border-dashed border-slate-300" data-testid="crop-preview">
          <img src={imagePreview} alt="Beskärning" className="absolute" style={{ width: `${designConfig.scale * 100}%`, height: `${designConfig.scale * 100}%`, left: `${designConfig.position_x}%`, top: `${designConfig.position_y}%`, transform: `translate(-50%, -50%) rotate(${designConfig.rotation}deg)`, objectFit: 'cover' }} />
          <div className="absolute inset-0 border-4 border-primary/50 pointer-events-none" />
          <div className="absolute bottom-2 left-2 right-2 text-center"><span className="text-xs bg-black/60 text-white px-2 py-1 rounded">Detta område visas på produkten</span></div>
        </div>
      </div>
    )}
    {!imagePreview && <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">Ladda upp en bild först för att kunna justera den</div>}
    <SliderControl label="Position X (vänster/höger)" value={designConfig.position_x} unit="%" onChange={(v) => onConfigChange('position_x', v)} min={0} max={100} step={1} disabled={!imagePreview} testId="slider-position-x" />
    <SliderControl label="Position Y (upp/ner)" value={designConfig.position_y} unit="%" onChange={(v) => onConfigChange('position_y', v)} min={0} max={100} step={1} disabled={!imagePreview} testId="slider-position-y" />
    <SliderControl label="Storlek (zoom)" value={Math.round(designConfig.scale * 100)} unit="%" onChange={(v) => onConfigChange('scale', v / 100)} min={50} max={300} step={5} disabled={!imagePreview} icon={<ZoomIn className="w-4 h-4" />} testId="slider-scale" />
    <SliderControl label="Rotation" value={designConfig.rotation} unit="°" onChange={(v) => onConfigChange('rotation', v)} min={-180} max={180} step={5} disabled={!imagePreview} icon={<RotateCcw className="w-4 h-4" />} testId="slider-rotation" />
    <Button variant="outline" className="w-full" onClick={onReset} disabled={!imagePreview} data-testid="reset-adjustments"><RotateCcw className="w-4 h-4 mr-2" />Återställ</Button>
  </div>
);

const SliderControl = ({ label, value, unit, onChange, min, max, step, disabled, icon, testId }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">{icon}{label}</label>
      <span className="text-sm text-slate-500">{value}{unit}</span>
    </div>
    <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} disabled={disabled} data-testid={testId} />
  </div>
);

const TextTab = ({ designConfig, onConfigChange }) => (
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Text</label>
      <Input value={designConfig.text} onChange={(e) => onConfigChange('text', e.target.value)} placeholder="Skriv din text här..." data-testid="text-input" />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Typsnitt</label>
      <Select value={designConfig.text_font} onValueChange={(value) => onConfigChange('text_font', value)}>
        <SelectTrigger data-testid="font-select"><SelectValue /></SelectTrigger>
        <SelectContent>
          {FONTS.map((font) => <SelectItem key={font.value} value={font.value}><span style={{ fontFamily: font.value }}>{font.label}</span></SelectItem>)}
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Textfärg</label>
      <div className="flex items-center gap-3">
        <input type="color" value={designConfig.text_color} onChange={(e) => onConfigChange('text_color', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" data-testid="text-color-picker" />
        <Input value={designConfig.text_color} onChange={(e) => onConfigChange('text_color', e.target.value)} className="flex-1" />
      </div>
    </div>
  </div>
);

const ColorTab = ({ designConfig, onConfigChange, product, selectedColor, setSelectedColor, selectedSize, setSelectedSize }) => (
  <div className="space-y-6">
    {product?.colors?.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">Produktfärg</label>
        <div className="flex flex-wrap gap-3">
          {product.colors.map((color) => (
            <button key={color} onClick={() => setSelectedColor(color)} className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color ? 'border-primary scale-110' : 'border-slate-200 hover:border-slate-400'}`} style={{ backgroundColor: COLOR_HEX_MAP[color] || '#ddd' }} title={color} data-testid={`product-color-${color}`} />
          ))}
        </div>
      </div>
    )}
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Bakgrundsfärg (design-yta)</label>
      <div className="flex items-center gap-3">
        <input type="color" value={designConfig.background_color} onChange={(e) => onConfigChange('background_color', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" data-testid="bg-color-picker" />
        <Input value={designConfig.background_color} onChange={(e) => onConfigChange('background_color', e.target.value)} className="flex-1" />
      </div>
    </div>
    {product?.sizes?.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Storlek</label>
        <Select value={selectedSize} onValueChange={setSelectedSize}>
          <SelectTrigger data-testid="editor-size-select"><SelectValue placeholder="Välj storlek" /></SelectTrigger>
          <SelectContent>{product.sizes.map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    )}
  </div>
);

export default DesignTools;
