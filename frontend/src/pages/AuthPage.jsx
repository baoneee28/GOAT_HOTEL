import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { imageUrl } from '../config';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { resolvePostLoginDestination } from '../auth/authUtils';
import { useAuth } from '../auth/useAuth';

const COPY = {
  login: {
    image: imageUrl('/images/home/hero_slider_2.jpg'),
    imageAlt: 'Sanh GOAT HOTEL voi anh sang am',
  },
  register: {
    image: imageUrl('/images/home/hero_slider_3.jpg'),
    imageAlt: 'Phong nghi cao cap cua GOAT HOTEL',
  },
};

function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  helperText,
  required = true,
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-label text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-2xl border bg-white px-4 py-4 font-body text-[15px] text-on-surface shadow-[0_18px_40px_-34px_rgba(0,6,20,0.45)] transition-all placeholder:text-[#978f84] focus:outline-none focus:ring-4 ${
          error
            ? 'border-[#c97d6a] focus:border-[#c97d6a] focus:ring-[#c97d6a]/15'
            : 'border-[#d8d0c4] focus:border-secondary focus:ring-secondary/10'
        }`}
      />
      {helperText ? <p className={`text-xs leading-5 ${error ? 'text-[#b65039]' : 'text-on-surface-variant'}`}>{helperText}</p> : null}
    </div>
  );
}

function InlineMessage({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-[#d6b2a7] bg-[#fff4ef] px-4 py-3 text-sm leading-6 text-[#9e4b36]">
      {message}
    </div>
  );
}

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const activeTab = location.pathname === '/register' ? 'register' : 'login';
  const copy = COPY[activeTab];

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    fullname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const passwordsMismatch = Boolean(registerForm.confirmPassword) && registerForm.password !== registerForm.confirmPassword;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);

    try {
      const authPayload = await login({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      if (authPayload.authenticated) {
        const msg = authPayload.message || 'Đăng nhập thành công!';
        const destination = resolvePostLoginDestination(authPayload, location.state);

        if (window.Swal) {
          window.Swal
            .fire({ icon: 'success', title: 'Thành công', text: msg, timer: 1500, showConfirmButton: false })
            .then(() => navigate(destination.to, { replace: true, state: destination.state }));
        } else {
          navigate(destination.to, { replace: true, state: destination.state });
        }
      } else {
        setLoginError(authPayload.message || 'Sai email hoặc mật khẩu.');
      }
    } catch (err) {
      console.error('Login error:', err.response?.data ?? err.message);
      setLoginError(err.response?.data?.message || 'Sai email hoặc mật khẩu.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('Mật khẩu xác nhận chưa khớp. Vui lòng kiểm tra lại.');
      return;
    }

    setRegisterSubmitting(true);

    try {
      const payload = {
        fullname: registerForm.fullname.trim(),
        email: registerForm.email.trim(),
        phone: registerForm.phone.trim(),
        password: registerForm.password,
      };
      const res = await axios.post(`${API_BASE}/api/auth/register`, payload, { withCredentials: true });

      if (res.data.success) {
        if (window.Swal) {
          window.Swal
            .fire({ icon: 'success', title: 'Thành công', text: res.data.message })
            .then(() => navigate('/login', { replace: true, state: location.state }));
        } else {
          navigate('/login', { replace: true, state: location.state });
        }
      }
    } catch (err) {
      console.error('Register error:', err.response?.data ?? err.message);
      setRegisterError(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký.');
    } finally {
      setRegisterSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3efe7] font-body text-on-background antialiased flex flex-col">
      <Navbar user={user} onLogout={handleLogout} variant="dark" />

      <main className="relative flex-1 overflow-hidden px-4 pb-8 pt-24 sm:px-6 lg:px-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at top left, rgba(119,90,25,0.14), transparent 28%), radial-gradient(circle at bottom right, rgba(0,6,20,0.10), transparent 32%)',
          }}
        />

        <div className="relative mx-auto max-w-[1260px] overflow-hidden rounded-[32px] border border-[#d7d0c2] bg-[#f7f3ec] shadow-[0_35px_90px_-45px_rgba(0,6,20,0.35)]">
          <div className="grid lg:grid-cols-[1.04fr,0.96fr]">
            <section className="relative min-h-[360px] overflow-hidden lg:min-h-[720px]">
              <img src={copy.image} alt={copy.imageAlt} className="absolute inset-0 h-full w-full object-cover" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0,6,20,0.18) 0%, rgba(0,6,20,0.76) 100%), linear-gradient(135deg, rgba(0,6,20,0.14) 0%, rgba(119,90,25,0.30) 100%)',
                }}
              />
            </section>

            <section className="relative flex items-center" style={{ background: 'linear-gradient(180deg, #fbf8f2 0%, #f4efe6 100%)' }}>
              <div className="relative w-full px-6 py-8 sm:px-8 lg:px-10 xl:px-12">
                <div className="mx-auto max-w-[500px]">
                  <div className="mb-8 inline-flex w-full rounded-full border border-[#d7d0c2] bg-[#ece5d8] p-1 shadow-[0_16px_40px_-30px_rgba(0,6,20,0.32)]">
                    <button
                      type="button"
                      onClick={() => navigate('/login', { state: location.state })}
                      className={`flex-1 rounded-full px-4 py-3 font-label text-[10px] font-bold uppercase tracking-[0.28em] transition-all ${
                        activeTab === 'login'
                          ? 'bg-white text-primary shadow-[0_12px_30px_-22px_rgba(0,6,20,0.55)]'
                          : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Đăng nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/register', { state: location.state })}
                      className={`flex-1 rounded-full px-4 py-3 font-label text-[10px] font-bold uppercase tracking-[0.28em] transition-all ${
                        activeTab === 'register'
                          ? 'bg-white text-primary shadow-[0_12px_30px_-22px_rgba(0,6,20,0.55)]'
                          : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Đăng ký
                    </button>
                  </div>

                  <header className="mb-8 space-y-4">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.32em] text-secondary">
                      {activeTab === 'login' ? 'Member sign in' : 'Create a member profile'}
                    </p>
                    <h2 className="font-headline text-4xl leading-tight text-primary sm:text-5xl">
                      {activeTab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                    </h2>
                    <p className="text-sm leading-7 text-on-surface-variant sm:text-[15px]">
                      {activeTab === 'login'
                        ? 'Đăng nhập để tiếp tục hành trình lưu trú của bạn, quản lý đơn đặt phòng và giữ mọi thông tin trong cùng một trải nghiệm đồng bộ.'
                        : 'Đăng ký tài khoản để lưu thông tin liên hệ, rút gọn thao tác cho các lần đặt sau và kết nối liền mạch với hệ thống GOAT HOTEL.'}
                    </p>
                  </header>

                  <div className="rounded-[28px] border border-[#d7d0c2] bg-white/85 p-6 shadow-[0_30px_70px_-42px_rgba(0,6,20,0.45)] backdrop-blur-xl sm:p-8">
                    {activeTab === 'login' ? (
                      <form className="space-y-5" onSubmit={handleLogin}>
                        <InlineMessage message={loginError} />

                        <AuthField
                          id="login-email"
                          label="Email"
                          type="email"
                          value={loginForm.email}
                          onChange={(e) => {
                            setLoginForm((prev) => ({ ...prev, email: e.target.value }));
                            if (loginError) setLoginError('');
                          }}
                          autoComplete="email"
                          placeholder="ban@goathotel.com"
                        />

                        <AuthField
                          id="login-password"
                          label="Mật khẩu"
                          type="password"
                          value={loginForm.password}
                          onChange={(e) => {
                            setLoginForm((prev) => ({ ...prev, password: e.target.value }));
                            if (loginError) setLoginError('');
                          }}
                          autoComplete="current-password"
                          placeholder="Nhập mật khẩu của bạn"
                        />

                        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="max-w-xs text-xs leading-6 text-on-surface-variant">
                            Sử dụng email đã đăng ký để truy cập nhanh vào lịch sử đặt phòng và hồ sơ lưu trú của bạn.
                          </p>
                          <span className="font-label text-[10px] uppercase tracking-[0.22em] text-on-surface-variant/70">
                            Quên mật khẩu
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={loginSubmitting}
                          className={`mt-2 w-full rounded-full px-6 py-4 font-label text-[11px] font-bold uppercase tracking-[0.3em] text-on-primary transition-all ${
                            loginSubmitting
                              ? 'cursor-not-allowed bg-primary/75'
                              : 'bg-primary shadow-[0_26px_40px_-28px_rgba(0,6,20,0.75)] hover:-translate-y-0.5 hover:bg-primary-container'
                          }`}
                        >
                          {loginSubmitting ? 'Dang xu ly...' : 'Đăng nhập'}
                        </button>

                        <p className="pt-2 text-center text-sm leading-6 text-on-surface-variant">
                          Chưa có tài khoản?{' '}
                          <Link to="/register" state={location.state} className="font-semibold text-secondary transition-colors hover:text-primary">
                            Đăng ký ngay
                          </Link>
                        </p>
                      </form>
                    ) : (
                      <form className="space-y-5" onSubmit={handleRegister}>
                        <InlineMessage message={registerError} />

                        <AuthField
                          id="register-fullname"
                          label="Họ và tên"
                          value={registerForm.fullname}
                          onChange={(e) => {
                            setRegisterForm((prev) => ({ ...prev, fullname: e.target.value }));
                            if (registerError) setRegisterError('');
                          }}
                          autoComplete="name"
                          placeholder="Nguyen Van A"
                        />

                        <div className="grid gap-5 md:grid-cols-2">
                          <AuthField
                            id="register-email"
                            label="Email"
                            type="email"
                            value={registerForm.email}
                            onChange={(e) => {
                              setRegisterForm((prev) => ({ ...prev, email: e.target.value }));
                              if (registerError) setRegisterError('');
                            }}
                            autoComplete="email"
                            placeholder="ban@goathotel.com"
                          />

                          <AuthField
                            id="register-phone"
                            label="Số điện thoại"
                            type="tel"
                            value={registerForm.phone}
                            onChange={(e) => {
                              setRegisterForm((prev) => ({ ...prev, phone: e.target.value }));
                              if (registerError) setRegisterError('');
                            }}
                            autoComplete="tel"
                            placeholder="0901 234 567"
                          />
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <AuthField
                            id="register-password"
                            label="Mật khẩu"
                            type="password"
                            value={registerForm.password}
                            onChange={(e) => {
                              setRegisterForm((prev) => ({ ...prev, password: e.target.value }));
                              if (registerError) setRegisterError('');
                            }}
                            autoComplete="new-password"
                            placeholder="Tạo mật khẩu"
                          />

                          <AuthField
                            id="register-confirm-password"
                            label="Xác nhận mật khẩu"
                            type="password"
                            value={registerForm.confirmPassword}
                            onChange={(e) => {
                              setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                              if (registerError) setRegisterError('');
                            }}
                            autoComplete="new-password"
                            placeholder="Nhập lại mật khẩu"
                            error={passwordsMismatch}
                            helperText={passwordsMismatch ? 'Mật khẩu xác nhận chưa khớp.' : ''}
                          />
                        </div>

                        <p className="rounded-2xl border border-[#e3ddd2] bg-[#f8f5ef] px-4 py-3 text-xs leading-6 text-on-surface-variant">
                          Email và số điện thoại này sẽ được dùng để xác nhận đặt phòng và hỗ trợ bạn trong các lần lưu trú tiếp theo.
                        </p>

                        <button
                          type="submit"
                          disabled={registerSubmitting}
                          className={`mt-2 w-full rounded-full px-6 py-4 font-label text-[11px] font-bold uppercase tracking-[0.3em] text-on-primary transition-all ${
                            registerSubmitting
                              ? 'cursor-not-allowed bg-primary/75'
                              : 'bg-primary shadow-[0_26px_40px_-28px_rgba(0,6,20,0.75)] hover:-translate-y-0.5 hover:bg-primary-container'
                          }`}
                        >
                          {registerSubmitting ? 'Dang xu ly...' : 'Đăng ký'}
                        </button>

                        <p className="pt-2 text-center text-sm leading-6 text-on-surface-variant">
                          Đã có tài khoản?{' '}
                          <Link to="/login" state={location.state} className="font-semibold text-secondary transition-colors hover:text-primary">
                            Đăng nhập
                          </Link>
                        </p>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
