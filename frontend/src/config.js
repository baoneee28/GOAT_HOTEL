// ============================================================
// CẤU HÌNH TRUNG TÂM — Mọi URL API đều xuất phát từ đây
// Khi deploy, chỉ cần thay đổi DUY NHẤT file này.
// ============================================================

const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const devApiBase = typeof window !== 'undefined' && ['3000', '4173', '5173'].includes(window.location.port)
  ? `${window.location.protocol}//${window.location.hostname}:8080`
  : runtimeOrigin;

const API_BASE = import.meta.env.VITE_API_BASE_URL || devApiBase;

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

export default API_BASE;
