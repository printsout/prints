import { Upload, Trash2 } from 'lucide-react';
import { COVER_MATERIALS } from './constants';

export function CoverEditor({ coverImage, setCoverImage, coverText, setCoverText, coverMaterial, setCoverMaterial, coverInputRef, handleCoverUpload }) {
  return (
    <>
      <div className="bg-white rounded-xl border overflow-hidden" data-testid="cover-editor">
        <div className="px-4 py-3 border-b bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-700">Designa albumets omslag</h3>
          <p className="text-xs text-slate-400">Ladda upp en bild och lägg till text på framsidan</p>
        </div>
        <div className="aspect-[3/4] bg-gradient-to-b from-slate-100 to-slate-50 flex items-center justify-center relative">
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          {coverImage ? (
            <div className="relative w-full h-full group">
              <img src={coverImage} alt="Omslag" className="w-full h-full object-cover" />
              {coverText && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 py-8">
                  <p className="text-white text-2xl font-bold text-center drop-shadow-lg">{coverText}</p>
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => coverInputRef.current?.click()} className="p-2 bg-white/90 text-slate-700 rounded-lg shadow-md hover:bg-white transition-colors" data-testid="change-cover-image">
                  <Upload className="w-4 h-4" />
                </button>
                <button onClick={() => setCoverImage(null)} className="p-2 bg-red-500/90 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors" data-testid="remove-cover-image">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div onClick={() => coverInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors" data-testid="cover-upload-area">
              <div className="w-20 h-20 rounded-full bg-[#2a9d8f]/10 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-[#2a9d8f]" />
              </div>
              <p className="text-base font-semibold text-slate-700">Ladda upp omslagsbild</p>
              <p className="text-sm text-slate-400 mt-1">Klicka för att välja en bild</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4" data-testid="cover-text-section">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Text på omslaget (valfritt)</h3>
        <input
          type="text"
          value={coverText}
          onChange={(e) => setCoverText(e.target.value)}
          placeholder="T.ex. Familjen Andersson 2026"
          maxLength={50}
          className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]"
          data-testid="cover-text-input"
        />
        <p className="text-xs text-slate-400 mt-1">Visas längst ner på omslaget</p>
      </div>

      <div className="bg-white rounded-xl border p-4" data-testid="cover-material-section">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Välj omslagsmaterial</h3>
        <div className="space-y-2">
          {COVER_MATERIALS.map(mat => (
            <button
              key={mat.id}
              onClick={() => setCoverMaterial(mat.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                coverMaterial === mat.id ? 'border-[#2a9d8f] bg-[#2a9d8f]/5' : 'border-slate-200 hover:border-slate-300'
              }`}
              data-testid={`cover-material-${mat.id}`}
            >
              <div className={`w-10 h-10 rounded-lg flex-shrink-0 ${
                mat.id === 'hardpaper' ? 'bg-amber-100 border border-amber-200' :
                mat.id === 'fabric' ? 'bg-slate-200 border border-slate-300' :
                'bg-stone-800 border border-stone-700'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{mat.label}</p>
                <p className="text-xs text-slate-400">{mat.desc}</p>
              </div>
              <span className="text-sm font-semibold text-slate-600 flex-shrink-0">
                {mat.price === 0 ? 'Ingår' : `+${mat.price} kr`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
