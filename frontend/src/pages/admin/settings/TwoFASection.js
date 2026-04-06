import { useState } from 'react';
import { Shield, ShieldCheck, ShieldOff, QrCode } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { toast } from 'sonner';
import api from '../../../services/api';

const TwoFASection = ({ getAuthHeaders, twoFAEnabled, setTwoFAEnabled }) => {
  const [twoFASetupData, setTwoFASetupData] = useState(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  const handleSetup2FA = async () => {
    setTwoFALoading(true);
    try {
      const res = await api.post('/admin/setup-2fa', {}, { headers: getAuthHeaders() });
      setTwoFASetupData(res.data);
      toast.info('Skanna QR-koden med Microsoft Authenticator');
    } catch (error) {
      toast.error('Kunde inte starta 2FA-installationen');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    if (twoFACode.length !== 6) {
      toast.error('Ange en 6-siffrig kod');
      return;
    }
    setTwoFALoading(true);
    try {
      await api.post('/admin/confirm-2fa', { code: twoFACode }, { headers: getAuthHeaders() });
      setTwoFAEnabled(true);
      setTwoFASetupData(null);
      setTwoFACode('');
      toast.success('Tvåstegsverifiering aktiverad!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Felaktig kod. Försök igen.');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (disableCode.length !== 6) {
      toast.error('Ange en 6-siffrig kod för att inaktivera');
      return;
    }
    setTwoFALoading(true);
    try {
      await api.post('/admin/disable-2fa', { code: disableCode }, { headers: getAuthHeaders() });
      setTwoFAEnabled(false);
      setDisableCode('');
      toast.success('Tvåstegsverifiering inaktiverad');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Felaktig kod');
    } finally {
      setTwoFALoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="2fa-settings-section">
      <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <Shield className="w-5 h-5" />
        Tvåstegsverifiering (2FA)
      </h2>

      {/* Status indicator */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-lg border" style={{ borderColor: twoFAEnabled ? '#2a9d8f' : '#e2e8f0', backgroundColor: twoFAEnabled ? '#f0fdf9' : '#f8fafc' }}>
        {twoFAEnabled ? (
          <ShieldCheck className="w-6 h-6 text-[#2a9d8f] flex-shrink-0" />
        ) : (
          <ShieldOff className="w-6 h-6 text-slate-400 flex-shrink-0" />
        )}
        <div>
          <p className="font-medium" style={{ color: twoFAEnabled ? '#2a9d8f' : '#64748b' }} data-testid="2fa-status-text">
            {twoFAEnabled ? 'Tvåstegsverifiering är aktiverad' : 'Tvåstegsverifiering är inte aktiverad'}
          </p>
          <p className="text-sm text-slate-500">
            {twoFAEnabled
              ? 'Din adminpanel skyddas med Microsoft Authenticator'
              : 'Aktivera för att skydda din adminpanel med Microsoft Authenticator'}
          </p>
        </div>
      </div>

      {/* Setup flow */}
      {!twoFAEnabled && !twoFASetupData && (
        <Button
          type="button"
          onClick={handleSetup2FA}
          disabled={twoFALoading}
          className="bg-[#2a9d8f] hover:bg-[#238b7e]"
          data-testid="setup-2fa-btn"
        >
          {twoFALoading ? 'Förbereder...' : (
            <>
              <QrCode className="w-4 h-4 mr-2" />
              Aktivera tvåstegsverifiering
            </>
          )}
        </Button>
      )}

      {/* QR Code display */}
      {!twoFAEnabled && twoFASetupData && (
        <div className="space-y-5">
          <div className="bg-slate-50 rounded-lg p-6 text-center">
            <p className="font-medium text-slate-800 mb-2">Steg 1: Skanna QR-koden</p>
            <p className="text-sm text-slate-500 mb-4">
              Öppna Microsoft Authenticator och skanna denna QR-kod
            </p>
            <div className="flex justify-center mb-4">
              <img
                src={twoFASetupData.qr_code}
                alt="2FA QR Code"
                className="w-48 h-48 border-4 border-white shadow-lg rounded-lg"
                data-testid="2fa-qr-code-img"
              />
            </div>
            <details className="text-left">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                Kan du inte skanna? Ange manuell kod
              </summary>
              <p className="mt-2 font-mono text-xs bg-white p-2 rounded border select-all break-all" data-testid="2fa-manual-secret">
                {twoFASetupData.secret}
              </p>
            </details>
          </div>

          <div>
            <p className="font-medium text-slate-800 mb-2">Steg 2: Ange verifieringskod</p>
            <p className="text-sm text-slate-500 mb-3">
              Ange den 6-siffriga koden från appen för att bekräfta
            </p>
            <div className="flex gap-3">
              <Input
                type="text"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-xl tracking-[0.3em] font-mono max-w-[200px]"
                maxLength={6}
                data-testid="2fa-confirm-code-input"
              />
              <Button
                type="button"
                onClick={handleConfirm2FA}
                disabled={twoFALoading || twoFACode.length !== 6}
                className="bg-[#2a9d8f] hover:bg-[#238b7e]"
                data-testid="confirm-2fa-btn"
              >
                {twoFALoading ? 'Verifierar...' : 'Bekräfta'}
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setTwoFASetupData(null); setTwoFACode(''); }}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Avbryt
          </button>
        </div>
      )}

      {/* Disable flow */}
      {twoFAEnabled && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-2">Inaktivera tvåstegsverifiering</p>
          <p className="text-xs text-slate-500 mb-3">
            Ange en kod från Microsoft Authenticator för att bekräfta
          </p>
          <div className="flex gap-3">
            <Input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-xl tracking-[0.3em] font-mono max-w-[200px]"
              maxLength={6}
              data-testid="disable-2fa-code-input"
            />
            <Button
              type="button"
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={twoFALoading || disableCode.length !== 6}
              data-testid="disable-2fa-btn"
            >
              {twoFALoading ? 'Inaktiverar...' : 'Inaktivera 2FA'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFASection;
