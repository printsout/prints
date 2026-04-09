import { useState, useMemo } from 'react';
import { Download, Package, Printer, Trash2, Truck, ExternalLink, Edit } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const CARRIERS = {
  postnord: { name: 'PostNord', url: (n) => `https://tracking.postnord.com/tracking.html?id=${n}` },
  dhl: { name: 'DHL', url: (n) => `https://www.dhl.com/se-sv/home/tracking.html?tracking-id=${n}` },
  bring: { name: 'Bring', url: (n) => `https://tracking.bring.se/tracking/${n}` },
  schenker: { name: 'DB Schenker', url: (n) => `https://www.dbschenker.com/se-sv/spara/${n}` },
  ups: { name: 'UPS', url: (n) => `https://www.ups.com/track?tracknum=${n}` },
};

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
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('postnord');

  if (!selectedOrder) {
    return (
      <div className="text-center text-slate-500 py-8">
        <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p>Välj en order för att se detaljer</p>
      </div>
    );
  }

  const handleStatusChange = (value) => {
    if (value === 'shipped') {
      setTrackingNumber(selectedOrder.tracking_number || '');
      setTrackingCarrier(selectedOrder.tracking_carrier || 'postnord');
      setShowShippingDialog(true);
    } else {
      onUpdateStatus(selectedOrder.order_id, value);
    }
  };

  const handleShipConfirm = () => {
    onUpdateStatus(selectedOrder.order_id, 'shipped', trackingNumber.trim(), trackingCarrier);
    setShowShippingDialog(false);
    setTrackingNumber('');
  };

  const existingTracking = selectedOrder.tracking_number;
  const existingCarrier = selectedOrder.tracking_carrier || 'postnord';
  const carrierInfo = CARRIERS[existingCarrier] || CARRIERS.postnord;

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

        {/* Tracking number display */}
        {existingTracking && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3" data-testid="tracking-info">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-600 font-semibold uppercase">Spårning ({carrierInfo.name})</p>
            </div>
            <p className="text-sm font-mono font-semibold text-slate-900">{existingTracking}</p>
            <a
              href={carrierInfo.url(existingTracking)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-blue-600 hover:underline"
              data-testid="tracking-link"
            >
              <ExternalLink className="w-3 h-3" />
              Spåra paket
            </a>
          </div>
        )}

        <div>
          <p className="text-xs text-slate-500 uppercase">Produkter</p>
          <div className="mt-2 space-y-3">
            {selectedOrder.items?.map((item, index) => (
              <OrderItemDetail key={item.product_id || `item-${index}`} item={item} toast={toast} orderId={selectedOrder.order_id} />
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
            onValueChange={handleStatusChange}
          >
            <SelectTrigger data-testid="order-status-select">
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

        {/* Shipping dialog */}
        {showShippingDialog && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3" data-testid="shipping-dialog">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-slate-900">Leveransinformation</h4>
            </div>
            <p className="text-sm text-slate-600">Ange spårningsnummer för att inkludera det i kundens leveransbekräftelse.</p>
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Transportör</label>
              <Select value={trackingCarrier} onValueChange={setTrackingCarrier}>
                <SelectTrigger data-testid="carrier-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CARRIERS).map(([key, c]) => (
                    <SelectItem key={key} value={key}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Spårningsnummer</label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="T.ex. 12345678901234"
                data-testid="tracking-number-input"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleShipConfirm}
                className="flex-1"
                data-testid="confirm-shipping-btn"
              >
                <Truck className="w-4 h-4 mr-1.5" />
                Bekräfta leverans
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowShippingDialog(false)}
                data-testid="cancel-shipping-btn"
              >
                Avbryt
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const OrderItemDetail = ({ item, toast, orderId }) => {
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
          {item.customization.type === 'calendar' && <CalendarCustomization item={item} orderId={orderId} />}
          {item.customization.type === 'design' && <DesignCustomization item={item} />}
          {item.customization.type === 'catalog_design' && <CatalogDesignCustomization item={item} orderId={orderId} />}
          {item.customization.type === 'businesscard' && <BusinesscardCustomization item={item} />}
          {item.customization.type === 'print_catalog' && <PrintCatalogCustomization item={item} orderId={orderId} />}
          {item.customization.type === 'our_catalog' && <OurCatalogCustomization item={item} />}
          {!['nametag', 'photoalbum', 'calendar', 'design', 'catalog_design', 'businesscard', 'print_catalog', 'our_catalog'].includes(item.customization.type) && (
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
      {c.motif && <p>Motiv: <strong>{c.motif}</strong></p>}
      {c.background && <p>Bakgrund: {c.background}</p>}
      {c.uploaded_image_url && (
        <ImagePreview url={c.uploaded_image_url} alt="Kunduppladdning" />
      )}
    </>
  );
};

const PhotoAlbumCustomization = ({ item, toast }) => {
  const c = item.customization;
  const pages = c.pages;
  const pagesWithImages = useMemo(() => 
    pages?.filter(pg => pg.image_urls?.length > 0) || [],
    [pages]
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

const CalendarCustomization = ({ item, orderId }) => {
  const c = item.customization;
  const months = c.months;
  const monthsWithImages = useMemo(() => 
    months?.filter(m => m.image_url) || [],
    [months]
  );

  const handleDownloadZip = () => {
    const token = sessionStorage.getItem('adminToken');
    const url = `${API_BASE}/api/admin/orders/${orderId}/calendar-images`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Kunde inte ladda ner');
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `kalenderbilder_${orderId?.slice(0, 8)}.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => {});
  };

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
          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#2a9d8f] text-white text-xs font-semibold rounded-md hover:bg-[#238b7e] transition-colors"
            data-testid="download-calendar-zip"
          >
            <Download className="w-3.5 h-3.5" />
            Ladda ner alla bilder (ZIP)
          </button>
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

const CatalogDesignCustomization = ({ item, orderId }) => {
  const c = item.customization;

  const handleDownloadPdf = () => {
    const url = `${API_BASE}/api/admin/orders/${orderId}/catalog-pdf`;
    const token = localStorage.getItem('admin_token');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Kunde inte generera PDF');
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `katalog_${c.company_name || 'design'}_${orderId?.slice(0, 8)}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => {});
  };

  return (
    <>
      <p>Företag: <strong>{c.company_name}</strong></p>
      {c.template && <p>Mall: {c.template}</p>}
      {c.page_count && <p>Sidor: {c.page_count}</p>}
      {c.theme?.primaryColor && <p>Primärfärg: <span style={{ color: c.theme.primaryColor }}>{c.theme.primaryColor}</span></p>}
      {c.theme?.font && <p>Typsnitt: {c.theme.font}</p>}
      {c.logo_url && <ImagePreview url={c.logo_url} alt="Logotyp" />}
      {c.pages?.length > 0 && (
        <div className="mt-2">
          <p className="font-medium mb-1">Sidor:</p>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {c.pages.map((pg, idx) => (
              <div key={pg.id || `page-${idx}`} className="border rounded p-2 bg-white text-xs">
                <span className="font-medium">Sida {idx + 1}: {pg.type}</span>
                {pg.title && <span className="text-slate-500 ml-1">— {pg.title}</span>}
                {pg.items?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {pg.items.filter(it => it.image).map((it, i) => {
                      const imgUrl = it.image?.startsWith('http') ? it.image : `${API_BASE}${it.image}`;
                      return (
                        <div key={`prod-${i}`} className="relative group">
                          <img src={imgUrl} alt={it.name || ''} className="w-10 h-10 object-cover rounded border" />
                          <a href={imgUrl} download target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                            <Download className="w-3 h-3 text-white" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={handleDownloadPdf}
        className="flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-[#2a9d8f] text-white text-xs font-semibold rounded-md hover:bg-[#238b7e] transition-colors"
        data-testid="download-catalog-pdf"
      >
        <Download className="w-3.5 h-3.5" />
        Ladda ner katalog (PDF)
      </button>
      <a
        href={`/katalog-designer?admin_edit=${orderId}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-700 transition-colors w-fit"
        data-testid="admin-edit-catalog-design"
      >
        <Edit className="w-3.5 h-3.5" />
        Redigera design
      </a>
    </>
  );
};

const BusinesscardCustomization = ({ item }) => {
  const c = item.customization;
  return (
    <>
      <p>Källa: <strong>{c.source === 'editor' ? 'Editor' : 'PDF-uppladdning'}</strong></p>
      {c.card_details?.template && <p>Mall: {c.card_details.template}</p>}
      {c.card_details?.name && <p>Namn: {c.card_details.name}</p>}
      {c.card_details?.company && <p>Företag: {c.card_details.company}</p>}
      {c.card_details?.email && <p>E-post: {c.card_details.email}</p>}
      {c.card_details?.phone && <p>Telefon: {c.card_details.phone}</p>}
      {c.original_filename && <p>Fil: {c.original_filename}</p>}
      {c.pdf_url && (
        <a href={c.pdf_url.startsWith('http') ? c.pdf_url : `${API_BASE}${c.pdf_url}`} download target="_blank" rel="noreferrer" className="flex items-center gap-1 mt-1 text-[#2a9d8f] hover:underline text-xs">
          <Download className="w-3 h-3" /> Ladda ner PDF
        </a>
      )}
    </>
  );
};

const PrintCatalogCustomization = ({ item, orderId }) => {
  const c = item.customization;
  const pdfLink = c.pdf_url
    ? (c.pdf_url.startsWith('http') ? c.pdf_url : `${API_BASE}${c.pdf_url}`)
    : null;

  const handleB2bDownload = () => {
    if (!orderId) return;
    const url = `${API_BASE}/api/admin/b2b-orders/${orderId}/pdf`;
    const token = localStorage.getItem('admin_token');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = c.original_filename || `katalog_${orderId?.slice(0, 8)}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => {});
  };

  return (
    <>
      <p>Typ: <strong>Katalogutskrift</strong></p>
      {c.company_name && <p>Företag: {c.company_name}</p>}
      {c.original_filename && <p>Fil: {c.original_filename}</p>}
      {pdfLink ? (
        <a href={pdfLink} download target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#2a9d8f] text-white text-xs font-semibold rounded-md hover:bg-[#238b7e] transition-colors w-fit"
          data-testid="download-print-catalog-pdf">
          <Download className="w-3.5 h-3.5" /> Ladda ner PDF
        </a>
      ) : orderId && (
        <button onClick={handleB2bDownload}
          className="flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#2a9d8f] text-white text-xs font-semibold rounded-md hover:bg-[#238b7e] transition-colors"
          data-testid="download-b2b-pdf">
          <Download className="w-3.5 h-3.5" /> Ladda ner PDF
        </button>
      )}
    </>
  );
};

const OurCatalogCustomization = ({ item }) => {
  const c = item.customization;
  return (
    <>
      <p>Typ: <strong>{c.catalog_type === 'physical' ? 'Fysisk katalog' : 'Digital PDF'}</strong></p>
      {c.company_name && <p>Företag: {c.company_name}</p>}
      {c.contact_email && <p>E-post: {c.contact_email}</p>}
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
