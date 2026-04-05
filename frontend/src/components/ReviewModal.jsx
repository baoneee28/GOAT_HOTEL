import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '24px' }}>
          <h3 className="text-xl font-bold font-headline mb-1 text-slate-800">Đánh giá Trải nghiệm</h3>
          <p className="text-sm text-slate-500 mb-6 font-label">{notification.message}</p>
          
          <form onSubmit={handleSubmit}>
            {/* Comment textarea - above */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">Bình luận của bạn (Không bắt buộc)</label>
              <textarea
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                rows="4"
                placeholder="Khách sạn GOAT rất tuyệt vời..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {/* Star rating - below */}
            <div className="mb-5">
              <p className="text-sm font-bold text-slate-700 mb-3 text-center">Đánh giá của bạn</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', lineHeight: 1 }}
                    title={['', 'Tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Tuyệt vời'][star]}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: '38px',
                        display: 'block',
                        color: star <= rating ? '#f59e0b' : '#cbd5e1',
                        fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0",
                        pointerEvents: 'none',
                        userSelect: 'none',
                        transition: 'color 0.15s',
                      }}
                    >star</span>
                  </button>
                ))}
              </div>
              <p className="text-center text-xs font-semibold mt-2" style={{ color: '#f59e0b', minHeight: '18px' }}>
                {['', '😞 Tệ', '😐 Không tốt', '🙂 Bình thường', '😊 Tốt', '🤩 Tuyệt vời!'][rating]}
              </p>
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
    </div>,
    document.body
  );
}
