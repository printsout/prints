import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Star, Plus, Trash2, Pencil, ExternalLink, Save, X, MessageSquare, Globe } from 'lucide-react';

const PLATFORM_OPTIONS = [
  { id: 'google', label: 'Google Reviews', icon: 'G', color: '#4285F4' },
  { id: 'trustpilot', label: 'Trustpilot', icon: 'T', color: '#00B67A' },
  { id: 'facebook', label: 'Facebook', icon: 'F', color: '#1877F2' },
  { id: 'yelp', label: 'Yelp', icon: 'Y', color: '#D32323' },
  { id: 'prisjakt', label: 'Prisjakt', icon: 'P', color: '#E6007E' },
  { id: 'reco', label: 'Reco.se', icon: 'R', color: '#FF6600' },
  { id: 'custom', label: 'Annan', icon: '?', color: '#64748b' },
];

const AdminReviews = () => {
  const { getAuthHeaders } = useAdmin();
  const [reviews, setReviews] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ user_name: '', rating: 5, text: '', source: 'manual' });
  const [showPlatformForm, setShowPlatformForm] = useState(false);
  const [platformForm, setPlatformForm] = useState({ platform_id: 'google', name: '', url: '' });
  const [savingPlatforms, setSavingPlatforms] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchPlatforms();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/admin/reviews', { headers: getAuthHeaders() });
      setReviews(res.data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const res = await api.get('/admin/review-platforms', { headers: getAuthHeaders() });
      setPlatforms(res.data.platforms || []);
    } catch (err) {
    }
  };

  const handleSubmit = async () => {
    if (!form.user_name.trim() || !form.text.trim()) {
      toast.error('Fyll i namn och recensionstext');
      return;
    }
    try {
      if (editingId) {
        await api.put(`/admin/reviews/${editingId}`, form, { headers: getAuthHeaders() });
        toast.success('Recension uppdaterad');
      } else {
        await api.post('/admin/reviews', form, { headers: getAuthHeaders() });
        toast.success('Recension skapad');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ user_name: '', rating: 5, text: '', source: 'manual' });
      fetchReviews();
    } catch (err) {
      toast.error('Kunde inte spara recension');
    }
  };

  const handleEdit = (review) => {
    setForm({ user_name: review.user_name, rating: review.rating, text: review.text, source: review.source || 'manual' });
    setEditingId(review.review_id);
    setShowForm(true);
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Radera denna recension?')) return;
    try {
      await api.delete(`/admin/reviews/${reviewId}`, { headers: getAuthHeaders() });
      toast.success('Recension raderad');
      fetchReviews();
    } catch (err) {
      toast.error('Kunde inte radera recension');
    }
  };

  const handleAddPlatform = () => {
    if (!platformForm.url.trim()) {
      toast.error('Ange en URL');
      return;
    }
    const option = PLATFORM_OPTIONS.find(p => p.id === platformForm.platform_id);
    const newPlatform = {
      id: `${platformForm.platform_id}_${Date.now()}`,
      platform_id: platformForm.platform_id,
      name: platformForm.name.trim() || option?.label || 'Annan',
      url: platformForm.url.trim(),
      color: option?.color || '#64748b',
      icon: option?.icon || '?',
    };
    setPlatforms(prev => [...prev, newPlatform]);
    setPlatformForm({ platform_id: 'google', name: '', url: '' });
    setShowPlatformForm(false);
  };

  const handleRemovePlatform = (id) => {
    setPlatforms(prev => prev.filter(p => p.id !== id));
  };

  const handleSavePlatforms = async () => {
    setSavingPlatforms(true);
    try {
      await api.put('/admin/review-platforms', { platforms }, { headers: getAuthHeaders() });
      toast.success('Externa plattformar sparade');
    } catch (err) {
      toast.error('Kunde inte spara plattformar');
    } finally {
      setSavingPlatforms(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2a9d8f]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kundrecensioner</h1>
          <p className="text-slate-500">Hantera recensioner och koppla externa plattformar</p>
        </div>
        <Button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ user_name: '', rating: 5, text: '', source: 'manual' }); }}
          data-testid="add-review-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ny recension
        </Button>
      </div>

      {/* External Platforms Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Externa recensionsplattformar
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPlatformForm(!showPlatformForm)}
              data-testid="add-platform-btn"
            >
              <Plus className="w-4 h-4 mr-1" />
              Lägg till
            </Button>
            {platforms.length > 0 && (
              <Button
                size="sm"
                onClick={handleSavePlatforms}
                disabled={savingPlatforms}
                data-testid="save-platforms-btn"
              >
                <Save className="w-4 h-4 mr-1" />
                {savingPlatforms ? 'Sparar...' : 'Spara'}
              </Button>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Lägg till länkar till dina recensionssidor. Dessa visas på hemsidan så att kunder kan läsa och skriva recensioner.
        </p>

        {showPlatformForm && (
          <div className="bg-slate-50 rounded-lg p-4 mb-4 border" data-testid="platform-form">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Plattform</label>
                <select
                  value={platformForm.platform_id}
                  onChange={(e) => setPlatformForm(prev => ({ ...prev, platform_id: e.target.value }))}
                  className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  data-testid="platform-select"
                >
                  {PLATFORM_OPTIONS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Visningsnamn {platformForm.platform_id === 'custom' ? '' : '(valfritt)'}
                </label>
                <Input
                  value={platformForm.name}
                  onChange={(e) => setPlatformForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={PLATFORM_OPTIONS.find(p => p.id === platformForm.platform_id)?.label || 'Namn'}
                  data-testid="platform-name-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">URL</label>
                <Input
                  value={platformForm.url}
                  onChange={(e) => setPlatformForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                  data-testid="platform-url-input"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={() => setShowPlatformForm(false)}>Avbryt</Button>
              <Button size="sm" onClick={handleAddPlatform} data-testid="confirm-add-platform-btn">Lägg till</Button>
            </div>
          </div>
        )}

        {platforms.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Inga externa plattformar kopplade ännu.</p>
        ) : (
          <div className="space-y-2">
            {platforms.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border"
                data-testid={`platform-${p.id}`}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{p.name}</p>
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-[#2a9d8f] hover:underline truncate block">
                    {p.url}
                  </a>
                </div>
                <button
                  onClick={() => handleRemovePlatform(p.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                  data-testid={`remove-platform-${p.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="review-form">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? 'Redigera recension' : 'Ny recension'}
            </h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kundnamn</label>
              <Input
                value={form.user_name}
                onChange={(e) => setForm(prev => ({ ...prev, user_name: e.target.value }))}
                placeholder="T.ex. Anna S."
                data-testid="review-name-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Betyg</label>
              <div className="flex gap-1" data-testid="review-rating">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setForm(prev => ({ ...prev, rating: n }))}
                    className="p-1 transition-transform hover:scale-110"
                    data-testid={`rating-star-${n}`}
                  >
                    <Star className={`w-7 h-7 ${n <= form.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Recensionstext</label>
              <textarea
                value={form.text}
                onChange={(e) => setForm(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Skriv recensionstexten..."
                rows={3}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]"
                data-testid="review-text-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Källa</label>
              <select
                value={form.source}
                onChange={(e) => setForm(prev => ({ ...prev, source: e.target.value }))}
                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                data-testid="review-source-select"
              >
                <option value="manual">Manuellt tillagd</option>
                <option value="google">Google</option>
                <option value="trustpilot">Trustpilot</option>
                <option value="facebook">Facebook</option>
                <option value="other">Annan</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Avbryt</Button>
              <Button onClick={handleSubmit} data-testid="save-review-btn">
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Uppdatera' : 'Skapa'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5" />
          Alla recensioner ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Inga recensioner ännu.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <div
                key={review.review_id}
                className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border"
                data-testid={`review-item-${review.review_id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-800">{review.user_name}</span>
                    {review.source && review.source !== 'manual' && (
                      <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full capitalize">
                        {review.source}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={`star-${i}`} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 italic">"{review.text}"</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(review.created_at).toLocaleDateString('sv-SE')}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(review)}
                    className="p-2 text-slate-400 hover:text-[#2a9d8f] transition-colors rounded-lg hover:bg-slate-100"
                    data-testid={`edit-review-${review.review_id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(review.review_id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-100"
                    data-testid={`delete-review-${review.review_id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
