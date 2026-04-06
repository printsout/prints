import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Shield, ArrowLeft } from 'lucide-react';

export const SetupTwoFactor = ({ qrCode, manualSecret, totpCode, setTotpCode, loading, onVerify, onBack }) => (
  <form onSubmit={onVerify} className="bg-white rounded-2xl shadow-xl p-8" data-testid="setup-2fa-form">
    <div className="space-y-5">
      <div className="flex justify-center">
        <div className="w-14 h-14 rounded-full bg-[#2a9d8f]/10 flex items-center justify-center">
          <Shield className="w-7 h-7 text-[#2a9d8f]" />
        </div>
      </div>
      <h2 className="text-lg font-bold text-slate-900 text-center">Konfigurera Authenticator</h2>
      <p className="text-sm text-slate-500 text-center">
        Skanna QR-koden med Microsoft Authenticator för att aktivera tvåstegsverifiering
      </p>
      <div className="flex justify-center">
        <img src={qrCode} alt="QR-kod" className="w-48 h-48 border-4 border-white shadow-lg rounded-lg" data-testid="2fa-qr-code-img" />
      </div>
      <details className="text-center">
        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
          Kan du inte skanna? Ange manuell kod
        </summary>
        <p className="mt-2 font-mono text-xs bg-slate-50 p-2 rounded border select-all break-all" data-testid="2fa-manual-secret">
          {manualSecret}
        </p>
      </details>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Ange 6-siffrig kod från appen</label>
        <Input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="text-center text-2xl tracking-[0.5em] font-mono h-14" maxLength={6} autoFocus required data-testid="totp-code-input" />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={loading || totpCode.length !== 6} data-testid="verify-2fa-btn">
        {loading ? 'Verifierar...' : 'Aktivera & Logga in'}
      </Button>
      <button type="button" onClick={onBack} className="w-full text-center text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Tillbaka
      </button>
    </div>
  </form>
);

export const VerifyTwoFactor = ({ totpCode, setTotpCode, loading, onVerify, onBack }) => (
  <form onSubmit={onVerify} className="bg-white rounded-2xl shadow-xl p-8" data-testid="2fa-form">
    <div className="space-y-6">
      <div className="flex justify-center mb-2">
        <div className="w-16 h-16 rounded-full bg-[#2a9d8f]/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-[#2a9d8f]" />
        </div>
      </div>
      <h2 className="text-lg font-bold text-slate-900 text-center">Tvåstegsverifiering</h2>
      <p className="text-sm text-slate-500 text-center">
        Öppna Microsoft Authenticator och ange den 6-siffriga koden
      </p>
      <div>
        <Input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="text-center text-2xl tracking-[0.5em] font-mono h-14" maxLength={6} autoFocus required data-testid="totp-code-input" />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={loading || totpCode.length !== 6} data-testid="verify-2fa-btn">
        {loading ? 'Verifierar...' : 'Verifiera'}
      </Button>
      <button type="button" onClick={onBack} className="w-full text-center text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Tillbaka
      </button>
    </div>
  </form>
);
