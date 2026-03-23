import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, ChevronDown, Coffee, Shirt, Image, Tag, Calendar, BookOpen, Smartphone, ShoppingBag, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';

const categories = [
  { href: '/produkter/mugg', label: 'Muggar', icon: Coffee },
  { href: '/produkter/tshirt', label: 'T-shirts', icon: Shirt },
  { href: '/produkter/hoodie', label: 'Hoodies', icon: Layers },
  { href: '/produkter/poster', label: 'Posters', icon: Image },
  { href: '/produkter/mobilskal', label: 'Mobilskal', icon: Smartphone },
  { href: '/produkter/tygkasse', label: 'Tygkassar', icon: ShoppingBag },
  { href: '/produkter/namnskylt', label: 'Namnlappar', icon: Tag },
  { href: '/produkter/kalender', label: 'Kalendrar', icon: Calendar },
  { href: '/produkter/fotoalbum', label: 'Fotoalbum', icon: BookOpen },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setDropdownOpen(false), 200);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-100" data-testid="navbar">
      <div className="container-main">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <img
              src="https://customer-assets.emergentagent.com/job_be645e3c-37b1-47f0-ae1a-5a2a36047627/artifacts/trb662lu_logo1.png"
              alt="Printout"
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
              data-testid="nav-link-hem"
            >
              Hem
            </Link>

            {/* Produkter Dropdown */}
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              data-testid="products-dropdown"
            >
              <button
                onClick={() => { setDropdownOpen(!dropdownOpen); }}
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                  dropdownOpen ? 'text-[#2a9d8f]' : 'text-slate-600 hover:text-primary'
                }`}
                data-testid="products-dropdown-trigger"
              >
                Produkter
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[520px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
                  style={{ animation: 'fadeIn 0.15s ease-out' }}
                  data-testid="dropdown-menu"
                >
                  {/* Header */}
                  <div className="px-5 pt-4 pb-2 border-b border-slate-100">
                    <Link
                      to="/produkter"
                      onClick={() => setDropdownOpen(false)}
                      className="text-sm font-semibold text-[#2a9d8f] hover:underline"
                      data-testid="dropdown-all-products"
                    >
                      Visa alla produkter
                    </Link>
                  </div>

                  {/* Category Grid */}
                  <div className="p-4 grid grid-cols-3 gap-1">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <Link
                          key={cat.href}
                          to={cat.href}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#2a9d8f]/5 transition-colors group"
                          data-testid={`dropdown-${cat.label.toLowerCase()}`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#2a9d8f]/10 flex items-center justify-center transition-colors">
                            <Icon className="w-4 h-4 text-slate-500 group-hover:text-[#2a9d8f] transition-colors" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 group-hover:text-[#2a9d8f] transition-colors">
                            {cat.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Link
              to="/varukorg"
              className="relative p-2 hover:bg-slate-100 rounded-full transition-colors"
              data-testid="cart-button"
            >
              <ShoppingCart className="w-5 h-5 text-slate-700" />
              {itemCount > 0 && (
                <span className="cart-badge" data-testid="cart-count">{itemCount}</span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  to="/konto"
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  data-testid="account-button"
                >
                  <User className="w-5 h-5 text-slate-700" />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  data-testid="logout-button"
                >
                  Logga ut
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/logga-in">
                  <Button variant="ghost" size="sm" data-testid="login-button">
                    Logga in
                  </Button>
                </Link>
                <Link to="/registrera">
                  <Button size="sm" className="btn-primary text-sm py-2 px-4" data-testid="register-button">
                    Registrera
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 hover:bg-slate-100 rounded-full transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-700" />
              ) : (
                <Menu className="w-5 h-5 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-20 bg-white border-b border-slate-200 shadow-lg animate-fade-in z-50" data-testid="mobile-menu">
          <div className="container-main py-4 space-y-1 max-h-[calc(100vh-80px)] overflow-y-auto">
            <Link
              to="/"
              className="block text-base font-medium text-slate-700 hover:text-primary py-2.5 px-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hem
            </Link>

            <Link
              to="/produkter"
              className="block text-base font-semibold text-[#2a9d8f] py-2.5 px-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Alla produkter
            </Link>

            <div className="pl-2 space-y-0.5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.href}
                    to={cat.href}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-slate-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">{cat.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-slate-100 pt-3 mt-3 space-y-1">
              {user ? (
                <>
                  <Link
                    to="/konto"
                    className="block text-base font-medium text-slate-700 hover:text-primary py-2.5 px-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mitt konto
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block text-base font-medium text-slate-500 hover:text-primary py-2.5 px-2"
                  >
                    Logga ut
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/logga-in"
                    className="block text-base font-medium text-slate-700 hover:text-primary py-2.5 px-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Logga in
                  </Link>
                  <Link
                    to="/registrera"
                    className="block text-base font-medium text-[#2a9d8f] py-2.5 px-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Registrera
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
