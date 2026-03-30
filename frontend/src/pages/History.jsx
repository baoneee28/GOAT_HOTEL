import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { imageUrl } from '../config';

const STATUS_STYLES = {
  pending: {
    badge: 'border border-secondary/60 text-secondary bg-secondary/5',
    label: 'Chờ xử lý',
  },
  confirmed: {
    badge: 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30',
    label: 'Đã xác nhận',
  },
  completed: {
    badge: 'bg-slate-800 text-slate-300 border border-slate-700',
    label: 'Đã hoàn thành',
  },
  cancelled: {
    badge: 'bg-red-950/40 text-red-400 border border-red-800/30 line-through',
    label: 'Đã hủy',
  },
};

const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  let d;
  if (Array.isArray(dateValue)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
    d = new Date(year, month - 1, day, hour, minute, second);
  } else {
    d = new Date(dateValue);
  }
  if (isNaN(d)) return 'Invalid Date';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getRoomImage = (url) => {
  return imageUrl(url);
};

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

export default function History() {
  const navigate = useNavigate();
  const { user: sessionUser } = useOutletContext() || {};
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const currentUserId = sessionUser?.id;

  const fetchHistory = async (filter, pg) => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg });
      if (filter !== 'all') params.append('status', filter);
      const res = await axios.get(`${API_BASE}/api/bookings/history?${params}`, { withCredentials: true });
      setBookings(res.data?.bookings || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(activeFilter, page);
  }, [activeFilter, page, currentUserId]);

  const handleFilterChange = (f) => {
    setActiveFilter(f);
    setPage(1);
  };

  const goToDetail = (booking) => {
    navigate(`/booking/${booking.id}`, { state: { booking } });
  };

  return (
    <div className="min-h-screen font-body text-slate-200" style={{ background: 'radial-gradient(circle at top left, #0f172a, #020617)' }}>
      <style>{`
        .glass-card { background: rgba(15,23,42,0.6); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
      `}</style>

      <main className="pt-8 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Page Header */}
        <header className="mb-16 border-b border-slate-800 pb-12 space-y-4">
          <h1 className="font-headline text-5xl md:text-6xl font-light tracking-tight text-white italic">
            Lịch sử <span className="text-secondary not-italic">Đặt phòng</span>
          </h1>
          <p className="text-slate-500 font-body text-sm max-w-lg">
            Toàn bộ hồ sơ lưu trú và đặt phòng của bạn tại GOAT HOTEL.
          </p>
        </header>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-12">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-5 py-2 font-label text-[0.65rem] uppercase tracking-[0.3em] font-bold border transition-all duration-300 ${
                activeFilter === f
                  ? 'bg-secondary text-slate-950 border-secondary'
                  : 'border-slate-800 text-slate-500 hover:border-secondary/40 hover:text-secondary'
              }`}
            >
              {f === 'all' ? 'Tất cả' : STATUS_STYLES[f]?.label || f}
            </button>
          ))}
        </div>

        {/* Booking List */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass-card p-20 rounded-lg text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-slate-700">hotel</span>
            <p className="font-headline text-xl text-slate-500 italic">Không tìm thấy đặt phòng nào.</p>
            <Link to="/collections" className="inline-block mt-4 font-label text-xs uppercase tracking-widest text-secondary border-b border-secondary/40 pb-0.5">
              Xem phòng
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const detail = booking.details?.[0];
              const status = booking.status?.toLowerCase() || 'pending';
              const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
              return (
                <div
                  key={booking.id}
                  onClick={() => goToDetail(booking)}
                  className="glass-card rounded-lg overflow-hidden cursor-pointer group hover:border-secondary/30 transition-all duration-500"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Room Image */}
                    <div className="md:w-1/5 relative overflow-hidden">
                      <img
                        alt={`Room ${detail?.room?.roomNumber}`}
                        src={getRoomImage(detail?.room?.image)}
                        className="w-full h-full object-cover min-h-[180px] transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 transition-colors duration-500"></div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 font-label text-[0.6rem] uppercase tracking-widest font-bold rounded-sm ${style.badge}`}>
                            {style.label}
                          </span>
                          <span className="font-label text-[0.6rem] text-slate-600 uppercase tracking-widest">
                            #{String(booking.id).padStart(5, '0')}
                          </span>
                        </div>
                        <h3 className="font-headline text-2xl text-white italic">
                          {detail?.room?.roomType?.typeName || 'Phòng Tiêu chuẩn'}
                        </h3>
                        <p className="font-label text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">
                          Phòng {detail?.room?.roomNumber || 'N/A'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-8 md:gap-12">
                        <div className="space-y-1">
                          <p className="font-label text-[0.6rem] uppercase tracking-widest text-slate-600 font-bold">Nhận phòng</p>
                          <p className="font-headline text-base text-white">{formatDate(detail?.checkIn)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="font-label text-[0.6rem] uppercase tracking-widest text-slate-600 font-bold">Trả phòng</p>
                          <p className="font-headline text-base text-white">{formatDate(detail?.checkOut)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="font-label text-[0.6rem] uppercase tracking-widest text-slate-600 font-bold">Tổng cộng</p>
                          <p className="font-headline text-xl text-secondary">{(booking.totalPrice || 0).toLocaleString('vi-VN')}đ</p>
                        </div>
                      </div>

                      <div className="hidden md:flex items-center">
                        <span className="material-symbols-outlined text-slate-700 group-hover:text-secondary group-hover:translate-x-1 transition-all duration-300">arrow_forward_ios</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2 border border-slate-800 text-slate-500 font-label text-[0.65rem] uppercase tracking-widest hover:border-secondary hover:text-secondary transition-all disabled:opacity-30"
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`w-10 h-10 font-label text-[0.65rem] uppercase tracking-widest border transition-all ${
                  pg === page ? 'bg-secondary text-slate-950 border-secondary' : 'border-slate-800 text-slate-500 hover:border-secondary/40'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-5 py-2 border border-slate-800 text-slate-500 font-label text-[0.65rem] uppercase tracking-widest hover:border-secondary hover:text-secondary transition-all disabled:opacity-30"
            >
              Tiếp
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
