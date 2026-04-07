import API_BASE from './api';

const LOCAL_PUBLIC_PREFIXES = ['/images/news/', '/images/assets/', '/icons/'];
const BACKEND_STATIC_PREFIXES = [
  '/images/contact/',
  '/images/home/',
  '/images/rooms/',
  '/images/Featured_news/',
  '/images/default_avatar.png',
];

const ICON_ALIASES = {
  'wifi.png': '/icons/wifi.png',
  'tv.png': '/icons/tv.png',
  'safe.png': '/icons/safe.png',
  'mini.png': '/icons/mini.png',
  'fridge.png': '/icons/mini.png',
  'jacuzzi.png': '/icons/jacuzzi.png',
  'bathtub.png': '/icons/jacuzzi.png',
  'ironing.png': '/icons/ironing.png',
  'iron.png': '/icons/ironing.png',
  'heart.png': '/icons/heart.png',
  'sofa.png': '/icons/heart.png',
  'hairdryer.png': '/icons/hairdryer.png',
  'balcony.png': '/icons/balcony.png',
  'air-conditioner.png': '/icons/air-conditioner.png',
  'ac.png': '/icons/air-conditioner.png',
};

function resolveAssetUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;

  if (LOCAL_PUBLIC_PREFIXES.some((prefix) => url.startsWith(prefix))) return url;
  if (BACKEND_STATIC_PREFIXES.some((prefix) => url.startsWith(prefix))) return `${API_BASE}${url}`;

  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function imageUrl(url, fallback = '/images/rooms/standard-room.jpg') {
  return resolveAssetUrl(url || fallback);
}

export function uploadedImageUrl(url, fallback = '/images/rooms/standard-room.jpg') {
  if (!url) return resolveAssetUrl(fallback);
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  if (url.startsWith('/')) return resolveAssetUrl(url);
  return `${API_BASE}/uploads/${url}`;
}

export function iconUrl(url, fallback = '/icons/tv.png') {
  if (!url) return fallback;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/')) return resolveAssetUrl(url);

  const key = url.trim().toLowerCase();
  const fileName = key.includes('/') ? key.split('/').pop() : key;

  return ICON_ALIASES[fileName] || `/icons/${fileName}`;
}
