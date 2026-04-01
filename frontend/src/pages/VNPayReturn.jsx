import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

export default function VNPayReturn() {
  const [searchParams] = useSearchParams();
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoState, setDemoState] = useState(null);

  const bookingId = searchParams.get('bookingId');
  const initialStatus = searchParams.get('status') === 'success' ? 'success' : 'error';
  const status = demoState?.status || initialStatus;
  const message = demoState?.message
    || searchParams.get('message')
    || (status === 'success' ? 'Thanh toán VNPay thành công.' : 'Thanh toán VNPay chưa hoàn tất.');

  const handleDemoSuccess = async () => {
    if (!bookingId) return;

    try {
      setDemoSubmitting(true);
      const res = await axios.post(`${API_BASE}/api/vnpay/demo-success`, {
        bookingId,
      }, {
        withCredentials: true,
      });

      if (res.data?.success) {
        setDemoState({
          status: 'success',
          message: res.data?.message || 'Đã mô phỏng thanh toán thành công cho booking này.',
        });
        return;
      }

      setDemoState({
        status: 'error',
        message: res.data?.message || 'Không thể mô phỏng thanh toán thành công.',
      });
    } catch (error) {
      setDemoState({
        status: 'error',
        message: error.response?.data?.message || 'Không thể xác nhận thanh toán demo lúc này.',
      });
    } finally {
      setDemoSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5efe5_0%,#fbf8f3_34%,#f9f5ee_100%)] px-6 py-24 text-on-surface">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-outline-variant/14 bg-white/88 p-10 text-center shadow-[0_30px_70px_-42px_rgba(15,23,42,0.24)]">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border ${
          status === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
            : 'border-rose-200 bg-rose-50 text-rose-600'
        }`}>
          <span className="material-symbols-outlined text-3xl">
            {status === 'success' ? 'check' : 'close'}
          </span>
        </div>

        <p className={`mt-8 font-label text-[0.68rem] uppercase tracking-[0.28em] ${
          status === 'success' ? 'text-emerald-600' : 'text-rose-600'
        }`}>
          VNPay Demo Result
        </p>
        <h1 className="mt-4 font-headline text-4xl text-primary">
          {status === 'success' ? 'Thanh toán thành công' : 'Thanh toán chưa hoàn tất'}
        </h1>
        <p className="mt-5 text-sm leading-7 text-on-surface-variant">{message}</p>

        {status !== 'success' && bookingId && (
          <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-left text-sm leading-7 text-amber-900">
            Booking này chỉ được giữ chỗ tạm thời trong một khoảng thời gian ngắn. Nếu bạn cần demo case thành công để bảo vệ đồ án, hãy xác nhận lại khi booking vẫn còn hiệu lực hoặc tạo booking mới khi đơn cũ đã hết hạn.
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {bookingId && (
            <Link
              to={`/booking/${bookingId}`}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-label text-[0.64rem] uppercase tracking-[0.22em] text-on-primary transition-all hover:brightness-105"
            >
              Xem chi tiết đơn
            </Link>
          )}
          {status !== 'success' && bookingId && (
            <button
              type="button"
              onClick={handleDemoSuccess}
              disabled={demoSubmitting}
              className="inline-flex items-center justify-center rounded-full border border-emerald-500 bg-emerald-50 px-6 py-3 font-label text-[0.64rem] uppercase tracking-[0.22em] text-emerald-700 transition-all hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {demoSubmitting ? 'ĐANG XÁC NHẬN DEMO...' : 'THANH TOÁN THÀNH CÔNG (DEMO)'}
            </button>
          )}
          <Link
            to="/history"
            className="inline-flex items-center justify-center rounded-full border border-outline-variant/16 bg-white px-6 py-3 font-label text-[0.64rem] uppercase tracking-[0.22em] text-primary transition-all hover:border-secondary/35 hover:text-secondary"
          >
            Về lịch sử booking
          </Link>
        </div>
      </div>
    </div>
  );
}
