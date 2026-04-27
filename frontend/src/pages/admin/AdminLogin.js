import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { toast } from 'sonner';
import api from '../../services/api';
import { LoginForm, ForgotPasswordForm, ResetPasswordForm } from './login/LoginForms';
import { SetupTwoFactor, VerifyTwoFactor } from './login/TwoFactorForms';

const STEP_DESCRIPTIONS = {
  login: 'Logga in för att hantera din webshop',
  setup: 'Konfigurera tvåstegsverifiering',
  verify: 'Ange koden från Microsoft Authenticator',
  forgot: 'Återställ ditt lösenord',
  reset: 'Ange ny lösenord',
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const { setAdminToken } = useAdmin();
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [manualSecret, setManualSecret] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/login', { email, password });
      if (!res.data.requires_2fa) {
        // Direct login — no 2FA
        sessionStorage.setItem('adminToken', res.data.token);
        setAdminToken(res.data.token);
        toast.success('Inloggad!');
        navigate('/admin/dashboard');
        return;
      }
      setTempToken(res.data.temp_token);
      if (res.data.needs_setup) {
        setQrCode(res.data.qr_code);
        setManualSecret(res.data.secret);
        setStep('setup');
        toast.info('Skanna QR-koden med Microsoft Authenticator');
      } else {
        setStep('verify');
        toast.info('Ange koden från din Authenticator-app');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Inloggning misslyckades');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/verify-2fa', { temp_token: tempToken, code: totpCode });
      setAdminToken(res.data.access_token);
      toast.success('Inloggad!');
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
      if (res.data.reset_code) setResetCode(res.data.reset_code);
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
    if (newPassword !== confirmPassword) { toast.error('Lösenorden matchar inte'); return; }
    if (newPassword.length < 8) { toast.error('Lösenordet måste vara minst 8 tecken'); return; }
    setLoading(true);
    try {
      await api.post('/admin/reset-password', { code: resetCode, new_password: newPassword });
      toast.success('Lösenordet har ändrats! Logga in med det nya lösenordet.');
      setStep('login');
      setPassword(''); setNewPassword(''); setConfirmPassword(''); setResetCode('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kunde inte ändra lösenord');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => { setStep('login'); setTotpCode(''); setQrCode(''); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="Printsout" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 mt-2">{STEP_DESCRIPTIONS[step]}</p>
        </div>

        {step === 'login' && <LoginForm email={email} setEmail={setEmail} password={password} setPassword={setPassword} loading={loading} onSubmit={handleLogin} onForgotPassword={() => setStep('forgot')} />}
        {step === 'setup' && <SetupTwoFactor qrCode={qrCode} manualSecret={manualSecret} totpCode={totpCode} setTotpCode={setTotpCode} loading={loading} onVerify={handleVerify} onBack={goBack} />}
        {step === 'verify' && <VerifyTwoFactor totpCode={totpCode} setTotpCode={setTotpCode} loading={loading} onVerify={handleVerify} onBack={goBack} />}
        {step === 'forgot' && <ForgotPasswordForm email={email} setEmail={setEmail} loading={loading} onSubmit={handleForgotPassword} onBack={() => setStep('login')} />}
        {step === 'reset' && <ResetPasswordForm resetCode={resetCode} setResetCode={setResetCode} newPassword={newPassword} setNewPassword={setNewPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} loading={loading} onSubmit={handleResetPassword} onBack={() => setStep('login')} />}

        <div className="text-center mt-6">
          <a href="/" className="text-slate-400 hover:text-white transition-colors text-sm">
            &larr; Tillbaka till butiken
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
