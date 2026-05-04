import { useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

/**
 * Reusable "Spara design"-button. Posts the cart-item-shaped payload to /api/saved-designs.
 *
 * Props:
 *   buildPayload: () => SavedDesignCreate | null  — build payload at click time
 *                 Must return at minimum { editor_type, name, customization }
 *   defaultName?: string
 *   className?: string
 *   variant?: button variant
 *   size?: button size
 *   designId?: string  — when set, updates instead of creating (PUT)
 *   onSaved?: (savedDesign) => void
 */
const SaveDesignButton = ({
  buildPayload,
  defaultName = 'Min design',
  className = '',
  variant = 'outline',
  size = 'default',
  designId = null,
  onSaved,
}) => {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);

  const handleClick = (e) => {
    if (!user || !token) {
      e.preventDefault();
      toast.error('Logga in för att spara designer');
      return;
    }
    setName(defaultName);
    setOpen(true);
  };

  const handleSave = async () => {
    let payload;
    try {
      payload = typeof buildPayload === 'function' ? await buildPayload() : null;
    } catch (e) {
      toast.error(e?.message || 'Kunde inte bygga designdata');
      return;
    }
    if (!payload) {
      toast.error('Kunde inte bygga designdata');
      return;
    }
    payload.name = name?.trim() || defaultName;
    setSaving(true);
    try {
      const url = designId ? `/saved-designs/${designId}` : '/saved-designs';
      const method = designId ? 'put' : 'post';
      const res = await api[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(designId ? 'Design uppdaterad' : 'Design sparad i Mitt konto');
      setOpen(false);
      if (onSaved) onSaved(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Kunde inte spara designen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={handleClick}
          className={className}
          data-testid="save-design-btn"
        >
          <Save className="w-4 h-4 mr-2" />
          {designId ? 'Uppdatera design' : 'Spara design'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{designId ? 'Uppdatera design' : 'Spara design'}</DialogTitle>
          <DialogDescription>
            Ge din design ett namn så hittar du den enkelt under "Mina designer" i ditt konto.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="design-name">Namn</Label>
          <Input
            id="design-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            data-testid="save-design-name-input"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name?.trim()}
            className="bg-primary text-white hover:bg-primary/90"
            data-testid="save-design-confirm-btn"
          >
            {saving ? 'Sparar…' : 'Spara'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveDesignButton;
