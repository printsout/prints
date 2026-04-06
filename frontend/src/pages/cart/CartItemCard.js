import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';

export function CartItemCard({ item, product, loading, onQuantityChange, onRemove }) {
  const itemPrice = item.price || product.price;

  const getThumbUrl = () => {
    if (item.design_preview) {
      return item.design_preview.startsWith('/api')
        ? `${process.env.REACT_APP_BACKEND_URL}${item.design_preview}`
        : item.design_preview;
    }
    return item.image || product.images?.[0];
  };
  const thumbUrl = getThumbUrl();

  return (
    <div className="bg-white rounded-xl p-6 shadow-soft flex gap-6" data-testid={`cart-item-${item.cart_item_id}`}>
      <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-100">
        <img src={thumbUrl} alt={item.name || product.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1">
        <Link to={`/produkt/${product.product_id}`} className="font-semibold text-slate-900 hover:text-primary">
          {item.name || product.name}
        </Link>
        <div className="text-sm text-slate-500 mt-1 space-x-3">
          {item.color && <span>Färg: {item.color}</span>}
          {item.size && <span>Storlek: {item.size}</span>}
        </div>
        {item.customization && (
          <div className="mt-1.5 space-y-0.5">
            {item.customization.type === 'nametag' && item.customization.child_name && (
              <span className="inline-block text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded mr-1">
                Namn: {item.customization.child_name}
              </span>
            )}
            {item.customization.type === 'calendar' && (
              <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded mr-1">
                Kalender {item.customization.year} — {item.customization.images_count} bilder
              </span>
            )}
            {item.customization.type === 'photoalbum' && (
              <span className="inline-block text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded mr-1">
                Album — {item.customization.total_pages} sidor, {item.customization.total_images} bilder
              </span>
            )}
            {item.customization.type === 'design' && (
              <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mr-1">
                Med egen design
              </span>
            )}
          </div>
        )}
        {!item.customization && item.design_preview && (
          <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-2">Med egen design</span>
        )}
        <p className="text-primary font-semibold mt-2">{itemPrice} kr</p>
      </div>

      <div className="flex flex-col items-end justify-between">
        <button onClick={() => onRemove(item.cart_item_id)} className="text-slate-400 hover:text-red-500 transition-colors" data-testid={`remove-item-${item.cart_item_id}`}>
          <Trash2 className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onQuantityChange(item.cart_item_id, (item.quantity || 1) - 1)}
            className="w-8 h-8 rounded-full border border-slate-200 hover:border-primary flex items-center justify-center transition-colors"
            disabled={loading || (item.quantity || 1) <= 1}
            data-testid={`decrease-${item.cart_item_id}`}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-medium w-6 text-center">{item.quantity || 1}</span>
          <button
            onClick={() => onQuantityChange(item.cart_item_id, (item.quantity || 1) + 1)}
            className="w-8 h-8 rounded-full border border-slate-200 hover:border-primary flex items-center justify-center transition-colors"
            disabled={loading}
            data-testid={`increase-${item.cart_item_id}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
