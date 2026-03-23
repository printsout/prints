import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Receipt, TrendingUp, FileText, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

const AdminTax = () => {
  const { getAuthHeaders } = useAdmin();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await api.get('/admin/tax-report', { headers: getAuthHeaders() });
      setReport(res.data);
    } catch (error) {
      toast.error('Kunde inte hämta skatterapport');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!report) return;
    const header = 'Månad,Antal ordrar,Total försäljning (kr),Moms 25% (kr),Netto exkl. moms (kr)\n';
    const rows = report.months.map(m =>
      `${m.month},${m.order_count},${m.total_sales},${m.vat_amount},${m.net_amount}`
    ).join('\n');
    const summary = `\nTOTALT,${report.summary.total_orders},${report.summary.total_sales},${report.summary.total_vat},${report.summary.total_net}`;
    const blob = new Blob([header + rows + summary], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skatterapport_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exporterad');
  };

  const formatMonth = (m) => {
    if (!m) return '—';
    const [y, mo] = m.split('-');
    const months = ['', 'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
    return `${months[parseInt(mo)]} ${y}`;
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Laddar skatterapport...</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl" data-testid="admin-tax-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Skatterapport</h1>
          <p className="text-sm text-slate-500 mt-1">Moms {report?.tax_rate}% — Alla priser inkl. moms</p>
        </div>
        <Button onClick={exportCSV} variant="outline" data-testid="export-csv-btn">
          <Download className="w-4 h-4 mr-2" />
          Exportera CSV
        </Button>
      </div>

      {/* Summary Cards */}
      {report?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-slate-500">Totalt ordrar</span>
            </div>
            <p className="text-2xl font-bold text-slate-900" data-testid="total-orders">{report.summary.total_orders}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-slate-500">Total försäljning</span>
            </div>
            <p className="text-2xl font-bold text-slate-900" data-testid="total-sales">{report.summary.total_sales.toLocaleString('sv-SE')} kr</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-slate-500">Moms 25%</span>
            </div>
            <p className="text-2xl font-bold text-slate-900" data-testid="total-vat">{report.summary.total_vat.toLocaleString('sv-SE')} kr</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-slate-500">Netto exkl. moms</span>
            </div>
            <p className="text-2xl font-bold text-slate-900" data-testid="total-net">{report.summary.total_net.toLocaleString('sv-SE')} kr</p>
          </div>
        </div>
      )}

      {/* Monthly Breakdown Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Per månad</h2>
        </div>
        {report?.months?.length === 0 ? (
          <p className="p-8 text-center text-slate-500">Inga ordrar ännu.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="tax-table">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Månad</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ordrar</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Försäljning inkl. moms</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Moms 25%</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Netto exkl. moms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {report?.months?.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{formatMonth(m.month)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-right">{m.order_count}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 text-right">{m.total_sales.toLocaleString('sv-SE')} kr</td>
                    <td className="px-6 py-4 text-sm text-amber-600 font-medium text-right">{m.vat_amount.toLocaleString('sv-SE')} kr</td>
                    <td className="px-6 py-4 text-sm text-slate-900 text-right">{m.net_amount.toLocaleString('sv-SE')} kr</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-6 py-4 text-sm text-slate-900">Totalt</td>
                  <td className="px-6 py-4 text-sm text-slate-900 text-right">{report?.summary?.total_orders}</td>
                  <td className="px-6 py-4 text-sm text-slate-900 text-right">{report?.summary?.total_sales.toLocaleString('sv-SE')} kr</td>
                  <td className="px-6 py-4 text-sm text-amber-600 text-right">{report?.summary?.total_vat.toLocaleString('sv-SE')} kr</td>
                  <td className="px-6 py-4 text-sm text-slate-900 text-right">{report?.summary?.total_net.toLocaleString('sv-SE')} kr</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTax;
