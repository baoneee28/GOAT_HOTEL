import React, { useState } from 'react';
import axios from 'axios';
import API_BASE from '../config';
const Swal = window.Swal;

export default function ReviewModal({ notification, isOpen, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !notification) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/reviews`,
        {
          bookingId: notification.relatedId,
          rating,
          comment,
        },
        { withCredentials: true }
      );

      // Mark notification as read
      await axios.post(`${API_BASE}/api/notifications/${notification.id}/read`, {}, { withCredentials: true });

      const reward = res.data.rewardCoupon;
      if (reward) {
        Swal?.fire({
          icon: 'success',
          title: 'Cảm ơn bạn đã đánh giá!',
          text: `Bạn đã được tặng Voucher: ${reward.name} (${reward.code}). Bạn có thể xem trong mục Mã giảm giá!`,
        });
      } else {
        Swal?.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Cảm ơn bạn đã để lại đánh giá!',
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Không thể gửi đánh giá, vui lòng thử lại sau.';
      Swal?.fire('Lỗi', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="p-6">
          <h3 className="text-xl font-bold font-headline mb-1 text-slate-800">Đánh giá Trải nghiệm</h3>
          <p className="text-sm text-slate-500 mb-6 font-label">{notification.message}</p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`material-symbols-outlined text-4xl transition-all ${
                    star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                  }`}
                  style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Bình luận của bạn (Không bắt buộc)</label>
              <textarea
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                rows="4"
                placeholder="Khách sạn GOAT rất tuyệt vời..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 transition-all font-label"
              >
                HỦY
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all font-label"
              >
                {submitting ? 'ĐANG GỬI...' : 'GỬI ĐÁNH GIÁ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
