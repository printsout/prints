import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Inloggningen misslyckades');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-6" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary font-accent">
            NordicPrint
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-6">Välkommen tillbaka</h1>
          <p className="text-slate-500 mt-2">Logga in på ditt konto</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="••••••••"
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

            <Button 
              type="submit" 
              className="btn-primary w-full"
              disabled={loading}
              data-testid="login-submit"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5 mr-2" />
                  Loggar in...
                </>
              ) : (
                'Logga in'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-slate-500 mt-6">
          Har du inget konto?{' '}
          <Link to="/registrera" className="text-primary font-medium hover:underline" data-testid="register-link">
            Registrera dig
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
