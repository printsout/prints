import { Square, Columns, Rows, LayoutGrid, Grid2x2 } from 'lucide-react';

export const MIN_PAGES = 10;
export const MAX_PAGES = 80;
export const DEFAULT_PAGES = 20;

export const LAYOUTS = [
  { id: 'single', label: '1 bild', icon: Square, slots: 1 },
  { id: 'two-h', label: '2 bredvid', icon: Columns, slots: 2 },
  { id: 'two-v', label: '2 staplade', icon: Rows, slots: 2 },
  { id: 'three', label: '1 + 2', icon: LayoutGrid, slots: 3 },
  { id: 'four', label: '2 x 2', icon: Grid2x2, slots: 4 },
];

export const COVER_MATERIALS = [
  { id: 'hardpaper', label: 'Hårt papper', desc: 'Klassiskt hårt kartongomslag', price: 0 },
  { id: 'fabric', label: 'Tygbeklätt', desc: 'Hårt papper beklätt med tyg', price: 49 },
  { id: 'leather', label: 'Konstläder', desc: 'Hårt papper beklätt med konstläder', price: 79 },
];

export function createPage(id) {
  return { id, layout: 'single', images: [null], captions: [''] };
}

export function resizeImages(images, newSlots) {
  const result = [...images];
  while (result.length < newSlots) result.push(null);
  return result.slice(0, newSlots);
}

export function resizeCaptions(captions, newSlots) {
  const result = [...(captions || [])];
  while (result.length < newSlots) result.push('');
  return result.slice(0, newSlots);
}

export function getPageImageCount(page) {
  return page.images.filter(Boolean).length;
}

export function burnCaptionOnImage(imageSrc, captionText) {
  return new Promise((resolve) => {
    if (!captionText) {
      resolve(imageSrc);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const gradientHeight = img.height * 0.18;
      const gradient = ctx.createLinearGradient(0, img.height - gradientHeight, 0, img.height);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, img.height - gradientHeight, img.width, gradientHeight);

      const fontSize = Math.max(16, Math.round(img.width * 0.035));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(captionText, img.width / 2, img.height - fontSize * 0.6, img.width * 0.9);

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
