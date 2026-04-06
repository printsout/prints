import { Input } from '../../../components/ui/input';
import { CreditCard, Smartphone, Building2, AlertCircle } from 'lucide-react';

const PaymentMethodCard = ({ icon: Icon, iconBg, iconColor, title, description, enabled, onToggle, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={onToggle}>
      <div className="flex items-center gap-4">
        <div className={`${iconBg} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-slate-300'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </div>
    </div>
    {enabled && children && (
      <div className="p-6 pt-0 space-y-4 border-t border-slate-100">{children}</div>
    )}
  </div>
);

export const StripeCard = ({ settings, setSettings, onToggle }) => (
  <PaymentMethodCard icon={CreditCard} iconBg="bg-purple-100" iconColor="text-purple-600" title="Stripe" description="Visa, Mastercard, etc." enabled={settings.stripe_enabled} onToggle={onToggle}>
    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
      <AlertCircle className="w-4 h-4 text-green-600 mt-0.5" />
      <p className="text-sm text-green-700">Stripe är redan konfigurerad och aktiv. Ändringar av API-nycklar görs via miljövariabler.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Publishable Key</label>
        <Input value={settings.stripe_publishable_key} onChange={(e) => setSettings(prev => ({ ...prev, stripe_publishable_key: e.target.value }))} placeholder="pk_live_..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Secret Key</label>
        <Input type="password" value={settings.stripe_secret_key} onChange={(e) => setSettings(prev => ({ ...prev, stripe_secret_key: e.target.value }))} placeholder="sk_live_..." />
      </div>
    </div>
  </PaymentMethodCard>
);

export const KlarnaCard = ({ settings, setSettings, onToggle }) => (
  <PaymentMethodCard icon={CreditCard} iconBg="bg-pink-100" iconColor="text-pink-600" title="Klarna" description="Faktura, delbetalning, direktbetalning" enabled={settings.klarna_enabled} onToggle={onToggle}>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Merchant ID</label>
      <Input value={settings.klarna_merchant_id} onChange={(e) => setSettings(prev => ({ ...prev, klarna_merchant_id: e.target.value }))} placeholder="K12345..." />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
      <Input type="password" value={settings.klarna_api_key} onChange={(e) => setSettings(prev => ({ ...prev, klarna_api_key: e.target.value }))} placeholder="Din Klarna API-nyckel" />
    </div>
  </PaymentMethodCard>
);

export const SwishCard = ({ settings, setSettings, onToggle }) => (
  <PaymentMethodCard icon={Smartphone} iconBg="bg-green-100" iconColor="text-green-600" title="Swish" description="Mobilbetalning för svenska kunder" enabled={settings.swish_enabled} onToggle={onToggle}>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Swish-nummer</label>
      <Input value={settings.swish_number} onChange={(e) => setSettings(prev => ({ ...prev, swish_number: e.target.value }))} placeholder="123 456 78 90" />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Certifikat (Base64)</label>
      <textarea value={settings.swish_certificate} onChange={(e) => setSettings(prev => ({ ...prev, swish_certificate: e.target.value }))} placeholder="Klistra in ditt Swish-certifikat här..." className="w-full p-3 border border-slate-300 rounded-lg resize-none font-mono text-xs" rows={3} />
    </div>
  </PaymentMethodCard>
);

export const BankTransferCard = ({ settings, setSettings, onToggle }) => (
  <PaymentMethodCard icon={Building2} iconBg="bg-blue-100" iconColor="text-blue-600" title="Banköverföring" description="Manuell betalning till bankkonto" enabled={settings.bank_transfer_enabled} onToggle={onToggle}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Bank</label><Input value={settings.bank_name} onChange={(e) => setSettings(prev => ({ ...prev, bank_name: e.target.value }))} placeholder="t.ex. Nordea" /></div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1">Kontonummer</label><Input value={settings.bank_account} onChange={(e) => setSettings(prev => ({ ...prev, bank_account: e.target.value }))} placeholder="1234-5678901234" /></div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1">IBAN</label><Input value={settings.bank_iban} onChange={(e) => setSettings(prev => ({ ...prev, bank_iban: e.target.value }))} placeholder="SE00 0000 0000 0000 0000 0000" /></div>
      <div><label className="block text-sm font-medium text-slate-700 mb-1">BIC/SWIFT</label><Input value={settings.bank_bic} onChange={(e) => setSettings(prev => ({ ...prev, bank_bic: e.target.value }))} placeholder="NDEASESS" /></div>
    </div>
  </PaymentMethodCard>
);
