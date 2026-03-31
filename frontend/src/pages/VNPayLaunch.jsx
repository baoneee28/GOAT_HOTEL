import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

export default function VNPayLaunch() {
  const [searchParams] = useSearchParams();
  const launchedRef = useRef(false);
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Đang khởi tạo giao dịch và chuyển bạn tới cổng thanh toán VNPay...');

  useEffect(() => {
    if (launchedRef.current) return;
    launchedRef.current = true;

    const bookingId = searchParams.get('bookingId');
    if (!bookingId) {
      setStatus('error');
      setMessage('Thiếu mã booking để mở thanh toán VNPay.');
      return;
    }

    const launchPayment = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/vnpay/create-payment?bookingId=${bookingId}`, {
          withCredentials: true,
        });

        if (!res.data?.paymentUrl) {
          setStatus('error');
          setMessage(res.data?.message || 'Không lấy được liên kết thanh toán VNPay.');
          return;
        }

        window.location.replace(res.data.paymentUrl);
      } catch (error) {
        setStatus('error');
        setMessage(
          error.response?.data?.message
            || error.response?.data?.error
            || 'Không thể kết nối tới cổng VNPay lúc này.',
        );
      }
    };

    launchPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5efe5_0%,#fbf8f3_34%,#f9f5ee_100%)] px-6 py-24 text-on-surface">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-outline-variant/14 bg-white/88 p-10 text-center shadow-[0_30px_70px_-42px_rgba(15,23,42,0.24)]">
        {status === 'processing' ? (
          <>
            <div className="mx-auto h-14 w-14 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
            <p className="mt-8 font-label text-[0.68rem] uppercase tracking-[0.28em] text-secondary">VNPay Gateway</p>
            <h1 className="mt-4 font-headline text-4xl text-primary">Đang mở cổng thanh toán</h1>
            <p className="mt-5 text-sm leading-7 text-on-surface-variant">{message}</p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <p className="mt-8 font-label text-[0.68rem] uppercase tracking-[0.28em] text-rose-600">VNPay Gateway</p>
            <h1 className="mt-4 font-headline text-4xl text-primary">Không thể mở VNPay</h1>
            <p className="mt-5 text-sm leading-7 text-on-surface-variant">{message}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/history"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-label text-[0.64rem] uppercase tracking-[0.22em] text-on-primary transition-all hover:brightness-105"
              >
                Về lịch sử booking
              </Link>
              <Link
                to="/collections"
                className="inline-flex items-center justify-center rounded-full border border-outline-variant/16 bg-white px-6 py-3 font-label text-[0.64rem] uppercase tracking-[0.22em] text-primary transition-all hover:border-secondary/35 hover:text-secondary"
              >
                Quay lại chọn phòng
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
