import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Vänligen fyll i alla fält');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Lösenorden matchar inte');
      return;
    }

    if (password.length < 6) {
      toast.error('Lösenordet måste vara minst 6 tecken');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Konto skapat! Välkommen!');
      navigate('/konto');
    } catch (error) {
      console.error('Register error:', error);
      toast.error(error.response?.data?.detail || 'Registreringen misslyckades');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-6" data-testid="register-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary font-accent">
            Printout
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-6">Skapa konto</h1>
          <p className="text-slate-500 mt-2">Registrera dig för att komma igång</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Namn</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  placeholder="Ditt namn"
                  data-testid="register-name"
                />
              </div>
            </div>

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
                  data-testid="register-email"
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
                  placeholder="Minst 6 tecken"
                  data-testid="register-password"
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

            <div>
              <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Upprepa lösenord"
                  data-testid="register-confirm-password"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="btn-primary w-full"
              disabled={loading}
              data-testid="register-submit"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5 mr-2" />
                  Skapar konto...
                </>
              ) : (
                'Skapa konto'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-slate-500 mt-6">
          Har du redan ett konto?{' '}
          <Link to="/logga-in" className="text-primary font-medium hover:underline" data-testid="login-link">
            Logga in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
