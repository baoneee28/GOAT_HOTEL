import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API_BASE from '../config';

const DAY_MS = 24 * 60 * 60 * 1000;

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'active', label: 'Đang áp dụng' },
  { id: 'expiring', label: 'Sắp hết hạn' },
];

const COUPON_COPY_FALLBACKS = {
  WELCOME50: {
    name: 'Ưu đãi chào kỳ nghỉ mới',
    description: 'Giảm trực tiếp 50.000đ cho booking phòng tiêu chuẩn tại GOAT HOTEL.',
  },
  GOAT10: {
    name: 'Giảm phần trăm cho booking',
    description: 'Giảm 10% cho booking phòng khách sạn, phù hợp khi bạn chốt lịch lưu trú sớm.',
  },
  OFF50: {
    name: 'Ưu đãi demo booking',
    description: 'Mã giảm giá demo dành cho luồng đặt phòng khách sạn tại GOAT HOTEL.',
  },
  GOAT50: {
    name: 'Ưu đãi chào kỳ nghỉ mới',
    description: 'Giảm trực tiếp 50.000đ cho booking phòng tiêu chuẩn tại GOAT HOTEL.',
  },
  HOTEL10: {
    name: 'Giảm phần trăm toàn bộ booking',
    description: 'Giảm 10% cho booking phòng, phù hợp khi bạn chốt lịch lưu trú sớm.',
  },
  SUMMER100: {
    name: 'Ưu đãi mùa cao điểm',
    description: 'Giảm 100.000đ cho booking từ 1.000.000đ trong các kỳ nghỉ dài ngày.',
  },
  FIRSTBOOK: {
    name: 'Ưu đãi cho lần đặt đầu tiên',
    description: 'Mã dành cho khách mới muốn trải nghiệm lần đầu dịch vụ lưu trú tại GOAT HOTEL.',
  },
  DELUXE15: {
    name: 'Ưu đãi phòng Deluxe',
    description: 'Giảm 15% cho các booking phòng Deluxe, tối đa 200.000đ.',
  },
  FAMILY80: {
    name: 'Ưu đãi phòng Family',
    description: 'Giảm 80.000đ cho Family Room, phù hợp nhu cầu lưu trú gia đình hoặc nhóm nhỏ.',
  },
  WEEKDAY70: {
    name: 'Ưu đãi giữa tuần',
    description: 'Coupon demo đang tạm tắt để admin dễ minh họa trạng thái inactive.',
  },
  EXPIRED15: {
    name: 'Coupon đã hết hạn',
    description: 'Coupon demo để test case coupon hết hạn ở checkout và admin filter.',
  },
};

function normalizeCouponCode(value) {
  if (value == null) return '';
  return String(value).trim().toUpperCase();
}

function hasBrokenText(value) {
  if (!value) return false;
  return value.includes('?') || value.includes('�') || /Ã.|Â.|Æ.|Ð./.test(value);
}

function normalizeCouponCopy(coupon) {
  if (!coupon) return coupon;

  const normalizedCode = normalizeCouponCode(coupon.code);
  const fallback = COUPON_COPY_FALLBACKS[normalizedCode];
  const normalizedName = typeof coupon.name === 'string' ? coupon.name.trim() : '';
  const normalizedDescription = typeof coupon.description === 'string' ? coupon.description.trim() : '';
  if (!fallback) {
    return {
      ...coupon,
      code: normalizedCode || coupon.code,
      name: normalizedName || coupon.name,
      description: normalizedDescription || coupon.description,
    };
  }

  const shouldReplaceName = !normalizedName
    || hasBrokenText(normalizedName)
    || /^welcome\b/i.test(normalizedName)
    || /^coupon\b/i.test(normalizedName);
  const shouldReplaceDescription = !normalizedDescription
    || hasBrokenText(normalizedDescription)
    || /booking demo/i.test(normalizedDescription);

  return {
    ...coupon,
    code: normalizedCode || coupon.code,
    name: shouldReplaceName ? fallback.name : normalizedName,
    description: shouldReplaceDescription ? fallback.description : normalizedDescription,
  };
}

function parseDateValue(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    const parsed = new Date(year, (month || 1) - 1, day || 1, hour, minute, second);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function formatDate(value) {
  const parsed = parseDateValue(value);
  if (!parsed) return 'Chưa cập nhật';

  return parsed.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateRange(startDate, endDate) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function getDaysUntil(value) {
  const parsed = parseDateValue(value);
  if (!parsed) return Number.POSITIVE_INFINITY;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(parsed);
  target.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

function isExpired(coupon) {
  return parseDateValue(coupon.endDate)?.getTime() < Date.now();
}

function isUsageExhausted(coupon) {
  const usageLimit = Number(coupon.usageLimit || 0);
  const usedCount = Number(coupon.usedCount || 0);
  return usageLimit > 0 && usedCount >= usageLimit;
}

function isScheduled(coupon) {
  const startDate = parseDateValue(coupon.startDate);
  return Boolean(coupon.isActive) && Boolean(startDate) && startDate.getTime() > Date.now();
}

function isActiveCoupon(coupon) {
  return Boolean(coupon.isActive) && !isScheduled(coupon) && !isExpired(coupon) && !isUsageExhausted(coupon);
}

function isExpiringSoon(coupon) {
  return isActiveCoupon(coupon) && getDaysUntil(coupon.endDate) <= 7;
}

function getCouponStatus(coupon) {
  if (!coupon.isActive) {
    return {
      label: 'Tạm tắt',
      className: 'border border-slate-300/18 bg-slate-200/10 text-slate-200',
    };
  }
  if (isUsageExhausted(coupon)) {
    return {
      label: 'Hết lượt',
      className: 'border border-rose-400/24 bg-rose-400/10 text-rose-200',
    };
  }
  if (isExpired(coupon)) {
    return {
      label: 'Hết hạn',
      className: 'border border-rose-400/24 bg-rose-400/10 text-rose-200',
    };
  }
  if (isScheduled(coupon)) {
    return {
      label: 'Chưa bắt đầu',
      className: 'border border-sky-400/24 bg-sky-400/10 text-sky-200',
    };
  }
  if (isExpiringSoon(coupon)) {
    return {
      label: 'Sắp hết hạn',
      className: 'border border-amber-400/24 bg-amber-400/10 text-amber-200',
    };
  }
  return {
    label: 'Đang áp dụng',
    className: 'border border-emerald-400/24 bg-emerald-400/10 text-emerald-200',
  };
}

function getCouponBenefit(coupon) {
  if (coupon.discountType === 'PERCENT') {
    const maxText = coupon.maxDiscountAmount ? `, tối đa ${formatCurrency(coupon.maxDiscountAmount)}đ` : '';
    return `Giảm ${coupon.discountValue}%${maxText}`;
  }
  return `Giảm ${formatCurrency(coupon.discountValue)}đ`;
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchCoupons = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await axios.get(`${API_BASE}/api/coupons`, {
          params: { status: 'all' },
          withCredentials: true,
        });

        if (isMounted) {
          const normalizedCoupons = Array.isArray(res.data?.coupons)
            ? res.data.coupons.map(normalizeCouponCopy)
            : [];
          setCoupons(normalizedCoupons);
        }
      } catch (fetchError) {
        console.error('Fetch coupons failed:', fetchError);
        if (isMounted) {
          setError('Không thể tải danh sách mã giảm giá lúc này.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCoupons();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCoupons = coupons.filter((coupon) => {
    if (activeFilter === 'active') return isActiveCoupon(coupon);
    if (activeFilter === 'expiring') return isExpiringSoon(coupon);
    return true;
  });

  const activeCount = coupons.filter(isActiveCoupon).length;
  const expiringCount = coupons.filter(isExpiringSoon).length;

  const handleCopyCode = async (code) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      }

      setCopiedCode(code);
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: `Đã sao chép mã ${code}`,
          timer: 1200,
          showConfirmButton: false,
        });
      }

      window.setTimeout(() => {
        setCopiedCode((current) => (current === code ? '' : current));
      }, 1800);
    } catch (copyError) {
      console.error('Copy coupon failed:', copyError);
      if (window.Swal) {
        window.Swal.fire('Không thể sao chép', 'Vui lòng sao chép thủ công mã giảm giá.', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5efe6_0%,#fbf8f3_28%,#f8f4ed_100%)] font-body text-on-surface">
      <style>{`
        .coupon-hero-shell {
          background:
            linear-gradient(180deg, rgba(5, 15, 30, 0.52) 0%, rgba(5, 15, 30, 0.78) 100%),
            linear-gradient(90deg, rgba(5, 15, 30, 0.86) 0%, rgba(5, 15, 30, 0.46) 48%, rgba(5, 15, 30, 0.72) 100%);
        }
        .coupon-panel {
          background: linear-gradient(180deg, rgba(255,252,247,0.94) 0%, rgba(249,244,237,0.98) 100%);
          border: 1px solid rgba(120, 90, 25, 0.14);
          box-shadow: 0 28px 70px -46px rgba(40, 28, 12, 0.28);
          backdrop-filter: blur(18px);
        }
        .coupon-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(249,245,239,0.96) 100%);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 24px 60px -44px rgba(15, 23, 42, 0.2);
        }
      `}</style>

      <section className="coupon-hero-shell relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: `url(${API_BASE}/images/home/hero_slider_2.jpg)` }}
        />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-28 sm:px-8 lg:px-10 lg:pb-28 lg:pt-32">
          <div className="max-w-3xl">
            <p className="font-label text-[0.72rem] uppercase tracking-[0.34em] text-secondary/90">
              GOAT HOTEL Booking Benefits
            </p>
            <h1 className="mt-7 font-headline text-4xl leading-tight text-white sm:text-5xl lg:text-[3.75rem]">
              Mã giảm giá đặt phòng
            </h1>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto mt-12 max-w-7xl px-6 pb-24 sm:px-8 lg:mt-16 lg:px-10">
        <section className="coupon-panel rounded-[32px] p-6 sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center">
            <div>
              <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary">
                Chỉ dành cho booking phòng
              </p>
              <h2 className="mt-3 font-headline text-[2rem] leading-tight text-primary">
                Ưu đãi gọn, đúng trọng tâm, dùng được ở checkout
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-outline-variant/14 bg-white/75 p-4">
                <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-on-surface-variant">Tổng mã</p>
                <p className="mt-3 font-headline text-3xl text-primary">{coupons.length}</p>
              </div>
              <div className="rounded-[24px] border border-outline-variant/14 bg-white/75 p-4">
                <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-on-surface-variant">Đang áp dụng</p>
                <p className="mt-3 font-headline text-3xl text-primary">{activeCount}</p>
              </div>
              <div className="rounded-[24px] border border-outline-variant/14 bg-white/75 p-4">
                <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-on-surface-variant">Sắp hết hạn</p>
                <p className="mt-3 font-headline text-3xl text-primary">{expiringCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {FILTERS.map((filter) => {
              const isSelected = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-full px-4 py-3 font-label text-[0.64rem] uppercase tracking-[0.22em] transition-all ${
                    isSelected
                      ? 'bg-secondary text-slate-950 shadow-[0_14px_30px_-18px_rgba(212,175,55,0.8)]'
                      : 'border border-outline-variant/20 bg-white/70 text-primary/72 hover:border-secondary/35 hover:text-secondary'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_320px]">
          <div className="space-y-5">
            {loading ? (
              <div className="coupon-panel rounded-[28px] px-6 py-16 text-center">
                <h3 className="font-headline text-3xl text-primary">Đang tải mã giảm giá</h3>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-on-surface-variant">
                  Hệ thống đang lấy danh sách coupon cho booking phòng.
                </p>
              </div>
            ) : error ? (
              <div className="coupon-panel rounded-[28px] px-6 py-16 text-center">
                <h3 className="font-headline text-3xl text-primary">Không tải được dữ liệu</h3>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-on-surface-variant">
                  {error}
                </p>
              </div>
            ) : filteredCoupons.length > 0 ? filteredCoupons.map((coupon) => {
              const status = getCouponStatus(coupon);
              return (
                <article key={coupon.id} className="coupon-card overflow-hidden rounded-[28px] p-6 sm:p-7">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full px-4 py-2 font-label text-[0.6rem] uppercase tracking-[0.22em] ${status.className}`}>
                          {status.label}
                        </span>
                        <span className="rounded-full border border-outline-variant/16 bg-white/70 px-3 py-2 font-label text-[0.56rem] uppercase tracking-[0.22em] text-primary/54">
                          {getCouponBenefit(coupon)}
                        </span>
                      </div>

                      <h3 className="mt-5 font-headline text-[2rem] leading-tight text-primary">
                        {coupon.name}
                      </h3>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
                        {coupon.description || 'Ưu đãi dành riêng cho đặt phòng khách sạn tại GOAT HOTEL.'}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-outline-variant/12 bg-[linear-gradient(180deg,rgba(8,19,37,0.96)_0%,rgba(15,31,56,0.92)_100%)] px-5 py-4 text-white lg:min-w-[220px]">
                      <p className="font-label text-[0.56rem] uppercase tracking-[0.22em] text-secondary/80">
                        Coupon code
                      </p>
                      <p className="mt-3 font-headline text-3xl tracking-[0.08em] text-secondary">
                        {coupon.code}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 rounded-[24px] border border-outline-variant/12 bg-white/76 p-5 md:grid-cols-3">
                    <div>
                      <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-on-surface-variant">
                        Đơn tối thiểu
                      </p>
                      <p className="mt-2 font-headline text-xl text-primary">
                        {formatCurrency(coupon.minOrderValue)}đ
                      </p>
                    </div>
                    <div>
                      <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-on-surface-variant">
                        Thời gian áp dụng
                      </p>
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                        {formatDateRange(coupon.startDate, coupon.endDate)}
                      </p>
                    </div>
                    <div>
                      <p className="font-label text-[0.58rem] uppercase tracking-[0.22em] text-on-surface-variant">
                        Lượt sử dụng
                      </p>
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                        {coupon.usedCount || 0} / {coupon.usageLimit || 'Không giới hạn'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm leading-7 text-on-surface-variant">
                      Hệ thống vẫn sẽ kiểm tra lại điều kiện mã ở bước checkout trước khi tạo booking.
                    </p>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 font-label text-[0.64rem] uppercase tracking-[0.22em] text-on-primary transition-all hover:brightness-105"
                    >
                      {copiedCode === coupon.code ? 'Đã sao chép' : 'Sao chép mã'}
                    </button>
                  </div>
                </article>
              );
            }) : (
              <div className="coupon-panel rounded-[28px] px-6 py-16 text-center">
                <h3 className="font-headline text-3xl text-primary">Không có mã phù hợp</h3>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-on-surface-variant">
                  Bộ lọc hiện tại chưa có coupon tương ứng. Bạn có thể quay lại “Tất cả” để xem toàn bộ ưu đãi
                  dành cho booking phòng tại GOAT HOTEL.
                </p>
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <section className="coupon-panel rounded-[28px] p-6">
              <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary">
                Cách dùng nhanh
              </p>
              <div className="mt-5 space-y-4">
                {[
                  'Xem điều kiện và thời gian áp dụng của coupon phù hợp.',
                  'Sao chép mã bạn muốn dùng cho booking phòng.',
                  'Dán mã vào bước checkout và bấm áp dụng.',
                ].map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-[0.72rem] font-bold text-slate-950">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-sm leading-6 text-on-surface-variant">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="coupon-panel rounded-[28px] p-6">
              <p className="font-label text-[0.64rem] uppercase tracking-[0.28em] text-secondary">
                Đi tới booking
              </p>
              <h3 className="mt-3 font-headline text-2xl text-primary">
                Chọn phòng và áp dụng mã ngay
              </h3>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                Sau khi chọn phòng và ngày lưu trú, bạn có thể nhập coupon ở bước booking confirmation để
                backend tính lại discount amount và final amount.
              </p>
              <Link
                to="/collections"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-secondary px-5 py-3 font-label text-[0.64rem] uppercase tracking-[0.22em] text-slate-950 transition-all hover:brightness-105"
              >
                Đi tới đặt phòng
              </Link>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
