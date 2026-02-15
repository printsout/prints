import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-100" data-testid="footer">
      <div className="container-main py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-bold text-primary font-accent">
              NordicPrint
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed">
              Skapa personliga produkter med dina egna foton. Högsta kvalité, svensk design.
            </p>
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
                <span className="text-slate-500 text-sm">FAQ</span>
              </li>
              <li>
                <span className="text-slate-500 text-sm">Frakt & Leverans</span>
              </li>
              <li>
                <span className="text-slate-500 text-sm">Returer</span>
              </li>
              <li>
                <span className="text-slate-500 text-sm">Kontakt</span>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Information</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-slate-500 text-sm">Om oss</span>
              </li>
              <li>
                <span className="text-slate-500 text-sm">Integritetspolicy</span>
              </li>
              <li>
                <span className="text-slate-500 text-sm">Köpvillkor</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-200 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            © 2024 NordicPrint. Alla rättigheter förbehållna.
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
