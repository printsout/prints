import { Link } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';

const categories = [
  { href: '/produkter/mugg', label: 'Muggar', icon: 'Coffee' },
  { href: '/produkter/tshirt', label: 'T-shirts', icon: 'Shirt' },
  { href: '/produkter/hoodie', label: 'Hoodies', icon: 'Layers' },
  { href: '/produkter/poster', label: 'Posters', icon: 'Image' },
  { href: '/produkter/mobilskal', label: 'Mobilskal', icon: 'Smartphone' },
  { href: '/produkter/tygkasse', label: 'Tygkassar', icon: 'ShoppingBag' },
  { href: '/produkter/namnskylt', label: 'Namnlappar', icon: 'Tag' },
  { href: '/produkter/kalender', label: 'Kalendrar', icon: 'Calendar' },
  { href: '/produkter/fotoalbum', label: 'Fotoalbum', icon: 'BookOpen' },
];

export const MobileMenu = ({ isOpen, categories: cats, user, onClose, onLogout }) => {
  if (!isOpen) return null;
  return (
    <div className="md:hidden fixed inset-x-0 top-20 bg-white border-b border-slate-200 shadow-lg animate-fade-in z-50" data-testid="mobile-menu">
      <div className="container-main py-4 space-y-1 max-h-[calc(100vh-80px)] overflow-y-auto">
        <Link to="/" className="block text-base font-medium text-slate-700 hover:text-primary py-2.5 px-2" onClick={onClose}>Hem</Link>
        <Link to="/produkter" className="block text-base font-semibold text-[#2a9d8f] py-2.5 px-2" onClick={onClose}>Alla produkter</Link>
        <div className="pl-2 space-y-0.5">
          {cats.map((cat) => (
            <Link key={cat.href} to={cat.href} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-slate-50 transition-colors" onClick={onClose}>
              <span className="text-sm font-medium text-slate-600">{cat.label}</span>
            </Link>
          ))}
        </div>
        <Link to="/foretag" className="block text-base font-medium text-slate-700 hover:text-primary py-2.5 px-2" onClick={onClose}>Företag</Link>
        <div className="border-t border-slate-100 pt-3 mt-3 space-y-1">
          {user ? (
            <>
              <Link to="/konto" className="block text-base font-medium text-slate-700 hover:text-primary py-2.5 px-2" onClick={onClose}>Mitt konto</Link>
              <button onClick={onLogout} className="block text-base font-medium text-slate-500 hover:text-primary py-2.5 px-2">Logga ut</button>
            </>
          ) : (
            <>
              <Link to="/logga-in" className="block text-base font-medium text-slate-700 hover:text-primary py-2.5 px-2" onClick={onClose}>Logga in</Link>
              <Link to="/registrera" className="block text-base font-medium text-[#2a9d8f] py-2.5 px-2" onClick={onClose}>Registrera</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export { categories };
