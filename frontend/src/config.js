// ============================================================
// CẤU HÌNH TRUNG TÂM — Mọi URL API đều xuất phát từ đây
// Khi deploy, chỉ cần thay đổi DUY NHẤT file này.
// ============================================================

const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const devApiBase = typeof window !== 'undefined' && ['3000', '4173', '5173'].includes(window.location.port)
  ? `${window.location.protocol}//${window.location.hostname}:8080`
  : runtimeOrigin;

const API_BASE = import.meta.env.VITE_API_BASE_URL || devApiBase;

const ROOM_TYPE_SPEC_SEEDS = {
  standard: {
    size: '20m²',
    beds: '1 giường đôi',
    view: 'Hướng vườn / nội khu',
  },
  superior: {
    size: '24m²',
    beds: '2 giường đơn / 1 giường đôi',
    view: 'Hướng thành phố',
  },
  deluxe: {
    size: '28m²',
    beds: '2 giường đơn / 1 giường đôi',
    view: 'Hướng biển',
  },
  family: {
    size: '35m²',
    beds: '2 giường đôi',
    view: 'Hướng hồ bơi / thành phố',
  },
};

function resolveAssetUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;

  const localPublicPrefixes = ['/images/news/', '/images/assets/', '/icons/'];
  if (localPublicPrefixes.some((prefix) => url.startsWith(prefix))) return url;

  const backendStaticPrefixes = [
    '/images/contact/',
    '/images/home/',
    '/images/rooms/',
    '/images/Featured_news/',
    '/images/default_avatar.png',
  ];
  if (backendStaticPrefixes.some((prefix) => url.startsWith(prefix))) return `${API_BASE}${url}`;

  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

function normalizeDateValue(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    const parsed = new Date(year, (month || 1) - 1, day || 1, hour, minute, second);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isBrokenUnicode(value) {
  if (!value) return false;
  return value.includes('?') || value.includes('�');
}

function resolveRoomTypeKey(typeName) {
  if (!typeName) return null;
  const normalized = typeName.trim().toLowerCase();
  return Object.keys(ROOM_TYPE_SPEC_SEEDS).find((key) => normalized.includes(key)) || null;
}

/**
 * Chuyển đổi đường dẫn ảnh tương đối thành URL đầy đủ.
 * - Nếu đã là URL tuyệt đối (http/https) → giữ nguyên
 * - Nếu là path tương đối (/images/...) → ghép với API_BASE
 * 
 * @param {string} url - Đường dẫn ảnh (có thể tương đối hoặc tuyệt đối)
 * @param {string} fallback - URL ảnh mặc định nếu url rỗng
 * @returns {string} URL đầy đủ
 */
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

  const iconAliases = {
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

  return iconAliases[fileName] || `/icons/${fileName}`;
}

export function formatDateValue(value, locale = 'vi-VN') {
  const parsed = normalizeDateValue(value);
  return parsed ? parsed.toLocaleDateString(locale) : '';
}

export function calculateStayNights(checkIn, checkOut) {
  const start = normalizeDateValue(checkIn);
  const end = normalizeDateValue(checkOut);

  if (!start || !end || end <= start) {
    return 0;
  }

  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffDays = Math.round((endDate - startDate) / 86400000);

  return diffDays > 0 ? diffDays : 1;
}

export function calculateBookingDisplayTotal(booking) {
  if (!booking) return 0;

  const storedTotal = Number(booking.totalPrice || 0);
  const details = Array.isArray(booking.details) ? booking.details : [];

  if (details.length === 0) {
    return storedTotal;
  }

  const recalculatedTotal = details.reduce((sum, detail) => {
    const nights = calculateStayNights(detail?.checkIn, detail?.checkOut);
    const pricePerNight = Number(detail?.priceAtBooking ?? detail?.room?.roomType?.pricePerNight ?? 0);
    return sum + (nights > 0 ? pricePerNight * nights : 0);
  }, 0);

  if (recalculatedTotal > 0 && Math.abs(storedTotal - recalculatedTotal) > 0.01) {
    return recalculatedTotal;
  }

  return storedTotal || recalculatedTotal;
}

export function resolveRoomTypeSpec(typeName, field, value, fallback = 'Chưa cập nhật') {
  const roomTypeKey = resolveRoomTypeKey(typeName);

  if (roomTypeKey === 'deluxe' && field === 'beds' && value && value.toLowerCase().includes('queen')) {
    return ROOM_TYPE_SPEC_SEEDS.deluxe.beds;
  }

  if (value && !isBrokenUnicode(value)) {
    return value;
  }

  if (roomTypeKey && ROOM_TYPE_SPEC_SEEDS[roomTypeKey]?.[field]) {
    return ROOM_TYPE_SPEC_SEEDS[roomTypeKey][field];
  }

  return value || fallback;
}

export default API_BASE;
