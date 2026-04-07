import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { calculateBookingDisplayTotal, calculateStayNights, imageUrl, uploadedImageUrl } from '../config';

const FILTERS = ['all', 'pending', 'deposit_paid', 'confirmed', 'staying', 'completed', 'cancelled', 'expired'];
const EMPTY_STATUS_SUMMARY = { all: 0, pending: 0, deposit_paid: 0, confirmed: 0, staying: 0, completed: 0, cancelled: 0, expired: 0 };

const STATUS_STYLES = {
  pending: {
    badge: 'border border-amber-400/25 bg-amber-500/10 text-amber-200',
    pill: 'border border-amber-400/25 bg-amber-500/8 text-amber-200',
    label: 'Chờ xử lý',
    summary: 'Đang chờ khách sạn xác nhận',
  },
  confirmed: {
    badge: 'border border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
    pill: 'border border-emerald-400/25 bg-emerald-500/8 text-emerald-200',
    label: 'Đã xác nhận',
    summary: 'Kỳ nghỉ sắp tới',
  },
  deposit_paid: {
    badge: 'border border-violet-400/25 bg-violet-500/10 text-violet-200',
    pill: 'border border-violet-400/25 bg-violet-500/8 text-violet-200',
    label: 'Đã đặt cọc',
    summary: 'Đã cọc 30%, chờ thanh toán phần còn lại',
  },
  staying: {
    badge: 'border border-cyan-400/25 bg-cyan-500/10 text-cyan-200',
    pill: 'border border-cyan-400/25 bg-cyan-500/8 text-cyan-200',
    label: 'Đang thuê',
    summary: 'Bạn đang lưu trú tại GOAT HOTEL',
  },
  completed: {
    badge: 'border border-slate-300/14 bg-white/8 text-white/82',
    pill: 'border border-slate-300/14 bg-white/6 text-white/78',
    label: 'Đã hoàn thành',
    summary: 'Đã lưu trú',
  },
  cancelled: {
    badge: 'border border-rose-400/22 bg-rose-500/10 text-rose-200',
    pill: 'border border-rose-400/22 bg-rose-500/8 text-rose-200',
    label: 'Đã hủy',
    summary: 'Đơn lưu trú đã hủy',
  },
  expired: {
    badge: 'border border-slate-400/22 bg-slate-500/10 text-slate-200',
    pill: 'border border-slate-400/22 bg-slate-500/8 text-slate-200',
    label: 'Hết hạn giữ chỗ',
    summary: 'Giữ chỗ tạm thời đã hết hiệu lực',
  },
};

const PAYMENT_STYLES = {
  unpaid: {
    badge: 'border border-amber-300/24 bg-amber-100/80 text-amber-800',
    pill: 'border border-amber-300/24 bg-amber-100/80 text-amber-800',
    label: 'Chưa thanh toán',
  },
  pending_payment: {
    badge: 'border border-sky-300/24 bg-sky-100/80 text-sky-800',
    pill: 'border border-sky-300/24 bg-sky-100/80 text-sky-800',
    label: 'Chờ thanh toán',
  },
  deposit_paid: {
    badge: 'border border-violet-300/24 bg-violet-100/80 text-violet-800',
    pill: 'border border-violet-300/24 bg-violet-100/80 text-violet-800',
    label: 'Đã đặt cọc',
  },
  paid: {
    badge: 'border border-emerald-300/24 bg-emerald-100/80 text-emerald-800',
    pill: 'border border-emerald-300/24 bg-emerald-100/80 text-emerald-800',
    label: 'Đã thanh toán',
  },
  failed: {
    badge: 'border border-rose-300/24 bg-rose-100/80 text-rose-800',
    pill: 'border border-rose-300/24 bg-rose-100/80 text-rose-800',
    label: 'Thanh toán lỗi',
  },
};

function formatDate(dateValue) {
  if (!dateValue) return 'Chưa cập nhật';
  let d;
  if (Array.isArray(dateValue)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
    d = new Date(year, month - 1, day, hour, minute, second);
  } else {
    d = new Date(dateValue);
  }
  if (Number.isNaN(d.getTime())) return 'Chưa cập nhật';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateValue) {
  if (!dateValue) return 'Chưa cập nhật';
  let d;
  if (Array.isArray(dateValue)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
    d = new Date(year, month - 1, day, hour, minute, second);
  } else {
    d = new Date(dateValue);
  }
  if (Number.isNaN(d.getTime())) return 'Chưa cập nhật';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function getBookingCode(id) {
  return `GH-${String(id || 0).padStart(5, '0')}`;
}

function getRoomImage(url) {
  return uploadedImageUrl(url, '/images/rooms/standard-room.jpg');
}

function resolveHistoryStatus(booking) {
  const normalizedStatus = String(booking?.status || 'pending').toLowerCase();
  if (normalizedStatus !== 'confirmed') {
    return normalizedStatus;
  }

  const detail = booking?.details?.[0];
  if (detail?.checkInActual && !detail?.checkOutActual) {
    return 'staying';
  }

  if (String(booking?.paymentStatus || '').toLowerCase() === 'deposit_paid') {
    return 'deposit_paid';
  }

  return normalizedStatus;
}

export default function History() {
  const navigate = useNavigate();
  const { user: sessionUser } = useOutletContext() || {};
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusSummary, setStatusSummary] = useState(EMPTY_STATUS_SUMMARY);

  const currentUserId = sessionUser?.id;

  const fetchHistory = async (filter, pg, silent = false) => {
    if (!currentUserId) return;
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg });
      if (filter !== 'all') params.append('status', filter);
      const res = await axios.get(`${API_BASE}/api/bookings/history?${params}`, { withCredentials: true });
      const payload = res.data || {};
      const meta = payload.meta || {};
      setBookings(payload.data || []);
      setTotalPages(meta.totalPages || 1);
      setStatusSummary({ ...EMPTY_STATUS_SUMMARY, ...(meta.statusSummary || {}) });
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(activeFilter, page);
  }, [activeFilter, page, currentUserId]);

  useEffect(() => {
    if (Number(statusSummary.pending || 0) <= 0) return undefined;

    const refreshTimer = window.setInterval(() => {
      fetchHistory(activeFilter, page, true);
    }, 5000);

    return () => window.clearInterval(refreshTimer);
  }, [statusSummary.pending, activeFilter, page, currentUserId]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const goToDetail = (booking) => {
    navigate(`/booking/${booking.id}`, { state: { booking } });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5efe5_0%,#fbf8f3_34%,#f9f5ee_100%)] font-body text-slate-200">
      <style>{`
        .history-shell {
          background:
            linear-gradient(180deg, rgba(5, 15, 30, 0.46) 0%, rgba(5, 15, 30, 0.68) 100%),
            linear-gradient(90deg, rgba(5, 15, 30, 0.78) 0%, rgba(5, 15, 30, 0.4) 48%, rgba(5, 15, 30, 0.66) 100%);
        }
        .history-panel {
          background: linear-gradient(180deg, rgba(255,252,247,0.94) 0%, rgba(250,246,239,0.98) 100%);
          border: 1px solid rgba(120, 90, 25, 0.14);
          box-shadow: 0 28px 70px -46px rgba(40, 28, 12, 0.28);
          backdrop-filter: blur(20px);
        }
        .history-filter-rail {
          background: linear-gradient(180deg, rgba(255,251,246,0.95) 0%, rgba(248,243,235,0.98) 100%);
          border: 1px solid rgba(120, 90, 25, 0.14);
          box-shadow: 0 24px 60px -42px rgba(40, 28, 12, 0.22);
          backdrop-filter: blur(18px);
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          vertical-align: middle;
        }
      `}</style>

      <section className="history-shell relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={imageUrl('/images/home/history_hero.webp')}
            alt="GOAT HOTEL reservations"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-28 sm:px-8 lg:px-10 lg:pb-28 lg:pt-32">
          <div className="max-w-3xl pt-12 sm:pt-16 lg:pt-24">
            <p className="font-label text-[0.72rem] uppercase tracking-[0.34em] text-secondary/90">
              Reservation Archive
            </p>
            <h1 className="mt-8 font-headline text-4xl leading-tight text-white sm:text-5xl lg:text-[3.8rem]">
              Lịch sử Đặt phòng
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
              Kho lưu trú cá nhân của bạn tại GOAT HOTEL, nơi mọi lần đặt phòng được lưu lại với trạng thái,
              thời gian và giá trị rõ ràng trong một trải nghiệm sang trọng, dễ theo dõi.
            </p>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto mt-12 max-w-7xl px-6 pb-24 sm:px-8 lg:mt-16 lg:px-10">
        <section className="history-filter-rail rounded-[30px] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary">Bộ lọc lưu trú</p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Chọn trạng thái để tập trung vào những kỳ lưu trú bạn cần xem lại nhanh nhất.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {FILTERS.map((filter) => {
                const isActive = activeFilter === filter;
                const label = filter === 'all' ? 'Tất cả' : STATUS_STYLES[filter]?.label || filter;
                return (
                  <button
                    key={filter}
                    onClick={() => handleFilterChange(filter)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-3 font-label text-[0.64rem] uppercase tracking-[0.22em] transition-all ${
                      isActive
                        ? 'bg-secondary text-slate-950 shadow-[0_14px_30px_-18px_rgba(212,175,55,0.8)]'
                        : 'border border-outline-variant/20 bg-white/70 text-primary/72 hover:border-secondary/35 hover:text-secondary'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`inline-flex min-w-6 justify-center rounded-full px-2 py-0.5 text-[0.58rem] tracking-normal ${isActive ? 'bg-slate-950/12 text-slate-950' : 'bg-primary/6 text-primary/58'}`}>
                      {statusSummary[filter] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="history-panel rounded-[30px] px-6 py-24 text-center text-primary sm:px-10">
              <div className="mx-auto h-10 w-10 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
              <p className="mt-6 font-label text-[0.68rem] uppercase tracking-[0.28em] text-primary/42">Đang tải lịch sử lưu trú</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="history-panel rounded-[32px] px-6 py-20 text-center sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-outline-variant/18 bg-white/75 text-secondary">
                <span className="material-symbols-outlined text-3xl">hotel</span>
              </div>
              <h2 className="mt-6 font-headline text-3xl text-primary">Chưa có lưu trú phù hợp</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-on-surface-variant">
                Không tìm thấy đơn đặt phòng ở trạng thái bạn đang chọn. Hãy khám phá bộ sưu tập phòng để bắt đầu
                một hành trình lưu trú mới cùng GOAT HOTEL.
              </p>
              <Link
                to="/collections"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 font-label text-[0.68rem] uppercase tracking-[0.24em] text-slate-950 transition-all hover:brightness-105"
              >
                Đặt phòng ngay
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => {
                const detail = booking.details?.[0];
                const historyStatus = resolveHistoryStatus(booking);
                const paymentStatus = booking.paymentStatus?.toLowerCase() || 'unpaid';
                const statusMeta = STATUS_STYLES[historyStatus] || STATUS_STYLES.pending;
                const paymentMeta = PAYMENT_STYLES[paymentStatus] || PAYMENT_STYLES.unpaid;
                const roomTypeName = detail?.room?.roomType?.typeName || 'Phòng tiêu chuẩn';
                const roomNumber = detail?.room?.roomNumber || 'N/A';
                const stayNights = calculateStayNights(detail?.checkIn, detail?.checkOut);
                const displayTotal = calculateBookingDisplayTotal(booking);

                return (
                  <article
                    key={booking.id}
                    className="history-panel group overflow-hidden rounded-[32px] text-primary transition-all duration-500 hover:-translate-y-1 hover:border-secondary/25 hover:shadow-[0_34px_90px_-48px_rgba(40,28,12,0.32)]"
                  >
                    <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
                      <div className="relative min-h-[260px] overflow-hidden">
                        <img
                          alt={`Phòng ${roomNumber}`}
                          src={getRoomImage(detail?.room?.roomType?.image)}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent"></div>

                        <div className="absolute inset-x-0 bottom-0 p-6">
                          <p className="font-label text-[0.62rem] uppercase tracking-[0.26em] text-white/58">Booking code</p>
                          <p className="mt-3 font-headline text-4xl text-white">{getBookingCode(booking.id)}</p>
                        </div>
                      </div>

                      <div className="p-6 sm:p-8 lg:p-9">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`rounded-full px-4 py-2 font-label text-[0.62rem] uppercase tracking-[0.24em] ${statusMeta.badge}`}>
                                {statusMeta.label}
                              </span>
                              <span className={`rounded-full px-4 py-2 font-label text-[0.62rem] uppercase tracking-[0.24em] ${paymentMeta.badge}`}>
                                {paymentMeta.label}
                              </span>
                              <span className="rounded-full border border-outline-variant/16 bg-white/65 px-3 py-2 font-label text-[0.58rem] uppercase tracking-[0.24em] text-primary/45">
                                Phòng {roomNumber}
                              </span>
                            </div>
                            <h3 className="mt-5 font-headline text-3xl leading-tight text-primary sm:text-[2.4rem]">
                              {roomTypeName}
                            </h3>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                              {statusMeta.summary}
                            </p>
                            {historyStatus === 'pending' && booking.expiresAt ? (
                              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-amber-700">
                                Giữ chỗ đến {formatDateTime(booking.expiresAt)}
                              </p>
                            ) : null}
                          </div>

                          <div className="rounded-[24px] border border-outline-variant/12 bg-white/65 px-5 py-4 text-left xl:min-w-[220px] xl:text-right">
                            <p className="font-label text-[0.58rem] uppercase tracking-[0.24em] text-primary/42">Tổng thanh toán</p>
                            <p className="mt-3 font-headline text-3xl text-secondary">{formatCurrency(displayTotal)}đ</p>
                            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-primary/32">Đã lưu vào hồ sơ</p>
                          </div>
                        </div>

                        <div className="mt-8 grid gap-4 rounded-[28px] border border-outline-variant/12 bg-white/62 p-5 sm:grid-cols-2 2xl:grid-cols-5">
                          <div>
                            <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-primary/42">Nhận phòng</p>
                            <p className="mt-3 font-headline text-xl text-primary">{formatDate(detail?.checkIn)}</p>
                          </div>
                          <div>
                            <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-primary/42">Trả phòng</p>
                            <p className="mt-3 font-headline text-xl text-primary">{formatDate(detail?.checkOut)}</p>
                          </div>
                          <div>
                            <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-primary/42">Ngày đặt</p>
                            <p className="mt-3 font-headline text-xl text-primary">{formatDate(booking.createdAt || detail?.checkIn)}</p>
                          </div>
                          <div>
                            <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-primary/42">Booking</p>
                            <div className={`mt-3 inline-flex rounded-full px-4 py-2 font-label text-[0.62rem] uppercase tracking-[0.22em] ${statusMeta.pill}`}>
                              {statusMeta.label}
                            </div>
                          </div>
                          <div>
                            <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-primary/42">Thanh toán</p>
                            <div className={`mt-3 inline-flex rounded-full px-4 py-2 font-label text-[0.62rem] uppercase tracking-[0.22em] ${paymentMeta.pill}`}>
                              {paymentMeta.label}
                            </div>
                          </div>
                        </div>

                        <div className="mt-7 flex flex-col gap-4 border-t border-outline-variant/12 pt-6 md:flex-row md:items-center md:justify-between">
                          <p className="text-sm leading-7 text-on-surface-variant">
                            {stayNights > 0
                              ? `Lưu trú dự kiến ${stayNights} đêm, đã đồng bộ trong hồ sơ đặt phòng của bạn.`
                              : 'Mọi chi tiết lưu trú đã được GOAT HOTEL lưu lại cho trải nghiệm thành viên liền mạch.'}
                          </p>

                          <div className="flex flex-wrap gap-3">
                            {historyStatus === 'completed' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/collections');
                                }}
                                className="inline-flex items-center gap-2 rounded-full border border-outline-variant/18 bg-white/70 px-5 py-3 font-label text-[0.64rem] uppercase tracking-[0.22em] text-primary/80 transition-all hover:border-secondary/30 hover:text-secondary"
                              >
                                Đặt lại
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => goToDetail(booking)}
                              className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 font-label text-[0.64rem] uppercase tracking-[0.22em] text-slate-950 transition-all hover:brightness-105"
                            >
                              Xem chi tiết
                              <span className="material-symbols-outlined text-base">north_east</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {totalPages > 1 && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full border border-outline-variant/18 bg-white/70 px-5 py-3 font-label text-[0.64rem] uppercase tracking-[0.22em] text-primary/62 transition-all hover:border-secondary/30 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
            >
              Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`h-11 min-w-11 rounded-full px-4 font-label text-[0.64rem] uppercase tracking-[0.2em] transition-all ${
                  pg === page
                    ? 'bg-secondary text-slate-950'
                    : 'border border-outline-variant/18 bg-white/70 text-primary/62 hover:border-secondary/30 hover:text-secondary'
                }`}
              >
                {pg}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-full border border-outline-variant/18 bg-white/70 px-5 py-3 font-label text-[0.64rem] uppercase tracking-[0.22em] text-primary/62 transition-all hover:border-secondary/30 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
            >
              Tiếp
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
