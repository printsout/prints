import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Lock, Mail, ArrowLeft, KeyRound } from 'lucide-react';

export const LoginForm = ({ email, setEmail, password, setPassword, loading, onSubmit, onForgotPassword }) => (
  <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl p-8" data-testid="login-form">
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">E-postadress</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@printsout.se" className="pl-10" required data-testid="admin-email" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Lösenord</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="........" className="pl-10" required data-testid="admin-password" />
        </div>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={loading} data-testid="admin-login-btn">
        {loading ? 'Loggar in...' : 'Logga in'}
      </Button>
      <button type="button" onClick={onForgotPassword} className="w-full text-center text-sm text-[#2a9d8f] hover:underline" data-testid="forgot-password-link">
        Glömt lösenord?
      </button>
    </div>
  </form>
);

export const ForgotPasswordForm = ({ email, setEmail, loading, onSubmit, onBack }) => (
  <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl p-8" data-testid="forgot-form">
    <div className="space-y-6">
      <div className="flex justify-center mb-2">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
          <KeyRound className="w-8 h-8 text-amber-500" />
        </div>
      </div>
      <h2 className="text-lg font-bold text-slate-900 text-center">Glömt lösenord</h2>
      <p className="text-sm text-slate-500 text-center">Ange din admin-e-postadress för att få en återställningskod</p>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@printsout.se" className="pl-10" required data-testid="forgot-email" />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={loading} data-testid="forgot-submit-btn">
        {loading ? 'Skickar...' : 'Skicka återställningskod'}
      </Button>
      <button type="button" onClick={onBack} className="w-full text-center text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Tillbaka till inloggning
      </button>
    </div>
  </form>
);

export const ResetPasswordForm = ({ resetCode, setResetCode, newPassword, setNewPassword, confirmPassword, setConfirmPassword, loading, onSubmit, onBack }) => (
  <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl p-8" data-testid="reset-form">
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 text-center">Nytt lösenord</h2>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Återställningskod</label>
        <Input type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value.toUpperCase())} placeholder="XXXXXXXX" className="text-center font-mono tracking-wider" required data-testid="reset-code-input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Nytt lösenord</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minst 8 tecken" className="pl-10" required data-testid="new-password-input" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Bekräfta lösenord</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Upprepa lösenord" className="pl-10" required data-testid="confirm-password-input" />
        </div>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={loading} data-testid="reset-submit-btn">
        {loading ? 'Ändrar...' : 'Ändra lösenord'}
      </Button>
      <button type="button" onClick={onBack} className="w-full text-center text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Tillbaka till inloggning
      </button>
    </div>
  </form>
);
