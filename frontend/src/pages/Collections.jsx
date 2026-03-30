import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../config';
import bookingImage from '../assets/booking_images_1.jpg';
import HeroHeader from '../components/HeroHeader';

const getToday = () => new Date().toISOString().split('T')[0];
const getTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

// Helper: lấy danh sách amenities từ API response (room.items[].item.name)
const getRoomAmenities = (room) => {
  if (room.items && room.items.length > 0) {
    return room.items.map(ri => ri.item?.name).filter(Boolean);
  }
  return [];
};

export default function Collections() {
  const navigate = useNavigate();
  const [originalRooms, setOriginalRooms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [shakeField, setShakeField] = useState('');
  const roomListRef = useRef(null);

  const [navVisible, setNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [checkIn, setCheckIn] = useState(getToday);
  const [checkOut, setCheckOut] = useState(getTomorrow);

  const [maxPrice, setMaxPrice] = useState(1500000);
  const [guests, setGuests] = useState(2);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const handleResetFilters = () => {
    const scrollY = window.scrollY;
    setMaxPrice(1500000);
    setGuests(2);
    setSelectedAmenities([]);
    setRooms(originalRooms);
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
  };

  const handleAmenityToggle = (label) => {
    setSelectedAmenities(prev => 
      prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
    );
  };

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
    axios.get(`${API_BASE}/api/room-types`, { withCredentials: true })
      .then(res => { 
        setOriginalRooms(res.data);
        setRooms(res.data); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, []);

  const handleApplyFilters = () => {
    const scrollY = window.scrollY;
    let filtered = [...originalRooms];

    filtered = filtered.filter(r => (r.pricePerNight || 0) <= maxPrice);
    filtered = filtered.filter(r => (r.capacity || 2) >= guests);
    
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter(r => {
        const roomAmns = getRoomAmenities(r);
        return selectedAmenities.every(a => roomAmns.includes(a));
      });
    }
    
    setRooms(filtered);
    // Giữ nguyên vị trí scroll sau khi filter để sidebar không nhảy
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
    showToast(filtered.length > 0 ? `Tìm thấy ${filtered.length} phòng phù hợp` : 'Không có phòng nào khớp bộ lọc', filtered.length > 0 ? 'done' : 'hotel');
  };

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
    // TODO: gọi API lọc phòng trống theo checkIn/checkOut
  };

  const capacityIcon = (cap) => cap >= 4 ? 'group' : 'person';

  const CAPACITY_OPTIONS = [1, 2, 3, 4];

  const AMENITY_OPTIONS = React.useMemo(() => {
    const amenitiesSet = new Set();
    originalRooms.forEach(r => {
      getRoomAmenities(r).forEach(a => amenitiesSet.add(a));
    });
    return Array.from(amenitiesSet);
  }, [originalRooms]);

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

      <HeroHeader image={bookingImage} altText="Đặt phòng GOAT HOTEL" />

      <main className="max-w-7xl mx-auto px-12 pt-16 pb-20 grid md:grid-cols-[256px_1fr] gap-10 items-start min-h-[calc(100vh-120px)]">

        {/* ── FILTER SIDEBAR ── */}
        <aside className="w-full md:w-auto self-start sticky top-28">
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
                  <span className="text-[9px] font-semibold text-primary px-2 py-0.5 rounded-full bg-secondary/10">≤ {maxPrice.toLocaleString('vi-VN')}đ</span>
                </div>
                <input className="w-full h-1 bg-surface-container-highest appearance-none rounded-full accent-secondary cursor-pointer" max="2000000" min="200000" step="100000" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} type="range" />
                <div className="flex justify-between text-[9px] text-outline font-bold mt-1">
                  <span>200k</span><span>2tr</span>
                </div>
              </section>

              <div className="h-px bg-outline-variant/15" />

              {/* Capacity */}
              <section>
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-secondary mb-2">Số người</h3>
                <div className="flex flex-col gap-1">
                  {CAPACITY_OPTIONS.map((num) => (
                    <label key={num} className="flex items-center gap-2.5 group cursor-pointer py-1.5 px-2 rounded-lg hover:bg-secondary/5 transition-colors">
                      <input 
                        checked={guests === num} 
                        onChange={() => setGuests(num)} 
                        name="guests"
                        className="w-3.5 h-3.5 accent-secondary cursor-pointer" 
                        type="radio" 
                      />
                      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">{num} Khách</span>
                    </label>
                  ))}
                </div>
              </section>

              <div className="h-px bg-outline-variant/15" />

              {/* Amenities */}
              <section>
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-secondary mb-2">Tiện ích</h3>
                <div className="flex flex-col gap-1">
                  {AMENITY_OPTIONS.map((label) => (
                    <label key={label} className="flex items-center gap-2.5 group cursor-pointer py-1.5 px-2 rounded-lg hover:bg-secondary/5 transition-colors">
                      <input 
                        checked={selectedAmenities.includes(label)}
                        onChange={() => handleAmenityToggle(label)}
                        className="w-3.5 h-3.5 accent-secondary rounded-sm cursor-pointer" 
                        type="checkbox" 
                      />
                      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">{label}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            {/* Apply Button & Reset Button */}
            <div className="px-5 pb-5 pt-2 flex flex-col gap-3">
              <button 
                onClick={handleApplyFilters} 
                className="w-full bg-secondary text-white py-3 font-bold tracking-widest uppercase text-[9px] rounded-xl hover:bg-[#5d4201] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-secondary/20"
              >
                <span className="material-symbols-outlined text-sm">search</span>
                Áp dụng Bộ lọc
              </button>
              <button 
                onClick={handleResetFilters} 
                className="w-full text-on-surface-variant font-bold tracking-widest uppercase text-[9px] hover:text-primary transition-colors py-2 focus:outline-none underline underline-offset-4 decoration-outline-variant/30 hover:decoration-primary/50"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </aside>

        {/* ── ROOM LIST ── */}
        <div ref={roomListRef} className="flex flex-col gap-12 min-h-[500px] w-full">
          {loading && (
            <div className="flex items-center justify-center py-24">
              <span className="material-symbols-outlined animate-spin text-secondary text-4xl">progress_activity</span>
            </div>
          )}
          {!loading && rooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-4">
              <span className="material-symbols-outlined text-6xl text-outline/50">hotel</span>
              <p className="font-headline text-xl text-primary">Không có phòng nào trống</p>
              <p className="text-sm text-outline max-w-xs text-center">Thử điều chỉnh lại bộ lọc hoặc thay đổi ngày nhận phòng để tìm phòng phù hợp.</p>
              <button onClick={handleResetFilters} className="mt-2 px-6 py-2 border border-secondary text-secondary font-label text-xs uppercase tracking-widest hover:bg-secondary hover:text-white transition-all rounded-full">
                Xóa bộ lọc
              </button>
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
                    {getRoomAmenities(room).slice(0, 5).map((label, idx) => (
                      <span key={idx} className="px-3 py-1 bg-surface-container-low text-[9px] uppercase tracking-widest font-bold text-on-surface-variant border border-outline-variant/20">
                        {label}
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
