import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { calculateStayNights, uploadedImageUrl, resolveRoomTypeSpec } from '../config';
import HeroHeader from '../components/HeroHeader';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function BookingConfirmation() {
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  const { user: sessionUser, setUser } = useOutletContext() || {};
  const [searchParams] = useSearchParams();
  const contentRef = React.useRef(null);
  const hasAutoScrolledRef = React.useRef(false);

  const roomId = state?.roomId || searchParams.get('roomId') || '';
  const hasBookingContext = Boolean(roomId);

  const [booking, setBooking] = useState({
    roomId,
    physicalRoomNumber: state?.physicalRoomNumber ?? searchParams.get('physicalRoomNumber') ?? '',
    room: state?.room ?? searchParams.get('room') ?? '',
    pricePerNight: Number(state?.pricePerNight ?? searchParams.get('pricePerNight') ?? 0),
    image: uploadedImageUrl(state?.image ?? searchParams.get('image'), '/images/rooms/standard-room.jpg'),
    size: state?.size ?? searchParams.get('size') ?? '',
    beds: state?.beds ?? searchParams.get('beds') ?? '',
    view: state?.view ?? searchParams.get('view') ?? '',
    capacity: Number(state?.capacity ?? searchParams.get('capacity') ?? searchParams.get('guests') ?? 0),
  });

  const [formData, setFormData] = useState({
    checkIn: state?.checkIn ?? searchParams.get('checkIn') ?? new Date().toISOString().split('T')[0],
    checkOut: state?.checkOut ?? searchParams.get('checkOut') ?? new Date(Date.now() + 86400000).toISOString().split('T')[0],
    guests: Number(state?.guests ?? searchParams.get('guests') ?? 2),
  });

  const nights = formData.checkIn && formData.checkOut
    ? calculateStayNights(formData.checkIn, formData.checkOut)
    : 0; 
  const bookingSubtotal = nights > 0 ? Math.round((booking.pricePerNight || 0) * nights) : 0;
  const displayCapacity = booking.capacity || formData.guests || 0;
  const displaySize = resolveRoomTypeSpec(booking.room, 'size', booking.size);
  const displayBeds = resolveRoomTypeSpec(booking.room, 'beds', booking.beds);
  const displayView = resolveRoomTypeSpec(booking.room, 'view', booking.view);
  const accountName = sessionUser?.fullName?.trim() || 'Chưa cập nhật trong hồ sơ';
  const accountPhone = sessionUser?.phone?.trim() || 'Chưa cập nhật trong hồ sơ';
  const accountEmail = sessionUser?.email?.trim() || 'Chưa cập nhật trong hồ sơ';
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState(null);
  const [pricingSummary, setPricingSummary] = useState({
    subtotal: bookingSubtotal,
    discountAmount: 0,
    finalAmount: bookingSubtotal,
    couponCode: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const [submitting, setSubmitting] = useState(false);
  const appliedCouponCode = pricingSummary.couponCode || '';

  useEffect(() => {
    setPricingSummary((prev) => {
      if (prev.couponCode) {
        return prev;
      }

      return {
        subtotal: bookingSubtotal,
        discountAmount: 0,
        finalAmount: bookingSubtotal,
        couponCode: null,
      };
    });
  }, [bookingSubtotal]);

  useEffect(() => {
    setCouponInput('');
    setCouponFeedback(null);
    setPricingSummary({
      subtotal: bookingSubtotal,
      discountAmount: 0,
      finalAmount: bookingSubtotal,
      couponCode: null,
    });
  }, [roomId, formData.checkIn, formData.checkOut, bookingSubtotal]);

  useEffect(() => {
    const needsRoomRefresh = !state?.room || !state?.size || !state?.beds || !state?.view || !state?.capacity;
    if (!roomId || !needsRoomRefresh) return;
    axios.get(`${API_BASE}/api/rooms/${roomId}`, { withCredentials: true })
      .then((res) => {
        const roomData = res.data;
        if (!roomData) return;
        setBooking((prev) => ({
          roomId,
          physicalRoomNumber: roomData.roomNumber || prev.physicalRoomNumber,
          room: roomData.roomType?.typeName || prev.room,
          pricePerNight: roomData.roomType?.pricePerNight || prev.pricePerNight,
          image: uploadedImageUrl(roomData.roomType?.image, prev.image),
          size: roomData.roomType?.size || prev.size,
          beds: roomData.roomType?.beds || prev.beds,
          view: roomData.roomType?.view || prev.view,
          capacity: roomData.roomType?.capacity || prev.capacity,
        }));
      })
      .catch((err) => console.error('Không thể tải lại thông tin phòng:', err));
  }, [roomId, state?.room, state?.size, state?.beds, state?.view, state?.capacity]);

  useEffect(() => {
    if (hasAutoScrolledRef.current || !contentRef.current) return;

    const scrollTimer = window.setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      hasAutoScrolledRef.current = true;
    }, 150);

    return () => window.clearTimeout(scrollTimer);
  }, []);

  const validateBookingInput = () => {
    if (!hasBookingContext) {
      if (window.Swal) window.Swal.fire('Thiếu dữ liệu', 'Vui lòng chọn phòng từ danh sách trước khi xác nhận lưu trú.', 'warning');
      else alert('Vui lòng chọn phòng từ danh sách trước khi xác nhận lưu trú.');
      navigate('/collections');
      return null;
    }
    if(nights <= 0) {
      if (window.Swal) window.Swal.fire('Lỗi', 'Ngày trả phòng phải sau ngày nhận phòng.', 'warning');
      else alert('Ngày trả phòng phải sau ngày nhận phòng.');
      return null;
    }
    
    if (!sessionUser?.id) {
       if (window.Swal) window.Swal.fire('Chú ý', 'Bạn cần đăng nhập để đặt phòng.', 'warning');
       else alert('Bạn cần đăng nhập để đặt phòng.');
       navigate('/login', { state: { from: location } });
       return null;
    }

    const effectiveRoomId = booking.roomId || roomId;
    if (!effectiveRoomId) {
      if (window.Swal) window.Swal.fire('Thiếu dữ liệu', 'Không xác định được phòng cần đặt. Vui lòng chọn lại phòng.', 'warning');
      else alert('Không xác định được phòng cần đặt. Vui lòng chọn lại phòng.');
      navigate(-1);
      return null;
    }

    return {
      roomId: String(effectiveRoomId),
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
    };
  };

  const createBooking = async (paymentFlow = 'standard_request') => {
    const payload = validateBookingInput();
    if (!payload) {
      return null;
    }

    try {
      const res = await axios.post(`${API_BASE}/api/bookings`, {
        ...payload,
        paymentFlow,
        couponCode: appliedCouponCode || null,
      }, { withCredentials: true });
      if (res.data?.success) {
        return res.data;
      }

      if (window.Swal) window.Swal.fire('Lỗi', res.data?.message || 'Có lỗi khi đặt phòng.', 'error');
      else alert(res.data?.message || 'Có lỗi khi đặt phòng.');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setUser?.(null);
        if (window.Swal) {
          window.Swal.fire('Phiên đăng nhập đã hết', 'Vui lòng đăng nhập lại để tiếp tục đặt phòng.', 'warning')
            .then(() => navigate('/login', { state: { from: location } }));
        } else {
          alert('Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.');
          navigate('/login', { state: { from: location } });
        }
        return;
      }
      if (window.Swal) window.Swal.fire('Lỗi', err.response?.data?.message || 'Không thể kết nối với máy chủ.', 'error');
      else alert('Không thể kết nối với máy chủ.');
    }

    return null;
  };

  const handleApplyCoupon = async () => {
    const payload = validateBookingInput();
    if (!payload) {
      return;
    }

    const normalizedCouponCode = couponInput.trim().toUpperCase();
    if (!normalizedCouponCode) {
      setCouponFeedback({ type: 'error', message: 'Vui lòng nhập mã giảm giá trước khi áp dụng.' });
      setPricingSummary({
        subtotal: bookingSubtotal,
        discountAmount: 0,
        finalAmount: bookingSubtotal,
        couponCode: null,
      });
      return;
    }

    setApplyingCoupon(true);
    try {
      const res = await axios.post(`${API_BASE}/api/coupons/apply`, {
        roomId: payload.roomId,
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
        couponCode: normalizedCouponCode,
      }, { withCredentials: true });

      if (!res.data?.success) {
        setCouponFeedback({ type: 'error', message: res.data?.message || 'Không thể áp dụng mã giảm giá.' });
        setPricingSummary({
          subtotal: bookingSubtotal,
          discountAmount: 0,
          finalAmount: bookingSubtotal,
          couponCode: null,
        });
        return;
      }

      setCouponFeedback({
        type: res.data.valid ? 'success' : 'error',
        message: res.data.message,
      });

      if (res.data.valid) {
        const appliedCode = res.data?.coupon?.code || normalizedCouponCode;
        setCouponInput(appliedCode);
        setPricingSummary({
          subtotal: Number(res.data.subtotal || 0),
          discountAmount: Number(res.data.discountAmount || 0),
          finalAmount: Number(res.data.finalAmount || 0),
          couponCode: appliedCode,
        });
      } else {
        setPricingSummary({
          subtotal: Number(res.data.subtotal || bookingSubtotal),
          discountAmount: 0,
          finalAmount: Number(res.data.finalAmount || bookingSubtotal),
          couponCode: null,
        });
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setUser?.(null);
        if (window.Swal) {
          window.Swal.fire('Phiên đăng nhập đã hết', 'Vui lòng đăng nhập lại để tiếp tục đặt phòng.', 'warning')
            .then(() => navigate('/login', { state: { from: location } }));
        } else {
          alert('Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.');
          navigate('/login', { state: { from: location } });
        }
        return;
      }

      setCouponFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể kiểm tra mã giảm giá lúc này.',
      });
      setPricingSummary({
        subtotal: bookingSubtotal,
        discountAmount: 0,
        finalAmount: bookingSubtotal,
        couponCode: null,
      });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await createBooking('standard_request');
      if (!result?.success) return;

      if (!result.bookingId) {
        if (window.Swal) {
          window.Swal.fire('Thiếu dữ liệu', 'Booking đã được tạo nhưng chưa lấy được mã đơn để mở trang chi tiết.', 'warning')
            .then(() => navigate('/history'));
        } else {
          alert('Booking đã được tạo nhưng chưa lấy được mã đơn để mở trang chi tiết.');
          navigate('/history');
        }
        return;
      }

      if (window.Swal) {
        window.Swal.fire('Thành công', result.message || 'Đã tạo booking giữ chỗ!', 'success')
          .then(() => navigate(`/booking/${result.bookingId}`));
      } else {
        alert(result.message || 'Đã tạo booking giữ chỗ!');
        navigate(`/booking/${result.bookingId}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasBookingContext) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg text-center space-y-5">
          <h1 className="font-headline text-4xl text-primary">Thiếu thông tin đặt phòng</h1>
          <p className="font-body text-on-surface-variant">
            Bạn cần chọn một phòng cụ thể trước khi vào bước xác nhận lưu trú.
          </p>
          <button
            onClick={() => navigate('/collections')}
            className="bg-primary text-on-primary px-8 py-4 font-label text-xs uppercase tracking-widest hover:bg-primary-container transition-all"
          >
            Quay lại chọn phòng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col">
      
      {/* ── HERO IMAGE ──────────────────────────────────────────────── */}
      <HeroHeader image={booking.image} altText={booking.room} />

      {/* ── HEADER BREADCRUMB ────────────────────────────────────── */}
      <div className="border-b border-outline-variant/20 bg-surface">
        <div className="max-w-7xl mx-auto px-8 md:px-16 py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 font-label uppercase tracking-widest text-xs text-on-surface-variant hover:text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            QUAY LẠI
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ────────────────────────────────────── */}
      <section ref={contentRef} className="max-w-7xl mx-auto px-8 md:px-16 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-3 gap-16 flex-grow scroll-mt-28">
        
        {/* LEFT: INFO & FORM ─────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="mb-12">
            <h1 className="font-headline text-4xl md:text-5xl tracking-tight text-on-surface mb-2">
              Xác nhận lưu trú 
            </h1>
            <p className="text-secondary font-headline text-2xl mb-4">
              PHÒNG {booking.physicalRoomNumber}
            </p>
            <p className="text-on-surface-variant font-body text-base">
              Vui lòng kiểm tra lại lịch trình đã chọn. Sau khi xác nhận giữ chỗ, hệ thống sẽ giữ booking tối đa 2 phút để bạn tiếp tục đặt cọc hoặc thanh toán ở trang chi tiết đơn.
            </p>
          </div>

          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-12">
            
            {/* THÔNG TIN LƯU TRÚ (Dịch chuyển từ RoomDetail sang đây) */}
            <div className="space-y-6">
              <h2 className="font-label uppercase tracking-widest text-xs text-secondary border-b border-outline-variant/30 pb-2">
                1. Thông tin lưu trú
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant mb-2 block">
                    Ngày nhận phòng <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    name="checkIn"
                    value={formData.checkIn}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border-0 border-b border-outline-variant/40 focus:border-secondary bg-transparent py-2 px-0 focus:ring-0 font-body text-base text-on-surface transition-colors focus:outline-none opacity-50 cursor-not-allowed"
                    disabled
                  />
                </div>
                <div>
                  <label className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant mb-2 block">
                    Ngày trả phòng <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    name="checkOut"
                    value={formData.checkOut}
                    onChange={handleInputChange}
                    min={formData.checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full border-0 border-b border-outline-variant/40 focus:border-secondary bg-transparent py-2 px-0 focus:ring-0 font-body text-base text-on-surface transition-colors focus:outline-none opacity-50 cursor-not-allowed"
                    disabled
                  />
                </div>
                <div>
                  <label className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant mb-2 block">
                    Số khách <span className="text-error">*</span>
                  </label>
                  <select
                    name="guests"
                    value={formData.guests}
                    onChange={handleInputChange}
                    className="w-full border-0 border-b border-outline-variant/40 focus:border-secondary bg-transparent py-2 px-0 focus:ring-0 font-body text-base text-on-surface transition-colors focus:outline-none opacity-50 cursor-not-allowed"
                    disabled
                  >
                    {[1, 2, 3, 4].map(n => <option key={n} value={n} className="bg-surface text-on-surface">{n} Khách</option>)}
                  </select>
                </div>
              </div>
              <p className="font-body text-xs text-on-surface-variant">
                Ngày lưu trú và số khách đang hiển thị theo lựa chọn ở bước trước để bạn đối chiếu lại trước khi tạo booking.
              </p>
            </div>

            {/* THÔNG TIN TÀI KHOẢN */}
            <div className="space-y-6">
              <h2 className="font-label uppercase tracking-widest text-xs text-secondary border-b border-outline-variant/30 pb-2">
                2. Tài khoản áp dụng cho booking
              </h2>
              <p className="font-body text-xs text-on-surface-variant">
                Hệ thống hiện gắn booking với thông tin của tài khoản đang đăng nhập. Nếu cần cập nhật số điện thoại hoặc email, vui lòng chỉnh ở hồ sơ trước khi đặt.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border border-outline-variant/30 rounded-sm px-4 py-4 bg-surface-container-low/30">
                  <p className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant mb-2">
                    Họ và tên
                  </p>
                  <p className="font-body text-base text-on-surface">{accountName}</p>
                </div>
                <div className="border border-outline-variant/30 rounded-sm px-4 py-4 bg-surface-container-low/30">
                  <p className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant mb-2">
                    Số điện thoại
                  </p>
                  <p className="font-body text-base text-on-surface">{accountPhone}</p>
                </div>
                <div className="md:col-span-2 border border-outline-variant/30 rounded-sm px-4 py-4 bg-surface-container-low/30">
                  <p className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant mb-2">
                    Địa chỉ email
                  </p>
                  <p className="font-body text-base text-on-surface break-all">{accountEmail}</p>
                </div>
              </div>
            </div>

            {/* LƯU Ý BẢN DEMO */}
            <div className="space-y-6">
              <h2 className="font-label uppercase tracking-widest text-xs text-secondary border-b border-outline-variant/30 pb-2">
                3. Lưu ý cho bước xác nhận hiện tại
              </h2>
              <div className="border border-outline-variant/30 rounded-sm px-4 py-4 bg-secondary/5">
                <p className="font-body text-sm text-on-surface leading-7">
                  Bản demo hiện tại chỉ tạo booking theo <strong>phòng</strong>, <strong>ngày lưu trú</strong> và <strong>hình thức xử lý</strong>.
                  Yêu cầu đặc biệt theo từng booking chưa được lưu riêng ở bước này để tránh hiển thị nhiều hơn phần backend đang xử lý thật.
                </p>
              </div>
            </div>

            {/* CHÍNH SÁCH */}
             <div className="space-y-4">
              <h2 className="font-label uppercase tracking-widest text-xs text-secondary border-b border-outline-variant/30 pb-2">
                Chính sách lưu trú
              </h2>
              <ul className="text-sm font-body text-on-surface-variant space-y-2 list-disc list-inside">
                <li>Nhận phòng từ <strong>14:00</strong>. Cần xuất trình CMND/CCCD hoặc Hộ chiếu.</li>
                <li>Trả phòng trước <strong>12:00</strong>. Việc trả muộn có thể phát sinh phụ phí.</li>
                <li>Du lịch có trách nhiệm: Cấm hút thuốc tại phòng và không mang theo thú cưng.</li>
              </ul>
            </div>

          </form>
        </div>

        {/* RIGHT: BOOKING SUMMARY (STICKY) ───────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-secondary/5 rounded-sm p-8 border border-secondary/10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.05)]">
            
            <h3 className="font-headline text-2xl mb-6">Tóm tắt đặt phòng</h3>

            {/* Room ID Badge */}
            <div className="flex gap-4 mb-6 border-b border-outline-variant/20 pb-6">
              <img src={booking.image} alt={booking.room} className="w-24 h-24 object-cover rounded-sm" />
              <div>
                <h4 className="font-headline text-3xl tracking-tight text-on-surface mb-1">PHÒNG {booking.physicalRoomNumber}</h4>
                <p className="font-body text-sm text-on-surface-variant font-medium">{booking.room}</p>
                <div className="flex items-center gap-2 font-body text-[10px] uppercase tracking-wider text-on-surface-variant mt-2 opacity-80 flex-wrap">
                  <span>{displaySize}</span><span>•</span>
                  <span>{displayBeds}</span><span>•</span>
                  <span>{displayView}</span><span>•</span>
                  <span>{displayCapacity} Khách</span>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4 mb-6 border-b border-outline-variant/20 pb-6">
              <h4 className="font-label uppercase tracking-widest text-[10px] text-secondary">Thời gian lưu trú</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-body text-xs text-on-surface-variant mb-1">Nhận phòng</p>
                  <p className="font-medium text-sm">14:00</p>
                  <p className="font-headline text-base">{fmtDate(formData.checkIn)}</p>
                </div>
                <div className="border-l border-outline-variant/20 pl-4">
                  <p className="font-body text-xs text-on-surface-variant mb-1">Trả phòng</p>
                  <p className="font-medium text-sm">12:00</p>
                  <p className="font-headline text-base">{fmtDate(formData.checkOut)}</p>
                </div>
              </div>
              <p className="font-body text-sm text-on-surface-variant pt-2">
                Tổng cộng: <span className="font-medium text-on-surface">{nights} đêm</span>
              </p>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-6">
              <h4 className="font-label uppercase tracking-widest text-[10px] text-secondary mb-2">Chi tiết thanh toán</h4>
              {nights > 0 ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Giá phòng ({booking.pricePerNight.toLocaleString('vi-VN')}đ × {nights} đêm)</span>
                    <span className="font-medium">{pricingSummary.subtotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Thuế & phí dịch vụ</span>
                    <span className="font-medium">0đ</span>
                  </div>
                  <div className={`flex justify-between text-sm ${pricingSummary.discountAmount > 0 ? 'text-emerald-700' : 'text-on-surface-variant'}`}>
                    <span>
                      Giảm giá {pricingSummary.couponCode ? `(${pricingSummary.couponCode})` : ''}
                    </span>
                    <span className="font-medium">
                      {pricingSummary.discountAmount > 0
                        ? `-${pricingSummary.discountAmount.toLocaleString('vi-VN')}đ`
                        : '0đ'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-error">Vui lòng chọn ngày hợp lệ</div>
              )}
            </div>

            <div className="space-y-3 mb-6 border-t border-outline-variant/20 pt-6">
              <h4 className="font-label uppercase tracking-widest text-[10px] text-secondary">Mã giảm giá</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    const nextValue = e.target.value.toUpperCase();
                    setCouponInput(nextValue);
                    setCouponFeedback(null);
                    if (pricingSummary.couponCode && nextValue.trim() !== pricingSummary.couponCode) {
                      setPricingSummary({
                        subtotal: bookingSubtotal,
                        discountAmount: 0,
                        finalAmount: bookingSubtotal,
                        couponCode: null,
                      });
                    }
                  }}
                  placeholder="VD: WELCOME50"
                  className="min-w-0 flex-1 border border-outline-variant/40 bg-white/80 px-3 py-3 text-sm text-on-surface focus:border-secondary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={nights <= 0 || !couponInput.trim() || applyingCoupon || submitting}
                  className={`px-4 py-3 font-label uppercase tracking-widest text-[10px] transition-all ${(nights > 0 && couponInput.trim() && !applyingCoupon && !submitting) ? 'bg-secondary text-slate-950 hover:brightness-105' : 'bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-70'}`}
                >
                  {applyingCoupon ? 'ĐANG KIỂM TRA...' : 'ÁP DỤNG'}
                </button>
              </div>
              {couponFeedback && (
                <div className={`border px-3 py-3 text-xs ${couponFeedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                  {couponFeedback.message}
                </div>
              )}
              {pricingSummary.couponCode && (
                <p className="text-[11px] text-on-surface-variant">
                  Đang áp dụng mã <span className="font-semibold text-on-surface">{pricingSummary.couponCode}</span>.
                  Nếu muốn bỏ mã, chỉ cần xóa hoặc đổi nội dung trong ô nhập rồi áp dụng lại.
                </p>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-end font-headline text-xl lg:text-2xl pt-6 border-t border-outline-variant/20 mb-8">
              <span>Tổng thanh toán</span>
              <span className="text-secondary tracking-tight">
                {nights > 0 ? pricingSummary.finalAmount.toLocaleString('vi-VN') + 'đ' : '0đ'}
              </span>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <button
                type="submit"
                form="checkout-form"
                disabled={nights <= 0 || submitting}
                className={`w-full font-label uppercase tracking-widest text-xs py-5 transition-all shadow-xl active:scale-95 ${(nights > 0 && !submitting) ? 'bg-primary text-on-primary hover:bg-primary-container shadow-primary/10' : 'bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-70'}`}
              >
                {submitting ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN GIỮ CHỖ'}
              </button>
            </div>
            <p className="text-center mt-4">
              <span className="font-body text-[10px] text-on-surface-variant">
                Bước này chỉ xác nhận bạn muốn giữ chỗ hay không. Các thao tác đặt cọc 30% và thanh toán VNPay sẽ được thực hiện ở trang chi tiết booking ngay sau đó.
              </span>
            </p>

          </div>
        </div>
      </section>
    </div>
  );
}
