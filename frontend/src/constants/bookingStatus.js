export const STATUS_META = {
  pending: {
    label: 'Chờ xử lý',
    summary: 'Đơn đặt phòng đã được tiếp nhận và đang chờ khách sạn xác nhận.',
    badgeClass: 'border border-amber-400/24 bg-amber-500/10 text-amber-100',
    chipClass: 'border border-amber-400/22 bg-amber-500/8 text-amber-100',
    accentClass: 'bg-amber-400',
  },
  confirmed: {
    label: 'Đã xác nhận',
    summary: 'Kỳ lưu trú đã được xác nhận và sẵn sàng cho ngày nhận phòng.',
    badgeClass: 'border border-emerald-400/24 bg-emerald-500/10 text-emerald-100',
    chipClass: 'border border-emerald-400/22 bg-emerald-500/8 text-emerald-100',
    accentClass: 'bg-emerald-400',
  },
  completed: {
    label: 'Hoàn thành',
    summary: 'Kỳ lưu trú đã hoàn tất và được lưu lại trong hồ sơ thành viên của bạn.',
    badgeClass: 'border border-white/14 bg-white/8 text-white/90',
    chipClass: 'border border-white/14 bg-white/8 text-white/82',
    accentClass: 'bg-white',
  },
  cancelled: {
    label: 'Đã hủy',
    summary: 'Đơn đặt phòng không còn hiệu lực và quy trình lưu trú đã dừng lại.',
    badgeClass: 'border border-rose-400/22 bg-rose-500/10 text-rose-100',
    chipClass: 'border border-rose-400/22 bg-rose-500/8 text-rose-100',
    accentClass: 'bg-rose-400',
  },
  expired: {
    label: 'Hết hạn giữ chỗ',
    summary: 'Booking giữ chỗ tạm thời đã hết hiệu lực vì không được xử lý tiếp trong thời gian cho phép.',
    badgeClass: 'border border-slate-300/18 bg-slate-200/12 text-slate-100',
    chipClass: 'border border-slate-300/18 bg-slate-200/10 text-slate-100',
    accentClass: 'bg-slate-300',
  },
};

export const PAYMENT_META = {
  unpaid: {
    label: 'Chưa thanh toán',
    summary: 'Booking mới được ghi nhận và chưa có giao dịch thanh toán.',
    badgeClass: 'border border-amber-300/24 bg-amber-100/80 text-amber-800',
  },
  pending_payment: {
    label: 'Chờ thanh toán',
    summary: 'Bạn đã mở luồng VNPay nhưng giao dịch chưa được xác nhận thành công.',
    badgeClass: 'border border-sky-300/24 bg-sky-100/80 text-sky-800',
  },
  deposit_paid: {
    label: 'Đã đặt cọc',
    summary: 'Bạn đã thanh toán khoản đặt cọc và booking đang chờ thanh toán phần còn lại.',
    badgeClass: 'border border-violet-300/24 bg-violet-100/80 text-violet-800',
  },
  paid: {
    label: 'Đã thanh toán',
    summary: 'Booking đã được đánh dấu thanh toán thành công.',
    badgeClass: 'border border-emerald-300/24 bg-emerald-100/80 text-emerald-800',
  },
  failed: {
    label: 'Thanh toán lỗi',
    summary: 'Lần thanh toán gần nhất không hoàn tất, booking vẫn chưa được ghi nhận đã thanh toán.',
    badgeClass: 'border border-rose-300/24 bg-rose-100/80 text-rose-800',
  },
};

export const TIMELINE_STEPS = [
  {
    key: 'pending',
    label: 'Chờ xử lý',
    description: 'Yêu cầu đặt phòng đã được tiếp nhận',
  },
  {
    key: 'confirmed',
    label: 'Đã xác nhận',
    description: 'Khách sạn xác nhận lịch lưu trú',
  },
  {
    key: 'completed',
    label: 'Hoàn thành',
    description: 'Kỳ lưu trú kết thúc trọn vẹn',
  },
  {
    key: 'cancelled',
    label: 'Đã hủy',
    description: 'Đơn không còn hiệu lực',
  },
  {
    key: 'expired',
    label: 'Hết hạn giữ chỗ',
    description: 'Booking giữ chỗ tạm thời đã hết hiệu lực',
  },
];

const FLOW_INDEX = {
  pending: 0,
  confirmed: 1,
  completed: 2,
};

export function getTimelineState(stepKey, currentStatus) {
  if (currentStatus === 'cancelled' || currentStatus === 'expired') {
    if (stepKey === 'pending') return 'complete';
    if (stepKey === currentStatus) return 'current';
    return 'muted';
  }

  if (stepKey === 'cancelled' || stepKey === 'expired') return 'muted';

  const currentIndex = FLOW_INDEX[currentStatus] ?? 0;
  const stepIndex = FLOW_INDEX[stepKey] ?? 0;

  if (stepIndex < currentIndex) return 'complete';
  if (stepIndex === currentIndex) return 'current';
  return 'muted';
}
