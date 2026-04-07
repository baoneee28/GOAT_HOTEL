import React from 'react';
import { Link } from 'react-router-dom';

export default function OrderDetailErrorState({ message, onRetry }) {
  return (
    <div className="min-h-[70vh] bg-[linear-gradient(180deg,#f6f0e5_0%,#faf7f2_100%)] flex items-center justify-center px-6">
      <div className="max-w-xl rounded-[28px] border border-outline-variant/15 bg-white/90 px-8 py-12 text-center shadow-[0_26px_60px_-42px_rgba(15,23,42,0.3)]">
        <p className="font-label text-[0.72rem] uppercase tracking-[0.3em] text-secondary">Booking detail</p>
        <h1 className="mt-5 font-headline text-3xl text-primary">Không thể tải chi tiết đặt phòng</h1>
        <p className="mt-4 text-sm leading-7 text-on-surface-variant">{message}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-label text-[0.68rem] uppercase tracking-[0.24em] text-on-primary transition-all hover:brightness-105"
          >
            Thử tải lại
          </button>
          <Link
            to="/history"
            className="inline-flex items-center gap-2 rounded-full border border-outline-variant/16 bg-white px-6 py-3 font-label text-[0.68rem] uppercase tracking-[0.24em] text-primary transition-all hover:border-secondary/35 hover:text-secondary"
          >
            Về lịch sử
          </Link>
        </div>
      </div>
    </div>
  );
}
