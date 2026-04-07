import { Input } from '../../components/ui/input';
import { Upload, X, Image as ImageIcon, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PAGE_TYPES, nextItemId, makeProduct, makeGallery, makeTextPage } from './catalogConstants';

const ProductItemEditor = ({ item, index, onChange, onRemove, onImageUpload }) => (
  <div className="bg-slate-50 rounded-xl p-4 space-y-3" data-testid={`product-item-${index}`}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Produkt {index + 1}</span>
      <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
    <div className="relative">
      {item.image ? (
        <div className="relative w-full h-28 rounded-lg overflow-hidden bg-slate-100">
          <img src={item.image} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange({ ...item, image: null })}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={onImageUpload}
          className="w-full h-28 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] flex flex-col items-center justify-center gap-1 transition-colors">
          <Upload className="w-5 h-5 text-slate-400" />
          <span className="text-xs text-slate-400">Ladda upp bild</span>
        </button>
      )}
    </div>
    <Input placeholder="Produktnamn" value={item.name} onChange={e => onChange({ ...item, name: e.target.value })} className="text-sm h-9" data-testid={`product-name-${index}`} />
    <Input placeholder="Kort beskrivning" value={item.desc} onChange={e => onChange({ ...item, desc: e.target.value })} className="text-sm h-9" />
    <Input placeholder="Pris (kr)" value={item.price} onChange={e => onChange({ ...item, price: e.target.value })} className="text-sm h-9" />
  </div>
);

export const PageEditor = ({ currentPage, activePage, pages, updatePage, removePage, triggerImageUpload, contentPageTypes }) => {
  if (!currentPage) return null;

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            {PAGE_TYPES.find(t => t.id === currentPage?.type)?.name || 'Sida'} — Sida {activePage + 1}
          </h3>
          {activePage > 0 && activePage < pages.length - 1 && (
            <button type="button" onClick={() => removePage(activePage)}
              className="text-xs text-red-500 hover:text-red-600 font-medium" data-testid="remove-page-btn">
              Ta bort
            </button>
          )}
        </div>
        {activePage > 0 && activePage < pages.length - 1 && (
          <div className="flex gap-1 mt-3">
            {contentPageTypes.map(t => (
              <button key={t.id} type="button"
                onClick={() => {
                  const makers = { product: makeProduct, gallery: makeGallery, text: makeTextPage };
                  if (currentPage?.type !== t.id) updatePage(activePage, makers[t.id]());
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${currentPage?.type === t.id ? 'bg-[#2a9d8f]/10 text-[#2a9d8f]' : 'text-slate-500 hover:bg-slate-50'}`}
                data-testid={`change-type-${t.id}`}>
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content editors */}
      <div className="flex-1 p-4 space-y-4" data-testid="page-editor-controls">
        {currentPage?.type === 'cover' && (
          <CoverEditor page={currentPage} activePage={activePage} updatePage={updatePage} triggerImageUpload={triggerImageUpload} />
        )}
        {currentPage?.type === 'product' && (
          <ProductPageEditor page={currentPage} activePage={activePage} updatePage={updatePage} triggerImageUpload={triggerImageUpload} />
        )}
        {currentPage?.type === 'gallery' && (
          <GalleryEditor page={currentPage} activePage={activePage} updatePage={updatePage} triggerImageUpload={triggerImageUpload} />
        )}
        {currentPage?.type === 'text' && (
          <TextEditor page={currentPage} activePage={activePage} updatePage={updatePage} />
        )}
        {currentPage?.type === 'backcover' && (
          <BackCoverEditor page={currentPage} activePage={activePage} updatePage={updatePage} />
        )}
      </div>
    </div>
  );
};

const CoverEditor = ({ page, activePage, updatePage, triggerImageUpload }) => (
  <>
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">Titel</label>
      <Input value={page.title} onChange={e => updatePage(activePage, { title: e.target.value })} className="h-9 text-sm" data-testid="cover-title" />
    </div>
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">Undertitel</label>
      <Input value={page.subtitle} onChange={e => updatePage(activePage, { subtitle: e.target.value })} className="h-9 text-sm" data-testid="cover-subtitle" />
    </div>
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">Bakgrundsbild (valfritt)</label>
      {page.bgImage ? (
        <div className="relative h-24 rounded-lg overflow-hidden">
          <img src={page.bgImage} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={() => updatePage(activePage, { bgImage: null })}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center"><X className="w-3 h-3" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => triggerImageUpload(activePage, 'cover')}
          className="w-full h-24 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] flex items-center justify-center gap-2 text-sm text-slate-500 transition-colors" data-testid="cover-bg-upload">
          <Upload className="w-4 h-4" /> Ladda upp
        </button>
      )}
    </div>
  </>
);

const ProductPageEditor = ({ page, activePage, updatePage, triggerImageUpload }) => (
  <>
    {(page.items || []).map((item, i) => (
      <ProductItemEditor
        key={item.id || `item-${i}`} item={item} index={i}
        onChange={(updated) => {
          const items = [...(page.items || [])];
          items[i] = updated;
          updatePage(activePage, { items });
        }}
        onRemove={() => {
          if ((page.items || []).length <= 1) { toast.error('Minst en produkt per sida'); return; }
          updatePage(activePage, { items: page.items.filter((_, j) => j !== i) });
        }}
        onImageUpload={() => triggerImageUpload(activePage, 'product', i)}
      />
    ))}
    {(page.items || []).length < 6 && (
      <button type="button"
        onClick={() => updatePage(activePage, { items: [...(page.items || []), { id: nextItemId(), image: null, name: '', desc: '', price: '' }] })}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] text-sm font-medium text-slate-500 hover:text-[#2a9d8f] flex items-center justify-center gap-1.5 transition-colors"
        data-testid="add-product-btn">
        <Plus className="w-4 h-4" /> Lägg till produkt
      </button>
    )}
  </>
);

const GalleryEditor = ({ page, activePage, updatePage, triggerImageUpload }) => (
  <>
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">Rubrik</label>
      <Input value={page.title || ''} onChange={e => updatePage(activePage, { title: e.target.value })} className="h-9 text-sm" data-testid="gallery-title" />
    </div>
    <div className="grid grid-cols-2 gap-2">
      {(page.images || []).map((img, i) => (
        <div key={`gal-slot-${i}`}>
          {img ? (
            <div className="relative h-24 rounded-lg overflow-hidden">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => {
                const images = [...(page.images || [])];
                images[i] = null;
                updatePage(activePage, { images });
              }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => triggerImageUpload(activePage, 'gallery', i)}
              className="w-full h-24 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] flex flex-col items-center justify-center gap-1 transition-colors"
              data-testid={`gallery-img-${i}`}>
              <ImageIcon className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] text-slate-400">Bild {i + 1}</span>
            </button>
          )}
          <Input placeholder={`Text ${i + 1}`} value={(page.captions || [])[i] || ''}
            onChange={e => {
              const captions = [...(page.captions || [])];
              captions[i] = e.target.value;
              updatePage(activePage, { captions });
            }}
            className="h-7 text-xs mt-1" />
        </div>
      ))}
    </div>
  </>
);

const TextEditor = ({ page, activePage, updatePage }) => (
  <>
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">Rubrik</label>
      <Input value={page.title || ''} onChange={e => updatePage(activePage, { title: e.target.value })} className="h-9 text-sm" data-testid="text-title" />
    </div>
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">Brödtext</label>
      <textarea value={page.body || ''} onChange={e => updatePage(activePage, { body: e.target.value })}
        rows={8} className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/50 resize-none" data-testid="text-body"
        placeholder="Skriv din text här..." />
    </div>
  </>
);

const BackCoverEditor = ({ page, activePage, updatePage }) => (
  <div className="space-y-3">
    {[
      { key: 'companyName', label: 'Företagsnamn', placeholder: 'Företagsnamn AB' },
      { key: 'phone', label: 'Telefon', placeholder: '08-123 45 67' },
      { key: 'email', label: 'E-post', placeholder: 'info@foretag.se' },
      { key: 'website', label: 'Webbplats', placeholder: 'www.foretag.se' },
      { key: 'address', label: 'Adress', placeholder: 'Storgatan 1, 111 22 Stockholm' },
    ].map(f => (
      <div key={f.key}>
        <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
        <Input value={page[f.key] || ''} onChange={e => updatePage(activePage, { [f.key]: e.target.value })} placeholder={f.placeholder} className="h-9 text-sm" data-testid={`back-${f.key}`} />
      </div>
    ))}
  </div>
);
