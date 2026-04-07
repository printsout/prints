import { Image as ImageIcon } from 'lucide-react';

export const PagePreview = ({ page, template, theme, companyLogo, scale = 1 }) => {
  const font = theme.font || 'Inter';
  const color = theme.primaryColor || '#2a9d8f';
  const base = {
    width: 210 * scale, height: 297 * scale,
    fontFamily: font, fontSize: 10 * scale, color: '#1e293b',
    backgroundColor: '#fff', overflow: 'hidden', position: 'relative',
    border: '1px solid #e2e8f0', borderRadius: 4 * scale,
  };

  if (page.type === 'cover') {
    return (
      <div style={base} className="flex flex-col items-center justify-center text-center">
        {page.bgImage && <img src={page.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)` }} />
        <div className="relative z-10 flex flex-col items-center gap-2 px-4">
          {template === 'modern' && <div className="w-12 h-1 rounded-full mb-2" style={{ backgroundColor: color, width: 50 * scale }} />}
          {companyLogo && <img src={companyLogo} alt="Logo" style={{ height: 32 * scale }} className="object-contain mb-1" />}
          <h1 style={{ fontSize: 18 * scale, fontWeight: 700, color, lineHeight: 1.2 }}>{page.title || 'Företagsnamn'}</h1>
          <p style={{ fontSize: 10 * scale, color: '#64748b' }}>{page.subtitle || 'Produktkatalog'}</p>
          {template === 'classic' && <div className="w-8 h-0.5 rounded-full mt-2" style={{ backgroundColor: color, width: 32 * scale }} />}
        </div>
      </div>
    );
  }

  if (page.type === 'product') {
    const items = page.items || [];
    const cols = items.length <= 2 ? 1 : 2;
    return (
      <div style={base} className="flex flex-col">
        <div style={{ height: 6 * scale, backgroundColor: color }} />
        <div className="flex-1 p-2" style={{ padding: 8 * scale }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 * scale }}>
            {items.map((item, i) => (
              <div key={item.id || `preview-item-${i}`} style={{ border: '1px solid #f1f5f9', borderRadius: 4 * scale, overflow: 'hidden' }}>
                <div style={{ height: 50 * scale, backgroundColor: '#f8fafc' }} className="flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon style={{ width: 16 * scale, height: 16 * scale }} className="text-slate-300" />
                  )}
                </div>
                <div style={{ padding: 4 * scale }}>
                  <p style={{ fontSize: 8 * scale, fontWeight: 600, color: '#1e293b' }}>{item.name || 'Produktnamn'}</p>
                  {item.desc && <p style={{ fontSize: 6 * scale, color: '#94a3b8', marginTop: 2 * scale }}>{item.desc}</p>}
                  {item.price && <p style={{ fontSize: 8 * scale, fontWeight: 700, color, marginTop: 2 * scale }}>{item.price} kr</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (page.type === 'gallery') {
    const imgs = page.images || [];
    return (
      <div style={base} className="flex flex-col">
        <div style={{ height: 6 * scale, backgroundColor: color }} />
        <div style={{ padding: 8 * scale }} className="flex-1">
          {page.title && <p style={{ fontSize: 12 * scale, fontWeight: 700, color, marginBottom: 6 * scale }}>{page.title}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 * scale, flex: 1 }}>
            {imgs.map((img, i) => (
              <div key={`gallery-${i}`} style={{ backgroundColor: '#f8fafc', borderRadius: 3 * scale, overflow: 'hidden', aspectRatio: '4/3' }} className="flex items-center justify-center">
                {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <ImageIcon style={{ width: 14 * scale, height: 14 * scale }} className="text-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (page.type === 'text') {
    return (
      <div style={base} className="flex flex-col">
        <div style={{ height: 6 * scale, backgroundColor: color }} />
        <div style={{ padding: 10 * scale }} className="flex-1">
          <h2 style={{ fontSize: 14 * scale, fontWeight: 700, color, marginBottom: 6 * scale }}>{page.title || 'Rubrik'}</h2>
          <p style={{ fontSize: 7 * scale, lineHeight: 1.6, color: '#475569' }}>
            {page.body || 'Skriv din text här. Berätta om ert företag, era produkter eller era tjänster.'}
          </p>
        </div>
      </div>
    );
  }

  if (page.type === 'backcover') {
    return (
      <div style={base} className="flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}10, ${color}05)` }} />
        <div className="relative z-10 flex flex-col items-center gap-1 px-4">
          {companyLogo && <img src={companyLogo} alt="Logo" style={{ height: 28 * scale }} className="object-contain mb-2" />}
          <p style={{ fontSize: 12 * scale, fontWeight: 700, color: '#1e293b' }}>{page.companyName || 'Företagsnamn'}</p>
          {page.phone && <p style={{ fontSize: 7 * scale, color: '#64748b' }}>{page.phone}</p>}
          {page.email && <p style={{ fontSize: 7 * scale, color }}>{page.email}</p>}
          {page.website && <p style={{ fontSize: 7 * scale, color: '#64748b' }}>{page.website}</p>}
          {page.address && <p style={{ fontSize: 7 * scale, color: '#94a3b8', marginTop: 4 * scale }}>{page.address}</p>}
        </div>
      </div>
    );
  }

  return <div style={base} className="flex items-center justify-center text-slate-300">Tom sida</div>;
};
