import { useState, useRef } from 'react';
import { Input } from '../components/ui/input';
import {
  User, Briefcase, Building2, Phone, Mail, Globe, MapPin,
  Upload, X, FileText, Check, Palette
} from 'lucide-react';

const TEMPLATES = [
  { id: 'classic', name: 'Klassisk', desc: 'Ren och professionell' },
  { id: 'modern', name: 'Modern', desc: 'Djärv och centrerad' },
  { id: 'minimal', name: 'Minimal', desc: 'Enkel och elegant' },
  { id: 'elegant', name: 'Elegant', desc: 'Mörk bakgrund, lyxig känsla' },
  { id: 'creative', name: 'Kreativ', desc: 'Diagonal layout, unik stil' },
  { id: 'corporate', name: 'Företag', desc: 'Strikt professionell, stor logga' },
  { id: 'nature', name: 'Natur', desc: 'Gröna toner, organisk känsla' },
  { id: 'tech', name: 'Tech', desc: 'Mörk med neonaccenter' },
];

const COLORS = [
  { id: '#2a9d8f', name: 'Teal' },
  { id: '#264653', name: 'Mörkblå' },
  { id: '#e76f51', name: 'Korall' },
  { id: '#e63946', name: 'Röd' },
  { id: '#457b9d', name: 'Stålblå' },
  { id: '#6d6875', name: 'Lavendel' },
  { id: '#1d3557', name: 'Marinblå' },
  { id: '#000000', name: 'Svart' },
];

/* ───── Live Preview ───── */
function CardPreview({ card, logo, template, color }) {
  const renderClassic = () => (
    <div className="w-full h-full flex flex-col justify-between p-5 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: color }} />
      <div className="pl-4">
        {logo && <img src={logo} alt="Logo" className="h-8 mb-3 object-contain" />}
        <h3 className="text-base font-bold text-slate-900 leading-tight">{card.name || 'Förnamn Efternamn'}</h3>
        <p className="text-xs font-medium mt-0.5" style={{ color }}>{card.title || 'Titel'}</p>
        {card.company && <p className="text-xs text-slate-500 mt-0.5">{card.company}</p>}
      </div>
      <div className="pl-4 space-y-0.5 text-[10px] text-slate-500">
        {(card.phone || card.email) && (
          <div className="flex gap-4">
            {card.phone && <span>{card.phone}</span>}
            {card.email && <span>{card.email}</span>}
          </div>
        )}
        {(card.website || card.address) && (
          <div className="flex gap-4">
            {card.website && <span>{card.website}</span>}
            {card.address && <span>{card.address}</span>}
          </div>
        )}
      </div>
    </div>
  );

  const renderModern = () => (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-white">
      <div className="h-[38%] flex items-center justify-center" style={{ backgroundColor: color }}>
        {logo ? (
          <img src={logo} alt="Logo" className="h-8 object-contain" />
        ) : (
          card.company && <p className="text-sm font-bold text-white tracking-wide">{card.company}</p>
        )}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <h3 className="text-sm font-bold text-slate-900">{card.name || 'Förnamn Efternamn'}</h3>
        <p className="text-[10px] font-medium mt-0.5" style={{ color }}>{card.title || 'Titel'}</p>
        <div className="mt-2 space-y-0.5 text-[9px] text-slate-500">
          {card.phone && <p>{card.phone}</p>}
          {card.email && <p>{card.email}</p>}
          {card.website && <p>{card.website}</p>}
        </div>
      </div>
    </div>
  );

  const renderMinimal = () => (
    <div className="w-full h-full flex items-center p-5 bg-white">
      <div className="flex-1">
        <h3 className="text-sm font-bold text-slate-900">{card.name || 'Förnamn Efternamn'}</h3>
        <p className="text-[10px] mt-0.5" style={{ color }}>{card.title || 'Titel'}</p>
        {card.company && <p className="text-[10px] text-slate-400 mt-0.5">{card.company}</p>}
      </div>
      <div className="border-l border-slate-200 pl-4 ml-4 space-y-0.5 text-[9px] text-slate-500 text-right">
        {card.phone && <p>{card.phone}</p>}
        {card.email && <p>{card.email}</p>}
        {card.website && <p>{card.website}</p>}
        {card.address && <p>{card.address}</p>}
        {logo && <img src={logo} alt="Logo" className="h-5 ml-auto mt-1 object-contain" />}
      </div>
    </div>
  );

  const renderElegant = () => (
    <div className="w-full h-full flex flex-col justify-between p-5 relative overflow-hidden" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${color}, transparent)`, transform: 'translate(30%, -30%)' }} />
      <div>
        {logo && <img src={logo} alt="Logo" className="h-7 mb-2 object-contain brightness-0 invert" />}
        <h3 className="text-sm font-bold text-white tracking-wide">{card.name || 'Förnamn Efternamn'}</h3>
        <p className="text-[10px] font-medium mt-0.5" style={{ color }}>{card.title || 'Titel'}</p>
        {card.company && <p className="text-[10px] text-slate-400 mt-0.5">{card.company}</p>}
      </div>
      <div className="space-y-0.5 text-[9px] text-slate-400">
        <div className="w-8 h-px mb-2" style={{ backgroundColor: color }} />
        {card.phone && <p>{card.phone}</p>}
        {card.email && <p>{card.email}</p>}
        {card.website && <p>{card.website}</p>}
      </div>
    </div>
  );

  const renderCreative = () => (
    <div className="w-full h-full relative overflow-hidden bg-white">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20" style={{ backgroundColor: color }} />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-10" style={{ backgroundColor: color }} />
      <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(90deg, ${color}, ${color}88, ${color}22)` }} />
      <div className="relative z-10 p-5 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{card.name || 'Förnamn Efternamn'}</h3>
            <p className="text-[10px] font-medium mt-0.5" style={{ color }}>{card.title || 'Titel'}</p>
          </div>
          {logo && <img src={logo} alt="Logo" className="h-8 object-contain" />}
        </div>
        <div className="flex justify-between items-end">
          <div className="space-y-0.5 text-[9px] text-slate-500">
            {card.phone && <p>{card.phone}</p>}
            {card.email && <p>{card.email}</p>}
          </div>
          <div className="space-y-0.5 text-[9px] text-slate-500 text-right">
            {card.website && <p>{card.website}</p>}
            {card.address && <p>{card.address}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCorporate = () => (
    <div className="w-full h-full flex bg-white overflow-hidden">
      <div className="w-[35%] flex items-center justify-center" style={{ backgroundColor: color }}>
        {logo ? (
          <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
        ) : (
          <span className="text-white text-lg font-bold">{(card.company || 'AB')[0]}</span>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          {card.company && <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color }}>{card.company}</p>}
          <h3 className="text-sm font-bold text-slate-900 mt-1">{card.name || 'Förnamn Efternamn'}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">{card.title || 'Titel'}</p>
        </div>
        <div className="space-y-0.5 text-[9px] text-slate-500">
          {card.phone && <p>{card.phone}</p>}
          {card.email && <p>{card.email}</p>}
          {card.website && <p>{card.website}</p>}
        </div>
      </div>
    </div>
  );

  const renderNature = () => (
    <div className="w-full h-full flex flex-col justify-between p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7, #f0fdf4)' }}>
      <div className="absolute top-2 right-3 text-4xl opacity-10">&#127793;</div>
      <div>
        {logo && <img src={logo} alt="Logo" className="h-7 mb-2 object-contain" />}
        <h3 className="text-sm font-bold text-green-900">{card.name || 'Förnamn Efternamn'}</h3>
        <p className="text-[10px] font-medium text-green-700 mt-0.5">{card.title || 'Titel'}</p>
        {card.company && <p className="text-[10px] text-green-600/70 mt-0.5">{card.company}</p>}
      </div>
      <div className="space-y-0.5 text-[9px] text-green-800/60">
        <div className="w-10 h-px bg-green-300 mb-2" />
        {card.phone && <p>{card.phone}</p>}
        {card.email && <p>{card.email}</p>}
        {card.website && <p>{card.website}</p>}
      </div>
    </div>
  );

  const renderTech = () => (
    <div className="w-full h-full flex flex-col justify-between p-5 relative overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '16px 16px' }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-mono">{card.name || 'Förnamn Efternamn'}</h3>
            <p className="text-[10px] font-mono mt-0.5" style={{ color }}>{card.title || 'Titel'}</p>
          </div>
          {logo && <img src={logo} alt="Logo" className="h-7 object-contain brightness-0 invert" />}
        </div>
        {card.company && <p className="text-[10px] text-slate-500 font-mono mt-1">{card.company}</p>}
      </div>
      <div className="relative z-10 space-y-0.5 text-[9px] text-slate-400 font-mono">
        <div className="w-full h-px mb-2" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
        {card.phone && <p><span style={{ color }}>$</span> {card.phone}</p>}
        {card.email && <p><span style={{ color }}>$</span> {card.email}</p>}
        {card.website && <p><span style={{ color }}>$</span> {card.website}</p>}
      </div>
    </div>
  );

  const renderers = { classic: renderClassic, modern: renderModern, minimal: renderMinimal, elegant: renderElegant, creative: renderCreative, corporate: renderCorporate, nature: renderNature, tech: renderTech };

  return (
    <div className="bg-slate-100 rounded-xl p-6 flex items-center justify-center" data-testid="card-preview-container">
      <div
        className="rounded-lg shadow-lg border border-slate-200 overflow-hidden"
        style={{ width: '340px', height: '200px' }}
        data-testid="card-preview"
      >
        {(renderers[template] || renderClassic)()}
      </div>
    </div>
  );
}

/* ───── Main Editor ───── */
export default function BusinessCardEditor({ card, setCard, logo, setLogo, template, setTemplate, color, setColor }) {
  const logoInputRef = useRef(null);

  const updateCard = (field, value) => setCard(prev => ({ ...prev, [field]: value }));

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6" data-testid="businesscard-editor">
      {/* Live preview */}
      <CardPreview card={card} logo={logo} template={template} color={color} />

      {/* Logo upload - prominently placed */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#2a9d8f]" />Logotyp
        </label>
        {!logo ? (
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 hover:border-[#2a9d8f] rounded-xl p-5 transition-colors bg-white group"
            data-testid="logo-upload-area"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#2a9d8f]/10 group-hover:bg-[#2a9d8f]/20 flex items-center justify-center shrink-0 transition-colors">
                <Upload className="w-6 h-6 text-[#2a9d8f]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-700">Ladda upp er logotyp</p>
                <p className="text-xs text-slate-400 mt-0.5">PNG, JPG eller WebP — syns i live-förhandsvisningen</p>
              </div>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-4 bg-white rounded-xl border p-3" data-testid="logo-preview">
            <img src={logo} alt="Logo" className="h-14 w-14 object-contain rounded-lg bg-slate-50 p-1" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Logotyp uppladdad</p>
              <p className="text-xs text-slate-400">Visas i förhandsvisningen ovan</p>
            </div>
            <button type="button" onClick={() => { setLogo(null); if (logoInputRef.current) logoInputRef.current.value = ''; }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" data-testid="remove-logo">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoSelect} data-testid="logo-file-input" />
      </div>

      {/* Template selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#2a9d8f]" />Mall
        </label>
        <div className="grid grid-cols-3 gap-3" data-testid="template-grid">
          {TEMPLATES.map(t => (
            <button
              key={t.id} type="button"
              onClick={() => setTemplate(t.id)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                template === t.id ? 'border-[#2a9d8f] bg-[#2a9d8f]/5' : 'border-slate-200 hover:border-slate-300'
              }`}
              data-testid={`template-${t.id}`}
            >
              <p className="text-sm font-semibold text-slate-900">{t.name}</p>
              <p className="text-xs text-slate-500">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Color selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">Accentfärg</label>
        <div className="flex flex-wrap gap-2" data-testid="color-grid">
          {COLORS.map(c => (
            <button
              key={c.id} type="button"
              onClick={() => setColor(c.id)}
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                color === c.id ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: c.id }}
              title={c.name}
              data-testid={`color-${c.id}`}
            >
              {color === c.id && <Check className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* Card info fields */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
          <User className="w-4 h-4 text-[#2a9d8f]" />Kortinnehåll
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Namn *</label>
            <Input value={card.name} onChange={e => updateCard('name', e.target.value)} placeholder="Anna Svensson" className="h-10" data-testid="card-name" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Titel</label>
            <Input value={card.title} onChange={e => updateCard('title', e.target.value)} placeholder="VD / Säljchef" className="h-10" data-testid="card-title" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Företag</label>
            <Input value={card.company} onChange={e => updateCard('company', e.target.value)} placeholder="AB Företaget" className="h-10" data-testid="card-company" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Telefon</label>
            <Input value={card.phone} onChange={e => updateCard('phone', e.target.value)} placeholder="070-123 45 67" className="h-10" data-testid="card-phone" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">E-post</label>
            <Input value={card.email} onChange={e => updateCard('email', e.target.value)} placeholder="anna@foretaget.se" className="h-10" data-testid="card-email" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Webbsida</label>
            <Input value={card.website} onChange={e => updateCard('website', e.target.value)} placeholder="www.foretaget.se" className="h-10" data-testid="card-website" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Adress</label>
            <Input value={card.address} onChange={e => updateCard('address', e.target.value)} placeholder="Storgatan 1, 111 22 Stockholm" className="h-10" data-testid="card-address" />
          </div>
        </div>
      </div>
    </div>
  );
}
