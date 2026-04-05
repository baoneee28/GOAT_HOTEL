import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE from '../config';
import ReviewModal from './ReviewModal';

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/notifications/my`, { withCredentials: true });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Lỗi khi tải thông báo:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Optional: interval to poll for new notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    // Mark as read locally and backend
    if (!notification.isRead) {
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      try {
        await axios.post(`${API_BASE}/api/notifications/${notification.id}/read`, {}, { withCredentials: true });
      } catch (err) {
        console.error(err);
      }
    }

    if (notification.type === 'REVIEW_PROMPT') {
      setSelectedNotification(notification);
      setReviewModalOpen(true);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.post(`${API_BASE}/api/notifications/read-all`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center justify-center w-[38px] h-[38px] rounded-full bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/20 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-white/90 text-[20px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-lg border border-slate-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-[999] flex flex-col" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '400px' }}>
            <div className="px-4 py-3 border-b flex justify-between items-center" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <span className="text-white font-bold font-headline">Thông báo</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-secondary hover:text-white transition-colors"
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleNotificationClick(note)}
                    className={`w-full text-left p-4 border-b flex gap-3 transition-colors ${!note.isRead ? 'bg-primary/5' : 'bg-transparent hover:bg-white/5'}`}
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <span className={`material-symbols-outlined rounded-full p-1.5 text-sm ${note.type === 'REVIEW_PROMPT' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {note.type === 'REVIEW_PROMPT' ? 'reviews' : 'notifications'}
                      </span>
                    </div>
                    <div>
                      <h4 className={`text-sm ${!note.isRead ? 'text-white font-bold' : 'text-slate-300 font-medium'}`}>
                        {note.title}
                      </h4>
                      <p className={`text-xs mt-1 ${!note.isRead ? 'text-slate-300' : 'text-slate-500'} line-clamp-2`}>
                        {note.message}
                      </p>
                    </div>
                    {!note.isRead && (
                      <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0 mt-2"></div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">notifications_off</span>
                  <p>Bạn chưa có thông báo nào.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ReviewModal
        isOpen={reviewModalOpen}
        notification={selectedNotification}
        onClose={() => setReviewModalOpen(false)}
        onSuccess={fetchNotifications}
      />
    </>
  );
}
