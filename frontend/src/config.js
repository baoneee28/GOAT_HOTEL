// ============================================================
// CẤU HÌNH TRUNG TÂM — Mọi URL API đều xuất phát từ đây
// Khi deploy, chỉ cần thay đổi DUY NHẤT file này.
// ============================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
  if (!url) return fallback;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/images/') || url.startsWith('/icons/')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default API_BASE;
