import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { FileText, Plus, Edit, Trash2, X, Eye, EyeOff, Globe } from 'lucide-react';

const AdminContent = () => {
  const { getAuthHeaders } = useAdmin();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft',
  });

  useEffect(() => { fetchPages(); }, []);

  const fetchPages = async () => {
    try {
      const res = await api.get('/admin/content', { headers: getAuthHeaders() });
      setPages(res.data.pages || []);
    } catch {
      toast.error('Kunde inte hämta sidor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingPage(null);
    setFormData({ title: '', slug: '', content: '', status: 'draft' });
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (page) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      status: page.status || 'draft',
    });
    setShowModal(true);
  };

  const handleTitleChange = (title) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: editingPage ? prev.slug : '/' + title.toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPage) {
        await api.put(`/admin/content/${editingPage.page_id}`, formData, { headers: getAuthHeaders() });
        toast.success('Sida uppdaterad');
      } else {
        await api.post('/admin/content', formData, { headers: getAuthHeaders() });
        toast.success('Sida skapad');
      }
      setShowModal(false);
      resetForm();
      fetchPages();
    } catch {
      toast.error('Kunde inte spara sida');
    }
  };

  const handleDelete = async (pageId) => {
    if (!confirm('Vill du ta bort denna sida?')) return;
    try {
      await api.delete(`/admin/content/${pageId}`, { headers: getAuthHeaders() });
      toast.success('Sida raderad');
      fetchPages();
    } catch {
      toast.error('Kunde inte radera sida');
    }
  };

  const toggleStatus = async (page) => {
    const newStatus = page.status === 'published' ? 'draft' : 'published';
    try {
      await api.put(`/admin/content/${page.page_id}`, {
        ...page,
        status: newStatus,
      }, { headers: getAuthHeaders() });
      toast.success(newStatus === 'published' ? 'Sida publicerad' : 'Sida avpublicerad');
      fetchPages();
    } catch {
      toast.error('Kunde inte ändra status');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Innehåll</h1>
          <p className="text-slate-500">Hantera sidor som "Om oss", "Kontakt" och villkor</p>
        </div>
        <Button onClick={openCreate} data-testid="add-page-btn">
          <Plus className="w-4 h-4 mr-2" />
          Ny sida
        </Button>
      </div>

      {pages.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Inga sidor ännu</h3>
              <p className="text-sm text-blue-700 mt-1">
                Skapa din första sida genom att klicka på "Ny sida". Du kan skapa sidor som "Om oss", "Kontakta oss", "Leveransvillkor" m.m.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pages List */}
      {pages.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Sidor ({pages.length})</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {pages.map((page) => (
              <div key={page.page_id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors" data-testid={`page-row-${page.page_id}`}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="bg-slate-100 p-2 rounded-lg flex-shrink-0">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{page.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Globe className="w-3 h-3 text-slate-400" />
                      <span className="text-sm text-slate-500">{page.slug}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => toggleStatus(page)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                      page.status === 'published'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                    data-testid={`toggle-status-${page.page_id}`}
                  >
                    {page.status === 'published' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {page.status === 'published' ? 'Publicerad' : 'Utkast'}
                  </button>

                  <Button variant="ghost" size="sm" onClick={() => openEdit(page)} data-testid={`edit-page-${page.page_id}`}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(page.page_id)} data-testid={`delete-page-${page.page_id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" data-testid="content-modal">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingPage ? 'Redigera sida' : 'Skapa ny sida'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sidtitel</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="t.ex. Om oss"
                    required
                    data-testid="content-title-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL-slug</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="/om-oss"
                    required
                    data-testid="content-slug-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger data-testid="content-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Publicerad</SelectItem>
                    <SelectItem value="draft">Utkast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Innehåll</label>
                <p className="text-xs text-slate-400 mb-2">Skriv HTML eller vanlig text. Radbrytning sker med tomma rader.</p>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg resize-y min-h-[250px] font-mono text-sm"
                  placeholder="Skriv sidans innehåll här..."
                  data-testid="content-body-input"
                />
              </div>

              {/* Preview */}
              {formData.content && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Förhandsgranskning</label>
                  <div
                    className="p-4 border border-slate-200 rounded-lg bg-slate-50 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.content.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')) }}
                    data-testid="content-preview"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Avbryt
                </Button>
                <Button type="submit" data-testid="content-save-btn">
                  {editingPage ? 'Spara ändringar' : 'Skapa sida'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContent;
