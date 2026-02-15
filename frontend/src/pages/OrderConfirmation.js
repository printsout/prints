import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Package, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { useCart } from '../context/CartContext';

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();
  
  const [status, setStatus] = useState('loading');
  const [paymentData, setPaymentData] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const response = await api.get(`/payments/status/${sessionId}`);
        setPaymentData(response.data);

        if (response.data.payment_status === 'paid') {
          setStatus('success');
          // Clear cart after successful payment
          await clearCart();
        } else if (response.data.status === 'expired') {
          setStatus('expired');
        } else if (attempts < 5) {
          // Continue polling
          setTimeout(() => setAttempts(prev => prev + 1), 2000);
        } else {
          setStatus('pending');
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
        if (attempts < 3) {
          setTimeout(() => setAttempts(prev => prev + 1), 2000);
        } else {
          setStatus('error');
        }
      }
    };

    checkPaymentStatus();
  }, [sessionId, attempts, clearCart]);

  const formatAmount = (amount) => {
    if (!amount) return '0';
    // Amount is in cents
    return (amount / 100).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12" data-testid="order-confirmation-page">
      <div className="container-main max-w-2xl">
        {status === 'loading' && (
          <div className="bg-white rounded-xl p-12 shadow-soft text-center">
            <div className="spinner mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-slate-700">Kontrollerar betalning...</h2>
            <p className="text-slate-500 mt-2">Vänta medan vi bekräftar din beställning</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-xl p-12 shadow-soft text-center animate-slide-up">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2" data-testid="success-title">
              Tack för din beställning!
            </h1>
            <p className="text-slate-600 mb-8">
              Din betalning har genomförts. En orderbekräftelse har skickats till din e-post.
            </p>
            
            {paymentData && (
              <div className="bg-slate-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Orderdetaljer
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Betalningsstatus</span>
                    <span className="text-green-600 font-medium">Betald</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Summa</span>
                    <span className="font-medium">{formatAmount(paymentData.amount_total)} {paymentData.currency?.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Session ID</span>
                    <span className="font-mono text-xs truncate max-w-[200px]">{sessionId}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/konto">
                <Button variant="outline" className="btn-outline" data-testid="view-orders">
                  Se dina beställningar
                </Button>
              </Link>
              <Link to="/produkter">
                <Button className="btn-primary" data-testid="continue-shopping">
                  Fortsätt handla
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className="bg-white rounded-xl p-12 shadow-soft text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Betalning bearbetas
            </h1>
            <p className="text-slate-600 mb-6">
              Din betalning bearbetas. Du kommer att få en bekräftelse via e-post när den är klar.
            </p>
            <Link to="/">
              <Button className="btn-primary">
                Tillbaka till startsidan
              </Button>
            </Link>
          </div>
        )}

        {status === 'expired' && (
          <div className="bg-white rounded-xl p-12 shadow-soft text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Betalningssessionen har gått ut
            </h1>
            <p className="text-slate-600 mb-6">
              Din betalningssession har löpt ut. Försök igen.
            </p>
            <Link to="/varukorg">
              <Button className="btn-primary">
                Tillbaka till varukorgen
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-xl p-12 shadow-soft text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Något gick fel
            </h1>
            <p className="text-slate-600 mb-6">
              Vi kunde inte verifiera din betalning. Kontakta kundtjänst om problemet kvarstår.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/varukorg">
                <Button variant="outline" className="btn-outline">
                  Tillbaka till varukorgen
                </Button>
              </Link>
              <Link to="/">
                <Button className="btn-primary">
                  Till startsidan
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderConfirmation;
