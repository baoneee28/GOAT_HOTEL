import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import BookingPrintView from '../components/BookingPrintView';
import BookingTimeline from '../components/BookingTimeline';
import OrderDetailErrorState from '../components/OrderDetailErrorState';
import OrderDetailSkeleton from '../components/OrderDetailSkeleton';
import { PAYMENT_META, STATUS_META } from '../constants/bookingStatus';
import API_BASE, {
  calculateBookingDiscountAmount,
  calculateBookingDisplayTotal,
  calculateBookingSubtotal,
  calculateStayNights,
  imageUrl,
  uploadedImageUrl,
  resolveRoomTypeSpec,
} from '../config';
import {
  formatCountdown,
  formatDate,
  formatDateTime,
  getRemainingSeconds,
} from '../utils/dateFormat';
import './OrderDetail.css';

const REQUEST_CONFIG = {
  withCredentials: true,
  timeout: 15000,
};

function getRoomImageUrl(url) {
  return uploadedImageUrl(url, '/images/rooms/standard-room.jpg');
}

function getLoadErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'Máy chủ phản hồi quá lâu. Vui lòng thử lại sau ít phút.';
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return 'Phiên đăng nhập đã hết hoặc bạn không còn quyền xem booking này.';
    }

    return error.response?.data?.message || 'Không thể kết nối tới máy chủ lúc này.';
  }

  return 'Không thể tải chi tiết booking vào lúc này.';
}

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [pendingVNPayMode, setPendingVNPayMode] = useState(null);
  const [confirmingDemoPayment, setConfirmingDemoPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [hasSyncedExpiredState, setHasSyncedExpiredState] = useState(false);
  const [clockTick, setClockTick] = useState(Date.now());

  const fetchBookingDetail = React.useCallback(async ({
    showSpinner = false,
    suppressErrorState = false,
  } = {}) => {
    if (!id) {
      setBooking(null);
      setLoadError(null);
      setLoading(false);
      return;
    }

    if (showSpinner) {
      setLoading(true);
      setLoadError(null);
    }

    try {
      const res = await axios.get(`${API_BASE}/api/bookings/${id}`, REQUEST_CONFIG);
      const payload = res.data || {};

      if (payload.data) {
        setBooking(payload.data);
        setLoadError(null);
        return;
      }

      setBooking(null);
      setLoadError(null);
    } catch (error) {
      console.error('Không thể tải chi tiết booking:', error);

      try {
        const hist = await axios.get(`${API_BASE}/api/bookings/history?page=1`, REQUEST_CONFIG);
        const matched = (hist.data?.data || []).find((entry) => String(entry.id) === String(id));

        if (matched) {
          setBooking(matched);
          setLoadError(null);
          return;
        }
      } catch (historyError) {
        console.error('Không thể tải lịch sử booking dự phòng:', historyError);
      }

      if (error?.response?.status === 404) {
        setBooking(null);
        setLoadError(null);
        return;
      }

      if (!suppressErrorState) {
        setBooking(null);
        setLoadError(error);
      }
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [id]);

  React.useEffect(() => {
    if (!id) {
      setBooking(null);
      setLoadError(null);
      setLoading(false);
      return;
    }

    setBooking(null);
    setLoadError(null);
    void fetchBookingDetail({ showSpinner: true });
  }, [id, fetchBookingDetail]);

  const bookingDetails = Array.isArray(booking?.details) ? booking.details.filter(Boolean) : [];
  const detail = bookingDetails[0];
  const roomType = detail?.room?.roomType;
  const currentStatus = (booking?.status || 'pending').toLowerCase();
  const currentPaymentStatus = (booking?.paymentStatus || 'unpaid').toLowerCase();
  const remainingHoldSeconds = currentStatus === 'pending'
    ? getRemainingSeconds(booking?.expiresAt, clockTick)
    : null;

  React.useEffect(() => {
    setHasSyncedExpiredState(false);
  }, [booking?.id, booking?.expiresAt, currentStatus]);

  React.useEffect(() => {
    if (currentStatus !== 'pending' || !booking?.expiresAt) return undefined;

    setClockTick(Date.now());
    const timerId = window.setInterval(() => {
      setClockTick(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [currentStatus, booking?.expiresAt]);

  React.useEffect(() => {
    if (!booking?.id || currentStatus !== 'pending' || remainingHoldSeconds == null) return;
    if (remainingHoldSeconds > 0 || hasSyncedExpiredState) return;

    setHasSyncedExpiredState(true);
    void fetchBookingDetail({ suppressErrorState: true });
  }, [
    booking?.id,
    currentStatus,
    remainingHoldSeconds,
    hasSyncedExpiredState,
    fetchBookingDetail,
  ]);

  React.useEffect(() => {
    if (currentPaymentStatus === 'paid') {
      setPendingVNPayMode(null);
      return;
    }

    if (currentPaymentStatus === 'deposit_paid' && pendingVNPayMode === 'deposit') {
      setPendingVNPayMode(null);
    }
  }, [currentPaymentStatus, pendingVNPayMode]);

  const handleRetry = () => {
    void fetchBookingDetail({ showSpinner: true });
  };

  if (loading) {
    return <OrderDetailSkeleton />;
  }

  if (loadError && !booking) {
    return (
      <OrderDetailErrorState
        message={getLoadErrorMessage(loadError)}
        onRetry={handleRetry}
      />
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

  const statusMeta = STATUS_META[currentStatus] || STATUS_META.pending;
  const paymentMeta = PAYMENT_META[currentPaymentStatus] || PAYMENT_META.unpaid;
  const orderNumber = String(booking.id || 0).padStart(5, '0');
  const nights = Math.max(calculateStayNights(detail?.checkIn, detail?.checkOut) || 1, 1);
  const roomEntries = bookingDetails.map((entry, index) => {
    const entryRoomType = entry?.room?.roomType;
    const entryNights = Math.max(calculateStayNights(entry?.checkIn, entry?.checkOut) || 1, 1);
    const entryPricePerNight = Number(entry?.priceAtBooking ?? entryRoomType?.pricePerNight ?? 0);
    const entryRoomTypeName = entryRoomType?.typeName || `Phong ${index + 1}`;

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
      sizeLabel: resolveRoomTypeSpec(entryRoomTypeName, 'size', entryRoomType?.size, 'Diện tích chưa cập nhật'),
      bedLabel: resolveRoomTypeSpec(entryRoomTypeName, 'beds', entryRoomType?.beds, 'Giường chưa cập nhật'),
      viewLabel: resolveRoomTypeSpec(entryRoomTypeName, 'view', entryRoomType?.view, 'Hướng nhìn chưa cập nhật'),
      guestLabel: entry?.guestCount || entryRoomType?.capacity ? `${entry?.guestCount || entryRoomType?.capacity} khách` : 'Chưa cập nhật',
    };
  });
  const roomCount = roomEntries.length || 1;
  const uniqueRoomTypeCount = new Set(roomEntries.map((entry) => entry.roomTypeName)).size;
  const pricePerNight = Number(detail?.priceAtBooking ?? roomType?.pricePerNight ?? 0);
  const bookingSubtotal = Number(calculateBookingSubtotal(booking) || 0);
  const discountAmount = Number(calculateBookingDiscountAmount(booking) || 0);
  const grandTotal = Number(calculateBookingDisplayTotal(booking) || 0);
  const guestCount = booking.guestCount || booking.guests || detail?.guestCount || roomType?.capacity || null;
  const roomTypeName = roomType?.typeName || 'Phòng tiêu chuẩn';
  const roomSummaryLabel = roomEntries.length > 1 ? `${roomCount} phòng đã đặt` : roomTypeName;
  const bookingOwner = booking.user?.fullName || booking.user?.email || 'Khach luu tru';
  const heroBackground = uploadedImageUrl(roomType?.image, imageUrl('/images/home/hero_slider_2.jpg'));
  const printGeneratedAt = new Date().toLocaleString('vi-VN');
  const subtotalLabel = roomCount > 1
    ? `Tạm tính lưu trú (${roomCount} phong)`
    : `Gia phong (${pricePerNight.toLocaleString('vi-VN')}d x ${nights} dem)`;
  const paidAmount = Number(booking?.paidAmount ?? 0);
  const depositAmount = Number(booking?.depositAmount ?? 0);
  const remainingAmount = Number(booking?.remainingAmount ?? 0);
  const depositOutstandingAmount = Number(booking?.depositOutstandingAmount ?? 0);
  const canDeposit = ['pending', 'confirmed'].includes(currentStatus)
    && !['deposit_paid', 'paid'].includes(currentPaymentStatus)
    && depositOutstandingAmount > 0.01;
  const canOpenVNPay = ['pending', 'confirmed'].includes(currentStatus)
    && currentPaymentStatus !== 'paid'
    && remainingAmount > 0.01;
  const showDemoSuccessButton = Boolean(pendingVNPayMode) && currentPaymentStatus !== 'paid';

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: `GOAT HOTEL - Đơn #${orderNumber}`,
      text: `Chi tiet don dat phong #${orderNumber}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        await Swal.fire({
          icon: 'success',
          title: 'Đã sao chép liên kết',
          timer: 1400,
          showConfirmButton: false,
        });
        return;
      }

      await Swal.fire({
        icon: 'info',
        title: 'Sao chép thủ công',
        text: 'Trình duyệt của bạn chưa hỗ trợ chia sẻ tự động. Vui lòng sao chép đường dẫn trên thanh địa chỉ.',
      });
    } catch (error) {
      if (error?.name === 'AbortError') return;

      await Swal.fire({
        icon: 'error',
        title: 'Không thể chia sẻ',
        text: 'Vui lòng thử lại sau.',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenVNPay = (paymentMode) => {
    if (!booking?.id || typeof window === 'undefined') return;

    const normalizedPaymentMode = paymentMode === 'deposit' ? 'deposit' : 'full';
    const launchUrl = `${window.location.origin}/vnpay-launch?bookingId=${booking.id}&paymentMode=${normalizedPaymentMode}`;
    const paymentWindow = window.open('', '_blank');

    if (!paymentWindow) {
      void Swal.fire({
        icon: 'warning',
        title: 'Trình duyệt đang chặn tab mới',
        text: 'Vui lòng cho phép mở tab mới để tiếp tục với VNPay.',
      });
      return;
    }

    try {
      paymentWindow.opener = null;
      paymentWindow.location.href = launchUrl;
      paymentWindow.focus?.();
    } catch {
      window.location.assign(launchUrl);
    }

    setPendingVNPayMode(normalizedPaymentMode);
    if (!['deposit_paid', 'paid'].includes(currentPaymentStatus)) {
      setBooking((prev) => (prev ? { ...prev, paymentStatus: 'pending_payment' } : prev));
    }
  };

  const handleDemoSuccess = async () => {
    if (!booking?.id) return;

    try {
      setConfirmingDemoPayment(true);
      const res = await axios.post(`${API_BASE}/api/vnpay/demo-success`, {
        bookingId: booking.id,
        paymentMode: pendingVNPayMode || 'full',
      }, REQUEST_CONFIG);

      if (res.data?.success) {
        setPendingVNPayMode(null);

        if (res.data?.data) {
          setBooking(res.data.data);
        } else {
          await fetchBookingDetail({ suppressErrorState: true });
        }

        await Swal.fire({
          icon: 'success',
          title: 'Đã xác nhận demo',
          text: res.data?.message,
        });
        return;
      }

      await Swal.fire({
        icon: 'error',
        title: 'Không thể xác nhận demo',
        text: res.data?.message || 'Vui lòng thử lại.',
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Không thể xác nhận demo',
        text: error.response?.data?.message || 'Vui lòng thử lại sau.',
      });
    } finally {
      setConfirmingDemoPayment(false);
    }
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hủy đơn đặt phòng?',
      text: 'Thao tac nay se dua don ve trang thai da huy.',
      showCancelButton: true,
      confirmButtonText: 'Hủy đơn',
      cancelButtonText: 'Giữ lại',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setCancelling(true);
    try {
      const res = await axios.delete(`${API_BASE}/api/bookings/${booking.id}`, REQUEST_CONFIG);

      if (res.data?.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Da huy don',
          showConfirmButton: false,
          timer: 1500,
        });
        navigate('/history');
        return;
      }

      await Swal.fire({
        icon: 'error',
        title: 'Không thể hủy',
        text: res.data?.message,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.response?.data?.message || 'Có lỗi xảy ra.',
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="order-detail-page min-h-screen bg-[linear-gradient(180deg,#f5efe6_0%,#fbf8f3_30%,#f8f4ed_100%)] font-body text-on-surface">
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
                    <span className={`inline-flex items-center rounded-full px-4 py-2 font-label text-[0.64rem] uppercase tracking-[0.2em] shadow-[0_10px_30px_-20px_rgba(0,0,0,0.45)] ${paymentMeta.badgeClass}`}>
                      {paymentMeta.label}
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
                    <div className="col-span-2">
                      <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-white/44">Thanh toán</p>
                      <p className="mt-2 text-sm text-white/82">{paymentMeta.label}</p>
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
            {currentStatus === 'pending' && booking.expiresAt && (
              <section className="booking-panel mb-8 rounded-[28px] border border-amber-200/70 bg-[linear-gradient(180deg,rgba(255,251,235,0.95)_0%,rgba(255,247,217,0.98)_100%)] p-6 sm:p-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-amber-700">Giữ chỗ tạm thời</p>
                    <h2 className="mt-3 font-headline text-[1.8rem] leading-tight text-primary">Booking này đang được giữ chỗ trong 2 phút</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                      Bạn có thể thanh toán tiền đặt cọc hoặc thanh toán toàn bộ trước khi hết thời gian giữ chỗ để chuyển booking sang trạng thái đã xác nhận.
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-amber-300/70 bg-white/80 px-5 py-4 text-left lg:min-w-[240px] lg:text-right">
                    <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-primary/42">Giữ chỗ đến</p>
                    <p className="mt-2 font-headline text-xl text-primary">{formatDateTime(booking.expiresAt)}</p>
                    <p className="mt-4 font-label text-[0.58rem] uppercase tracking-[0.22em] text-primary/42">Đếm ngược</p>
                    <p className="mt-2 font-headline text-3xl text-amber-700">
                      {remainingHoldSeconds === 0 ? '00:00' : formatCountdown(remainingHoldSeconds)}
                    </p>
                  </div>
                </div>
              </section>
            )}

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

              <BookingTimeline currentStatus={currentStatus} />
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
                              <p className="font-label text-[0.54rem] uppercase tracking-[0.2em] text-on-surface-variant">Lưu trú</p>
                              <p className="mt-2 font-headline text-2xl text-primary">{room.nights} đêm</p>
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
                        ['Trạng thái booking', statusMeta.label],
                        ['Trạng thái thanh toán', paymentMeta.label],
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
                      <span className="font-headline text-xl text-white">{bookingSubtotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex items-start justify-between gap-5 text-sm">
                        <span className="max-w-[220px] leading-6 text-white/64">Giảm giá</span>
                        <span className="font-headline text-xl text-secondary-fixed">-{discountAmount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-5 text-sm">
                      <span className="max-w-[220px] leading-6 text-white/64">Tiền đặt cọc yêu cầu</span>
                      <span className="font-headline text-xl text-white">{depositAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex items-start justify-between gap-5 text-sm">
                      <span className="max-w-[220px] leading-6 text-white/64">Đã thanh toán</span>
                      <span className="font-headline text-xl text-white">{paidAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex items-start justify-between gap-5 text-sm">
                      <span className="max-w-[220px] leading-6 text-white/64">Còn lại</span>
                      <span className="font-headline text-xl text-secondary-fixed">{remainingAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex items-start justify-between gap-5 text-sm">
                      <span className="max-w-[220px] leading-6 text-white/64">Trạng thái thanh toán</span>
                      <span className="font-label text-[0.64rem] uppercase tracking-[0.22em] text-secondary-fixed">
                        {paymentMeta.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-white/10 pt-6">
                    <p className="font-label text-[0.58rem] uppercase tracking-[0.24em] text-secondary-fixed/90">Tổng cộng</p>
                    <div className="mt-3 flex items-end justify-between gap-4">
                      <span className="text-sm leading-6 text-white/62">{paymentMeta.summary}</span>
                      <span className="font-headline text-4xl text-secondary-fixed">{grandTotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                </section>

                <section className="booking-panel rounded-[30px] p-6 sm:p-7">
                  <div className="border-b border-outline-variant/12 pb-5">
                    <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary">Thao tác dành cho bạn</p>
                    <h2 className="mt-3 font-headline text-[1.8rem] leading-tight text-primary">Thao tác nhanh</h2>
                    <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                      Các thao tác được mở theo đúng trạng thái booking và trạng thái thanh toán của đơn này.
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
                    {canDeposit && (
                      <button
                        type="button"
                        onClick={() => handleOpenVNPay('deposit')}
                        className="inline-flex items-center justify-center rounded-[20px] border border-violet-500/28 bg-violet-50 px-5 py-4 font-label text-[0.64rem] uppercase tracking-[0.22em] text-violet-700 transition-all hover:border-violet-500/40 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Thanh toán tiền đặt cọc
                      </button>
                    )}
                    {canOpenVNPay && (
                      <button
                        type="button"
                        onClick={() => handleOpenVNPay('full')}
                        className="inline-flex items-center justify-center rounded-[20px] border border-emerald-500/28 bg-emerald-50 px-5 py-4 font-label text-[0.64rem] uppercase tracking-[0.22em] text-emerald-700 transition-all hover:border-emerald-500/40 hover:bg-emerald-100"
                      >
                        Thanh toán toàn bộ
                      </button>
                    )}
                    {showDemoSuccessButton && (
                      <button
                        type="button"
                        onClick={handleDemoSuccess}
                        disabled={confirmingDemoPayment}
                        className="inline-flex items-center justify-center rounded-[20px] border border-sky-500/30 bg-sky-50 px-5 py-4 font-label text-[0.64rem] uppercase tracking-[0.22em] text-sky-700 transition-all hover:border-sky-500/45 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {confirmingDemoPayment ? 'Đang xác nhận demo...' : 'Thanh toán VNPay demo thành công'}
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

                  {currentStatus === 'pending' && (
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

      <BookingPrintView
        booking={booking}
        bookingOwner={bookingOwner}
        detail={detail}
        discountAmount={discountAmount}
        grandTotal={grandTotal}
        guestCount={guestCount}
        orderNumber={orderNumber}
        paymentMeta={paymentMeta}
        printGeneratedAt={printGeneratedAt}
        roomCount={roomCount}
        roomEntries={roomEntries}
        roomSummaryLabel={roomSummaryLabel}
        statusMeta={statusMeta}
        subtotalLabel={subtotalLabel}
        bookingSubtotal={bookingSubtotal}
      />
    </div>
  );
}




