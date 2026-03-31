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
    fullName: '',
    phone: '',
    email: '',
    notes: ''
  });

  const nights = formData.checkIn && formData.checkOut
    ? calculateStayNights(formData.checkIn, formData.checkOut)
    : 0; 
  const displayCapacity = booking.capacity || formData.guests || 0;
  const displaySize = resolveRoomTypeSpec(booking.room, 'size', booking.size);
  const displayBeds = resolveRoomTypeSpec(booking.room, 'beds', booking.beds);
  const displayView = resolveRoomTypeSpec(booking.room, 'view', booking.view);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const [submitting, setSubmitting] = useState(false);
  const [preparingVNPay, setPreparingVNPay] = useState(false);

  useEffect(() => {
    if (!sessionUser) return;
    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || sessionUser.fullName || '',
      phone: prev.phone || sessionUser.phone || '',
      email: prev.email || sessionUser.email || '',
    }));
  }, [sessionUser]);

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

    if(!formData.fullName || !formData.phone || !formData.email) {
      if (window.Swal) window.Swal.fire('Thiếu thông tin', 'Vui lòng điền đầy đủ các thông tin cá nhân bắt buộc', 'warning');
      else alert('Vui lòng điền đầy đủ thông tin bắt buộc.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await createBooking('standard_request');
      if (!result?.success) return;

      if (window.Swal) {
        window.Swal.fire('Thành công', 'Đã lưu yêu cầu đặt phòng!', 'success').then(() => navigate('/history'));
      } else {
        alert('Đặt phòng thành công!');
        navigate('/history');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVNPaySubmit = async () => {
    setPreparingVNPay(true);
    try {
      const result = await createBooking('vnpay_demo');
      if (!result?.success) return;

      if (!result.bookingId) {
        if (window.Swal) {
          window.Swal.fire('Thiếu dữ liệu', 'Đơn đã được tạo nhưng chưa lấy được mã booking để mở VNPay. Bạn có thể vào lịch sử để thanh toán lại.', 'warning')
            .then(() => navigate('/history'));
        } else {
          alert('Đơn đã được tạo nhưng chưa lấy được mã booking để mở VNPay.');
          navigate('/history');
        }
        return;
      }

      navigate(`/vnpay-launch?bookingId=${result.bookingId}`);
    } finally {
      setPreparingVNPay(false);
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
              Vui lòng hoàn thiện lịch trình và thông tin liên hệ để gửi yêu cầu đặt phòng hoặc mở luồng thanh toán demo.
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
            </div>

            {/* THÔNG TIN KHÁCH */}
            <div className="space-y-6">
              <h2 className="font-label uppercase tracking-widest text-xs text-secondary border-b border-outline-variant/30 pb-2">
                2. Thông tin cá nhân
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant mb-2 block">
                    Họ và tên <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Nguyễn Văn A"
                    className="w-full border-0 border-b border-outline-variant/40 focus:border-secondary bg-transparent py-2 px-0 focus:ring-0 font-body text-base text-on-surface transition-colors placeholder:text-outline-variant focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant mb-2 block">
                    Số điện thoại <span className="text-error">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="090 123 4567"
                    className="w-full border-0 border-b border-outline-variant/40 focus:border-secondary bg-transparent py-2 px-0 focus:ring-0 font-body text-base text-on-surface transition-colors placeholder:text-outline-variant focus:outline-none"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant mb-2 block">
                    Địa chỉ Email <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="nguyen.a@email.com"
                    className="w-full border-0 border-b border-outline-variant/40 focus:border-secondary bg-transparent py-2 px-0 focus:ring-0 font-body text-base text-on-surface transition-colors placeholder:text-outline-variant focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* YÊU CẦU ĐẶC BIỆT */}
            <div className="space-y-6">
              <h2 className="font-label uppercase tracking-widest text-xs text-secondary border-b border-outline-variant/30 pb-2">
                3. Yêu cầu đặc biệt (Tùy chọn)
              </h2>
              <p className="font-body text-xs text-on-surface-variant">
                Mọi yêu cầu của bạn sẽ được gửi trực tiếp tới khách sạn để chúng tôi chuẩn bị tốt nhất.
              </p>
              <div>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Cần xe đưa rước sân bay, chuẩn bị nôi em bé..."
                  rows="3"
                  className="w-full border border-outline-variant/40 focus:border-secondary bg-transparent p-4 focus:ring-0 font-body text-sm text-on-surface transition-colors placeholder:text-outline-variant rounded-sm resize-none focus:outline-none"
                ></textarea>
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
                    <span className="font-medium">{(booking.pricePerNight * nights).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Thuế & phí dịch vụ</span>
                    <span className="font-medium">0đ</span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-error">Vui lòng chọn ngày hợp lệ</div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-end font-headline text-xl lg:text-2xl pt-6 border-t border-outline-variant/20 mb-8">
              <span>Tổng cộng</span>
              <span className="text-secondary tracking-tight">
                {nights > 0 ? (booking.pricePerNight * nights).toLocaleString('vi-VN') + 'đ' : '0đ'}
              </span>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <button
                type="submit"
                form="checkout-form"
                disabled={nights <= 0 || submitting || preparingVNPay}
                className={`w-full font-label uppercase tracking-widest text-xs py-5 transition-all shadow-xl active:scale-95 ${(nights > 0 && !submitting && !preparingVNPay) ? 'bg-primary text-on-primary hover:bg-primary-container shadow-primary/10' : 'bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-70'}`}
              >
                {submitting ? 'ĐANG XỬ LÝ...' : 'GỬI YÊU CẦU ĐẶT PHÒNG'}
              </button>
              <button
                type="button"
                onClick={handleVNPaySubmit}
                disabled={nights <= 0 || submitting || preparingVNPay}
                className={`w-full font-label uppercase tracking-widest text-xs py-5 transition-all border active:scale-95 ${(nights > 0 && !submitting && !preparingVNPay) ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-500/10' : 'border-outline-variant/30 text-on-surface-variant cursor-not-allowed opacity-70'}`}
              >
                {preparingVNPay ? 'ĐANG MỞ VNPAY...' : 'MỞ VNPAY DEMO'}
              </button>
            </div>
            <p className="text-center mt-4">
              <span className="font-body text-[10px] text-on-surface-variant">
                Gửi yêu cầu đặt phòng sẽ tạo booking chờ duyệt. Mở VNPay demo sẽ tạo booking chờ thanh toán, chưa tự động xác nhận thành công.
              </span>
            </p>

          </div>
        </div>
      </section>
    </div>
  );
}
