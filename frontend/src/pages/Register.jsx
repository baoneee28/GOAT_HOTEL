import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

export default function Register() {
  const [formData, setFormData] = useState({ fullname: '', email: '', phone: '', password: '', confirm_password: '' });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      if (window.Swal) window.Swal.fire('Lỗi', 'Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    try {
      const response = await axios.post(`${API_BASE}/api/auth/register`, formData, { withCredentials: true });
      if (response.data.success) {
        if (window.Swal) {
          window.Swal.fire({ icon: 'success', title: 'Thành công', text: response.data.message }).then(() => navigate('/login'));
        } else {
          navigate('/login');
        }
      }
    } catch (err) {
      if (window.Swal) window.Swal.fire('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại', 'error');
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface antialiased overflow-x-hidden min-h-screen">
      <style>{`
        .floating-label-group {
          position: relative;
          margin-bottom: 2.5rem;
        }
        .floating-label-group input {
          padding: 0.75rem 0;
          display: block;
          width: 100%;
          border: none;
          border-bottom: 1px solid rgba(196, 199, 199, 0.4);
          background: transparent;
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          transition: border-color 0.3s ease;
          outline: none;
        }
        .floating-label-group input:focus {
          border-bottom: 1px solid #000000;
        }
        .floating-label-group label {
          position: absolute;
          pointer-events: none;
          left: 0;
          top: 0.75rem;
          transition: 0.2s ease all;
          color: #858383;
          font-family: 'Inter', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.75rem;
        }
        .floating-label-group input:focus ~ label,
        .floating-label-group input:not(:placeholder-shown) ~ label {
          top: -1.25rem;
          font-size: 0.65rem;
          color: #000000;
        }
        body { min-height: max(884px, 100dvh); }
      `}</style>

      {/* Top Navigation Anchor */}
      <header className="fixed top-0 w-full z-50 bg-stone-100/10 backdrop-blur-md flex items-center justify-between px-6 h-20">
        <div className="flex items-center gap-4">
          <Link to="/">
            <span className="material-symbols-outlined text-stone-900 cursor-pointer hover:opacity-70 transition-opacity duration-300">close</span>
          </Link>
        </div>
        <div className="font-headline tracking-[0.2em] uppercase text-xl font-bold text-stone-900">
          GOAT HOTEL
        </div>
        <div className="w-10"></div>
      </header>

      <main className="min-h-screen flex flex-col md:flex-row">
        {/* Visual Column (Asymmetric Hero) */}
        <section className="hidden md:block md:w-5/12 lg:w-1/2 relative h-screen overflow-hidden">
          <img
            alt="Luxury Hotel Lobby"
            className="absolute inset-0 w-full h-full object-cover"
            src={`${API_BASE}/images/home/hero_slider_3.jpg`}
          />
          <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
          <div className="absolute bottom-20 left-12 max-w-sm z-10">
            <p className="font-headline text-white text-4xl font-extrabold tracking-[-0.04em] leading-tight">
              MỘT THÁNH ĐỊA <br/>CỦA SỰ TINH TẾ <br/>VÀ ĐƠN GIẢN.
            </p>
            <div className="h-px w-12 bg-white/50 mt-6"></div>
          </div>
        </section>

        {/* Registration Form Column */}
        <section className="flex-1 flex items-center justify-center px-8 pt-32 pb-20 md:pt-20">
          <div className="w-full max-w-md">
            <header className="mb-16">
              <span className="text-secondary font-label text-[10px] tracking-[0.2em] uppercase block mb-4">Thành viên</span>
              <h1 className="font-headline text-5xl font-extrabold tracking-[-0.04em] text-primary mb-2">Tạo Tài Khoản</h1>
              <p className="text-on-surface-variant font-body font-light text-lg">Gia nhập cộng đồng thượng lưu toàn cầu.</p>
            </header>

            <form className="space-y-2" onSubmit={handleRegister}>
              <div className="floating-label-group">
                <input id="fullname" name="fullname" placeholder=" " required type="text"
                  value={formData.fullname} onChange={e => setFormData({...formData, fullname: e.target.value})} />
                <label htmlFor="fullname">Họ và Tên</label>
              </div>
              <div className="floating-label-group">
                <input id="email" name="email" placeholder=" " required type="email"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <label htmlFor="email">Địa chỉ Email</label>
              </div>
              <div className="floating-label-group">
                <input id="phone" name="phone" placeholder=" " required type="tel"
                  value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <label htmlFor="phone">Số điện thoại</label>
              </div>
              <div className="floating-label-group">
                <input id="password" name="password" placeholder=" " required type="password"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                <label htmlFor="password">Mật khẩu</label>
              </div>
              <div className="floating-label-group">
                <input id="confirm_password" name="confirm_password" placeholder=" " required type="password"
                  value={formData.confirm_password} onChange={e => setFormData({...formData, confirm_password: e.target.value})} />
                <label htmlFor="confirm_password">Xác nhận Mật khẩu</label>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 py-4 mb-8">
                <input className="mt-1 rounded-sm border-outline-variant text-primary focus:ring-0 focus:ring-offset-0 transition-colors cursor-pointer" id="terms" type="checkbox" required />
                <label className="text-xs text-on-surface-variant font-light leading-relaxed" htmlFor="terms">
                  Tôi đồng ý với <Link className="text-primary font-medium hover:underline" to="#">Điều khoản Dịch vụ</Link> và <Link className="text-primary font-medium hover:underline" to="#">Chính sách Bảo mật</Link>.
                </label>
              </div>

              <button className="w-full py-5 bg-primary text-on-primary rounded-xl font-label text-xs tracking-[0.2em] uppercase font-semibold transition-all hover:opacity-90 active:scale-[0.98] duration-200 shadow-xl shadow-primary/10" type="submit">
                Đăng ký tài khoản
              </button>

              <div className="pt-8 text-center">
                <p className="text-sm text-on-surface-variant font-light">
                  Đã có tài khoản?
                  <Link className="text-secondary font-semibold ml-2 hover:underline transition-all" to="/login">Đăng nhập</Link>
                </p>
              </div>
            </form>

            {/* Social Proof */}
            <div className="mt-20 pt-10 border-t border-outline-variant/20">
              <div className="flex items-center gap-6">
                <div className="flex -space-x-3">
                  <img className="w-8 h-8 rounded-full border-2 border-surface" src={`${API_BASE}/images/Featured_news/news_featured_1.jpg`} alt="guest 1" />
                  <img className="w-8 h-8 rounded-full border-2 border-surface" src={`${API_BASE}/images/Featured_news/news_featured_2.jpg`} alt="guest 2" />
                  <img className="w-8 h-8 rounded-full border-2 border-surface" src={`${API_BASE}/images/Featured_news/news_featured_3.jpg`} alt="guest 3" />
                </div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium">
                  Hơn 2000+ khách hàng tinh hoa
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-stone-200/20 flex flex-col md:flex-row justify-between items-center px-10 py-12 gap-6 bg-surface">
        <div className="text-[10px] tracking-widest uppercase text-stone-400">
          © 2024 GOAT HOTEL. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-8">
          <Link className="text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors" to="#">Bảo mật</Link>
          <Link className="text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors" to="#">Điều khoản</Link>
          <Link className="text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors" to="#">Hỗ trợ</Link>
        </div>
      </footer>
    </div>
  );
}
