import { useState } from 'react';
import { Save, Percent, Plus, Trash2, ToggleLeft, ToggleRight, Send } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { toast } from 'sonner';

const DiscountCodesSection = ({
  shippingSettings,
  setShippingSettings,
  savingShipping,
  onSaveShipping,
  discountCodes,
  onCreateCode,
  onToggleCode,
  onDeleteCode,
  onSendEmail,
  sendingEmail
}) => {
  const [newCode, setNewCode] = useState({ code: '', discount_percent: 10, max_uses: 0, expires_at: '' });
  const [emailMessage, setEmailMessage] = useState('');

  const handleCreate = () => {
    if (!newCode.code.trim()) {
      toast.error('Ange en rabattkod');
      return;
    }
    if (newCode.discount_percent <= 0 || newCode.discount_percent > 100) {
      toast.error('Rabatt måste vara mellan 1-100%');
      return;
    }
    onCreateCode({
      ...newCode,
      code: newCode.code.trim().toUpperCase(),
      expires_at: newCode.expires_at || null,
    });
    setNewCode({ code: '', discount_percent: 10, max_uses: 0, expires_at: '' });
  };

  const handleSendEmailClick = (code) => {
    onSendEmail(code, emailMessage);
    setEmailMessage('');
  };

  return (
    <>
      {/* Discount Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <Percent className="w-5 h-5" />
          Rabatt
        </h2>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700">Aktivera rabatt</p>
              <p className="text-sm text-slate-500">Slå på för att ge alla kunder en procentuell rabatt</p>
            </div>
            <button
              type="button"
              onClick={() => setShippingSettings(prev => ({ ...prev, discount_enabled: !prev.discount_enabled }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                shippingSettings.discount_enabled ? 'bg-[#2a9d8f]' : 'bg-slate-300'
              }`}
              data-testid="discount-toggle"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  shippingSettings.discount_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {shippingSettings.discount_enabled && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rabatt (%)
              </label>
              <p className="text-xs text-slate-500 mb-1">
                Rabatten appliceras på hela orderns delsumma.
              </p>
              <Input
                type="number"
                min="0"
                max="100"
                value={shippingSettings.discount_percent}
                onChange={(e) => setShippingSettings(prev => ({ ...prev, discount_percent: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) }))}
                data-testid="discount-percent-input"
              />
              {shippingSettings.discount_percent > 0 && (
                <p className="text-sm text-[#2a9d8f] mt-2 font-medium">
                  Kunder får {shippingSettings.discount_percent}% rabatt på alla ordrar
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={onSaveShipping}
              disabled={savingShipping}
              className="min-w-[180px]"
              data-testid="save-discount-btn"
            >
              {savingShipping ? 'Sparar...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Spara rabattinställningar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Discount Codes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <Percent className="w-5 h-5" />
          Rabattkoder
        </h2>

        {/* Create new code */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <p className="font-medium text-slate-700 mb-3">Skapa ny rabattkod</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Kod</label>
              <Input
                value={newCode.code}
                onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="T.ex. SOMMAR20"
                data-testid="new-discount-code-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Rabatt (%)</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={newCode.discount_percent}
                onChange={(e) => setNewCode(prev => ({ ...prev, discount_percent: parseFloat(e.target.value) || 0 }))}
                data-testid="new-discount-percent-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max användningar (0 = obegränsat)</label>
              <Input
                type="number"
                min="0"
                value={newCode.max_uses}
                onChange={(e) => setNewCode(prev => ({ ...prev, max_uses: parseInt(e.target.value) || 0 }))}
                data-testid="new-discount-max-uses-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Utgångsdatum (valfritt)</label>
              <Input
                type="date"
                value={newCode.expires_at ? newCode.expires_at.split('T')[0] : ''}
                onChange={(e) => setNewCode(prev => ({ ...prev, expires_at: e.target.value ? new Date(e.target.value + 'T23:59:59Z').toISOString() : '' }))}
                data-testid="new-discount-expires-input"
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Button onClick={handleCreate} data-testid="create-discount-code-btn">
              <Plus className="w-4 h-4 mr-2" />
              Skapa kod
            </Button>
          </div>
        </div>

        {/* Optional email message */}
        {discountCodes.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Meddelande i e-post (valfritt)
            </label>
            <Input
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              placeholder="T.ex. Tack för att du är kund hos oss! Här är en rabatt..."
              data-testid="email-message-input"
            />
          </div>
        )}

        {/* Existing codes */}
        {discountCodes.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Inga rabattkoder skapade ännu.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-slate-600">Kod</th>
                  <th className="pb-2 font-medium text-slate-600">Rabatt</th>
                  <th className="pb-2 font-medium text-slate-600">Användningar</th>
                  <th className="pb-2 font-medium text-slate-600">Utgår</th>
                  <th className="pb-2 font-medium text-slate-600">Status</th>
                  <th className="pb-2 font-medium text-slate-600 text-right">Åtgärd</th>
                </tr>
              </thead>
              <tbody>
                {discountCodes.map((dc) => (
                  <tr key={dc.code} className="border-b last:border-0" data-testid={`discount-code-row-${dc.code}`}>
                    <td className="py-3 font-mono font-bold text-slate-900">{dc.code}</td>
                    <td className="py-3">{dc.discount_percent}%</td>
                    <td className="py-3">{dc.current_uses} / {dc.max_uses === 0 ? '\u221e' : dc.max_uses}</td>
                    <td className="py-3">{dc.expires_at ? new Date(dc.expires_at).toLocaleDateString('sv-SE') : '\u2014'}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${dc.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {dc.active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleSendEmailClick(dc.code)}
                          disabled={sendingEmail === dc.code || !dc.active}
                          className="text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-30"
                          title="Skicka till alla kunder via e-post"
                          data-testid={`email-code-${dc.code}`}
                        >
                          {sendingEmail === dc.code ? (
                            <span className="text-xs">Skickar...</span>
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => onToggleCode(dc.code, dc.active)}
                          className="text-slate-500 hover:text-[#2a9d8f] transition-colors"
                          title={dc.active ? 'Inaktivera' : 'Aktivera'}
                          data-testid={`toggle-code-${dc.code}`}
                        >
                          {dc.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => onDeleteCode(dc.code)}
                          className="text-slate-500 hover:text-red-500 transition-colors"
                          title="Radera"
                          data-testid={`delete-code-${dc.code}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default DiscountCodesSection;
