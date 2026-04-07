import { Link } from 'react-router-dom';
import { Instagram, Facebook } from 'lucide-react';

const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.52a8.27 8.27 0 0 0 4.85 1.56V6.69h-1.09z"/>
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-100" data-testid="footer">
      <div className="container-main py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="block">
              <img 
                src="https://customer-assets.emergentagent.com/job_be645e3c-37b1-47f0-ae1a-5a2a36047627/artifacts/trb662lu_logo1.png" 
                alt="Printsout" 
                className="h-16 w-auto"
              />
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed">
              Kvalitet i varje utskrift. Skapa personliga produkter med dina egna foton.
            </p>
            <div className="flex items-center gap-3" data-testid="social-media-icons">
              <a 
                href="https://www.instagram.com/printsout" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-slate-200 hover:bg-[#E4405F] flex items-center justify-center text-slate-500 hover:text-white transition-all"
                data-testid="social-instagram"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://www.facebook.com/printsout" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-slate-200 hover:bg-[#1877F2] flex items-center justify-center text-slate-500 hover:text-white transition-all"
                data-testid="social-facebook"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://www.tiktok.com/@printsout" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-slate-200 hover:bg-black flex items-center justify-center text-slate-500 hover:text-white transition-all"
                data-testid="social-tiktok"
                aria-label="TikTok"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Produkter</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/produkter/mugg" className="text-slate-500 hover:text-primary text-sm transition-colors">
                  Muggar
                </Link>
              </li>
              <li>
                <Link to="/produkter/tshirt" className="text-slate-500 hover:text-primary text-sm transition-colors">
                  T-shirts
                </Link>
              </li>
              <li>
                <Link to="/produkter/hoodie" className="text-slate-500 hover:text-primary text-sm transition-colors">
                  Hoodies
                </Link>
              </li>
              <li>
                <Link to="/produkter/poster" className="text-slate-500 hover:text-primary text-sm transition-colors">
                  Posters
                </Link>
              </li>
              <li>
                <Link to="/produkter/tygkasse" className="text-slate-500 hover:text-primary text-sm transition-colors">
                  Tygkassar
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/sida/faq" className="text-slate-500 hover:text-primary text-sm transition-colors">FAQ</Link>
              </li>
              <li>
                <Link to="/sida/frakt-leverans" className="text-slate-500 hover:text-primary text-sm transition-colors">Frakt & Leverans</Link>
              </li>
              <li>
                <Link to="/sida/returer" className="text-slate-500 hover:text-primary text-sm transition-colors">Returer</Link>
              </li>
              <li>
                <Link to="/sida/kontakt" className="text-slate-500 hover:text-primary text-sm transition-colors">Kontakt</Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Information</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/sida/om-oss" className="text-slate-500 hover:text-primary text-sm transition-colors">Om oss</Link>
              </li>
              <li>
                <Link to="/sida/integritetspolicy" className="text-slate-500 hover:text-primary text-sm transition-colors">Integritetspolicy</Link>
              </li>
              <li>
                <Link to="/sida/kopvillkor" className="text-slate-500 hover:text-primary text-sm transition-colors">Köpvillkor</Link>
              </li>
              <li>
                <Link to="/foretag" className="text-slate-500 hover:text-primary text-sm transition-colors">För företag</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-200 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            © 2024 Printsout. Alla rättigheter förbehållna.
          </p>
          <div className="flex items-center gap-4">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" 
              alt="Visa" 
              className="h-6 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
            />
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" 
              alt="Mastercard" 
              className="h-6 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
            />
            <span className="text-slate-400 text-xs px-2 py-1 border border-slate-300 rounded">Swish</span>
            <span className="text-slate-400 text-xs px-2 py-1 border border-slate-300 rounded">Klarna</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
