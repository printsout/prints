import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Search, User, Mail, Calendar, Trash2, Eye, X } from 'lucide-react';

const AdminUsers = () => {
  const { getAuthHeaders } = useAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users', { headers: getAuthHeaders() });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Kunde inte hämta användare');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`, { headers: getAuthHeaders() });
      setUserDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error('Kunde inte hämta användardetaljer');
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    await fetchUserDetails(user.user_id);
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Är du säker på att du vill ta bort denna användare?')) return;

    try {
      await api.delete(`/admin/users/${userId}`, { headers: getAuthHeaders() });
      toast.success('Användare raderad');
      fetchUsers();
      if (selectedUser?.user_id === userId) {
        setSelectedUser(null);
        setUserDetails(null);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Kunde inte radera användare');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Användare</h1>
        <p className="text-slate-500">Hantera registrerade användare</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Sök användare..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Användare</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">E-post</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Registrerad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr 
                      key={user.user_id} 
                      className={`hover:bg-slate-50 ${selectedUser?.user_id === user.user_id ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-slate-500" />
                          </div>
                          <span className="text-sm font-medium text-slate-900">{user.name || 'Namnlös'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('sv-SE') : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewUser(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.user_id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      Inga användare hittades
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {selectedUser && userDetails ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Användardetaljer</h3>
                <button 
                  onClick={() => { setSelectedUser(null); setUserDetails(null); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-slate-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{userDetails.user?.name || 'Namnlös'}</p>
                  <p className="text-sm text-slate-500">{userDetails.user?.email}</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">E-post</p>
                    <p className="text-sm text-slate-900">{userDetails.user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Registrerad</p>
                    <p className="text-sm text-slate-900">
                      {userDetails.user?.created_at 
                        ? new Date(userDetails.user.created_at).toLocaleString('sv-SE')
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Beställningar</h4>
                {userDetails.orders?.length > 0 ? (
                  <div className="space-y-2">
                    {userDetails.orders.map((order) => (
                      <div key={order.order_id} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="font-mono text-slate-600">#{order.order_id?.slice(0, 8)}</span>
                          <span className="font-medium">{order.total} kr</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(order.created_at).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Inga beställningar</p>
                )}
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Designer</h4>
                <p className="text-sm text-slate-500">
                  {userDetails.designs?.length || 0} sparade designer
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">
              <User className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p>Välj en användare för att se detaljer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
