import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
      data-testid="cookie-banner"
    >
      <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Cookie className="w-8 h-8 shrink-0 text-[#2a9d8f]" />
        <div className="flex-1 text-sm leading-relaxed">
          <p className="font-semibold text-base mb-1">Vi använder cookies</p>
          <p className="text-slate-300">
            Vi använder cookies för att förbättra din upplevelse, analysera trafik och visa relevanta erbjudanden. 
            Genom att klicka "Acceptera" godkänner du vår användning av cookies.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleDecline}
            className="flex-1 sm:flex-none px-5 py-2.5 text-sm rounded-lg border border-slate-600 hover:border-slate-400 transition-colors"
            data-testid="cookie-decline-btn"
          >
            Avböj
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 sm:flex-none px-5 py-2.5 text-sm rounded-lg bg-[#2a9d8f] hover:bg-[#238b7e] font-medium transition-colors"
            data-testid="cookie-accept-btn"
          >
            Acceptera
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
