import { useRef } from 'react';
import { Upload, Trash2 } from 'lucide-react';

export function ImageSlot({ image, slotIndex, pageIndex, onUpload, onRemove, caption, onCaptionChange }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpload(pageIndex, slotIndex, ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (image) {
    return (
      <div className="relative w-full h-full group flex flex-col">
        <div className="relative flex-1 min-h-0">
          <img src={image} alt="" className="w-full h-full object-cover" />
          {caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
              <p className="text-white text-xs font-medium text-center drop-shadow-md leading-tight">{caption}</p>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(pageIndex, slotIndex); }}
            className="absolute top-1.5 right-1.5 p-1.5 bg-red-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            data-testid={`remove-img-${pageIndex}-${slotIndex}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <input
          type="text"
          value={caption || ''}
          onChange={(e) => onCaptionChange(pageIndex, slotIndex, e.target.value)}
          placeholder="Skriv bildtext..."
          maxLength={80}
          className="w-full px-2 py-1.5 text-xs border-t border-slate-200 bg-slate-50 focus:outline-none focus:bg-white placeholder:text-slate-300"
          onClick={(e) => e.stopPropagation()}
          data-testid={`caption-${pageIndex}-${slotIndex}`}
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors border border-dashed border-slate-300 rounded"
      data-testid={`slot-${pageIndex}-${slotIndex}`}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <Upload className="w-5 h-5 text-slate-400 mb-1" />
      <span className="text-xs text-slate-400">Lägg till bild</span>
    </div>
  );
}
