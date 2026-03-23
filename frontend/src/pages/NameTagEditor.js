import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import {
  ShoppingCart, ChevronLeft, Type, Palette, ImageIcon, Upload,
  Star, Heart, Cat, Dog, Rabbit, Fish, Bird, Bug,
  Flower2, TreePine, Sun, Moon, Cloud, Leaf, Snowflake,
  Car, Plane, Rocket, Ship, Bike, Train,
  Trophy, Medal, Gamepad2, Music, Crown, Gem, Sparkles,
  Anchor, Skull, Ghost, Flame, Zap, Rainbow,
  Baby, IceCream, Cherry, Apple, Pizza, Cake,
  Minus, Plus, ToggleLeft, ToggleRight, RotateCcw,
  Dumbbell, Target, Swords, Shield, Mountain, Volleyball,
  Waves, Flag, Goal, Weight, Footprints, PersonStanding
} from 'lucide-react';

// Custom Horse icon (lucide doesn't have one)
const HorseIcon = ({ className, style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M3 19V16C3 14 5 12 7 11L9 10C10 9.5 11 8 11 6V3L13 5C14 6 15 6.5 16 6.5H19L20 8C20 8 21 9 21 10C21 11 20 12 19 12H17L15 14V19" />
    <path d="M5 19H15" />
    <circle cx="7" cy="19" r="1" />
    <circle cx="13" cy="19" r="1" />
  </svg>
);

// Custom Football/Soccer ball icon
const FootballIcon = ({ className, style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2L10 6.5L6 7.5L3.5 11" />
    <path d="M12 2L14 6.5L18 7.5L20.5 11" />
    <path d="M3.5 11L5 15L4 19.5" />
    <path d="M20.5 11L19 15L20 19.5" />
    <path d="M4 19.5L8.5 18L12 22L15.5 18L20 19.5" />
    <polygon points="10,6.5 14,6.5 18,7.5 19,15 15.5,18 8.5,18 5,15 6,7.5" strokeWidth="1.8" fill="none" />
  </svg>
);

// ─── FONTS ────────────────────────────────────────────
const FONTS = [
  { id: 'pacifico', label: 'Moonlight', family: "'Pacifico', cursive" },
  { id: 'patrickhand', label: 'Minya', family: "'Patrick Hand', cursive" },
  { id: 'permanentmarker', label: 'Roddy', family: "'Permanent Marker', cursive" },
  { id: 'bubblegum', label: 'Pupcat', family: "'Bubblegum Sans', cursive" },
  { id: 'orbitron', label: 'Octin', family: "'Orbitron', sans-serif" },
  { id: 'roboto', label: 'Roboto', family: "'Roboto', sans-serif" },
  { id: 'josefin', label: 'Josefine', family: "'Josefin Sans', sans-serif" },
  { id: 'quicksand', label: 'Bubbly', family: "'Quicksand', sans-serif" },
  { id: 'bungee', label: 'Zigzag', family: "'Bungee Shade', cursive" },
  { id: 'poppins', label: 'Aktivo', family: "'Poppins', sans-serif" },
  { id: 'indieflower', label: 'Marker', family: "'Indie Flower', cursive" },
  { id: 'blackops', label: 'Striker', family: "'Black Ops One', cursive" },
];

// ─── FONT COLORS ──────────────────────────────────────
const FONT_COLORS = [
  '#000000', '#FFFFFF', '#333333', '#666666',
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1',
  '#3949AB', '#1E88E5', '#039BE5', '#00ACC1',
  '#00897B', '#43A047', '#7CB342', '#C0CA33',
  '#FDD835', '#FFB300', '#FB8C00', '#F4511E',
  '#6D4C41', '#546E7A', '#FF6F00', '#AD1457',
];

// ─── MOTIFS ───────────────────────────────────────────
const MOTIF_CATEGORIES = [
  { id: 'popular', label: 'Populära' },
  { id: 'all', label: 'Alla Motiv' },
  { id: 'animals', label: 'Djur' },
  { id: 'nature', label: 'Natur' },
  { id: 'vehicles', label: 'Fordon' },
  { id: 'sports', label: 'Sport' },
  { id: 'fun', label: 'Roligt' },
  { id: 'food', label: 'Mat' },
];

const ALL_MOTIFS = [
  // Popular
  { id: 'star', icon: Star, label: 'Stjärna', color: '#FFD700', cats: ['popular', 'fun'] },
  { id: 'heart', icon: Heart, label: 'Hjärta', color: '#E53935', cats: ['popular', 'fun'] },
  { id: 'cat', icon: Cat, label: 'Katt', color: '#FF8C00', cats: ['popular', 'animals'] },
  { id: 'dog', icon: Dog, label: 'Hund', color: '#8D6E63', cats: ['popular', 'animals'] },
  { id: 'rabbit', icon: Rabbit, label: 'Kanin', color: '#F48FB1', cats: ['popular', 'animals'] },
  { id: 'rainbow', icon: Rainbow, label: 'Regnbåge', color: '#FF6F00', cats: ['popular', 'nature'] },
  { id: 'crown', icon: Crown, label: 'Krona', color: '#FFC107', cats: ['popular', 'fun'] },
  { id: 'rocket', icon: Rocket, label: 'Raket', color: '#1E88E5', cats: ['popular', 'vehicles'] },
  { id: 'sparkles', icon: Sparkles, label: 'Glitter', color: '#AB47BC', cats: ['popular', 'fun'] },
  { id: 'flower', icon: Flower2, label: 'Blomma', color: '#E91E63', cats: ['popular', 'nature'] },
  // Animals
  { id: 'fish', icon: Fish, label: 'Fisk', color: '#29B6F6', cats: ['animals'] },
  { id: 'bird', icon: Bird, label: 'Fågel', color: '#66BB6A', cats: ['animals'] },
  { id: 'bug', icon: Bug, label: 'Nyckelpiga', color: '#EF5350', cats: ['animals'] },
  { id: 'baby', icon: Baby, label: 'Baby', color: '#F48FB1', cats: ['animals', 'fun'] },
  { id: 'horse', icon: HorseIcon, label: 'Häst', color: '#795548', cats: ['animals', 'popular', 'sports'] },
  { id: 'footprints', icon: Footprints, label: 'Tassavtryck', color: '#8D6E63', cats: ['animals'] },
  // Nature
  { id: 'tree', icon: TreePine, label: 'Träd', color: '#2E7D32', cats: ['nature'] },
  { id: 'sun', icon: Sun, label: 'Sol', color: '#FFB300', cats: ['nature'] },
  { id: 'moon', icon: Moon, label: 'Måne', color: '#7E57C2', cats: ['nature'] },
  { id: 'cloud', icon: Cloud, label: 'Moln', color: '#42A5F5', cats: ['nature'] },
  { id: 'leaf', icon: Leaf, label: 'Löv', color: '#43A047', cats: ['nature'] },
  { id: 'snowflake', icon: Snowflake, label: 'Snöflinga', color: '#4FC3F7', cats: ['nature'] },
  // Vehicles
  { id: 'car', icon: Car, label: 'Bil', color: '#E53935', cats: ['vehicles'] },
  { id: 'plane', icon: Plane, label: 'Flygplan', color: '#1565C0', cats: ['vehicles'] },
  { id: 'ship', icon: Ship, label: 'Båt', color: '#00838F', cats: ['vehicles'] },
  { id: 'bike', icon: Bike, label: 'Cykel', color: '#43A047', cats: ['vehicles'] },
  { id: 'train', icon: Train, label: 'Tåg', color: '#6D4C41', cats: ['vehicles'] },
  // Sports
  { id: 'trophy', icon: Trophy, label: 'Trofé', color: '#FFB300', cats: ['sports'] },
  { id: 'medal', icon: Medal, label: 'Medalj', color: '#FFC107', cats: ['sports'] },
  { id: 'gamepad', icon: Gamepad2, label: 'Spel', color: '#7C4DFF', cats: ['sports', 'fun'] },
  { id: 'football', icon: FootballIcon, label: 'Fotboll', color: '#1B5E20', cats: ['sports', 'popular'] },
  { id: 'volleyball', icon: Volleyball, label: 'Volleyboll', color: '#FF9800', cats: ['sports'] },
  { id: 'dumbbell', icon: Dumbbell, label: 'Gym', color: '#546E7A', cats: ['sports'] },
  { id: 'target', icon: Target, label: 'Bågskytte', color: '#E53935', cats: ['sports'] },
  { id: 'swords', icon: Swords, label: 'Fäktning', color: '#78909C', cats: ['sports'] },
  { id: 'swimming', icon: Waves, label: 'Simning', color: '#0288D1', cats: ['sports'] },
  { id: 'mountain', icon: Mountain, label: 'Klättring', color: '#5D4037', cats: ['sports', 'nature'] },
  { id: 'shield', icon: Shield, label: 'Sköld', color: '#1565C0', cats: ['sports', 'fun'] },
  { id: 'flag', icon: Flag, label: 'Flagga', color: '#D32F2F', cats: ['sports'] },
  { id: 'weight', icon: Weight, label: 'Tyngdlyftning', color: '#37474F', cats: ['sports'] },
  { id: 'running', icon: PersonStanding, label: 'Löpning', color: '#FF5722', cats: ['sports'] },
  // Fun
  { id: 'gem', icon: Gem, label: 'Kristall', color: '#00BCD4', cats: ['fun'] },
  { id: 'music', icon: Music, label: 'Musik', color: '#9C27B0', cats: ['fun'] },
  { id: 'anchor', icon: Anchor, label: 'Ankare', color: '#37474F', cats: ['fun'] },
  { id: 'skull', icon: Skull, label: 'Dödskalle', color: '#455A64', cats: ['fun'] },
  { id: 'ghost', icon: Ghost, label: 'Spöke', color: '#7E57C2', cats: ['fun'] },
  { id: 'flame', icon: Flame, label: 'Eld', color: '#FF5722', cats: ['fun'] },
  { id: 'zap', icon: Zap, label: 'Blixt', color: '#FFC107', cats: ['fun'] },
  // Food
  { id: 'icecream', icon: IceCream, label: 'Glass', color: '#F48FB1', cats: ['food'] },
  { id: 'cherry', icon: Cherry, label: 'Körsbär', color: '#D32F2F', cats: ['food'] },
  { id: 'apple', icon: Apple, label: 'Äpple', color: '#4CAF50', cats: ['food'] },
  { id: 'pizza', icon: Pizza, label: 'Pizza', color: '#FF9800', cats: ['food'] },
  { id: 'cake', icon: Cake, label: 'Tårta', color: '#EC407A', cats: ['food'] },
];

// ─── BACKGROUNDS ──────────────────────────────────────
const BG_CATEGORIES = [
  { id: 'popular', label: 'Populära' },
  { id: 'colors', label: 'Färger' },
  { id: 'all', label: 'Alla' },
  { id: 'pastel', label: 'Pastell' },
  { id: 'gradient', label: 'Gradient' },
];

const ALL_BACKGROUNDS = [
  // Popular
  { id: 'white', color: '#FFFFFF', cats: ['popular', 'colors'] },
  { id: 'teal', color: '#7BA5BA', cats: ['popular', 'colors'] },
  { id: 'lilac', color: '#C8A2C8', cats: ['popular', 'colors'] },
  { id: 'rainbow_bg', gradient: 'linear-gradient(90deg, #ff9a9e, #fad0c4, #ffecd2, #a8edea, #d4fc79)', cats: ['popular', 'gradient'] },
  { id: 'softpink', color: '#D3AEBF', cats: ['popular', 'pastel'] },
  { id: 'baby_blue', color: '#ADD8E6', cats: ['popular', 'pastel'] },
  { id: 'mint_green', color: '#98FF98', cats: ['popular', 'pastel'] },
  { id: 'peach', color: '#FFD7BE', cats: ['popular', 'pastel'] },
  // Colors
  { id: 'bright_red', color: '#E53935', cats: ['colors'] },
  { id: 'bright_blue', color: '#1E88E5', cats: ['colors'] },
  { id: 'bright_green', color: '#43A047', cats: ['colors'] },
  { id: 'bright_yellow', color: '#FDD835', cats: ['colors'] },
  { id: 'bright_orange', color: '#FB8C00', cats: ['colors'] },
  { id: 'bright_purple', color: '#8E24AA', cats: ['colors'] },
  { id: 'navy', color: '#000080', cats: ['colors'] },
  { id: 'black', color: '#000000', cats: ['colors'] },
  { id: 'dark_green', color: '#5A8E54', cats: ['colors'] },
  { id: 'dark_teal', color: '#00897B', cats: ['colors'] },
  { id: 'sky_orange', color: '#FF9800', cats: ['colors'] },
  { id: 'charcoal', color: '#546E7A', cats: ['colors'] },
  // Pastel
  { id: 'p1', color: '#FBEAB4', cats: ['pastel'] },
  { id: 'p2', color: '#FAEBD4', cats: ['pastel'] },
  { id: 'p3', color: '#F9FAEC', cats: ['pastel'] },
  { id: 'p4', color: '#F5EFE6', cats: ['pastel'] },
  { id: 'p5', color: '#F2E8E6', cats: ['pastel'] },
  { id: 'p6', color: '#EFD6D2', cats: ['pastel'] },
  { id: 'p7', color: '#EEF1FF', cats: ['pastel'] },
  { id: 'p8', color: '#E8DFCA', cats: ['pastel'] },
  { id: 'p9', color: '#E3E0F8', cats: ['pastel'] },
  { id: 'p10', color: '#E2E3E4', cats: ['pastel'] },
  { id: 'p11', color: '#DEEFDC', cats: ['pastel'] },
  { id: 'p12', color: '#D6ECFF', cats: ['pastel'] },
  { id: 'p13', color: '#D0CDE8', cats: ['pastel'] },
  { id: 'p14', color: '#B3CEAF', cats: ['pastel'] },
  { id: 'p15', color: '#FFBB91', cats: ['pastel'] },
  { id: 'p16', color: '#E4BEAD', cats: ['pastel'] },
  // Gradients
  { id: 'g1', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', cats: ['gradient'] },
  { id: 'g2', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)', cats: ['gradient'] },
  { id: 'g3', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)', cats: ['gradient'] },
  { id: 'g4', gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)', cats: ['gradient'] },
  { id: 'g5', gradient: 'linear-gradient(135deg, #fa709a, #fee140)', cats: ['gradient'] },
  { id: 'g6', gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', cats: ['gradient'] },
  { id: 'g7', gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)', cats: ['gradient'] },
  { id: 'g8', gradient: 'linear-gradient(135deg, #89f7fe, #66a6ff)', cats: ['gradient'] },
  { id: 'g9', gradient: 'linear-gradient(135deg, #fddb92, #d1fdff)', cats: ['gradient'] },
  { id: 'g10', gradient: 'linear-gradient(135deg, #c1dfc4, #deecdd)', cats: ['gradient'] },
];

// ─── HELPER: contrast color for text on bg ──────────
function getContrastColor(hex) {
  if (!hex || hex.startsWith('linear')) return '#000000';
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#000000' : '#FFFFFF';
}

// ─────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────
const NameTagEditor = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const imageInputRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState('text');

  // Design state
  const [childName, setChildName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedFont, setSelectedFont] = useState('pacifico');
  const [fontColor, setFontColor] = useState('#000000');
  const [selectedMotif, setSelectedMotif] = useState('star');
  const [motifEnabled, setMotifEnabled] = useState(true);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedBg, setSelectedBg] = useState('white');
  const [quantity, setQuantity] = useState(1);

  // Sub-category states
  const [motifCategory, setMotifCategory] = useState('popular');
  const [bgCategory, setBgCategory] = useState('popular');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${productId}`);
        setProduct(response.data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error('Kunde inte hämta produkt');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  // ── Derived values ──
  const currentFont = FONTS.find(f => f.id === selectedFont) || FONTS[0];
  const currentBg = ALL_BACKGROUNDS.find(b => b.id === selectedBg) || ALL_BACKGROUNDS[0];
  const bgStyle = currentBg.gradient
    ? { background: currentBg.gradient }
    : { backgroundColor: currentBg.color || '#FFFFFF' };
  const autoTextColor = currentBg.gradient
    ? fontColor
    : fontColor;
  const currentMotif = ALL_MOTIFS.find(m => m.id === selectedMotif);

  const filteredMotifs = motifCategory === 'all'
    ? ALL_MOTIFS
    : ALL_MOTIFS.filter(m => m.cats.includes(motifCategory));

  const filteredBgs = bgCategory === 'all'
    ? ALL_BACKGROUNDS
    : ALL_BACKGROUNDS.filter(b => b.cats.includes(bgCategory));

  // ── Handlers ──
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target.result);
      setSelectedMotif(null);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setChildName('');
    setLastName('');
    setPhoneNumber('');
    setSelectedFont('pacifico');
    setFontColor('#000000');
    setSelectedMotif('star');
    setMotifEnabled(true);
    setUploadedImage(null);
    setSelectedBg('white');
  };

  const handleAddToCart = async () => {
    if (!childName.trim()) {
      toast.error('Skriv in ett förnamn');
      return;
    }
    try {
      // Upload image to server if one was uploaded
      let uploadedImageUrl = null;
      if (uploadedImage) {
        const uploadRes = await api.post('/upload-base64', { image: uploadedImage });
        uploadedImageUrl = uploadRes.data.url;
      }

      await addToCart({
        product_id: product.product_id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        image: product.imageUrl || product.images?.[0],
        customization: {
          type: 'nametag',
          child_name: childName,
          last_name: lastName,
          phone_number: phoneNumber,
          font: selectedFont,
          font_color: fontColor,
          motif: motifEnabled ? selectedMotif : null,
          uploaded_image_url: uploadedImageUrl,
          background: selectedBg,
        }
      });
      toast.success('Namnlappar tillagda i varukorgen!');
      navigate('/varukorg');
    } catch {
      toast.error('Kunde inte lägga till i varukorgen');
    }
  };

  // ── Loading / Error ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2a9d8f]" />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <p className="text-slate-500">Produkt hittades inte</p>
      </div>
    );
  }

  // ─── RENDER ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8f7f4]" data-testid="nametag-editor">
      {/* Back + Title */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-slate-500 hover:text-[#2a9d8f] transition-colors text-sm"
            data-testid="back-button"
          >
            <ChevronLeft className="w-4 h-4" />
            Tillbaka
          </button>
          <span className="text-slate-300">|</span>
          <h1 className="text-base font-semibold text-slate-800">{product.name}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Intro text */}
        <div className="text-center mb-6">
          <p className="text-slate-600 text-sm leading-relaxed max-w-lg mx-auto">
            Att designa din egen unika namnetikett är både roligt och enkelt.
            Med vårt stora utbud av bakgrunder och motiv kommer du att kunna märka alla dina saker – med stil!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* ─── LEFT: Preview + Tabs + Config ─── */}
          <div className="space-y-4">
            {/* Live Preview */}
            <div className="bg-white rounded-xl border p-6" data-testid="nametag-preview">
              <div className="flex justify-center mb-5">
                <div
                  className="relative w-72 rounded-lg shadow-md flex items-center justify-center gap-3 border overflow-hidden"
                  style={{ ...bgStyle, minHeight: '88px', padding: '10px 12px' }}
                  data-testid="nametag-preview-main"
                >
                  {motifEnabled && currentMotif && !uploadedImage && (
                    <currentMotif.icon className="w-9 h-9 flex-shrink-0" style={{ color: currentMotif.color }} />
                  )}
                  {motifEnabled && uploadedImage && (
                    <img src={uploadedImage} alt="uploaded" className="w-10 h-10 object-contain flex-shrink-0 rounded" />
                  )}
                  <div className="flex flex-col items-center min-w-0">
                    <span
                      className="text-xl font-medium truncate max-w-[180px]"
                      style={{ fontFamily: currentFont.family, color: autoTextColor }}
                    >
                      {childName || 'Förnamn'}{lastName ? ` ${lastName}` : ''}
                    </span>
                    {phoneNumber && (
                      <span
                        className="text-xs truncate max-w-[180px] opacity-80"
                        style={{ fontFamily: currentFont.family, color: autoTextColor }}
                      >
                        {phoneNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Small grid preview */}
              <p className="text-xs text-slate-400 text-center mb-3">Så här kommer dina namnlappar se ut:</p>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-w-md mx-auto">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-7 rounded shadow-sm flex items-center justify-center gap-1 border overflow-hidden"
                    style={bgStyle}
                  >
                    {motifEnabled && currentMotif && !uploadedImage && (
                      <currentMotif.icon className="w-3 h-3 flex-shrink-0" style={{ color: currentMotif.color }} />
                    )}
                    <span
                      className="truncate"
                      style={{ fontFamily: currentFont.family, color: autoTextColor, fontSize: '8px' }}
                    >
                      {childName || 'Namn'}{lastName ? ` ${lastName.charAt(0)}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl bg-white border overflow-hidden" data-testid="editor-tabs">
              {[
                { id: 'text', label: 'Text', Icon: Type },
                { id: 'motif', label: 'Motiv', Icon: Sparkles },
                { id: 'background', label: 'Bakgrund', Icon: Palette },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-[#2a9d8f] text-[#2a9d8f] bg-[#2a9d8f]/5'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <tab.Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border p-5 min-h-[320px]" data-testid="tab-content">
              {/* ─── TEXT TAB ─── */}
              {activeTab === 'text' && (
                <div className="space-y-6">
                  {/* 1. Name input */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">1. Ange förnamn</h3>
                    <Input
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="Skriv förnamn här..."
                      maxLength={25}
                      className="text-base h-11"
                      data-testid="child-name-input"
                    />
                    <p className="text-xs text-slate-400 mt-1">Max 25 tecken</p>
                  </div>

                  {/* 2. Last name input */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">2. Ange efternamn</h3>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Skriv efternamn här..."
                      maxLength={25}
                      className="text-base h-11"
                      data-testid="last-name-input"
                    />
                    <p className="text-xs text-slate-400 mt-1">Max 25 tecken (valfritt)</p>
                  </div>

                  {/* 3. Phone number input */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">3. Ange telefonnummer</h3>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="T.ex. 070-123 45 67"
                      maxLength={20}
                      className="text-base h-11"
                      data-testid="phone-number-input"
                    />
                    <p className="text-xs text-slate-400 mt-1">Valfritt - visas på namnlappen</p>
                  </div>

                  {/* 4. Font selection */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">4. Välj typsnitt</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" data-testid="font-grid">
                      {FONTS.map(font => (
                        <button
                          key={font.id}
                          onClick={() => setSelectedFont(font.id)}
                          className={`py-2.5 px-2 rounded-lg border-2 transition-all text-center ${
                            selectedFont === font.id
                              ? 'border-[#2a9d8f] bg-[#2a9d8f]/5 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          data-testid={`font-${font.id}`}
                        >
                          <span style={{ fontFamily: font.family, fontSize: '14px' }}>
                            {font.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Font color */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">5. Välj typsnittsfärg</h3>
                    <div className="flex flex-wrap gap-2" data-testid="font-color-grid">
                      {FONT_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setFontColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            fontColor === color
                              ? 'border-[#2a9d8f] ring-2 ring-[#2a9d8f]/30 scale-110'
                              : 'border-slate-200 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                          data-testid={`font-color-${color.replace('#', '')}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── MOTIF TAB ─── */}
              {activeTab === 'motif' && (
                <div className="space-y-4">
                  {/* Toggle + Upload row */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setMotifEnabled(!motifEnabled)}
                      className="flex items-center gap-2 text-sm font-medium text-slate-600"
                      data-testid="motif-toggle"
                    >
                      {motifEnabled
                        ? <ToggleRight className="w-6 h-6 text-[#2a9d8f]" />
                        : <ToggleLeft className="w-6 h-6 text-slate-400" />
                      }
                      Motiv {motifEnabled ? 'På' : 'Av'}
                    </button>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center gap-2 text-sm font-medium text-[#2a9d8f] hover:text-[#238b7e] transition-colors"
                      data-testid="upload-image-btn"
                    >
                      <Upload className="w-4 h-4" />
                      Ladda upp bild
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>

                  {uploadedImage && (
                    <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border">
                      <img src={uploadedImage} alt="Uploaded" className="w-12 h-12 object-contain rounded" />
                      <span className="text-sm text-slate-600 flex-1">Uppladdad bild</span>
                      <button
                        onClick={() => { setUploadedImage(null); setSelectedMotif('star'); }}
                        className="text-xs text-red-500 hover:text-red-700"
                        data-testid="remove-uploaded-image"
                      >
                        Ta bort
                      </button>
                    </div>
                  )}

                  {/* Category tabs */}
                  <div className="flex gap-1 flex-wrap" data-testid="motif-categories">
                    {MOTIF_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setMotifCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          motifCategory === cat.id
                            ? 'bg-[#2a9d8f] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Motif grid */}
                  <div
                    className={`grid grid-cols-5 sm:grid-cols-7 gap-2 ${!motifEnabled ? 'opacity-40 pointer-events-none' : ''}`}
                    data-testid="motif-grid"
                  >
                    {filteredMotifs.map(motif => {
                      const Icon = motif.icon;
                      return (
                        <button
                          key={motif.id}
                          onClick={() => { setSelectedMotif(motif.id); setUploadedImage(null); }}
                          className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 transition-all ${
                            selectedMotif === motif.id && !uploadedImage
                              ? 'border-[#2a9d8f] bg-[#2a9d8f]/10 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                          title={motif.label}
                          data-testid={`motif-${motif.id}`}
                        >
                          <Icon className="w-6 h-6" style={{ color: motif.color }} />
                          <span className="text-[9px] text-slate-500 leading-none">{motif.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── BACKGROUND TAB ─── */}
              {activeTab === 'background' && (
                <div className="space-y-4">
                  {/* Category tabs */}
                  <div className="flex gap-1 flex-wrap" data-testid="bg-categories">
                    {BG_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setBgCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          bgCategory === cat.id
                            ? 'bg-[#2a9d8f] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Background grid */}
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2" data-testid="bg-grid">
                    {filteredBgs.map(bg => {
                      const style = bg.gradient
                        ? { background: bg.gradient }
                        : { backgroundColor: bg.color };
                      return (
                        <button
                          key={bg.id}
                          onClick={() => setSelectedBg(bg.id)}
                          className={`aspect-square rounded-lg border-2 transition-all ${
                            selectedBg === bg.id
                              ? 'border-[#2a9d8f] ring-2 ring-[#2a9d8f]/30 scale-105'
                              : 'border-slate-200 hover:border-slate-300 hover:scale-105'
                          }`}
                          style={style}
                          title={bg.id}
                          data-testid={`bg-${bg.id}`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT: Product Info + Cart ─── */}
          <div className="space-y-4 lg:sticky lg:top-4 self-start">
            {/* Product info card */}
            <div className="bg-white rounded-xl border p-5" data-testid="product-info-card">
              <h2 className="text-lg font-bold text-slate-900 mb-1">{product.name}</h2>
              <p className="text-sm text-slate-500 mb-4">{product.description}</p>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-[#2a9d8f]" data-testid="product-price">
                  {product.price} kr
                </span>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between py-3 border-t border-b mb-4">
                <span className="text-sm text-slate-600">Antal</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
                    data-testid="qty-minus"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-semibold w-8 text-center" data-testid="qty-value">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
                    data-testid="qty-plus"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-slate-600">Totalt</span>
                <span className="text-xl font-bold text-slate-900" data-testid="total-price">
                  {product.price * quantity} kr
                </span>
              </div>

              <Button
                className="w-full bg-[#2a9d8f] hover:bg-[#238b7e] h-12 text-base"
                onClick={handleAddToCart}
                disabled={!childName.trim()}
                data-testid="add-nametag-to-cart"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Lägg i kundvagn
              </Button>

              {!childName.trim() && (
                <p className="text-xs text-slate-400 text-center mt-2">
                  Ange ett förnamn för att fortsätta
                </p>
              )}
            </div>

            {/* Reset button */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#2a9d8f] transition-colors mx-auto"
              data-testid="reset-design"
            >
              <RotateCcw className="w-4 h-4" />
              Återställ design
            </button>

            {/* Info badges */}
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2a9d8f]/10 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-[#2a9d8f]" />
                </div>
                <span className="text-sm text-slate-600">Gratis frakt</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2a9d8f]/10 flex items-center justify-center">
                  <Star className="w-4 h-4 text-[#2a9d8f]" />
                </div>
                <span className="text-sm text-slate-600">Leverans 3-5 dagar</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2a9d8f]/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-[#2a9d8f]" />
                </div>
                <span className="text-sm text-slate-600">100% Nöjd-kund-garanti</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NameTagEditor;
