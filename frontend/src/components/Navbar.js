import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const navLinks = [
    { href: '/produkter', label: 'Produkter' },
    { href: '/produkter/mugg', label: 'Muggar' },
    { href: '/produkter/tshirt', label: 'T-shirts' },
    { href: '/produkter/poster', label: 'Posters' },
  ];

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
          <Link 
            to="/" 
            className="flex items-center gap-2"
            data-testid="logo-link"
          >
            <span className="text-2xl font-bold text-primary font-accent">NordicPrint</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                data-testid={`nav-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
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
        <div className="md:hidden fixed inset-x-0 top-20 bg-white border-b border-slate-200 shadow-lg animate-fade-in" data-testid="mobile-menu">
          <div className="container-main py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block text-lg font-medium text-slate-700 hover:text-primary py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              {user ? (
                <>
                  <Link
                    to="/konto"
                    className="block text-lg font-medium text-slate-700 hover:text-primary py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mitt konto
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block text-lg font-medium text-slate-500 hover:text-primary py-2"
                  >
                    Logga ut
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/logga-in"
                    className="block text-lg font-medium text-slate-700 hover:text-primary py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Logga in
                  </Link>
                  <Link
                    to="/registrera"
                    className="block text-lg font-medium text-primary py-2"
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
    </nav>
  );
};

export default Navbar;
