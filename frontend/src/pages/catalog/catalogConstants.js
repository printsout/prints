import { BookOpen, Package, LayoutGrid, FileText } from 'lucide-react';
import { Type } from 'lucide-react';

let _pageId = 0;
export const nextId = () => `pg-${++_pageId}-${Date.now()}`;
let _itemId = 0;
export const nextItemId = () => `it-${++_itemId}-${Date.now()}`;

export const TEMPLATES = [
  { id: 'classic', name: 'Klassisk', desc: 'Ren layout med sidofält' },
  { id: 'modern', name: 'Modern', desc: 'Djärv med stora bilder' },
  { id: 'minimal', name: 'Minimal', desc: 'Enkel och luftig' },
];

export const PAGE_COUNTS = [4, 8, 12];

export const PAGE_TYPES = [
  { id: 'cover', name: 'Omslag', icon: BookOpen },
  { id: 'product', name: 'Produktsida', icon: Package },
  { id: 'gallery', name: 'Galleri', icon: LayoutGrid },
  { id: 'text', name: 'Textsida', icon: Type },
  { id: 'backcover', name: 'Baksida', icon: FileText },
];

export const THEME_COLORS = [
  '#2a9d8f', '#264653', '#e76f51', '#e63946',
  '#457b9d', '#6d6875', '#1d3557', '#000000',
  '#f4a261', '#606c38', '#bc6c25', '#8338ec',
];

export const FONTS = [
  { id: 'Inter', name: 'Inter' },
  { id: 'Georgia', name: 'Georgia' },
  { id: 'Playfair Display', name: 'Playfair Display' },
  { id: 'Montserrat', name: 'Montserrat' },
];

export const PRICE_TIERS = [
  { min: 1, max: 9, pricePerUnit: 89 },
  { min: 10, max: 24, pricePerUnit: 69 },
  { min: 25, max: 49, pricePerUnit: 49 },
  { min: 50, max: Infinity, pricePerUnit: 39 },
];

export function getPrice(qty) {
  const t = PRICE_TIERS.find(t => qty >= t.min && qty <= t.max);
  return t ? t.pricePerUnit : 89;
}

export function makeCover(companyName) {
  return { id: nextId(), type: 'cover', title: companyName || 'Företagsnamn', subtitle: 'Produktkatalog 2026', bgImage: null };
}
export function makeProduct() {
  return { id: nextId(), type: 'product', items: [{ id: nextItemId(), image: null, name: '', desc: '', price: '' }] };
}
export function makeGallery() {
  return { id: nextId(), type: 'gallery', title: 'Galleri', images: [null, null, null, null], captions: ['', '', '', ''] };
}
export function makeTextPage() {
  return { id: nextId(), type: 'text', title: 'Om oss', body: '' };
}
export function makeBackCover(companyName) {
  return { id: nextId(), type: 'backcover', companyName: companyName || '', phone: '', email: '', website: '', address: '' };
}

export function buildInitialPages(count, companyName) {
  const pages = [makeCover(companyName)];
  for (let i = 1; i < count - 1; i++) {
    pages.push(i % 3 === 0 ? makeGallery() : makeProduct());
  }
  pages.push(makeBackCover(companyName));
  return pages;
}
