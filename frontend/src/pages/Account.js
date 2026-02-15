import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, Palette, LogOut } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';

const Account = () => {
  const navigate = useNavigate();
  const { user, token, logout, loading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/logga-in');
      return;
    }

    if (user && token) {
      fetchData();
    }
  }, [user, token, authLoading, navigate]);

  const fetchData = async () => {
    try {
      const [ordersRes, designsRes] = await Promise.all([
        axios.get(`${API}/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/designs/my-designs`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setOrders(ordersRes.data);
      setDesigns(designsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Du har loggats ut');
  };

  const handleDeleteDesign = async (designId) => {
    try {
      await axios.delete(`${API}/designs/${designId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDesigns(designs.filter(d => d.design_id !== designId));
      toast.success('Design borttagen');
    } catch (error) {
      toast.error('Kunde inte ta bort designen');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Bekräftad';
      case 'pending':
        return 'Väntar';
      case 'shipped':
        return 'Skickad';
      case 'delivered':
        return 'Levererad';
      default:
        return status;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="account-page">
      <div className="container-main py-12">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-soft mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{user?.name}</h1>
                <p className="text-slate-500">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logga ut
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-white shadow-soft rounded-xl p-1">
            <TabsTrigger value="orders" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-orders">
              <Package className="w-4 h-4 mr-2" />
              Beställningar
            </TabsTrigger>
            <TabsTrigger value="designs" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-designs">
              <Palette className="w-4 h-4 mr-2" />
              Mina designer
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-soft">
                <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  Inga beställningar än
                </h3>
                <p className="text-slate-500 mb-6">
                  När du gör din första beställning kommer den att visas här
                </p>
                <Link to="/produkter">
                  <Button className="btn-primary">
                    Börja handla
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div 
                    key={order.order_id}
                    className="bg-white rounded-xl p-6 shadow-soft"
                    data-testid={`order-${order.order_id}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-slate-500">Order #{order.order_id.slice(0, 8)}</p>
                        <p className="text-sm text-slate-400">{formatDate(order.created_at)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          {item.design_preview && (
                            <img 
                              src={item.design_preview}
                              alt={item.product_name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{item.product_name}</p>
                            <p className="text-sm text-slate-500">
                              {item.quantity} st × {item.price} kr
                            </p>
                          </div>
                          <p className="font-medium">{(item.quantity * item.price).toFixed(0)} kr</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t mt-4 pt-4 flex items-center justify-between">
                      <span className="text-slate-600">Totalt</span>
                      <span className="text-lg font-semibold text-primary">{order.total_amount.toFixed(2)} kr</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Designs Tab */}
          <TabsContent value="designs">
            {designs.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-soft">
                <Palette className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  Inga sparade designer
                </h3>
                <p className="text-slate-500 mb-6">
                  Dina sparade designer kommer att visas här
                </p>
                <Link to="/produkter">
                  <Button className="btn-primary">
                    Skapa en design
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {designs.map((design) => (
                  <div 
                    key={design.design_id}
                    className="bg-white rounded-xl overflow-hidden shadow-soft"
                    data-testid={`design-${design.design_id}`}
                  >
                    <div className="aspect-square bg-slate-100">
                      {design.preview_image ? (
                        <img 
                          src={design.preview_image}
                          alt={design.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Palette className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-800 truncate">{design.name}</h3>
                      <p className="text-sm text-slate-500">{formatDate(design.created_at)}</p>
                      <div className="flex gap-2 mt-4">
                        <Link to={`/design/${design.product_id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Redigera
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteDesign(design.design_id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          Ta bort
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Account;
