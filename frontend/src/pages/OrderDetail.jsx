import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { imageUrl } from '../config';

// Helper: format datetime string
const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  let d;
  // Handle Spring Boot LocalDateTime array format: [YYYY, MM, DD, HH, mm]
  if (Array.isArray(dateValue)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
    d = new Date(year, month - 1, day, hour, minute, second);
  } else {
    d = new Date(dateValue);
  }
  if (isNaN(d)) return 'Invalid Date';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper: calculate nights from hours
const calcNights = (hours) => {
  if (!hours) return 1;
  return Math.max(1, Math.round(hours / 24));
};

// Status step definitions
const STATUS_STEPS = [
  { key: 'pending',   label: 'Chờ xử lý',   icon: 'check' },
  { key: 'confirmed', label: 'Đã xác nhận', icon: 'check_circle' },
  { key: 'completed', label: 'Đã hoàn thành', icon: 'auto_awesome' },
  { key: 'cancelled', label: 'Đã hủy', icon: 'cancel' },
];

const STATUS_ORDER = { pending: 0, confirmed: 1, completed: 2, cancelled: 3 };

const getRoomImageUrl = (url) => {
  return imageUrl(url);
};

export default function OrderDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [cancelling, setCancelling] = useState(false);
  const [loading, setLoading] = useState(!location.state?.booking);

  React.useEffect(() => {
    if (!booking && id) {
      axios.get(`${API_BASE}/api/admin/bookings/${id}`, { withCredentials: true })
        .then(res => {
          if (res.data) setBooking(res.data);
        })
        .catch(err => {
          console.error('Không thể tải chi tiết booking:', err);
          // Fallback thử tải từ history cá nhân
          axios.get(`${API_BASE}/api/bookings/history?page=1`, { withCredentials: true })
            .then(hist => {
              const matched = hist.data?.bookings?.find(b => String(b.id) === String(id));
              if (matched) setBooking(matched);
            }).catch(() => {});
        })
        .finally(() => setLoading(false));
    }
  }, [id, booking]);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6"><p className="text-secondary">Đang tải...</p></div>;
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <p className="text-slate-400 font-label tracking-widest uppercase text-sm">Không tìm thấy dữ liệu đặt phòng.</p>
        <Link to="/history" className="text-secondary font-label text-xs uppercase tracking-widest border-b border-secondary/40 pb-0.5">← Quay lại Lịch sử</Link>
      </div>
    );
  }

  const detail = booking.details?.[0];
  const currentStatus = booking.status?.toLowerCase() || 'pending';
  const currentStatusIndex = STATUS_ORDER[currentStatus] ?? 0;
  const nights = calcNights(detail?.totalHours);
  const pricePerNight = detail?.priceAtBooking ?? 0;
  const baseTotal = pricePerNight * nights;
  const serviceFee = booking.serviceFee || 0;
  const tax = booking.tax || 0;
  const totalFees = serviceFee + tax;
  const grandTotal = booking.totalAmount || (baseTotal + totalFees);

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn này?')) return;
    setCancelling(true);
    try {
      const res = await axios.delete(`${API_BASE}/api/bookings/${booking.id}?userId=${booking.user?.id || 1}`, { withCredentials: true });
      if (res.data?.success) {
        if (window.Swal) window.Swal.fire({ icon: 'success', title: 'Đã hủy đơn', showConfirmButton: false, timer: 1500 });
        navigate('/history');
      } else {
        if (window.Swal) window.Swal.fire({ icon: 'error', title: 'Không thể hủy', text: res.data?.message });
      }
    } catch (err) {
      if (window.Swal) window.Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Có lỗi xảy ra.' });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen font-body text-slate-200" style={{ background: 'radial-gradient(circle at top left, #0f172a, #020617)' }}>
      <style>{`
        .gold-shimmer {
          background: linear-gradient(90deg, #d4af37, #f3e5ab, #d4af37);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        @keyframes shimmer { to { background-position: 200% center; } }
        .glass-card {
          background: rgba(15,23,42,0.6);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
      `}</style>

      <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Back Button */}
        <Link to="/history" className="inline-flex items-center gap-2 text-slate-500 hover:text-secondary transition-colors font-label text-xs uppercase tracking-widest mb-12">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Quay lại Lịch sử
        </Link>

        {/* Header */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-800 pb-12">
          <div className="space-y-4">
            <span className="inline-block text-secondary font-label text-[0.7rem] tracking-[0.4em] uppercase font-bold px-3 py-1 border border-secondary/20 bg-secondary/5">
              Tổng quan Đặt phòng
            </span>
            <h1 className="font-headline text-5xl md:text-6xl font-light tracking-tight text-white italic">
              Đơn <span className="text-secondary not-italic">#{String(booking.id).padStart(5, '0')}</span>
            </h1>
          </div>

          {/* Status Stepper */}
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex items-center gap-4">
              {STATUS_STEPS.map((step, i) => {
                const isCurrent = step.key === currentStatus;
                const isPast = STATUS_ORDER[step.key] < currentStatusIndex;
                const isDim = !isCurrent && !isPast;
                return (
                  <React.Fragment key={step.key}>
                    <div className={`flex flex-col items-center gap-2 transition-opacity ${isDim ? 'opacity-30' : ''}`}>
                      {isCurrent ? (
                        <div className="relative">
                          <div className="absolute -inset-2 bg-emerald-500/20 blur-lg rounded-full animate-pulse"></div>
                          <div className="relative w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                            <span className="material-symbols-outlined text-lg">{step.icon}</span>
                          </div>
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <span className="font-label text-[0.55rem] tracking-[0.3em] uppercase font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20">Hiện tại</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${isPast ? 'border-secondary/50 text-secondary' : 'border-slate-700 text-slate-600'}`}>
                          <span className="material-symbols-outlined text-sm">{step.icon}</span>
                        </div>
                      )}
                      <span className={`font-headline text-[0.65rem] tracking-widest uppercase italic ${isCurrent ? 'text-white' : 'text-slate-500'}`}>{step.label}</span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && <div className="w-8 h-[1px] bg-slate-800"></div>}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="flex gap-3 pl-10 border-l border-slate-800">
              <button className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-800 text-slate-500 hover:border-secondary hover:text-secondary transition-all">
                <span className="material-symbols-outlined text-lg">share</span>
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-800 text-slate-500 hover:border-secondary hover:text-secondary transition-all">
                <span className="material-symbols-outlined text-lg">print</span>
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-10">

            {/* Reservation Summary */}
            <section className="glass-card p-10 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                <div className="space-y-2">
                  <p className="font-label text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 font-bold">Nhận phòng</p>
                  <p className="font-headline text-xl text-white">{formatDate(detail?.checkIn)}</p>
                  <p className="font-body text-[0.7rem] text-slate-500 uppercase tracking-tighter italic">Sau 15:00</p>
                </div>
                <div className="space-y-2">
                  <p className="font-label text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 font-bold">Trả phòng</p>
                  <p className="font-headline text-xl text-white">{formatDate(detail?.checkOut)}</p>
                  <p className="font-body text-[0.7rem] text-slate-500 uppercase tracking-tighter italic">Trước 11:00</p>
                </div>
                <div className="space-y-2">
                  <p className="font-label text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 font-bold">Thời gian</p>
                  <p className="font-headline text-xl text-secondary">{nights} Đêm</p>
                </div>
                <div className="space-y-2">
                  <p className="font-label text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 font-bold">Khách</p>
                  <p className="font-headline text-xl text-white">2 Khách</p>
                </div>
              </div>
            </section>

            {/* Room Card */}
            {detail && (
              <section className="glass-card p-0 rounded-lg overflow-hidden border-l-4 border-l-secondary">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 relative group">
                    <img
                      alt={detail.room?.roomNumber || 'Room'}
                      className="w-full h-full object-cover min-h-[300px] transition-transform duration-1000 group-hover:scale-110"
                      src={getRoomImageUrl(detail.room?.image)}
                    />
                    <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors duration-500"></div>
                    <div className="absolute top-4 left-4 bg-secondary p-2 shadow-2xl">
                      <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                    </div>
                  </div>
                  <div className="md:w-2/3 p-10 space-y-6">
                    <div>
                      <h2 className="font-headline text-3xl text-white mb-2 italic">
                        Phòng {detail.room?.roomNumber || 'N/A'}
                      </h2>
                      <p className="font-label text-[0.7rem] text-secondary tracking-[0.3em] uppercase font-bold">
                        {detail.room?.roomType?.typeName || 'Phòng Tiêu chuẩn'}
                      </p>
                    </div>
                    <p className="font-body text-slate-400 leading-relaxed text-sm">
                      {detail.room?.roomType?.description || 'Trải nghiệm đỉnh cao của sự sang trọng với nội thất thủ công được tuyển chọn kỹ lưỡng và dịch vụ hỗ trợ đặc quyền 24/7.'}
                    </p>
                    <div className="flex flex-wrap gap-8 pt-4 border-t border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary text-sm">bed</span>
                        <span className="text-[0.65rem] uppercase tracking-widest text-slate-300">
                          {detail.room?.roomType?.typeName || 'Giường King'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary text-sm">payments</span>
                        <span className="text-[0.65rem] uppercase tracking-widest text-slate-300">
                          {pricePerNight.toLocaleString('vi-VN')}đ / đêm
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary text-sm">hotel</span>
                        <span className="text-[0.65rem] uppercase tracking-widest text-slate-300">
                          {detail.room?.status || 'Đã đặt'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Financial Summary */}
            <section className="glass-card rounded-lg overflow-hidden">
              <div className="p-8 border-b border-slate-800 bg-slate-900/40">
                <h3 className="font-headline text-2xl text-white italic">Tóm tắt Tài chính</h3>
              </div>
              <div className="p-10 space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-light tracking-wide">
                    Tiền phòng ({nights} đêm × {pricePerNight.toLocaleString('vi-VN')}đ)
                  </span>
                  <span className="font-headline text-white">{baseTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between items-center text-sm pb-6 border-b border-slate-800/50">
                  <span className="text-slate-400 font-light tracking-wide">Thuế & Phí Dịch vụ</span>
                  <span className="font-headline text-white">{Math.round(totalFees).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <div className="space-y-1">
                    <span className="block font-label text-[0.7rem] uppercase tracking-[0.3em] font-bold text-secondary">Tổng cộng</span>
                    <span className="block text-[0.65rem] text-slate-500 italic">Đơn #{String(booking.id).padStart(5, '0')}</span>
                  </div>
                  <span className="font-headline text-4xl text-white gold-shimmer">{Math.round(Number(grandTotal)).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </section>

          </div>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-8">

            {/* Booking Info Card */}
            <section className="glass-card p-8 rounded-lg">
              <h3 className="font-label text-[0.7rem] uppercase tracking-[0.3em] text-secondary mb-8 font-bold">Thông tin Đặt phòng</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-950/50 border border-slate-800 p-4 rounded-lg">
                  <div>
                    <p className="font-headline text-sm text-white">Khách</p>
                    <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest mt-1">{booking.user?.fullName || booking.user?.email || 'N/A'}</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-lg">person</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/50 border border-slate-800 p-4 rounded-lg">
                  <div>
                    <p className="font-headline text-sm text-white">Trạng thái</p>
                    <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest mt-1 capitalize">{booking.status}</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-lg">info</span>
                </div>
              </div>
            </section>

            {/* Actions */}
            <section className="space-y-4">
              <button className="w-full py-5 bg-secondary text-slate-950 font-label text-[0.75rem] uppercase tracking-[0.3em] font-bold hover:bg-white transition-all duration-500 shadow-2xl shadow-secondary/10 group flex items-center justify-center gap-3">
                <span>Tải Hóa đơn</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-y-1 transition-transform">download</span>
              </button>
              {currentStatus === 'pending' && (
                <button className="w-full py-5 border border-slate-700 text-white font-label text-[0.75rem] uppercase tracking-[0.3em] font-bold hover:bg-slate-800/50 hover:border-secondary transition-all duration-300">
                  Thay đổi Đặt phòng
                </button>
              )}
              {(currentStatus === 'pending' || currentStatus === 'confirmed') && (
                <div className="pt-6 text-center">
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-600 hover:text-red-400 transition-colors border-b border-transparent hover:border-red-400/30 pb-1 disabled:opacity-40"
                  >
                    {cancelling ? 'Đang hủy...' : 'Hủy Đặt phòng'}
                  </button>
                </div>
              )}
            </section>

            {/* Digital Concierge Callout */}
            <section className="bg-slate-950 p-10 border border-secondary/20 rounded-lg relative overflow-hidden group">
              <div className="absolute -right-12 -bottom-12 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-110">
                <span className="material-symbols-outlined text-[12rem] text-secondary">concierge</span>
              </div>
              <div className="relative z-10 space-y-6">
                <h4 className="font-headline text-2xl text-white italic">Luôn Sẵn sàng Phục vụ</h4>
                <p className="font-body text-xs text-slate-400 leading-relaxed uppercase tracking-widest">
                  Dịch vụ hỗ trợ trực tuyến của chúng tôi làm việc 24/7 để mang đến những dịch vụ cá nhân hóa cho chuyến đi của bạn.
                </p>
                <button className="flex items-center gap-3 text-secondary font-label text-[0.75rem] uppercase tracking-[0.3em] font-bold group/btn">
                  <span className="border-b border-secondary/30 pb-1 group-hover/btn:border-secondary transition-all">Nhắn tin Hỗ trợ</span>
                  <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            </section>

          </aside>
        </div>
      </main>
    </div>
  );
}
