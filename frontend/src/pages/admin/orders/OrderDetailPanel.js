import { useMemo } from 'react';
import { Download, Package, Printer, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const downloadAllImages = (item, toast) => {
  const urls = item.customization?.pages?.flatMap(pg => pg.image_urls || []) || [];
  if (urls.length === 0) { toast.error('Inga bilder att ladda ner'); return; }
  urls.forEach((url, i) => {
    const a = document.createElement('a');
    a.href = `${API_BASE}${url}`;
    a.download = `sida-${i + 1}${url.substring(url.lastIndexOf('.'))}`;
    a.target = '_blank';
    document.body.appendChild(a);
    setTimeout(() => { a.click(); document.body.removeChild(a); }, i * 300);
  });
  toast.success(`Laddar ner ${urls.length} bilder...`);
};

const OrderDetailPanel = ({ selectedOrder, onUpdateStatus, onPrint, onDelete, toast }) => {
  if (!selectedOrder) {
    return (
      <div className="text-center text-slate-500 py-8">
        <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p>Välj en order för att se detaljer</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Orderdetaljer</h3>
          <p className="text-sm text-slate-500 font-mono">#{selectedOrder.order_id}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPrint(selectedOrder)}
          data-testid="print-selected-order"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          Skriv ut
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(selectedOrder.order_id)}
          className="text-red-500 hover:text-red-700 hover:border-red-300"
          data-testid="delete-selected-order"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Ta bort
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-500 uppercase">Kund</p>
          <p className="text-sm font-medium text-slate-900">
            {selectedOrder.shipping_address?.name || (selectedOrder.shipping_address?.first_name ? `${selectedOrder.shipping_address.first_name} ${selectedOrder.shipping_address.last_name || ''}`.trim() : '\u2014')}
          </p>
          <p className="text-sm text-slate-600">{selectedOrder.email}</p>
          {selectedOrder.shipping_address?.phone && (
            <p className="text-sm text-slate-600">Tel: {selectedOrder.shipping_address.phone}</p>
          )}
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase">Leveransadress</p>
          {selectedOrder.shipping_address ? (
            <div className="text-sm text-slate-900">
              {selectedOrder.shipping_address.name && <p className="font-medium">{selectedOrder.shipping_address.name}</p>}
              {(selectedOrder.shipping_address.street || selectedOrder.shipping_address.address) && (
                <p>{selectedOrder.shipping_address.street || selectedOrder.shipping_address.address}</p>
              )}
              <p>
                {selectedOrder.shipping_address.zip || selectedOrder.shipping_address.postal_code || ''}{' '}
                {selectedOrder.shipping_address.city || ''}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Ingen adress angiven</p>
          )}
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase">Datum</p>
          <p className="text-sm text-slate-900">{new Date(selectedOrder.created_at).toLocaleString('sv-SE')}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase">Produkter</p>
          <div className="mt-2 space-y-3">
            {selectedOrder.items?.map((item, index) => (
              <OrderItemDetail key={item.product_id || `item-${index}`} item={item} toast={toast} />
            )) || <p className="text-sm text-slate-500">Inga produkter</p>}
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-slate-600">Totalt</span>
            <span className="text-lg text-slate-900">{(selectedOrder.total_amount || selectedOrder.total)?.toLocaleString('sv-SE')} kr</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase mb-2">Uppdatera status</p>
          <Select
            value={selectedOrder.status}
            onValueChange={(value) => onUpdateStatus(selectedOrder.order_id, value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Väntande</SelectItem>
              <SelectItem value="processing">Behandlas</SelectItem>
              <SelectItem value="shipped">Skickad</SelectItem>
              <SelectItem value="completed">Slutförd</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

const OrderItemDetail = ({ item, toast }) => {
  return (
    <div className="border border-slate-100 rounded-lg p-3">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-800">{item.product_name || item.name || 'Produkt'}</span>
        <span className="text-slate-900">{item.price} kr</span>
      </div>
      <p className="text-xs text-slate-500 mt-0.5">Antal: {item.quantity || 1}</p>
      {item.customization && (
        <div className="mt-2 bg-slate-50 rounded p-2 text-xs text-slate-600 space-y-1">
          {item.customization.type === 'nametag' && <NametagCustomization item={item} />}
          {item.customization.type === 'photoalbum' && <PhotoAlbumCustomization item={item} toast={toast} />}
          {item.customization.type === 'calendar' && <CalendarCustomization item={item} />}
          {item.customization.type === 'design' && <DesignCustomization item={item} />}
          {!['nametag', 'photoalbum', 'calendar', 'design'].includes(item.customization.type) && (
            <p>Typ: {item.customization.type}</p>
          )}
        </div>
      )}
    </div>
  );
};

const NametagCustomization = ({ item }) => {
  const c = item.customization;
  return (
    <>
      {c.child_name && <p>Förnamn: <strong>{c.child_name}</strong></p>}
      {c.last_name && <p>Efternamn: <strong>{c.last_name}</strong></p>}
      {c.phone_number && <p>Telefon: <strong>{c.phone_number}</strong></p>}
      {c.font && <p>Typsnitt: {c.font}</p>}
      {c.font_color && <p>Typsnittsfärg: <span style={{color: c.font_color}}>{c.font_color}</span></p>}
      {c.motif && <p>Motiv: {c.motif}</p>}
      {c.background && <p>Bakgrund: {c.background}</p>}
      {c.uploaded_image_url && (
        <ImagePreview url={c.uploaded_image_url} alt="Kunduppladdning" />
      )}
    </>
  );
};

const PhotoAlbumCustomization = ({ item, toast }) => {
  const c = item.customization;
  const pagesWithImages = useMemo(() => 
    c.pages?.filter(pg => pg.image_urls?.length > 0) || [],
    [c.pages]
  );
  return (
    <>
      <p>Sidor: {c.total_pages}</p>
      <p>Bilder: {c.total_images || c.images_count}</p>
      {c.size && <p>Storlek: {c.size}</p>}
      {pagesWithImages.length > 0 && (
        <div className="mt-2">
          <p className="font-medium mb-1">Bilder per sida:</p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {pagesWithImages.map((pg) => (
              <div key={pg.page_number} className="border rounded p-2 bg-white">
                <p className="text-xs text-slate-500 mb-1">Sida {pg.page_number} ({pg.layout})</p>
                <div className="flex gap-1 flex-wrap">
                  {pg.image_urls.map((url, imgIdx) => {
                    const imgUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
                    return (
                      <div key={`img-${imgIdx}`} className="relative group">
                        <img src={imgUrl} alt={`S${pg.page_number}-${imgIdx + 1}`} className="w-14 h-14 object-cover rounded border" />
                        <a href={imgUrl} download target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                          <Download className="w-4 h-4 text-white" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => downloadAllImages(item, toast)}
            className="flex items-center gap-1.5 mt-2 text-xs font-medium text-[#2a9d8f] hover:underline"
            data-testid="download-all-images"
          >
            <Download className="w-3.5 h-3.5" />
            Ladda ner alla bilder
          </button>
        </div>
      )}
    </>
  );
};

const CalendarCustomization = ({ item }) => {
  const c = item.customization;
  const monthsWithImages = useMemo(() => 
    c.months?.filter(m => m.image_url) || [],
    [c.months]
  );
  return (
    <>
      {c.year && <p>År: <strong>{c.year}</strong></p>}
      {c.size && <p>Storlek: {c.size}</p>}
      <p>Bilder: {c.images_count || 0} / 12</p>
      {monthsWithImages.length > 0 && (
        <div className="mt-2">
          <p className="font-medium mb-1">Månadsbilder:</p>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {monthsWithImages.map((m, idx) => {
              const imgUrl = m.image_url.startsWith('http') ? m.image_url : `${API_BASE}${m.image_url}`;
              return (
                <div key={m.month || `month-${idx}`} className="flex items-center gap-2 border rounded p-1.5 bg-white">
                  <img src={imgUrl} alt={m.month} className="w-10 h-10 object-cover rounded border" />
                  <span className="text-xs text-slate-600">{m.month}</span>
                  <a href={imgUrl} download target="_blank" rel="noreferrer" className="ml-auto text-[#2a9d8f] hover:underline">
                    <Download className="w-3 h-3" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

const DesignCustomization = ({ item }) => {
  const c = item.customization;
  return (
    <>
      {c.text && <p>Text: <strong>{c.text}</strong></p>}
      {c.text_font && <p>Typsnitt: {c.text_font}</p>}
      {c.text_color && <p>Textfärg: <span style={{color: c.text_color}}>{c.text_color}</span></p>}
      {c.color && <p>Produktfärg: {c.color}</p>}
      {c.size && <p>Storlek: {c.size}</p>}
      {c.placement_notes && <p>Placeringsönskemål: <em>{c.placement_notes}</em></p>}
      {c.uploaded_image_url && (
        <ImagePreview url={c.uploaded_image_url} alt="Kunddesign" />
      )}
    </>
  );
};

const ImagePreview = ({ url, alt }) => {
  const imgUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  return (
    <div className="mt-2">
      <p className="mb-1 font-medium">Kundens bild:</p>
      <img src={imgUrl} alt={alt} className="w-20 h-20 object-cover rounded border" />
      <a href={imgUrl} download target="_blank" rel="noreferrer" className="flex items-center gap-1 mt-1 text-[#2a9d8f] hover:underline">
        <Download className="w-3 h-3" /> Ladda ner
      </a>
    </div>
  );
};

export default OrderDetailPanel;
