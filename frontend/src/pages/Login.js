import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState('login'); // login, forgot, reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vänligen fyll i alla fält');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Välkommen tillbaka!');
      navigate('/konto');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Inloggningen misslyckades');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Ange din e-postadress');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('En återställningskod har skickats till din e-post');
      setStep('reset');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Något gick fel');
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
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code: resetCode, new_password: newPassword });
      toast.success('Lösenordet har ändrats! Logga in med ditt nya lösenord.');
      setStep('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetCode('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kunde inte ändra lösenord');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-6" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary font-accent">
            Printsout
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-6">
            {step === 'login' && 'Välkommen tillbaka'}
            {step === 'forgot' && 'Glömt lösenord'}
            {step === 'reset' && 'Nytt lösenord'}
          </h1>
          <p className="text-slate-500 mt-2">
            {step === 'login' && 'Logga in på ditt konto'}
            {step === 'forgot' && 'Ange din e-post för att få en återställningskod'}
            {step === 'reset' && 'Ange koden och ditt nya lösenord'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-soft">
          {/* LOGIN */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6" data-testid="login-form">
              <div>
                <Label htmlFor="email">E-post</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="din@email.se"
                    data-testid="login-email"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Lösenord</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="........"
                    data-testid="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="btn-primary w-full" disabled={loading} data-testid="login-submit">
                {loading ? 'Loggar in...' : 'Logga in'}
              </Button>
              <button
                type="button"
                onClick={() => setStep('forgot')}
                className="w-full text-center text-sm text-primary hover:underline"
                data-testid="customer-forgot-link"
              >
                Glömt lösenord?
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {step === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-6" data-testid="customer-forgot-form">
              <div className="flex justify-center mb-2">
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                  <KeyRound className="w-7 h-7 text-amber-500" />
                </div>
              </div>
              <div>
                <Label htmlFor="forgot-email">E-postadress</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="din@email.se"
                    required
                    data-testid="customer-forgot-email"
                  />
                </div>
              </div>
              <Button type="submit" className="btn-primary w-full" disabled={loading} data-testid="customer-forgot-submit">
                {loading ? 'Skickar...' : 'Skicka återställningskod'}
              </Button>
              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Tillbaka till inloggning
              </button>
            </form>
          )}

          {/* RESET PASSWORD */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5" data-testid="customer-reset-form">
              <div>
                <Label>Återställningskod</Label>
                <Input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX"
                  className="mt-1 text-center font-mono tracking-wider"
                  required
                  data-testid="customer-reset-code"
                />
                <p className="text-xs text-slate-400 mt-1">Kolla din e-post efter koden</p>
              </div>
              <div>
                <Label>Nytt lösenord</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minst 8 tecken"
                    className="pl-10"
                    required
                    data-testid="customer-new-password"
                  />
                </div>
              </div>
              <div>
                <Label>Bekräfta lösenord</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Upprepa lösenord"
                    className="pl-10"
                    required
                    data-testid="customer-confirm-password"
                  />
                </div>
              </div>
              <Button type="submit" className="btn-primary w-full" disabled={loading} data-testid="customer-reset-submit">
                {loading ? 'Ändrar...' : 'Ändra lösenord'}
              </Button>
              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Tillbaka till inloggning
              </button>
            </form>
          )}
        </div>

        {step === 'login' && (
          <p className="text-center text-slate-500 mt-6">
            Har du inget konto?{' '}
            <Link to="/registrera" className="text-primary font-medium hover:underline" data-testid="register-link">
              Registrera dig
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
