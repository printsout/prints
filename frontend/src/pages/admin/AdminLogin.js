import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Lock, Mail, Shield, ArrowLeft, KeyRound } from 'lucide-react';
import api from '../../services/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { setAdminToken } = useAdmin();
  const [step, setStep] = useState('login'); // login, 2fa, forgot, reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/login', { email, password });
      if (res.data.requires_2fa) {
        setTempToken(res.data.temp_token);
        setStep('2fa');
        toast.info('Ange verifieringskoden från din Authenticator-app');
      } else {
        setAdminToken(res.data.access_token);
        toast.success('Inloggad som administratör');
        navigate('/admin/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Inloggning misslyckades');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/verify-2fa', { temp_token: tempToken, code: totpCode });
      setAdminToken(res.data.access_token);
      toast.success('Inloggad med tvåstegsverifiering');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Felaktig kod');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/forgot-password', { email });
      if (res.data.reset_code) {
        setResetCode(res.data.reset_code);
      }
      toast.success('Återställningskod genererad');
      setStep('reset');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Något gick fel');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Lösenorden matchar inte');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Lösenordet måste vara minst 8 tecken');
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin/reset-password', { code: resetCode, new_password: newPassword });
      toast.success('Lösenordet har ändrats! Logga in med det nya lösenordet.');
      setStep('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetCode('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kunde inte ändra lösenord');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_be645e3c-37b1-47f0-ae1a-5a2a36047627/artifacts/trb662lu_logo1.png" 
            alt="Printsout" 
            className="h-20 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 mt-2">
            {step === 'login' && 'Logga in för att hantera din webshop'}
            {step === '2fa' && 'Ange koden från Microsoft Authenticator'}
            {step === 'forgot' && 'Återställ ditt lösenord'}
            {step === 'reset' && 'Ange ny lösenord'}
          </p>
        </div>

        {/* LOGIN STEP */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-xl p-8" data-testid="login-form">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">E-postadress</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@printsout.se"
                    className="pl-10"
                    required
                    data-testid="admin-email"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lösenord</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                    data-testid="admin-password"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading} data-testid="admin-login-btn">
                {loading ? 'Loggar in...' : 'Logga in'}
              </Button>
              <button
                type="button"
                onClick={() => setStep('forgot')}
                className="w-full text-center text-sm text-[#2a9d8f] hover:underline"
                data-testid="forgot-password-link"
              >
                Glömt lösenord?
              </button>
            </div>
          </form>
        )}

        {/* 2FA STEP */}
        {step === '2fa' && (
          <form onSubmit={handleVerify2FA} className="bg-white rounded-2xl shadow-xl p-8" data-testid="2fa-form">
            <div className="space-y-6">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-[#2a9d8f]/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-[#2a9d8f]" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-slate-900 text-center">Tvåstegsverifiering</h2>
              <p className="text-sm text-slate-500 text-center">
                Öppna Microsoft Authenticator och ange den 6-siffriga koden
              </p>
              <div>
                <Input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                  maxLength={6}
                  autoFocus
                  required
                  data-testid="totp-code-input"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading || totpCode.length !== 6} data-testid="verify-2fa-btn">
                {loading ? 'Verifierar...' : 'Verifiera'}
              </Button>
              <button
                type="button"
                onClick={() => { setStep('login'); setTotpCode(''); }}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Tillbaka
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD STEP */}
        {step === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="bg-white rounded-2xl shadow-xl p-8" data-testid="forgot-form">
            <div className="space-y-6">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-amber-500" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-slate-900 text-center">Glömt lösenord</h2>
              <p className="text-sm text-slate-500 text-center">
                Ange din admin-e-postadress för att få en återställningskod
              </p>
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@printsout.se"
                    className="pl-10"
                    required
                    data-testid="forgot-email"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading} data-testid="forgot-submit-btn">
                {loading ? 'Skickar...' : 'Skicka återställningskod'}
              </Button>
              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Tillbaka till inloggning
              </button>
            </div>
          </form>
        )}

        {/* RESET PASSWORD STEP */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="bg-white rounded-2xl shadow-xl p-8" data-testid="reset-form">
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 text-center">Nytt lösenord</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Återställningskod</label>
                <Input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX"
                  className="text-center font-mono tracking-wider"
                  required
                  data-testid="reset-code-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nytt lösenord</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minst 8 tecken"
                    className="pl-10"
                    required
                    data-testid="new-password-input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Bekräfta lösenord</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Upprepa lösenord"
                    className="pl-10"
                    required
                    data-testid="confirm-password-input"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading} data-testid="reset-submit-btn">
                {loading ? 'Ändrar...' : 'Ändra lösenord'}
              </Button>
              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Tillbaka till inloggning
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-6">
          <a href="/" className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Tillbaka till butiken
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
