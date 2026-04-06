import { Link } from 'react-router-dom';
import { User, ChevronDown, LogOut, Package, Settings } from 'lucide-react';

export const UserDropdown = ({ user, onLogout }) => {
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/logga-in" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors px-3 py-2" data-testid="login-link">
          Logga in
        </Link>
        <Link to="/registrera" data-testid="register-link">
          <span className="bg-[#2a9d8f] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#238b7e] transition-colors">
            Registrera
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-primary transition-colors" data-testid="user-menu-btn">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <span className="hidden lg:inline">{user.name || user.email}</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <Link to="/konto" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" data-testid="my-account-link">
          <Package className="w-4 h-4" /> Mitt konto
        </Link>
        <button onClick={onLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-red-500" data-testid="logout-btn">
          <LogOut className="w-4 h-4" /> Logga ut
        </button>
      </div>
    </div>
  );
};
