import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE from '../config';
const Swal = window.Swal;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP + mật khẩu mới
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/forgot-password-request`, { email });
      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'Đã gửi!', text: res.data.message, confirmButtonColor: '#c9a96e' });
        setStep(2);
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Đã có lỗi xảy ra.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: 'warning', title: 'Mật khẩu không khớp', text: 'Vui lòng nhập lại mật khẩu xác nhận.' });
      return;
    }
    if (newPassword.length < 6) {
      Swal.fire({ icon: 'warning', title: 'Mật khẩu quá ngắn', text: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/verify-reset`, { email, otp, newPassword });
      if (res.data.success) {
        await Swal.fire({ icon: 'success', title: 'Thành công!', text: res.data.message, confirmButtonColor: '#c9a96e' });
        navigate('/');
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Outfit', sans-serif",
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: '-200px', right: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,110,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-200px', left: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#c9a96e', letterSpacing: '0.1em', marginBottom: '4px' }}>GOAT HOTEL</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Luxury · Comfort · Excellence</div>
          </Link>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '40px 36px' }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#c9a96e', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>1</div>
            <div style={{ flex: 1, height: '2px', background: step >= 2 ? '#c9a96e' : 'rgba(255,255,255,0.1)', transition: 'background 0.4s', borderRadius: '1px' }} />
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step >= 2 ? '#c9a96e' : 'rgba(255,255,255,0.1)', color: step >= 2 ? '#0f172a' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0, transition: 'all 0.4s' }}>2</div>
          </div>

          {step === 1 ? (
            <>
              <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Quên mật khẩu?</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '28px' }}>Nhập email đã đăng ký — chúng tôi sẽ gửi mã xác nhận (OTP) tới hộp thư của bạn.</p>

              <form onSubmit={handleRequestOtp}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Địa chỉ Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #c9a96e, #d4b483)', color: '#0f172a', fontWeight: 800, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, letterSpacing: '0.05em' }}
                >
                  {loading ? 'ĐANG GỬI...' : 'GỬI MÃ XÁC NHẬN →'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Đặt lại mật khẩu</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '4px' }}>Mã OTP đã được gửi tới: <span style={{ color: '#c9a96e', fontWeight: 600 }}>{email}</span></p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginBottom: '28px' }}>⏱ Mã có hiệu lực trong 10 phút</p>

              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mã OTP (6 chữ số)</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    placeholder="_ _ _ _ _ _"
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(201,169,110,0.3)', background: 'rgba(201,169,110,0.05)', color: '#c9a96e', fontSize: '24px', outline: 'none', boxSizing: 'border-box', letterSpacing: '8px', textAlign: 'center', fontWeight: 800, fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ marginBottom: '16px', position: 'relative' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mật khẩu mới</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    style={{ width: '100%', padding: '14px 48px 14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', bottom: '14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Xác nhận mật khẩu</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${confirmPassword && newPassword !== confirmPassword ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`, background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>Mật khẩu không khớp</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || (confirmPassword && newPassword !== confirmPassword)}
                  style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #c9a96e, #d4b483)', color: '#0f172a', fontWeight: 800, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, letterSpacing: '0.05em', marginBottom: '12px' }}
                >
                  {loading ? 'ĐANG XỬ LÝ...' : 'ĐẶT LẠI MẬT KHẨU'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
                >
                  ← Gửi lại mã khác
                </button>
              </form>
            </>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '24px', paddingTop: '20px', textAlign: 'center' }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none' }}>
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
