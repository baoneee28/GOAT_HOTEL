import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { imageUrl } from '../config';
import HeroHeader from '../components/HeroHeader';

// Helper: lấy danh sách amenities từ API response (room.items[].item.name)
const getRoomAmenities = (room) => {
  if (room.items && room.items.length > 0) {
    return room.items.map(ri => ri.item?.name).filter(Boolean);
  }
  // Fallback khi API không trả items
  return ['WiFi miễn phí', 'TV màn hình phẳng', 'Điều hòa', 'Phòng tắm riêng'];
};

const getAmenityIcon = (label) => {
  if (!label) return null;
  const l = label.toLowerCase();
  
  // Các icon cơ bản đã có
  if (l.includes('wifi') || l.includes('mạng') || l.includes('internet')) return '/icons/wifi.png';
  if (l.includes('ban công') || l.includes('balcony')) return '/icons/balcony.png';
  if (l.includes('hồ bơi') || l.includes('bơi') || l.includes('bồn tắm') || l.includes('jacuzzi')) return '/icons/jacuzzi.png';
  if (l.includes('spa') || l.includes('tình yêu') || l.includes('couple') || l.includes('massage') || l.includes('cặp đôi')) return '/icons/heart.png';
  
  // Icon mới upload
  if (l.includes('máy lạnh') || l.includes('điều hòa') || l.includes('air filter') || l.includes('air conditioner')) return '/icons/air-conditioner.png';
  if (l.includes('máy sấy') || l.includes('hairdryer')) return '/icons/hairdryer.png';
  if (l.includes('bàn ủi') || l.includes('iron') || l.includes('giặt')) return '/icons/ironing.png';
  if (l.includes('tủ lạnh') || l.includes('mini') || l.includes('fridge')) return '/icons/mini.png';
  if (l.includes('két sắt') || l.includes('safe') || l.includes('bảo mật')) return '/icons/safe.png';
  if (l.includes('tv') || l.includes('tivi') || l.includes('màn hình phẳng') || l.includes('truyền hình')) return '/icons/tv.png';
  
  return null;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [room, setRoom] = useState(location.state || null);
  const [activeImg, setActiveImg] = useState(0);

  const [formData, setFormData] = useState({
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    guests: 2
  });

  useEffect(() => {
    if (!room) {
      axios.get(`${API_BASE}/api/room-types/${id}`, { withCredentials: true })
        .then(res => setRoom(res.data))
        .catch(() => {
          // Fallback: Hiển thị thông báo lỗi thay vì mock data
          console.error('Không thể tải thông tin phòng');
        });
    }
  }, [id, room]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleContinue = (e) => {
    e.preventDefault();
    const ci = new Date(formData.checkIn);
    const co = new Date(formData.checkOut);
    if(ci >= co) {
        if(window.Swal) window.Swal.fire('Lỗi', 'Ngày trả phòng phải sau ngày nhận phòng', 'warning');
        else alert('Ngày trả không hợp lệ');
        return;
    }
    navigate(`/rooms/${id}/available`, { 
      state: { 
        roomData: room,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guests: formData.guests
      } 
    });
  };

  if (!room) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-on-surface-variant font-label uppercase tracking-widest text-xs animate-pulse">Đang tải...</div>
    </div>
  );

  const currentSpecs = {
    size: room.size ?? '25m²',
    capacity: room.capacity ?? 2,
    beds: room.beds ?? '1 Giường đôi',
    view: room.view ?? 'Hướng vườn',
    subtitle: `${room.typeName || 'Phòng nghỉ'} · Phù hợp ${room.capacity || 2} khách`
  };

  const roomAmenities = getRoomAmenities(room);

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col">

      {/* ── HERO IMAGE ──────────────────────────────────────────────── */}
      <HeroHeader image={imageUrl(room.image)} altText={room.typeName || room.name}>
        {/* Thumbnail strip */}
        {room.images?.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {room.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`w-16 h-10 overflow-hidden rounded-sm border-2 transition-all ${i === activeImg ? 'border-secondary' : 'border-white/20 opacity-60 hover:opacity-100'}`}
              >
                <img src={imageUrl(img)} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Text inside image */}
        <div className="absolute inset-0 flex flex-col justify-end pb-[100px] md:pb-[80px] px-4 md:px-12 z-10 pointer-events-none">
          <div className="max-w-[1050px] mx-auto w-full">
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-white tracking-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] pointer-events-auto">Đặt phòng ngay</h1>
          </div>
        </div>
      </HeroHeader>

    {/* ── STICKY SEARCH BAR ────────────────────────────────────── */}
      <div className="sticky top-[80px] z-50 w-full px-4 md:px-12 transition-all duration-500 -mt-[48px] mb-[48px]">
        <form onSubmit={handleContinue} className="max-w-[1050px] mx-auto bg-surface-container-lowest p-2 flex flex-col md:flex-row items-stretch gap-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] rounded-[40px] md:rounded-full">
          
          <div className="flex-1 px-8 py-2.5 flex flex-col justify-center hover:bg-black/5 transition-colors rounded-[32px] md:rounded-full relative group cursor-pointer" onClick={(e) => { const i = e.currentTarget.querySelector('input'); if (i && i.showPicker) i.showPicker(); }}>
            <label className="text-[10px] uppercase tracking-[0.2em] text-outline font-bold mb-1 group-hover:text-secondary transition-colors cursor-pointer">Ngày nhận phòng</label>
            <div className="flex justify-between items-center">
              <span className="text-primary font-headline text-lg tracking-tight pointer-events-none">{formatDate(formData.checkIn)}</span>
              <div className="relative w-10 h-10 flex items-center justify-center bg-surface-container-low rounded-full group-hover:bg-secondary/10 transition-colors">
                <span className="material-symbols-outlined text-secondary text-xl pointer-events-none">calendar_month</span>
                <input required className="absolute inset-0 opacity-0 cursor-pointer" type="date" name="checkIn" value={formData.checkIn} onChange={handleInputChange} min={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          </div>

          <div className="w-px bg-outline-variant/30 hidden md:block my-4 mx-2"></div>

          <div className="flex-1 px-8 py-2.5 flex flex-col justify-center hover:bg-black/5 transition-colors rounded-[32px] md:rounded-full relative group cursor-pointer" onClick={(e) => { const i = e.currentTarget.querySelector('input'); if (i && i.showPicker) i.showPicker(); }}>
            <label className="text-[10px] uppercase tracking-[0.2em] text-outline font-bold mb-1 group-hover:text-secondary transition-colors cursor-pointer">Ngày trả phòng</label>
            <div className="flex justify-between items-center">
              <span className="text-primary font-headline text-lg tracking-tight pointer-events-none">{formatDate(formData.checkOut)}</span>
              <div className="relative w-10 h-10 flex items-center justify-center bg-surface-container-low rounded-full group-hover:bg-secondary/10 transition-colors">
                <span className="material-symbols-outlined text-secondary text-xl pointer-events-none">calendar_month</span>
                <input required className="absolute inset-0 opacity-0 cursor-pointer" type="date" name="checkOut" value={formData.checkOut} onChange={handleInputChange} min={formData.checkIn || new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          </div>

          <div className="w-px bg-outline-variant/30 hidden md:block my-4 mx-2"></div>

          <div className="flex-1 px-8 py-2.5 flex flex-col justify-center hover:bg-black/5 transition-colors rounded-[32px] md:rounded-full relative group cursor-pointer" onClick={(e) => { const i = e.currentTarget.querySelector('select'); if (i) i.focus(); }}>
            <label className="text-[10px] uppercase tracking-[0.2em] text-outline font-bold mb-1 group-hover:text-secondary transition-colors cursor-pointer">Số khách</label>
            <div className="flex justify-between items-center">
              <span className="text-primary font-headline text-lg tracking-tight pointer-events-none">{formData.guests} Khách</span>
              <div className="relative w-10 h-10 flex items-center justify-center bg-surface-container-low rounded-full group-hover:bg-secondary/10 transition-colors">
                <span className="material-symbols-outlined text-secondary text-xl pointer-events-none">group</span>
                <select required className="absolute inset-0 opacity-0 cursor-pointer" name="guests" value={formData.guests} onChange={handleInputChange}>
                  {[1, 2, 3, 4].map(n => (
                    <option key={n} value={n} className="bg-surface text-on-surface">{n} Khách</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button type="submit" className="bg-secondary text-white px-8 py-3 font-bold tracking-widest uppercase text-xs hover:bg-[#5d4201] transition-all flex items-center justify-center gap-3 rounded-full md:ml-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 group shrink-0">
            TÌM PHÒNG<span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </form>
      </div>

      {/* ── BACK NAV ──────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 md:px-16 py-6 w-full relative z-10">
        <Link
          to="/collections"
          className="inline-flex items-center gap-2 font-label uppercase tracking-widest text-xs text-on-surface-variant hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          QUAY LẠI BỘ SƯU TẬP
        </Link>
      </div>

      {/* ── MAIN CONTENT (CENTERED) ────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-8 md:px-16 pb-24 space-y-14 w-full">

        {/* Title + price */}
        <div>
          <p className="font-label uppercase tracking-[0.3em] text-secondary text-xs mb-3">
            {currentSpecs.subtitle}
          </p>
          <h1 className="font-headline text-4xl md:text-5xl tracking-tight text-on-surface mb-4">
            {room.typeName || room.name}
          </h1>
          <p className="font-headline text-2xl text-secondary">
            {(room.pricePerNight || room.price)?.toLocaleString('vi-VN')}đ <span className="font-body text-sm text-on-surface-variant font-normal">/ đêm</span>
          </p>
        </div>

        {/* Quick specs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-outline-variant/20">
          {[
            { icon: 'square_foot', label: 'Kích thước', value: currentSpecs.size },
            { icon: 'person', label: 'Khách', value: `Tối đa ${currentSpecs.capacity} người` },
            { icon: 'bed', label: 'Giường', value: currentSpecs.beds },
            { icon: 'visibility', label: 'Hướng nhìn', value: currentSpecs.view },
          ].map(({ icon, label, value }) => (
            <div key={label} className="text-center">
              <span
                className="material-symbols-outlined text-secondary text-2xl mb-2 block"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
              >
                {icon}
              </span>
              <p className="font-label uppercase tracking-widest text-[10px] text-on-surface-variant mb-1">{label}</p>
              <p className="font-body text-sm text-on-surface font-medium">{value}</p>
            </div>
          ))}
        </div>

        {/* Description & Amenities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Description */}
          <div>
            <p className="font-label uppercase tracking-[0.25em] text-secondary text-xs mb-4">Về phòng này</p>
            <p className="text-on-surface-variant leading-relaxed text-base font-light">
              {room.description}
            </p>
          </div>

          {/* Amenities — lấy từ API thay vì hardcode */}
          <div>
            <p className="font-label uppercase tracking-[0.25em] text-secondary text-xs mb-6">
              Tiện ích Độc quyền
            </p>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              {roomAmenities.map((label) => {
                const customIcon = getAmenityIcon(label);
                return (
                  <div key={label} className="flex items-center gap-3">
                    {customIcon ? (
                      <img src={imageUrl(customIcon)} alt={label} className="w-5 h-5 object-contain flex-shrink-0" />
                    ) : (
                      <span
                        className="material-symbols-outlined text-secondary text-xl flex-shrink-0"
                        style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                      >
                        check_circle
                      </span>
                    )}
                    <span className="font-body text-sm text-on-surface">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
