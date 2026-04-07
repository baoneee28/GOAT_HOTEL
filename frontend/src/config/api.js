const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const devApiBase = typeof window !== 'undefined' && ['3000', '4173', '5173'].includes(window.location.port)
  ? `${window.location.protocol}//${window.location.hostname}:8080`
  : runtimeOrigin;

const API_BASE = import.meta.env.VITE_API_BASE_URL || devApiBase;

export default API_BASE;
