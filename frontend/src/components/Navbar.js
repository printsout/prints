import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { MobileMenu, categories } from './navbar/MobileMenu';
import { UserDropdown } from './navbar/UserDropdown';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const itemCount = cart.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm" data-testid="navbar">
      <div className="container-main">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0" data-testid="logo-link">
            <img
              src="/logo.jpg"
              alt="Printsout"
              className="h-14 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors" data-testid="nav-home">
              Hem
            </Link>

            {/* Products Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShowCategories(true)}
              onMouseLeave={() => setShowCategories(false)}
            >
              <Link
                to="/produkter"
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors flex items-center gap-1"
                data-testid="nav-products"
              >
                Produkter <ChevronDown className="w-3.5 h-3.5" />
              </Link>
              {showCategories && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <Link to="/produkter" className="block px-4 py-2 text-sm font-semibold text-[#2a9d8f] hover:bg-slate-50">
                    Alla produkter
                  </Link>
                  <div className="border-t border-slate-100 my-1"></div>
                  {categories.map((cat) => (
                    <Link
                      key={cat.href}
                      to={cat.href}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                      onClick={() => setShowCategories(false)}
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/foretag" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors" data-testid="nav-business">
              Företag
            </Link>
          </div>

          {/* Right: User + Cart + Mobile Toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <UserDropdown user={user} onLogout={handleLogout} />
            </div>

            <Link
              to="/varukorg"
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
              data-testid="cart-link"
            >
              <ShoppingCart className="w-5 h-5 text-slate-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center" data-testid="cart-count">
                  {itemCount}
                </span>
              )}
            </Link>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileOpen}
        categories={categories}
        user={user}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />
    </nav>
  );
};

export default Navbar;
