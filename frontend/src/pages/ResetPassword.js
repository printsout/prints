import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import api from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(token ? 'form' : 'invalid'); // form, success, invalid, error

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Lösenorden matchar inte');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: newPassword });
      setStatus('success');
    } catch (error) {
      const msg = error.response?.data?.detail || 'Något gick fel';
      if (msg.includes('gått ut') || msg.includes('Ogiltig')) {
        setStatus('error');
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-6" data-testid="reset-invalid">
        <div className="w-full max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Ogiltig länk</h1>
          <p className="text-slate-500 mb-6">Återställningslänken saknas eller är felaktig.</p>
          <Link to="/logga-in">
            <Button data-testid="back-to-login-btn">Tillbaka till inloggning</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-6" data-testid="reset-success">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Lösenordet har ändrats!</h1>
          <p className="text-slate-500 mb-6">Du kan nu logga in med ditt nya lösenord.</p>
          <Link to="/logga-in">
            <Button className="btn-primary" data-testid="go-to-login-btn">Logga in</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-6" data-testid="reset-expired">
        <div className="w-full max-w-md text-center">
          <XCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Länken har gått ut</h1>
          <p className="text-slate-500 mb-6">Begär en ny återställningslänk från inloggningssidan.</p>
          <Link to="/logga-in">
            <Button className="btn-primary" data-testid="back-to-login-btn">Tillbaka till inloggning</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-6" data-testid="reset-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary font-accent">
            Printsout
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-6">Välj nytt lösenord</h1>
          <p className="text-slate-500 mt-2">Ange ditt nya lösenord nedan</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-soft">
          <form onSubmit={handleReset} className="space-y-6" data-testid="reset-form">
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
                  data-testid="new-password-input"
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
                  data-testid="confirm-password-input"
                />
              </div>
            </div>
            <Button type="submit" className="btn-primary w-full" disabled={loading} data-testid="reset-submit-btn">
              {loading ? 'Ändrar...' : 'Ändra lösenord'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
