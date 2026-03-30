import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { imageUrl } from '../config';

export default function Profile() {
  const navigate = useNavigate();
  const { user: sessionUser } = useOutletContext() || {};
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '' });

  const currentUserId = sessionUser?.id;

  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    if (!currentUserId) return;
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/profile/${currentUserId}`, { withCredentials: true });
        if (res.data?.success) {
          const u = res.data.user;
          setUser(u);
          setFormData({ fullName: u.fullName || '', email: u.email || '', phone: u.phone || '' });
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    // Fetch recent bookings
    axios.get(`${API_BASE}/api/bookings/history?userId=${currentUserId}&page=1`, { withCredentials: true })
      .then(res => setRecentBookings((res.data?.bookings || []).slice(0, 2)))
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
        setUser(res.data.user);
        setIsEditing(false);
        if (window.Swal) window.Swal.fire({ icon: 'success', title: 'Đã cập nhật', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      console.error('Profile update error:', err);
    }
  };

  const getAvatarUrl = (url) => {
    return imageUrl(url, '/images/rooms/standard-room.jpg');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      <style>{`
        .hero-gradient { background: linear-gradient(135deg, #000614 0%, #001f41 100%); }
        .glass-card { background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); border: 1px solid rgba(196,198,207,0.2); }
        input:focus + label, input:not(:placeholder-shown) + label {
          transform: translateY(-1.5rem) scale(0.85); color: #775a19;
        }
      `}</style>

      {/* Hero Section */}
      <section className="hero-gradient relative py-32 px-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <img
            alt="Sovereign ambiance"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkzqUcwJwThy2XUO4RWs307igqJkBIgKZJMgcSDeCzdNgGhgCV6ZMo5cVq0EkjDK2q1AjOGXt0vTIwg2AFHpFMSAM3rHaN6Yzy744PDbObAJsvaZ4jWL1iWem0kKSUBY9mAdk4OsvrSLVTtUZQ6EYLXQAE1jJPv7j-d8pRFzTrezCCY5YJUP-l1sViEOW9tF68V-AxGsTme2i5ckEaz0tVjAN4rXzhVH1hM61-7ZhguVBKVdyrVXUqJexWF7FgMlzx54urR0TV1pw"
          />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto">
          <p className="text-secondary font-label text-[0.75rem] uppercase tracking-[0.3em] mb-4">ĐẶC QUYỀN KHÁCH HÀNG</p>
          <h1 className="font-headline text-5xl md:text-[3.5rem] text-white leading-tight -tracking-[0.02em] mb-6">
            Hồ sơ Của bạn
          </h1>
          <div className="h-1 w-24 bg-secondary"></div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Column: Personal & Security */}
          <div className="lg:col-span-4 space-y-16">

            {/* Personal Info */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <h2 className="font-headline text-2xl text-primary">Thông tin Cá nhân</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="font-label text-[0.7rem] uppercase tracking-widest text-secondary border-b border-secondary/40 pb-0.5 hover:text-primary transition-colors"
                >
                  {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-10 pt-4">
                <div className="relative">
                  <input
                    className="peer w-full bg-transparent border-b border-outline-variant/30 focus:border-secondary transition-colors py-2 outline-none text-on-surface disabled:opacity-60"
                    id="fullName" name="fullName" placeholder=" " type="text"
                    value={formData.fullName} onChange={handleChange} disabled={!isEditing} required
                  />
                  <label className="absolute left-0 top-2 text-outline pointer-events-none transition-all duration-300 font-label uppercase text-[0.7rem] tracking-widest" htmlFor="fullName">Họ và tên</label>
                </div>
                <div className="relative">
                  <input
                    className="peer w-full bg-transparent border-b border-outline-variant/30 py-2 outline-none text-on-surface opacity-60 cursor-not-allowed"
                    id="email" name="email" placeholder=" " type="email"
                    value={formData.email} disabled
                  />
                  <label className="absolute left-0 top-2 text-outline pointer-events-none transition-all duration-300 font-label uppercase text-[0.7rem] tracking-widest" htmlFor="email">Địa chỉ Email</label>
                </div>
                <div className="relative">
                  <input
                    className="peer w-full bg-transparent border-b border-outline-variant/30 focus:border-secondary transition-colors py-2 outline-none text-on-surface disabled:opacity-60"
                    id="phone" name="phone" placeholder=" " type="tel"
                    value={formData.phone} onChange={handleChange} disabled={!isEditing}
                  />
                  <label className="absolute left-0 top-2 text-outline pointer-events-none transition-all duration-300 font-label uppercase text-[0.7rem] tracking-widest" htmlFor="phone">Số điện thoại</label>
                </div>
                {isEditing ? (
                  <button type="submit" className="bg-primary text-on-primary px-8 py-4 rounded-sm font-label text-[0.75rem] uppercase tracking-widest hover:bg-secondary transition-all">
                    Lưu thay đổi
                  </button>
                ) : (
                  <button type="button" onClick={() => setIsEditing(true)} className="bg-primary text-on-primary px-8 py-4 rounded-sm font-label text-[0.75rem] uppercase tracking-widest hover:bg-secondary transition-all">
                    Cập nhật Hồ sơ
                  </button>
                )}
              </form>
            </div>

            {/* Security */}
            <div className="glass-card p-8 rounded-sm">
              <h2 className="font-headline text-2xl text-primary mb-8">Bảo mật &amp; Truy cập</h2>
              <div className="space-y-6">
                <p className="text-sm text-outline font-body">Đảm bảo tài khoản của bạn luôn được bảo mật bằng cách cập nhật thông tin thường xuyên.</p>
                <div className="flex items-center justify-between group cursor-pointer border-b border-outline-variant/20 pb-4">
                  <span className="font-label text-[0.75rem] uppercase tracking-widest text-on-surface group-hover:text-secondary transition-colors">Đổi mật khẩu</span>
                  <span className="material-symbols-outlined text-secondary text-lg">chevron_right</span>
                </div>
                <div className="flex items-center justify-between group cursor-pointer">
                  <span className="font-label text-[0.75rem] uppercase tracking-widest text-on-surface group-hover:text-secondary transition-colors">Xác thực hai yếu tố</span>
                  <div className="w-10 h-5 bg-surface-container-high rounded-full relative">
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: History & Preferences */}
          <div className="lg:col-span-8 space-y-16">

            {/* Booking History */}
            <div className="space-y-8">
              <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
                <h2 className="font-headline text-3xl text-primary leading-none">Lịch sử Đặt phòng của bạn</h2>
                <Link to="/history" className="font-label text-[0.7rem] uppercase tracking-widest text-secondary border-b border-secondary/30 pb-1">Xem tất cả</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {recentBookings.length > 0 ? recentBookings.map((booking) => {
                  const detail = booking.details?.[0];
                  const status = booking.status?.toLowerCase() || 'pending';
                  const statusLabel = status === 'pending' ? 'Chờ xử lý' : status === 'confirmed' ? 'Đã xác nhận' : status === 'completed' ? 'Đã hoàn thành' : 'Đã hủy';
                  return (
                    <div key={booking.id} className="group cursor-pointer" onClick={() => navigate(`/booking/${booking.id}`, { state: { booking } })}>
                      <div className="aspect-[16/10] mb-4 overflow-hidden rounded-sm">
                        <img
                          alt={detail?.room?.roomType?.typeName || 'Phòng'}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          src={imageUrl(detail?.room?.image)}
                        />
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-label text-[0.65rem] uppercase tracking-[0.2em] text-secondary">
                            {status === 'confirmed' ? 'Kỳ nghỉ sắp tới' : status === 'completed' ? 'Kỳ nghỉ trước' : statusLabel}
                          </span>
                          <h3 className="font-headline text-xl text-primary mt-1">{detail?.room?.roomType?.typeName || 'Phòng Tiêu chuẩn'}</h3>
                          <p className="text-sm text-outline font-body mt-1">Phòng {detail?.room?.roomNumber || 'N/A'}</p>
                        </div>
                        <span className={`px-3 py-1 font-label text-[0.6rem] uppercase tracking-widest ${status === 'confirmed' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="md:col-span-2 text-center py-8">
                    <p className="text-on-surface-variant font-body text-sm italic">Chưa có lịch sử đặt phòng nào.</p>
                    <Link to="/collections" className="text-secondary font-label text-xs uppercase tracking-widest mt-2 inline-block">Đặt phòng ngay</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Preferences Bento Grid */}
            <div className="space-y-8">
              <h2 className="font-headline text-3xl text-primary border-b border-outline-variant/20 pb-4">Sở thích Cá nhân</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-container-low p-8 rounded-sm space-y-4">
                  <span className="material-symbols-outlined text-secondary text-3xl">bed</span>
                  <h4 className="font-headline text-lg">Nghỉ ngơi</h4>
                  <p className="font-label text-[0.7rem] uppercase tracking-widest text-outline">Thực đơn Gối</p>
                  <p className="text-on-surface font-body text-sm">Lông ngỗng Hungary, cực kỳ êm ái.</p>
                </div>
                <div className="bg-surface-container-low p-8 rounded-sm space-y-4">
                  <span className="material-symbols-outlined text-secondary text-3xl">restaurant</span>
                  <h4 className="font-headline text-lg">Ẩm thực</h4>
                  <p className="font-label text-[0.7rem] uppercase tracking-widest text-outline">Nhu cầu Ăn uống</p>
                  <p className="text-on-surface font-body text-sm">Hỗ trợ ăn chay, không Gluten.</p>
                </div>
                <div className="bg-surface-container-low p-8 rounded-sm space-y-4">
                  <span className="material-symbols-outlined text-secondary text-3xl">thermostat</span>
                  <h4 className="font-headline text-lg">Nhiệt độ</h4>
                  <p className="font-label text-[0.7rem] uppercase tracking-widest text-outline">Nhiệt độ phòng</p>
                  <p className="text-on-surface font-body text-sm">Duy trì chính xác ở mức 21°C.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
