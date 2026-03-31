import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE, {
  calculateBookingDisplayTotal,
  calculateStayNights,
  imageUrl,
  uploadedImageUrl,
  resolveRoomTypeSpec,
} from '../config';

function formatDate(dateValue) {
  if (!dateValue) return 'Chưa cập nhật';

  let parsed;
  if (Array.isArray(dateValue)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
    parsed = new Date(year, month - 1, day, hour, minute, second);
  } else {
    parsed = new Date(dateValue);
  }

  if (Number.isNaN(parsed.getTime())) return 'Chưa cập nhật';

  return parsed.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const STATUS_META = {
  pending: {
    label: 'Chờ xử lý',
    summary: 'Đơn đặt phòng đã được tiếp nhận và đang chờ khách sạn xác nhận.',
    badgeClass: 'border border-amber-400/24 bg-amber-500/10 text-amber-100',
    chipClass: 'border border-amber-400/22 bg-amber-500/8 text-amber-100',
    accentClass: 'bg-amber-400',
  },
  confirmed: {
    label: 'Đã xác nhận',
    summary: 'Kỳ lưu trú đã được xác nhận và sẵn sàng cho ngày nhận phòng.',
    badgeClass: 'border border-emerald-400/24 bg-emerald-500/10 text-emerald-100',
    chipClass: 'border border-emerald-400/22 bg-emerald-500/8 text-emerald-100',
    accentClass: 'bg-emerald-400',
  },
  completed: {
    label: 'Hoàn thành',
    summary: 'Kỳ lưu trú đã hoàn tất và được lưu lại trong hồ sơ thành viên của bạn.',
    badgeClass: 'border border-white/14 bg-white/8 text-white/90',
    chipClass: 'border border-white/14 bg-white/8 text-white/82',
    accentClass: 'bg-white',
  },
  cancelled: {
    label: 'Đã hủy',
    summary: 'Đơn đặt phòng không còn hiệu lực và quy trình lưu trú đã dừng lại.',
    badgeClass: 'border border-rose-400/22 bg-rose-500/10 text-rose-100',
    chipClass: 'border border-rose-400/22 bg-rose-500/8 text-rose-100',
    accentClass: 'bg-rose-400',
  },
};

const TIMELINE_STEPS = [
  {
    key: 'pending',
    label: 'Chờ xử lý',
    description: 'Yêu cầu đặt phòng đã được tiếp nhận',
  },
  {
    key: 'confirmed',
    label: 'Đã xác nhận',
    description: 'Khách sạn xác nhận lịch lưu trú',
  },
  {
    key: 'completed',
    label: 'Hoàn thành',
    description: 'Kỳ lưu trú kết thúc trọn vẹn',
  },
  {
    key: 'cancelled',
    label: 'Đã hủy',
    description: 'Đơn không còn hiệu lực',
  },
];

const FLOW_INDEX = {
  pending: 0,
  confirmed: 1,
  completed: 2,
};

function getTimelineState(stepKey, currentStatus) {
  if (currentStatus === 'cancelled') {
    if (stepKey === 'pending') return 'complete';
    if (stepKey === 'cancelled') return 'current';
    return 'muted';
  }

  if (stepKey === 'cancelled') return 'muted';

  const currentIndex = FLOW_INDEX[currentStatus] ?? 0;
  const stepIndex = FLOW_INDEX[stepKey] ?? 0;

  if (stepIndex < currentIndex) return 'complete';
  if (stepIndex === currentIndex) return 'current';
  return 'muted';
}

function getRoomImageUrl(url) {
  return uploadedImageUrl(url, '/images/rooms/standard-room.jpg');
}

export default function OrderDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [cancelling, setCancelling] = useState(false);
  const [loading, setLoading] = useState(!location.state?.booking);

  React.useEffect(() => {
    if (!booking && id) {
      axios.get(`${API_BASE}/api/bookings/${id}`, { withCredentials: true })
        .then(res => {
          if (res.data?.booking) setBooking(res.data.booking);
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
    return (
      <div className="min-h-[70vh] bg-[linear-gradient(180deg,#f6f0e5_0%,#faf7f2_100%)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="h-10 w-10 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
          <p className="font-label text-[0.7rem] uppercase tracking-[0.3em] text-primary/40">Đang tải chi tiết đặt phòng</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-[70vh] bg-[linear-gradient(180deg,#f6f0e5_0%,#faf7f2_100%)] flex items-center justify-center px-6">
        <div className="rounded-[28px] border border-outline-variant/15 bg-white/88 px-8 py-12 text-center shadow-[0_26px_60px_-42px_rgba(15,23,42,0.3)]">
          <p className="font-label text-[0.72rem] uppercase tracking-[0.3em] text-secondary">Booking detail</p>
          <h1 className="mt-5 font-headline text-3xl text-primary">Không tìm thấy dữ liệu đặt phòng</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-on-surface-variant">
            Đơn đặt phòng này hiện không còn khả dụng trong lịch sử cá nhân của bạn.
          </p>
          <Link
            to="/history"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-label text-[0.68rem] uppercase tracking-[0.24em] text-on-primary transition-all hover:brightness-105"
          >
            Quay lại lịch sử
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </Link>
        </div>
      </div>
    );
  }

  const bookingDetails = Array.isArray(booking.details) ? booking.details.filter(Boolean) : [];
  const detail = bookingDetails[0];
  const roomType = detail?.room?.roomType;
  const currentStatus = (booking.status || 'pending').toLowerCase();
  const statusMeta = STATUS_META[currentStatus] || STATUS_META.pending;
  const orderNumber = String(booking.id || 0).padStart(5, '0');
  const nights = Math.max(calculateStayNights(detail?.checkIn, detail?.checkOut) || 1, 1);
  const roomEntries = bookingDetails.map((entry, index) => {
    const entryRoomType = entry?.room?.roomType;
    const entryNights = Math.max(calculateStayNights(entry?.checkIn, entry?.checkOut) || 1, 1);
    const entryPricePerNight = Number(entry?.priceAtBooking ?? entryRoomType?.pricePerNight ?? 0);
    const entryRoomTypeName = entryRoomType?.typeName || `Phòng ${index + 1}`;

    return {
      id: entry?.id || `${entry?.room?.id || 'room'}-${index}`,
      roomTypeName: entryRoomTypeName,
      roomNumber: entry?.room?.roomNumber || entry?.room?.id || `#${index + 1}`,
      image: getRoomImageUrl(entryRoomType?.image),
      description: entryRoomType?.description || 'Không gian lưu trú được tuyển chọn cho trải nghiệm nghỉ dưỡng thanh lịch, yên tĩnh và dễ chịu.',
      checkIn: formatDate(entry?.checkIn),
      checkOut: formatDate(entry?.checkOut),
      nights: entryNights,
      pricePerNight: entryPricePerNight,
      total: entryNights * entryPricePerNight,
      sizeLabel: resolveRoomTypeSpec(entryRoomTypeName, 'size', entryRoomType?.size, 'Diện tích chưa cập nhật'),
      bedLabel: resolveRoomTypeSpec(entryRoomTypeName, 'beds', entryRoomType?.beds, 'Giường chưa cập nhật'),
      viewLabel: resolveRoomTypeSpec(entryRoomTypeName, 'view', entryRoomType?.view, 'Hướng nhìn chưa cập nhật'),
      guestLabel: entry?.guestCount || entryRoomType?.capacity ? `${entry?.guestCount || entryRoomType?.capacity} khách` : 'Chưa cập nhật',
    };
  });
  const roomCount = roomEntries.length || 1;
  const uniqueRoomTypeCount = new Set(roomEntries.map((entry) => entry.roomTypeName)).size;
  const pricePerNight = Number(detail?.priceAtBooking ?? roomType?.pricePerNight ?? 0);
  const baseTotal = roomEntries.length > 0
    ? roomEntries.reduce((sum, entry) => sum + entry.total, 0)
    : pricePerNight * nights;
  const grandTotal = Number(calculateBookingDisplayTotal(booking) || baseTotal);
  const totalFees = Math.max(grandTotal - baseTotal, 0);
  const guestCount = booking.guestCount || booking.guests || detail?.guestCount || roomType?.capacity || null;
  const roomTypeName = roomType?.typeName || 'Phòng tiêu chuẩn';
  const roomSummaryLabel = roomEntries.length > 1 ? `${roomCount} phòng đã đặt` : roomTypeName;
  const bookingOwner = booking.user?.fullName || booking.user?.email || 'Khách lưu trú';
  const heroBackground = uploadedImageUrl(roomType?.image, imageUrl('/images/home/hero_slider_2.jpg'));
  const printGeneratedAt = new Date().toLocaleString('vi-VN');
  const subtotalLabel = roomCount > 1
    ? `Tạm tính lưu trú (${roomCount} phòng)`
    : `Giá phòng (${pricePerNight.toLocaleString('vi-VN')}đ x ${nights} đêm)`;

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: `GOAT HOTEL - Đơn #${orderNumber}`,
      text: `Chi tiết đơn đặt phòng #${orderNumber}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        if (window.Swal) {
          window.Swal.fire({
            icon: 'success',
            title: 'Đã sao chép liên kết',
            timer: 1400,
            showConfirmButton: false,
          });
        }
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      if (window.Swal) window.Swal.fire('Không thể chia sẻ', 'Vui lòng thử lại sau.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleVNPaySubmit = () => {
    if (!booking?.id) return;
    navigate(`/vnpay-launch?bookingId=${booking.id}`);
  };

  const handleCancel = async () => {
    let confirmed = false;

    if (window.Swal) {
      const result = await window.Swal.fire({
        icon: 'warning',
        title: 'Hủy đơn đặt phòng?',
        text: 'Thao tác này sẽ đưa đơn về trạng thái đã hủy.',
        showCancelButton: true,
        confirmButtonText: 'Hủy đơn',
        cancelButtonText: 'Giữ lại',
        reverseButtons: true,
      });
      confirmed = result.isConfirmed;
    } else {
      confirmed = window.confirm('Bạn có chắc muốn hủy đơn này?');
    }

    if (!confirmed) return;

    setCancelling(true);
    try {
      const res = await axios.delete(`${API_BASE}/api/bookings/${booking.id}`, { withCredentials: true });
      if (res.data?.success) {
        if (window.Swal) {
          window.Swal.fire({
            icon: 'success',
            title: 'Đã hủy đơn',
            showConfirmButton: false,
            timer: 1500,
          });
        }
        navigate('/history');
      } else if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Không thể hủy',
          text: res.data?.message,
        });
      }
    } catch (err) {
      if (window.Swal) {
        window.Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: err.response?.data?.message || 'Có lỗi xảy ra.',
        });
      }
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="order-detail-page min-h-screen bg-[linear-gradient(180deg,#f5efe6_0%,#fbf8f3_30%,#f8f4ed_100%)] font-body text-on-surface">
      <style>{`
        .booking-hero-shell {
          background:
            linear-gradient(180deg, rgba(5, 15, 30, 0.56) 0%, rgba(5, 15, 30, 0.86) 100%),
            linear-gradient(90deg, rgba(5, 15, 30, 0.9) 0%, rgba(5, 15, 30, 0.46) 46%, rgba(5, 15, 30, 0.78) 100%);
        }
        .booking-surface {
          background: linear-gradient(180deg, rgba(255,251,246,0.96) 0%, rgba(249,244,237,0.98) 100%);
          border: 1px solid rgba(120, 90, 25, 0.14);
          box-shadow: 0 30px 80px -50px rgba(15, 23, 42, 0.28);
          backdrop-filter: blur(20px);
        }
        .booking-panel {
          background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(249,245,239,0.96) 100%);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 22px 60px -46px rgba(15, 23, 42, 0.22);
        }
        .booking-dark-panel {
          background: linear-gradient(135deg, rgba(8,19,37,0.96) 0%, rgba(15,31,56,0.92) 56%, rgba(32,47,71,0.9) 100%);
          box-shadow: 0 26px 70px -46px rgba(15, 23, 42, 0.58);
        }
        .booking-action-chip {
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(18px);
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          vertical-align: middle;
        }
        .print-booking-invoice {
          display: none;
        }
        @page {
          size: A4;
          margin: 8mm;
        }
        @media print {
          html,
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          nav,
          footer {
            display: none !important;
          }
          .order-detail-page {
            min-height: auto !important;
            background: #ffffff !important;
            color: #111827 !important;
          }
          .order-detail-page .screen-booking-layout {
            display: none !important;
          }
          .order-detail-page .print-booking-invoice {
            display: block !important;
          }
          .print-sheet {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 12px;
          }
          .print-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print-room-table {
            width: 100%;
            border-collapse: collapse;
          }
          .print-room-table thead {
            display: table-header-group;
          }
          .print-room-table th,
          .print-room-table td {
            border-bottom: 1px solid #d7dce3;
            padding: 7px 6px;
            text-align: left;
            vertical-align: top;
          }
          .print-room-table th {
            font-size: 9px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #475569;
          }
          .print-room-table td {
            font-size: 11px;
            color: #111827;
          }
        }
      `}</style>

      <div className="screen-booking-layout">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBackground} alt={roomTypeName} className="h-full w-full object-cover" />
        </div>
        <div className="booking-hero-shell relative">
          <div className="mx-auto max-w-7xl px-6 pb-24 pt-28 sm:px-8 lg:px-10 lg:pb-28 lg:pt-32">
            <div className="grid gap-10 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.72fr)] xl:items-end">
              <div className="max-w-4xl">
                <p className="font-label text-[0.72rem] uppercase tracking-[0.34em] text-secondary-fixed/90">
                  Tổng quan đặt phòng
                </p>
                <h1 className="mt-6 font-headline text-4xl leading-tight text-white sm:text-5xl lg:text-[4rem]">
                  Đơn <span className="text-secondary-fixed">#{orderNumber}</span>
                </h1>
                <div className="mt-8 flex flex-wrap gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-label text-[0.64rem] uppercase tracking-[0.24em] shadow-[0_10px_30px_-20px_rgba(0,0,0,0.65)] ${statusMeta.badgeClass}`}>
                    <span className={`h-2 w-2 rounded-full ${statusMeta.accentClass}`}></span>
                    {statusMeta.label}
                  </span>
                  <span className="booking-action-chip inline-flex items-center rounded-full px-4 py-2 font-label text-[0.64rem] uppercase tracking-[0.2em] text-white">
                    {roomEntries.length > 1 ? `${roomCount} phòng` : roomTypeName}
                  </span>
                  <span className="booking-action-chip inline-flex items-center rounded-full px-4 py-2 font-label text-[0.64rem] uppercase tracking-[0.2em] text-white">
                    {formatDate(detail?.checkIn)} - {formatDate(detail?.checkOut)}
                  </span>
                </div>
              </div>

              <aside className="booking-action-chip rounded-[28px] p-5 text-white shadow-[0_24px_60px_-40px_rgba(0,0,0,0.55)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-label text-[0.6rem] uppercase tracking-[0.28em] text-white/54">Booking code</p>
                    <p className="mt-3 font-headline text-3xl text-white">GH-{orderNumber}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1.5 font-label text-[0.56rem] uppercase tracking-[0.24em] ${statusMeta.chipClass}`}>
                    {statusMeta.label}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                  <div>
                    <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-white/44">Ngày đặt</p>
                    <p className="mt-2 text-sm text-white/82">{formatDate(booking.createdAt || detail?.checkIn)}</p>
                  </div>
                  <div>
                    <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-white/44">Tổng cộng</p>
                    <p className="mt-2 text-sm text-secondary-fixed">{grandTotal.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center rounded-full border border-secondary-fixed/70 bg-secondary-fixed px-5 py-3 font-label text-[0.62rem] uppercase tracking-[0.22em] text-primary shadow-[0_18px_35px_-22px_rgba(245,203,126,0.85)] transition-all hover:border-white hover:bg-white"
                  >
                    Chia sẻ
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center rounded-full border border-secondary-fixed/70 bg-secondary-fixed px-5 py-3 font-label text-[0.62rem] uppercase tracking-[0.22em] text-primary shadow-[0_18px_35px_-22px_rgba(245,203,126,0.85)] transition-all hover:border-white hover:bg-white"
                  >
                    In
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto -mt-10 max-w-7xl px-6 pb-24 sm:px-8 lg:px-10">
        <section className="booking-surface rounded-[32px] p-6 sm:p-8 lg:p-10">
          <section className="booking-panel rounded-[28px] p-6 sm:p-7">
            <div className="flex flex-col gap-3 border-b border-outline-variant/12 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary">Booking status</p>
                <h2 className="mt-3 font-headline text-[2rem] leading-tight text-primary">Trạng thái đơn đặt phòng</h2>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <p className="max-w-xl text-sm leading-7 text-on-surface-variant">
                  Theo dõi tiến trình đơn theo đúng luồng lưu trú của GOAT HOTEL, từ lúc tiếp nhận đến khi hoàn tất hoặc hủy.
                </p>
                <Link
                  to="/history"
                  className="inline-flex items-center rounded-full border border-outline-variant/16 bg-white px-5 py-2.5 font-label text-[0.62rem] uppercase tracking-[0.22em] text-primary transition-all hover:border-secondary/35 hover:text-secondary"
                >
                  Quay lại lịch sử
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              {TIMELINE_STEPS.map((step) => {
                const state = getTimelineState(step.key, currentStatus);
                const isCurrent = state === 'current';
                const isComplete = state === 'complete';
                const toneClass = isCurrent
                  ? 'border-secondary/26 bg-secondary/10 text-primary'
                  : isComplete
                    ? 'border-primary/10 bg-primary/6 text-primary/86'
                    : 'border-outline-variant/14 bg-white/72 text-primary/42';

                return (
                  <div key={step.key} className={`rounded-[24px] border p-5 transition-all ${toneClass}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm ${
                        isCurrent
                          ? 'border-secondary/30 bg-secondary text-primary'
                          : isComplete
                            ? 'border-primary/14 bg-primary text-white'
                            : 'border-outline-variant/18 bg-white text-primary/36'
                      }`}>
                        <span className="font-label text-[0.64rem] uppercase tracking-[0.1em]">
                          {step.key === 'cancelled' ? 'X' : TIMELINE_STEPS.findIndex((item) => item.key === step.key) + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-headline text-lg leading-tight">{step.label}</p>
                        {isCurrent ? (
                          <p className="mt-1 font-label text-[0.58rem] uppercase tracking-[0.22em] text-secondary">
                            Trạng thái hiện tại
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-current/80">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.52fr)_minmax(320px,0.88fr)]">
            <div className="space-y-8">
              <section className="booking-dark-panel overflow-hidden rounded-[30px] text-white">
                <div className="grid gap-0 lg:grid-cols-[1.2fr_minmax(240px,0.72fr)]">
                  <div className="p-6 sm:p-8 lg:p-8">
                    <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary-fixed/90">Thông tin lưu trú</p>
                    <h2 className="mt-4 font-headline text-[2.2rem] leading-tight text-white">Lịch trình ở của bạn</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
                      Các mốc thời gian chính được nhóm lại để bạn kiểm tra nhanh trước ngày nhận phòng.
                    </p>

                    <div className="mt-7 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                        <p className="font-label text-[0.6rem] uppercase tracking-[0.24em] text-white/50">Nhận phòng</p>
                        <p className="mt-3 font-headline text-[1.65rem] text-white">{formatDate(detail?.checkIn)}</p>
                        <p className="mt-2 text-sm text-white/58">Từ 15:00</p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                        <p className="font-label text-[0.6rem] uppercase tracking-[0.24em] text-white/50">Trả phòng</p>
                        <p className="mt-3 font-headline text-[1.65rem] text-white">{formatDate(detail?.checkOut)}</p>
                        <p className="mt-2 text-sm text-white/58">Trước 11:00</p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                        <p className="font-label text-[0.6rem] uppercase tracking-[0.24em] text-white/50">Số đêm</p>
                        <p className="mt-3 font-headline text-[1.65rem] text-secondary-fixed">{nights} đêm</p>
                        <p className="mt-2 text-sm text-white/58">Theo lịch lưu trú hiện tại</p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                        <p className="font-label text-[0.6rem] uppercase tracking-[0.24em] text-white/50">Số khách</p>
                        <p className="mt-3 font-headline text-[1.65rem] text-white">{guestCount ? `${guestCount} khách` : 'Chưa cập nhật'}</p>
                        <p className="mt-2 text-sm text-white/58">Theo thông tin đơn đặt phòng</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 bg-black/10 p-5 sm:p-6 lg:border-l lg:border-t-0">
                    <p className="font-label text-[0.58rem] uppercase tracking-[0.24em] text-white/54">Phòng đã đặt</p>
                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <h3 className="font-headline text-[1.9rem] text-white">{roomCount} phòng</h3>
                        <p className="mt-2 text-sm leading-6 text-white/62">
                          {uniqueRoomTypeCount > 1
                            ? `${uniqueRoomTypeCount} hạng phòng trong cùng đơn đặt`
                            : 'Được nhóm theo cùng một lịch lưu trú'}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 font-label text-[0.56rem] uppercase tracking-[0.22em] text-white/78">
                        {roomSummaryLabel}
                      </span>
                    </div>

                    <div className="mt-6 space-y-3">
                      {roomEntries.slice(0, 3).map((room) => (
                        <div key={`preview-${room.id}`} className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/6 p-3.5">
                          <img src={room.image} alt={room.roomTypeName} className="h-16 w-16 rounded-[16px] object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-headline text-lg text-white">{room.roomTypeName}</p>
                            <p className="mt-1 font-label text-[0.54rem] uppercase tracking-[0.2em] text-white/50">
                              Phòng {room.roomNumber} • {room.guestLabel}
                            </p>
                            <p className="mt-1 text-sm text-white/62">{room.checkIn} - {room.checkOut}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {roomEntries.length > 3 ? (
                      <p className="mt-4 text-sm leading-6 text-white/58">
                        +{roomEntries.length - 3} phòng khác được hiển thị chi tiết ở danh sách bên dưới.
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="booking-panel rounded-[30px] p-6 sm:p-7">
                <div className="flex flex-col gap-4 border-b border-outline-variant/12 pb-6 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-2xl">
                    <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary">Chi tiết phòng</p>
                    <h2 className="mt-3 font-headline text-[2rem] leading-tight text-primary">Không gian đã đặt</h2>
                    <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                      Hiển thị theo dạng danh sách gọn để bạn dễ quét thông tin khi một booking có nhiều phòng.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-secondary/10 px-3 py-1 font-label text-[0.58rem] uppercase tracking-[0.22em] text-secondary">
                      {roomCount} phòng
                    </span>
                    <span className="rounded-full border border-outline-variant/16 bg-white/74 px-3 py-1 font-label text-[0.58rem] uppercase tracking-[0.22em] text-primary/48">
                      {uniqueRoomTypeCount > 1 ? `${uniqueRoomTypeCount} hạng phòng` : 'Cùng hạng phòng'}
                    </span>
                  </div>
                </div>

                <div className="mt-7 space-y-4">
                  {roomEntries.map((room, index) => (
                    <article key={room.id} className="rounded-[26px] border border-outline-variant/12 bg-white/78 p-4 sm:p-5">
                      <div className="grid gap-4 lg:grid-cols-[112px_minmax(0,1fr)_minmax(180px,0.72fr)] lg:items-center">
                        <div className="overflow-hidden rounded-[20px] bg-surface-container-low">
                          <img src={room.image} alt={room.roomTypeName} className="h-24 w-full object-cover sm:h-28 lg:h-24" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-secondary/10 px-3 py-1 font-label text-[0.58rem] uppercase tracking-[0.22em] text-secondary">
                              Phòng {room.roomNumber}
                            </span>
                            <span className="rounded-full border border-outline-variant/16 bg-white/74 px-3 py-1 font-label text-[0.58rem] uppercase tracking-[0.22em] text-primary/48">
                              {room.pricePerNight.toLocaleString('vi-VN')}đ / đêm
                            </span>
                            <span className="rounded-full border border-outline-variant/16 bg-white/74 px-3 py-1 font-label text-[0.58rem] uppercase tracking-[0.22em] text-primary/48">
                              {room.nights} đêm
                            </span>
                          </div>

                          <h3 className="mt-3 font-headline text-[1.75rem] leading-tight text-primary">
                            {room.roomTypeName}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                            {room.description}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {[room.sizeLabel, room.bedLabel, room.viewLabel, room.guestLabel].map((value) => (
                              <span
                                key={`${room.id}-${value}`}
                                className="rounded-full border border-outline-variant/16 bg-surface-container-low/60 px-3 py-1.5 font-label text-[0.54rem] uppercase tracking-[0.18em] text-primary/54"
                              >
                                {value}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[22px] border border-outline-variant/12 bg-surface-container-low/60 p-4">
                          <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-on-surface-variant">
                            Phòng {String(index + 1).padStart(2, '0')}
                          </p>
                          <div className="mt-3 text-sm leading-6 text-on-surface-variant">
                            <p>Nhận phòng: <span className="font-medium text-primary">{room.checkIn}</span></p>
                            <p>Trả phòng: <span className="font-medium text-primary">{room.checkOut}</span></p>
                          </div>
                          <div className="mt-4 border-t border-outline-variant/12 pt-4">
                            <p className="font-label text-[0.54rem] uppercase tracking-[0.2em] text-on-surface-variant">Tạm tính phòng</p>
                            <p className="mt-2 font-headline text-2xl text-primary">{room.total.toLocaleString('vi-VN')}đ</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <div className="grid gap-8 lg:grid-cols-2">
                <section className="booking-panel rounded-[30px] p-6 sm:p-7">
                  <div className="border-b border-outline-variant/12 pb-5">
                    <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary">Thông tin người đặt</p>
                    <h2 className="mt-3 font-headline text-[1.8rem] leading-tight text-primary">Khách lưu trú</h2>
                  </div>

                  <div className="mt-5 divide-y divide-outline-variant/12 rounded-[24px] border border-outline-variant/12 bg-white/76">
                    {[
                      ['Tên khách', bookingOwner],
                      ['Email', booking.user?.email || 'Chưa cập nhật'],
                      ['Số điện thoại', booking.user?.phone || 'Chưa cập nhật'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-on-surface-variant">{label}</p>
                        <p className="font-medium text-base text-primary sm:text-right">{value}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="booking-panel rounded-[30px] p-6 sm:p-7">
                  <div className="border-b border-outline-variant/12 pb-5">
                    <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary">Thông tin booking</p>
                    <h2 className="mt-3 font-headline text-[1.8rem] leading-tight text-primary">Chi tiết đơn đặt phòng</h2>
                  </div>

                  <div className="mt-5 divide-y divide-outline-variant/12 rounded-[24px] border border-outline-variant/12 bg-white/76">
                    {[
                      ['Mã booking', `GH-${orderNumber}`],
                      ['Trạng thái', statusMeta.label],
                      ['Ngày tạo', formatDate(booking.createdAt || detail?.checkIn)],
                      ['Loại phòng', roomSummaryLabel],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-on-surface-variant">{label}</p>
                        <p className="font-medium text-base text-primary sm:max-w-[52%] sm:text-right">{value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <aside className="space-y-8">
              <section className="booking-dark-panel rounded-[30px] p-6 text-white sm:p-8">
                <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary-fixed/90">Thông tin thanh toán</p>
                <h2 className="mt-3 font-headline text-[2rem] leading-tight text-white">Tóm tắt chi phí</h2>

                <div className="mt-8 space-y-5 border-t border-white/10 pt-6">
                  <div className="flex items-start justify-between gap-5 text-sm">
                    <span className="max-w-[220px] leading-6 text-white/64">
                      {subtotalLabel}
                    </span>
                    <span className="font-headline text-xl text-white">{baseTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex items-start justify-between gap-5 text-sm">
                    <span className="max-w-[220px] leading-6 text-white/64">Thuế & phí dịch vụ</span>
                    <span className="font-headline text-xl text-white">{Math.round(totalFees).toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="font-label text-[0.58rem] uppercase tracking-[0.24em] text-secondary-fixed/90">Tổng cộng</p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <span className="text-sm leading-6 text-white/62">Đã lưu trong hồ sơ đơn đặt phòng của bạn</span>
                    <span className="font-headline text-4xl text-secondary-fixed">{grandTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              </section>

              <section className="booking-panel rounded-[30px] p-6 sm:p-7">
                <div className="border-b border-outline-variant/12 pb-5">
                  <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary">Thao tác dành cho bạn</p>
                  <h2 className="mt-3 font-headline text-[1.8rem] leading-tight text-primary">Thao tác nhanh</h2>
                  <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                    Các thao tác cần thiết cho đơn đặt này được gom lại để bạn xử lý nhanh hơn.
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center justify-center rounded-[20px] border border-outline-variant/16 bg-white/78 px-5 py-4 font-label text-[0.64rem] uppercase tracking-[0.22em] text-primary transition-all hover:border-secondary/35 hover:text-secondary"
                  >
                    Chia sẻ đơn
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center justify-center rounded-[20px] border border-primary/18 bg-primary px-5 py-4 font-label text-[0.64rem] uppercase tracking-[0.22em] text-white shadow-[0_18px_35px_-24px_rgba(15,23,42,0.42)] transition-all hover:border-secondary/45 hover:bg-secondary hover:text-primary"
                  >
                    In chi tiết
                  </button>
                  {currentStatus === 'pending' && (
                    <button
                      type="button"
                      onClick={handleVNPaySubmit}
                      className="inline-flex items-center justify-center rounded-[20px] border border-emerald-500/28 bg-emerald-50 px-5 py-4 font-label text-[0.64rem] uppercase tracking-[0.22em] text-emerald-700 transition-all hover:border-emerald-500/40 hover:bg-emerald-100"
                    >
                      Thanh toán VNPay
                    </button>
                  )}
                  <Link
                    to="/history"
                    className="inline-flex items-center justify-center rounded-[20px] border border-outline-variant/16 bg-white/78 px-5 py-4 font-label text-[0.64rem] uppercase tracking-[0.22em] text-primary transition-all hover:border-secondary/35 hover:text-secondary"
                  >
                    Xem lịch sử
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center rounded-[20px] border border-outline-variant/16 bg-white/78 px-5 py-4 font-label text-[0.64rem] uppercase tracking-[0.22em] text-primary transition-all hover:border-secondary/35 hover:text-secondary"
                  >
                    Liên hệ hỗ trợ
                  </Link>
                </div>

                {(currentStatus === 'pending' || currentStatus === 'confirmed') && (
                  <div className="mt-6 border-t border-outline-variant/12 pt-6">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="w-full rounded-full border border-rose-200 bg-rose-50 px-5 py-4 font-label text-[0.64rem] uppercase tracking-[0.22em] text-rose-700 transition-all hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancelling ? 'Đang hủy...' : 'Hủy đặt phòng'}
                    </button>
                  </div>
                )}
              </section>
            </aside>
          </div>
        </section>
      </main>
      </div>

      <section className="print-booking-invoice">
        <div className="print-sheet mx-auto max-w-5xl px-4 py-4">
          <header className="print-card border-b border-slate-300 pb-4">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="font-label text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">GOAT HOTEL</p>
                <h1 className="mt-2 font-headline text-[2rem] text-slate-950">Hóa đơn đặt phòng</h1>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Booking summary được tối ưu để in hoặc xuất PDF trong một trang.
                </p>
              </div>
              <div className="min-w-[210px] rounded-[18px] border border-slate-300 bg-slate-50 p-3 text-xs text-slate-700">
                <p className="font-label text-[0.56rem] uppercase tracking-[0.22em] text-slate-500">Mã đơn</p>
                <p className="mt-1.5 font-headline text-[1.8rem] text-slate-950">GH-{orderNumber}</p>
                <div className="mt-3 space-y-1">
                  <p>Ngày tạo: <span className="font-medium text-slate-900">{formatDate(booking.createdAt || detail?.checkIn)}</span></p>
                  <p>Ngày in: <span className="font-medium text-slate-900">{printGeneratedAt}</span></p>
                  <p>Trạng thái: <span className="font-medium text-slate-900">{statusMeta.label}</span></p>
                </div>
              </div>
            </div>
          </header>

          <section className="print-card mt-4 rounded-[18px] border border-slate-300 p-4">
            <p className="font-label text-[0.56rem] uppercase tracking-[0.22em] text-slate-500">Thông tin nhanh</p>
            <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-xs leading-5 text-slate-700">
              <p>Tên khách: <span className="font-medium text-slate-950">{bookingOwner}</span></p>
              <p>Email: <span className="font-medium text-slate-950">{booking.user?.email || 'Chưa cập nhật'}</span></p>
              <p>Số điện thoại: <span className="font-medium text-slate-950">{booking.user?.phone || 'Chưa cập nhật'}</span></p>
              <p>Số khách: <span className="font-medium text-slate-950">{guestCount ? `${guestCount} khách` : 'Chưa cập nhật'}</span></p>
              <p>Số phòng: <span className="font-medium text-slate-950">{roomCount}</span></p>
              <p>Loại hiển thị: <span className="font-medium text-slate-950">{roomSummaryLabel}</span></p>
            </div>
          </section>

          <section className="print-card mt-4 rounded-[20px] border border-slate-300 p-4">
            <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
              <div>
                <p className="font-label text-[0.58rem] uppercase tracking-[0.24em] text-slate-500">Danh sách phòng</p>
                <h2 className="mt-1.5 font-headline text-[1.6rem] text-slate-950">Chi tiết lưu trú</h2>
              </div>
              <p className="text-xs text-slate-500">{roomCount} phòng trong đơn đặt này</p>
            </div>

            <div className="mt-3 overflow-hidden rounded-[16px] border border-slate-200">
              <table className="print-room-table">
                <thead className="bg-slate-50">
                  <tr>
                    <th>Phòng</th>
                    <th>Loại phòng</th>
                    <th>Nhận phòng</th>
                    <th>Trả phòng</th>
                    <th>Số đêm</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {roomEntries.map((room) => (
                    <tr key={`print-${room.id}`}>
                      <td>Phòng {room.roomNumber}</td>
                      <td className="font-medium text-slate-950">{room.roomTypeName}</td>
                      <td>{room.checkIn}</td>
                      <td>{room.checkOut}</td>
                      <td>{room.nights} đêm</td>
                      <td>{room.pricePerNight.toLocaleString('vi-VN')}đ</td>
                      <td className="font-medium text-slate-950">{room.total.toLocaleString('vi-VN')}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-[16px] border border-slate-300 p-3.5">
                <p className="font-label text-[0.56rem] uppercase tracking-[0.22em] text-slate-500">Ghi chú ngắn</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Hóa đơn này được in trực tiếp từ trang chi tiết booking của GOAT HOTEL.
                </p>
              </div>

              <div className="rounded-[16px] border border-slate-300 p-3.5">
                <p className="font-label text-[0.56rem] uppercase tracking-[0.22em] text-slate-500">Tổng thanh toán</p>
                <div className="mt-3 space-y-2 text-xs text-slate-700">
                  <div className="flex items-start justify-between gap-4">
                    <span>{subtotalLabel}</span>
                    <span className="font-medium text-slate-950">{baseTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span>Thuế & phí dịch vụ</span>
                    <span className="font-medium text-slate-950">{Math.round(totalFees).toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-300 pt-3">
                  <div className="flex items-end justify-between gap-4">
                    <span className="font-label text-[0.56rem] uppercase tracking-[0.22em] text-slate-500">Tổng cộng</span>
                    <span className="font-headline text-[2rem] text-slate-950">{grandTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
