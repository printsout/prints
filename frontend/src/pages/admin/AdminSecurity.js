import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Shield, ShieldCheck, ShieldOff, RefreshCw, LogIn, KeyRound, UserCog, Package, CreditCard, AlertTriangle } from 'lucide-react';

const ACTION_META = {
  login: { label: 'Inloggning', icon: LogIn, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  login_2fa: { label: 'Inloggning (2FA)', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  setup_2fa: { label: '2FA-installation startad', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
  enable_2fa: { label: '2FA aktiverad', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
  disable_2fa: { label: '2FA inaktiverad', icon: ShieldOff, color: 'text-amber-600', bg: 'bg-amber-50' },
  password_reset_request: { label: 'Begäran om ny kod', icon: KeyRound, color: 'text-amber-600', bg: 'bg-amber-50' },
  password_reset: { label: 'Nytt lösenord satt', icon: KeyRound, color: 'text-red-600', bg: 'bg-red-50' },
  update_payment_settings: { label: 'Betalningsinställningar ändrade', icon: CreditCard, color: 'text-violet-600', bg: 'bg-violet-50' },
  create_product: { label: 'Produkt skapad', icon: Package, color: 'text-teal-600', bg: 'bg-teal-50' },
  update_product: { label: 'Produkt uppdaterad', icon: Package, color: 'text-teal-600', bg: 'bg-teal-50' },
  delete_product: { label: 'Produkt raderad', icon: Package, color: 'text-red-600', bg: 'bg-red-50' },
  update_order_status: { label: 'Orderstatus ändrad', icon: UserCog, color: 'text-indigo-600', bg: 'bg-indigo-50' },
};

const DEFAULT_META = { label: 'Aktivitet', icon: AlertTriangle, color: 'text-slate-600', bg: 'bg-slate-50' };

const formatTimestamp = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const AdminSecurity = () => {
  const { getAuthHeaders } = useAdmin();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/logs?limit=200', { headers: getAuthHeaders() });
      setLogs(res.data.logs || []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const fetch2FAStatus = useCallback(async () => {
    try {
      const res = await api.get('/admin/2fa-status', { headers: getAuthHeaders() });
      setTwoFAEnabled(res.data.enabled);
    } catch {}
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchLogs();
    fetch2FAStatus();
  }, []);

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => {
    if (filter === 'auth') return ['login', 'login_2fa', 'password_reset_request', 'password_reset'].includes(l.action);
    if (filter === '2fa') return ['setup_2fa', 'enable_2fa', 'disable_2fa'].includes(l.action);
    if (filter === 'changes') return ['create_product', 'update_product', 'delete_product', 'update_order_status', 'update_payment_settings'].includes(l.action);
    return true;
  });

  const loginCount = logs.filter(l => l.action === 'login' || l.action === 'login_2fa').length;
  const securityEvents = logs.filter(l => ['setup_2fa', 'enable_2fa', 'disable_2fa', 'password_reset_request', 'password_reset'].includes(l.action)).length;
  const lastLogin = logs.find(l => l.action === 'login' || l.action === 'login_2fa');

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900" data-testid="security-page-title">Säkerhet</h1>
        <p className="text-slate-500">Aktivitetslogg och säkerhetsstatus</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5" data-testid="2fa-status-card">
          <div className="flex items-center gap-3 mb-2">
            {twoFAEnabled ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <ShieldOff className="w-5 h-5 text-amber-500" />}
            <span className="font-semibold text-slate-800">2FA-status</span>
          </div>
          <p className={`text-lg font-bold ${twoFAEnabled ? 'text-emerald-600' : 'text-amber-500'}`}>
            {twoFAEnabled ? 'Aktiverad' : 'Inte aktiverad'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Microsoft Authenticator</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5" data-testid="login-count-card">
          <div className="flex items-center gap-3 mb-2">
            <LogIn className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-800">Inloggningar</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{loginCount}</p>
          <p className="text-xs text-slate-400 mt-1">
            Senaste: {lastLogin ? formatTimestamp(lastLogin.timestamp) : '—'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5" data-testid="security-events-card">
          <div className="flex items-center gap-3 mb-2">
            <KeyRound className="w-5 h-5 text-violet-600" />
            <span className="font-semibold text-slate-800">Säkerhetshändelser</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{securityEvents}</p>
          <p className="text-xs text-slate-400 mt-1">2FA & lösenordsändringar</p>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Aktivitetslogg</h2>
          <div className="flex items-center gap-2">
            {/* Filters */}
            {['all', 'auth', '2fa', 'changes'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                data-testid={`filter-${f}`}
              >
                {{ all: 'Alla', auth: 'Inloggningar', '2fa': '2FA', changes: 'Ändringar' }[f]}
              </button>
            ))}
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} data-testid="refresh-logs-btn">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8" data-testid="no-logs-message">Inga händelser att visa.</p>
        ) : (
          <div className="space-y-1" data-testid="activity-log-list">
            {filteredLogs.map((log, idx) => {
              const meta = ACTION_META[log.action] || DEFAULT_META;
              const Icon = meta.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
                  data-testid={`log-entry-${idx}`}
                >
                  <div className={`w-9 h-9 rounded-full ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{meta.label}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {log.admin_email || '—'}
                      {log.details ? ` — ${log.details}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-500">{formatTimestamp(log.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSecurity;
