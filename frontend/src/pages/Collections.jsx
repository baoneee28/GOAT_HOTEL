import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import bookingImage from '../assets/booking_images_1.jpg';

const getToday = () => new Date().toISOString().split('T')[0];
const getTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export default function Collections() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [shakeField, setShakeField] = useState('');
  const roomListRef = useRef(null);

  const [navVisible, setNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [checkIn, setCheckIn] = useState(getToday);
  const [checkOut, setCheckOut] = useState(getTomorrow);

  const showToast = (message, icon = 'error') => {
    setToast({ message, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const triggerShake = (field) => {
    setShakeField(field);
    setTimeout(() => setShakeField(''), 600);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateString;
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    axios.get('http://localhost:8080/api/room-types', { withCredentials: true })
      .then(res => { setRooms(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSearch = () => {
    const today = getToday();
    if (checkIn < today) {
      triggerShake('checkIn');
      showToast('Ngày nhận phòng không thể ở trong quá khứ.', 'event_busy');
      return;
    }
    if (checkOut <= checkIn) {
      triggerShake('checkOut');
      showToast('Ngày trả phòng phải sau ngày nhận phòng.', 'calendar_today');
      return;
    }
    roomListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // TODO: gọi API lọc phòng trống theo checkIn/checkOut
  };

  const capacityIcon = (cap) => cap >= 4 ? 'group' : 'person';

  const CAPACITY_OPTIONS = [
    { label: '1 Người', defaultChecked: false },
    { label: '2 Người', defaultChecked: true },
    { label: '4 Người', defaultChecked: false },
  ];

  const AMENITY_OPTIONS = [
    { label: 'Máy lạnh', defaultChecked: true },
    { label: 'Máy sấy tóc', defaultChecked: false },
    { label: 'Tivi thông minh', defaultChecked: true },
    { label: 'Tủ lạnh mini', defaultChecked: false },
  ];

  return (
    <>
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px; width: 12px;
          border-radius: 50%;
          background: #775a19;
          cursor: pointer;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-6px); }
          30%      { transform: translateX(6px); }
          45%      { transform: translateX(-5px); }
          60%      { transform: translateX(5px); }
          75%      { transform: translateX(-3px); }
          90%      { transform: translateX(3px); }
        }
        .field-shake { animation: shake 0.5s ease; }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .toast-enter { animation: toast-in 0.25s ease forwards; }
      `}</style>

      {/* Toast — góc trên phải */}
      {toast && (
        <div className="toast-enter fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-slate-900 border border-red-500/40 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-black/40 max-w-sm">
          <span className="material-symbols-outlined text-red-400 text-xl flex-shrink-0">{toast.icon}</span>
          <p className="text-sm font-medium leading-snug">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-auto text-slate-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Hero */}
      <header className="pt-32 pb-16 px-12 bg-cover bg-center relative" style={{ backgroundImage: `url(${bookingImage})` }}>
        <div className="absolute inset-0 bg-slate-900/60"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="font-headline text-4xl text-white mb-8 tracking-tight drop-shadow-md">Đặt phòng ngay</h1>
        </div>
      </header>

      {/* Sticky Search Bar */}
      <div className={`sticky z-40 w-full px-12 -mt-10 transition-all duration-500 ${navVisible ? 'top-[80px]' : 'top-0'}`}>
        <div className="max-w-[1050px] mx-auto bg-surface-container-lowest p-2 flex flex-col md:flex-row items-stretch gap-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] rounded-[40px] md:rounded-full">

          {/* Ngày nhận phòng */}
          <div
            className={`flex-1 px-8 py-2.5 flex flex-col justify-center hover:bg-black/5 transition-colors rounded-[32px] md:rounded-full relative group cursor-pointer ${shakeField === 'checkIn' ? 'field-shake ring-2 ring-red-400/60 ring-inset' : ''}`}
            onClick={(e) => { const i = e.currentTarget.querySelector('input'); if (i && i.showPicker) i.showPicker(); }}
          >
            <label className="text-[10px] uppercase tracking-[0.2em] text-outline font-bold mb-1 group-hover:text-secondary transition-colors cursor-pointer">Ngày nhận phòng</label>
            <div className="flex justify-between items-center">
              <span className="text-primary font-headline text-lg tracking-tight pointer-events-none">{formatDate(checkIn)}</span>
              <div className="relative w-10 h-10 flex items-center justify-center bg-surface-container-low rounded-full group-hover:bg-secondary/10 transition-colors">
                <span className="material-symbols-outlined text-secondary text-xl pointer-events-none">calendar_month</span>
                <input
                  lang="en-GB" className="absolute inset-0 opacity-0 cursor-pointer" type="date"
                  value={checkIn} min={getToday()}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (checkOut <= e.target.value) {
                      const next = new Date(e.target.value);
                      next.setDate(next.getDate() + 1);
                      setCheckOut(next.toISOString().split('T')[0]);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="w-px bg-outline-variant/30 hidden md:block my-4 mx-2"></div>

          {/* Ngày trả phòng */}
          <div
            className={`flex-1 px-8 py-2.5 flex flex-col justify-center hover:bg-black/5 transition-colors rounded-[32px] md:rounded-full relative group cursor-pointer ${shakeField === 'checkOut' ? 'field-shake ring-2 ring-red-400/60 ring-inset' : ''}`}
            onClick={(e) => { const i = e.currentTarget.querySelector('input'); if (i && i.showPicker) i.showPicker(); }}
          >
            <label className="text-[10px] uppercase tracking-[0.2em] text-outline font-bold mb-1 group-hover:text-secondary transition-colors cursor-pointer">Ngày trả phòng</label>
            <div className="flex justify-between items-center">
              <span className="text-primary font-headline text-lg tracking-tight pointer-events-none">{formatDate(checkOut)}</span>
              <div className="relative w-10 h-10 flex items-center justify-center bg-surface-container-low rounded-full group-hover:bg-secondary/10 transition-colors">
                <span className="material-symbols-outlined text-secondary text-xl pointer-events-none">calendar_month</span>
                <input
                  lang="en-GB" className="absolute inset-0 opacity-0 cursor-pointer" type="date"
                  value={checkOut} min={checkIn || getToday()}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            className="bg-secondary text-white px-8 py-3 font-bold tracking-widest uppercase text-xs hover:bg-[#5d4201] transition-all flex items-center justify-center gap-3 rounded-full md:ml-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 group"
            onClick={handleSearch}
          >
            TÌM PHÒNG
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-12 pt-16 pb-20 flex flex-col md:flex-row gap-10 flex-grow">

        {/* ── FILTER SIDEBAR ── */}
        <aside className={`w-full md:w-64 flex-shrink-0 sticky h-fit transition-all duration-500 ${navVisible ? 'top-[200px]' : 'top-[120px]'}`}>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)] flex flex-col" style={{maxHeight: 'calc(100vh - 220px)'}}>

            {/* Card Header */}
            <div className="px-5 py-4 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-low/40">
              <div>
                <h2 className="font-headline text-base text-primary leading-tight">Lọc phòng</h2>
                <p className="text-[9px] uppercase tracking-[0.25em] text-outline mt-0.5">Tiêu chí tìm kiếm</p>
              </div>
              <span className="material-symbols-outlined text-secondary text-base">tune</span>
            </div>

            {/* Filter Body — scrollable khi viewport thấp */}
            <div className="px-5 py-5 flex flex-col gap-5 overflow-y-auto flex-1">

              {/* Price */}
              <section>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[9px] font-bold uppercase tracking-widest text-secondary">Mức giá</h3>
                  <span className="text-[9px] font-semibold text-primary px-2 py-0.5 rounded-full bg-secondary/10">≤ 15.000.000đ</span>
                </div>
                <input className="w-full h-1 bg-surface-container-highest appearance-none rounded-full accent-secondary cursor-pointer" max="50000000" min="2000000" step="500000" type="range" />
                <div className="flex justify-between text-[9px] text-outline font-bold mt-1">
                  <span>2tr</span><span>50tr</span>
                </div>
              </section>

              <div className="h-px bg-outline-variant/15" />

              {/* Capacity */}
              <section>
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-secondary mb-2">Số người</h3>
                <div className="flex flex-col gap-1">
                  {CAPACITY_OPTIONS.map(({ label, defaultChecked }) => (
                    <label key={label} className="flex items-center gap-2.5 group cursor-pointer py-1.5 px-2 rounded-lg hover:bg-secondary/5 transition-colors">
                      <input defaultChecked={defaultChecked} className="w-3.5 h-3.5 accent-secondary rounded-sm" type="checkbox" />
                      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">{label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <div className="h-px bg-outline-variant/15" />

              {/* Amenities */}
              <section>
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-secondary mb-2">Tiện ích</h3>
                <div className="flex flex-col gap-1">
                  {AMENITY_OPTIONS.map(({ label, defaultChecked }) => (
                    <label key={label} className="flex items-center gap-2.5 group cursor-pointer py-1.5 px-2 rounded-lg hover:bg-secondary/5 transition-colors">
                      <input defaultChecked={defaultChecked} className="w-3.5 h-3.5 accent-secondary rounded-sm" type="checkbox" />
                      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">{label}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            {/* Apply Button — luôn dính ở đáy card */}
            <div className="px-5 pb-5">
              <button className="w-full bg-secondary text-white py-3 font-bold tracking-widest uppercase text-[9px] rounded-xl hover:bg-[#5d4201] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-secondary/20">
                <span className="material-symbols-outlined text-sm">search</span>
                Áp dụng Bộ lọc
              </button>
            </div>
          </div>
        </aside>

        {/* ── ROOM LIST ── */}
        <div ref={roomListRef} className="flex-1 flex flex-col gap-12">
          {loading && (
            <div className="flex items-center justify-center py-24">
              <span className="material-symbols-outlined animate-spin text-secondary text-4xl">progress_activity</span>
            </div>
          )}
          {!loading && rooms.length === 0 && (
            <div className="text-center py-24 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-4 block">hotel</span>
              <p className="font-headline text-xl">Không có phòng nào trống</p>
            </div>
          )}
          {rooms.map((room) => (
            <article key={room.id} className="flex flex-col lg:flex-row bg-surface-container-lowest overflow-hidden group hover:shadow-2xl transition-all duration-500 border-l-4 border-transparent hover:border-secondary">
              <div className="lg:w-[34%] relative overflow-hidden h-56 lg:h-auto">
                <img
                  alt={room.typeName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  src={room.image || 'https://via.placeholder.com/600x400?text=No+Image'}
                />
                <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors"></div>
              </div>
              <div className="lg:w-[66%] p-8 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="font-headline text-2xl text-primary tracking-tight">{room.typeName}</h2>
                    <div className="flex items-center gap-1 text-secondary">
                      <span className="material-symbols-outlined text-sm">{capacityIcon(room.capacity)}</span>
                      <span className="text-[10px] font-bold tracking-widest uppercase">{room.capacity} Người</span>
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-6 font-light italic">{room.description}</p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {room.items && room.items.map((rti) => (
                      <span key={rti.item?.id} className="px-3 py-1 bg-surface-container-low text-[9px] uppercase tracking-widest font-bold text-on-surface-variant border border-outline-variant/20">
                        {rti.item?.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-outline">Bắt đầu từ</span>
                    <span className="text-2xl font-headline text-primary">{room.pricePerNight?.toLocaleString('vi-VN')}đ <span className="text-xs">/ ĐÊM</span></span>
                  </div>
                  <button
                    className="bg-secondary text-white px-8 py-4 font-bold tracking-widest uppercase text-[10px] hover:bg-[#5d4201] transition-all"
                    onClick={() => navigate(`/rooms/${room.id}`, { state: room })}
                  >
                    CHỌN PHÒNG
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
