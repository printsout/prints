import { BookOpen, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { DEFAULT_PAGES, MIN_PAGES, MAX_PAGES, COVER_MATERIALS, getPageImageCount } from './constants';

export function AlbumSidebar({
  product, coverImage, pages, selectedSize, setSelectedSize,
  quantity, setQuantity, coverMaterial, basePrice, extraPageCost,
  materialCost, totalPerItem, getTotalImages, handleAddToCart,
  addPages, removeLastPages, editMode, saveDesignSlot,
}) {
  return (
    <div className="space-y-4 lg:sticky lg:top-4 self-start">
      {/* Product info */}
      <div className="bg-white rounded-xl border p-5" data-testid="product-info">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-6 h-6 text-[#2a9d8f]" />
          <h2 className="text-lg font-bold text-slate-900">{product.name}</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">{product.description}</p>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">Omslag</span>
            <span className={`font-semibold ${coverImage ? 'text-[#2a9d8f]' : 'text-slate-400'}`}>
              {coverImage ? 'Klar' : 'Ej tillagd'}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">Sidor med bilder</span>
            <span className="font-semibold text-slate-900" data-testid="upload-count">
              {pages.filter(p => getPageImageCount(p) > 0).length} / {pages.length}
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2a9d8f] transition-all duration-300 rounded-full"
              style={{ width: `${(pages.filter(p => getPageImageCount(p) > 0).length / pages.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{getTotalImages()} bilder totalt</p>
        </div>
      </div>

      {/* Pages & Size */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Antal sidor</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={removeLastPages}
              disabled={pages.length <= MIN_PAGES}
              className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 transition-colors"
              data-testid="decrease-pages"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-lg w-12 text-center" data-testid="page-count">{pages.length}</span>
            <button
              onClick={() => addPages(2)}
              disabled={pages.length >= MAX_PAGES}
              className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 transition-colors"
              data-testid="increase-pages"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Min {MIN_PAGES}, Max {MAX_PAGES} sidor</p>
          {extraPageCost > 0 && <p className="text-xs text-[#2a9d8f] mt-1">+{extraPageCost} kr för extra sidor</p>}
        </div>

        {product.sizes?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Storlek</h3>
            <div className="grid grid-cols-2 gap-2">
              {product.sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedSize === size ? 'border-[#2a9d8f] bg-[#2a9d8f]/5 text-[#2a9d8f]' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  data-testid={`size-${size}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quantity + Price */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between py-2 border-b mb-3">
          <span className="text-sm text-slate-600">Antal</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors" data-testid="qty-minus">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold w-8 text-center" data-testid="qty-value">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors" data-testid="qty-plus">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Grundpris ({DEFAULT_PAGES} sidor)</span>
            <span className="text-slate-700">{basePrice} kr</span>
          </div>
          {extraPageCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Extra sidor ({pages.length - DEFAULT_PAGES} st)</span>
              <span className="text-slate-700">+{extraPageCost} kr</span>
            </div>
          )}
          {materialCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{COVER_MATERIALS.find(m => m.id === coverMaterial)?.label}</span>
              <span className="text-slate-700">+{materialCost} kr</span>
            </div>
          )}
          {quantity > 1 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">x {quantity} st</span>
              <span className="text-slate-700">{totalPerItem * quantity} kr</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-4 pt-2 border-t">
          <span className="text-sm font-medium text-slate-700">Totalt</span>
          <span className="text-xl font-bold text-slate-900" data-testid="total-price">{totalPerItem * quantity} kr</span>
        </div>

        <Button className="w-full bg-[#2a9d8f] hover:bg-[#238b7e] h-12 text-base" onClick={handleAddToCart} disabled={getTotalImages() === 0} data-testid="add-album-to-cart">
          <ShoppingCart className="w-5 h-5 mr-2" />{editMode ? 'Spara ändringar' : 'Lägg i kundvagn'}
        </Button>

        {saveDesignSlot && <div className="mt-2">{saveDesignSlot}</div>}

        {getTotalImages() === 0 && (
          <p className="text-xs text-slate-400 text-center mt-2">Lägg till minst en bild för att fortsätta</p>
        )}
      </div>

      {/* Tips */}
      <div className="bg-[#2a9d8f]/5 rounded-xl border border-[#2a9d8f]/20 p-4">
        <h4 className="text-sm font-semibold text-[#2a9d8f] mb-2">Tips</h4>
        <ul className="text-xs text-slate-600 space-y-1.5">
          <li>Välj sidlayout för att lägga till 1-4 bilder per sida</li>
          <li>Klicka på ett tomt fält för att ladda upp en bild</li>
          <li>Hovra över en bild för att ta bort den</li>
          <li>Extra sidor kostar 5 kr / sida utöver {DEFAULT_PAGES} grundsidor</li>
        </ul>
      </div>
    </div>
  );
}
