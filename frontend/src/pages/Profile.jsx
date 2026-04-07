import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { calculateBookingDisplayTotal, calculateStayNights, imageUrl, uploadedImageUrl } from '../config';

function formatDate(value) {
  if (!value) return 'Chưa cập nhật';
  if (Array.isArray(value)) {
    const [year, month, day] = value;
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('vi-VN');
  }
  return new Date(value).toLocaleDateString('vi-VN');
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function getStatusMeta(status) {
  switch ((status || '').toLowerCase()) {
    case 'confirmed':
      return {
        label: 'Đã xác nhận',
        summary: 'Kỳ nghỉ sắp tới',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      };
    case 'completed':
      return {
        label: 'Đã hoàn thành',
        summary: 'Đã lưu trú',
        className: 'bg-slate-100 text-slate-700 border border-slate-200',
      };
    case 'cancelled':
      return {
        label: 'Đã hủy',
        summary: 'Đã hủy',
        className: 'bg-rose-50 text-rose-700 border border-rose-200',
      };
    case 'expired':
      return {
        label: 'Hết hạn giữ chỗ',
        summary: 'Giữ chỗ đã hết hạn',
        className: 'bg-slate-100 text-slate-700 border border-slate-200',
      };
    default:
      return {
        label: 'Chờ xử lý',
        summary: 'Đang chờ khách sạn xác nhận',
        className: 'bg-amber-50 text-amber-700 border border-amber-200',
      };
  }
}

function getPaymentMeta(paymentStatus) {
  switch ((paymentStatus || '').toLowerCase()) {
    case 'paid':
      return {
        label: 'Đã thanh toán',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      };
    case 'deposit_paid':
      return {
        label: 'Đã đặt cọc',
        className: 'bg-violet-50 text-violet-700 border border-violet-200',
      };
    case 'pending_payment':
      return {
        label: 'Chờ thanh toán',
        className: 'bg-sky-50 text-sky-700 border border-sky-200',
      };
    case 'failed':
      return {
        label: 'Thanh toán lỗi',
        className: 'bg-rose-50 text-rose-700 border border-rose-200',
      };
    default:
      return {
        label: 'Chưa thanh toán',
        className: 'bg-amber-50 text-amber-700 border border-amber-200',
      };
  }
}

function getBookingCode(id) {
  return `GH-${String(id || 0).padStart(5, '0')}`;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user: sessionUser, setUser } = useOutletContext() || {};
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '' });
  const profileInfoRef = useRef(null);

  const currentUserId = sessionUser?.id;

  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    if (!currentUserId) return;
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/profile/${currentUserId}`, { withCredentials: true });
        if (res.data?.success) {
          const u = res.data.user;
          setProfileUser(u);
          setFormData({ fullName: u.fullName || '', email: u.email || '', phone: u.phone || '' });
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    axios.get(`${API_BASE}/api/bookings/history?page=1`, { withCredentials: true })
      .then((res) => setRecentBookings((res.data?.data || []).slice(0, 3)))
      .catch(() => {});
  }, [currentUserId]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/profile/${currentUserId}`, {
        fullName: formData.fullName,
        phone: formData.phone,
      }, { withCredentials: true });
      if (res.data?.success) {
        setProfileUser(res.data.user);
        setUser?.(res.data.user);
        setIsEditing(false);
        if (window.Swal) window.Swal.fire({ icon: 'success', title: 'Đã cập nhật', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      console.error('Profile update error:', err);
    }
  };

  const getAvatarUrl = (url) => {
    return imageUrl(url, '/images/default_avatar.png');
  };

  const nextStay = useMemo(
    () => recentBookings.find((booking) => ['pending', 'confirmed'].includes((booking.status || '').toLowerCase())),
    [recentBookings],
  );

  const stats = useMemo(() => {
    const completedCount = recentBookings.filter((booking) => (booking.status || '').toLowerCase() === 'completed').length;
    const pendingCount = recentBookings.filter((booking) => ['pending', 'confirmed'].includes((booking.status || '').toLowerCase())).length;
    const totalSpent = recentBookings
      .filter((booking) => (booking.paymentStatus || '').toLowerCase() === 'paid')
      .reduce((sum, booking) => sum + calculateBookingDisplayTotal(booking), 0);

    return { completedCount, pendingCount, totalSpent };
  }, [recentBookings]);

  const memberTier = useMemo(() => {
    if (stats.completedCount >= 5) return 'Signature Member';
    if (stats.completedCount >= 2) return 'Preferred Guest';
    return 'Classic Member';
  }, [stats.completedCount]);

  const handleEditProfileClick = () => {
    setIsEditing(true);
    profileInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f2ea_0%,#f7f4ef_28%,#fbfaf8_100%)] font-body text-on-surface">
      <style>{`
        .profile-hero-shell {
          background:
            linear-gradient(180deg, rgba(5, 15, 30, 0.48) 0%, rgba(5, 15, 30, 0.66) 100%),
            linear-gradient(90deg, rgba(5, 15, 30, 0.78) 0%, rgba(5, 15, 30, 0.42) 48%, rgba(5, 15, 30, 0.64) 100%);
        }
        .profile-premium-card {
          background: rgba(255, 251, 246, 0.9);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(120, 90, 25, 0.12);
          box-shadow: 0 30px 70px -42px rgba(15, 23, 42, 0.35);
        }
        .profile-panel {
          background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,250,245,0.96) 100%);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 20px 55px -38px rgba(15, 23, 42, 0.24);
        }
        .profile-input {
          width: 100%;
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: rgba(255,255,255,0.9);
          padding: 0.95rem 1rem;
          color: #0f172a;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .profile-input:focus {
          outline: none;
          border-color: rgba(119, 90, 25, 0.6);
          box-shadow: 0 0 0 4px rgba(119, 90, 25, 0.08);
          background: #fff;
        }
        .profile-input:disabled {
          background: rgba(248, 244, 238, 0.85);
          color: rgba(15, 23, 42, 0.68);
          cursor: not-allowed;
        }
      `}</style>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={imageUrl('/images/home/profile_hero.jpg')} alt="GOAT HOTEL member ambiance" className="h-full w-full object-cover" />
        </div>
        <div className="profile-hero-shell relative">
          <div className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:px-8 lg:px-10 lg:pb-28">
            <div className="max-w-3xl">
              <p className="font-label text-[0.72rem] uppercase tracking-[0.34em] text-secondary/90">GOAT HOTEL Privilege</p>
              <h1 className="mt-4 max-w-2xl font-headline text-4xl leading-tight text-white sm:text-5xl lg:text-[3.6rem]">Hồ sơ của bạn</h1>
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto -mt-14 max-w-7xl px-6 pb-20 sm:px-8 lg:px-10">
        <section className="profile-premium-card rounded-[32px] p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.9fr)] xl:items-stretch">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,rgba(8,19,37,0.96)_0%,rgba(15,31,56,0.92)_56%,rgba(32,47,71,0.88)_100%)] p-6 text-white sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                  <div className="h-24 w-24 overflow-hidden rounded-[28px] border border-white/15 bg-white/10 shadow-[0_18px_42px_-28px_rgba(0,0,0,0.7)] sm:h-28 sm:w-28">
                    <img src={getAvatarUrl(profileUser?.image)} alt={profileUser?.fullName || 'Avatar thành viên'} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="inline-flex items-center rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1 font-label text-[0.6rem] uppercase tracking-[0.28em] text-secondary">
                      {memberTier}
                    </div>
                    <h2 className="mt-4 font-headline text-3xl leading-tight text-white sm:text-[2.2rem]">{profileUser?.fullName || 'Khách hàng GOAT HOTEL'}</h2>
                    <p className="mt-2 text-sm text-white/68">{profileUser?.email || 'Thành viên đặc quyền'}</p>
                    <p className="mt-1 text-sm text-white/58">{profileUser?.phone || 'Chưa cập nhật số điện thoại'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-end">
                  <button
                    type="button"
                    onClick={handleEditProfileClick}
                    className="rounded-full border border-white/70 bg-white px-5 py-3 font-label text-[0.68rem] uppercase tracking-[0.24em] text-primary transition-all hover:bg-[#f7f0e4] hover:border-[#f7f0e4]"
                  >
                    Chỉnh sửa hồ sơ
                  </button>
                  <button type="button" onClick={() => navigate('/history')} className="rounded-full bg-secondary px-5 py-3 font-label text-[0.68rem] uppercase tracking-[0.24em] text-primary transition-all hover:brightness-105">
                    Quản lý lưu trú
                  </button>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <p className="font-label text-[0.62rem] uppercase tracking-[0.24em] text-white/52">Đơn hoàn tất</p>
                  <p className="mt-3 font-headline text-3xl text-white">{stats.completedCount}</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <p className="font-label text-[0.62rem] uppercase tracking-[0.24em] text-white/52">Lưu trú sắp tới</p>
                  <p className="mt-3 font-headline text-3xl text-white">{stats.pendingCount}</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <p className="font-label text-[0.62rem] uppercase tracking-[0.24em] text-white/52">Chi tiêu gần đây</p>
                  <p className="mt-3 font-headline text-3xl text-white">{formatCurrency(stats.totalSpent)}đ</p>
                </div>
              </div>
            </div>

            <aside className="profile-panel flex h-full flex-col justify-between rounded-[28px] p-6 sm:p-7">
              <div>
                <p className="font-label text-[0.65rem] uppercase tracking-[0.28em] text-secondary">Tóm tắt thành viên</p>
                <h3 className="mt-4 font-headline text-2xl text-primary">Trải nghiệm được cá nhân hóa</h3>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                  Hồ sơ của bạn được dùng để đồng bộ thông tin lưu trú, lịch sử đặt phòng và các tương tác dịch vụ
                  trong toàn bộ hệ sinh thái GOAT HOTEL.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-[22px] border border-outline-variant/15 bg-white/75 p-4">
                  <p className="font-label text-[0.62rem] uppercase tracking-[0.24em] text-on-surface-variant">Kỳ lưu trú tiếp theo</p>
                  <p className="mt-2 font-headline text-xl text-primary">{nextStay?.details?.[0]?.room?.roomType?.typeName || 'Chưa có kỳ lưu trú sắp tới'}</p>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {nextStay ? `${formatDate(nextStay.details?.[0]?.checkIn)} — ${formatDate(nextStay.details?.[0]?.checkOut)}` : 'Khám phá bộ sưu tập phòng để lên kế hoạch cho kỳ nghỉ tiếp theo.'}
                  </p>
                </div>

                <div>
                  <button type="button" onClick={() => navigate('/history')} className="w-full rounded-full border border-outline-variant/25 bg-transparent px-5 py-3 font-label text-[0.68rem] uppercase tracking-[0.22em] text-primary transition-all hover:border-secondary/40 hover:text-secondary">
                    Xem lịch sử
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-10 grid gap-8 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.65fr)]">
          <div className="space-y-8">
            <section ref={profileInfoRef} className="profile-panel scroll-mt-32 rounded-[30px] p-6 sm:p-8">
              <div className="flex flex-col gap-4 border-b border-outline-variant/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary">Tài khoản thành viên</p>
                  <h2 className="mt-3 font-headline text-[2rem] leading-tight text-primary">Thông tin cá nhân</h2>
                </div>
                <button onClick={() => setIsEditing((prev) => !prev)} className="rounded-full border border-outline-variant/20 bg-white px-5 py-3 font-label text-[0.66rem] uppercase tracking-[0.22em] text-primary transition-all hover:border-secondary/40 hover:text-secondary">
                  {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block font-label text-[0.64rem] uppercase tracking-[0.24em] text-on-surface-variant" htmlFor="fullName">Họ và tên</label>
                  <input id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} disabled={!isEditing} required className="profile-input" />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-label text-[0.64rem] uppercase tracking-[0.24em] text-on-surface-variant" htmlFor="email">Địa chỉ email</label>
                    <input id="email" name="email" type="email" value={formData.email} disabled className="profile-input" />
                  </div>

                  <div>
                    <label className="mb-2 block font-label text-[0.64rem] uppercase tracking-[0.24em] text-on-surface-variant" htmlFor="phone">Số điện thoại</label>
                    <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={!isEditing} className="profile-input" />
                  </div>
                </div>

                <div className="grid gap-4 rounded-[24px] border border-outline-variant/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(248,243,236,0.95)_100%)] p-5 sm:grid-cols-2">
                  <div>
                    <p className="font-label text-[0.62rem] uppercase tracking-[0.24em] text-on-surface-variant">Loại thành viên</p>
                    <p className="mt-2 font-headline text-xl text-primary">{memberTier}</p>
                  </div>
                  <div>
                    <p className="font-label text-[0.62rem] uppercase tracking-[0.24em] text-on-surface-variant">Mã khách hàng</p>
                    <p className="mt-2 font-headline text-xl text-primary">MEM-{String(profileUser?.id || 0).padStart(4, '0')}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  {isEditing ? (
                    <button type="submit" className="rounded-full bg-primary px-6 py-3 font-label text-[0.68rem] uppercase tracking-[0.24em] text-on-primary transition-all hover:brightness-105">
                      Lưu thay đổi
                    </button>
                  ) : (
                    <button type="button" onClick={() => setIsEditing(true)} className="rounded-full bg-primary px-6 py-3 font-label text-[0.68rem] uppercase tracking-[0.24em] text-on-primary transition-all hover:brightness-105">
                      Cập nhật hồ sơ
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.Swal) window.Swal.fire('Sắp ra mắt', 'Tính năng đổi mật khẩu sẽ được bổ sung ở phiên bản tiếp theo.', 'info');
                    }}
                    className="rounded-full border border-outline-variant/25 bg-white px-6 py-3 font-label text-[0.68rem] uppercase tracking-[0.24em] text-primary transition-all hover:border-secondary/40 hover:text-secondary"
                  >
                    Đổi mật khẩu
                  </button>
                </div>
              </form>
            </section>

            <section className="profile-panel rounded-[30px] p-6 sm:p-8">
              <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary">Dịch vụ ưu tiên</p>
              <h3 className="mt-3 font-headline text-[1.9rem] text-primary">Quyền lợi thành viên</h3>
              <div className="mt-6 grid gap-4">
                {[
                  ['Nghỉ dưỡng tinh chỉnh', 'Yêu cầu gối, nhiệt độ phòng và nhịp lưu trú phù hợp cho từng kỳ nghỉ.'],
                  ['Hỗ trợ đặt phòng nhanh', 'Ưu tiên truy xuất lịch sử và tiếp tục quy trình đặt phòng chỉ trong vài thao tác.'],
                  ['Liên hệ dịch vụ', 'Đội ngũ GOAT HOTEL sẵn sàng xác nhận các yêu cầu phát sinh cho lưu trú sắp tới.'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-[22px] border border-outline-variant/12 bg-white/75 p-5">
                    <p className="font-headline text-xl text-primary">{title}</p>
                    <p className="mt-2 text-sm leading-7 text-on-surface-variant">{desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="profile-panel rounded-[30px] p-6 sm:p-8">
            <div className="flex flex-col gap-4 border-b border-outline-variant/15 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary">Reservation Ledger</p>
                <h2 className="mt-3 font-headline text-[2rem] leading-tight text-primary">Lịch sử đặt phòng</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                  Theo dõi các kỳ lưu trú gần đây với trạng thái, chi phí và mốc thời gian rõ ràng trong một bố cục
                  phù hợp cho trải nghiệm thành viên cao cấp.
                </p>
              </div>
              <Link
                to="/history"
                className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-full border border-outline-variant/20 bg-white px-5 py-3 font-label text-[0.68rem] uppercase tracking-[0.22em] text-primary whitespace-nowrap transition-all hover:border-secondary/40 hover:text-secondary"
              >
                Xem tất cả
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>

            <div className="mt-8 space-y-5">
              {recentBookings.length > 0 ? recentBookings.map((booking) => {
                const detail = booking.details?.[0];
                const statusMeta = getStatusMeta(booking.status);
                const paymentMeta = getPaymentMeta(booking.paymentStatus);
                const roomTypeName = detail?.room?.roomType?.typeName || 'Phòng tiêu chuẩn';
                const roomNumber = detail?.room?.roomNumber || 'N/A';
                const imageSrc = uploadedImageUrl(detail?.room?.roomType?.image, '/images/rooms/standard-room.jpg');
                const stayNights = calculateStayNights(detail?.checkIn, detail?.checkOut);
                const displayTotal = calculateBookingDisplayTotal(booking);

                return (
                  <article key={booking.id} className="group overflow-hidden rounded-[24px] border border-outline-variant/12 bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_-40px_rgba(15,23,42,0.45)]">
                    <div className="grid gap-0 lg:grid-cols-[175px_minmax(0,1fr)]">
                      <div className="relative min-h-[160px] overflow-hidden bg-surface-container-low lg:min-h-[100%]">
                        <img src={imageSrc} alt={roomTypeName} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/75 to-transparent p-4">
                          <p className="font-label text-[0.6rem] uppercase tracking-[0.24em] text-white/75">Booking code</p>
                          <p className="mt-1.5 font-headline text-xl text-white">{getBookingCode(booking.id)}</p>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between p-4 sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 font-label text-[0.58rem] uppercase tracking-[0.24em] text-secondary">
                              {statusMeta.summary}
                            </div>
                            <h3 className="mt-3 font-headline text-[2rem] leading-tight text-primary lg:text-[2.15rem]">{roomTypeName}</h3>
                            <p className="mt-1 text-sm text-on-surface-variant">Phòng {roomNumber}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full px-3.5 py-1.5 font-label text-[0.58rem] uppercase tracking-[0.22em] ${statusMeta.className}`}>
                              {statusMeta.label}
                            </span>
                            <span className={`inline-flex rounded-full px-3.5 py-1.5 font-label text-[0.58rem] uppercase tracking-[0.22em] ${paymentMeta.className}`}>
                              {paymentMeta.label}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-[20px] border border-outline-variant/10 bg-[linear-gradient(180deg,rgba(248,244,238,0.82)_0%,rgba(255,255,255,0.94)_100%)] p-4 xl:grid-cols-4">
                          <div>
                            <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-on-surface-variant">Nhận phòng</p>
                            <p className="mt-1.5 font-headline text-base leading-tight text-primary xl:text-lg">{formatDate(detail?.checkIn)}</p>
                          </div>
                          <div>
                            <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-on-surface-variant">Trả phòng</p>
                            <p className="mt-1.5 font-headline text-base leading-tight text-primary xl:text-lg">{formatDate(detail?.checkOut)}</p>
                          </div>
                          <div>
                            <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-on-surface-variant">Ngày đặt</p>
                            <p className="mt-1.5 font-headline text-base leading-tight text-primary xl:text-lg">{formatDate(booking.createdAt || detail?.checkIn)}</p>
                          </div>
                          <div>
                            <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-on-surface-variant">Tổng giá trị</p>
                            <p className="mt-1.5 font-headline text-base leading-tight text-primary xl:text-lg">{formatCurrency(displayTotal)}đ</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm leading-6 text-on-surface-variant">
                            {stayNights > 0
                              ? `Lưu trú dự kiến ${stayNights} đêm.`
                              : 'Thông tin lưu trú đã được lưu trong hồ sơ thành viên của bạn.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate(`/booking/${booking.id}`, { state: { booking } })}
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 font-label text-[0.62rem] uppercase tracking-[0.22em] text-on-primary transition-all hover:brightness-105"
                          >
                            Xem chi tiết
                            <span className="material-symbols-outlined text-base">north_east</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }) : (
                <div className="rounded-[30px] border border-dashed border-outline-variant/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(248,243,236,0.9)_100%)] px-6 py-14 text-center sm:px-10">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <span className="material-symbols-outlined text-3xl">hotel</span>
                  </div>
                  <h3 className="mt-6 font-headline text-3xl text-primary">Chưa có kỳ lưu trú nào</h3>
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-on-surface-variant">
                    Hồ sơ thành viên của bạn vẫn đang chờ những hành trình đầu tiên. Khám phá bộ sưu tập phòng để bắt
                    đầu một trải nghiệm lưu trú được chăm chút theo phong cách GOAT HOTEL.
                  </p>
                  <Link to="/collections" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-label text-[0.68rem] uppercase tracking-[0.24em] text-on-primary transition-all hover:brightness-105">
                    Đặt phòng ngay
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                </div>
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
