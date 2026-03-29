import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const HERO_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8M-FaRoCO8wBYor7LaCaMvUdbWL9eJFdQhitFz_hFpNhqxUJgG5pgJ0_DH7OcDG5WXztdRva1kdtFooZZ5PpRlLCpJY8fpLhH7gY3zch59Z7NNFj__0qpgwy8ddNXY70Ej3IBUbFu-Om1PRnoYyYYv9FT2gJRda9MYu9VsJXcCwSK1yndY3etLlA2F8Ikw9qOJARK44RpziXj9C2FS6v2A74vm5JAoetNVOWNL2KPzv0UC5BY5SThqpEjpHtRxmCDqYt1BZquypQ';

const STATIC_ROOM = {
  id: 1,
  name: 'Imperial Grand Suite',
  price: 340,
  size: '120m²',
  capacity: 2,
  beds: '1 King Bed',
  view: 'Azure Coast',
  description:
    'Designed as a private sanctuary above the Azure Coast, the Imperial Grand Suite offers a masterclass in bespoke luxury. Every texture, from the hand-stitched silk wallcoverings to the rare Italian marble, has been curated to provide an atmosphere of silent, unparalleled elegance.',
  amenities: [
    { icon: 'wifi', label: 'Wi-Fi Tốc độ cao' },
    { icon: 'local_bar', label: 'Minibar riêng' },
    { icon: 'bathtub', label: 'Bồn tắm cẩm thạch' },
    { icon: 'balcony', label: 'Ban công riêng' },
    { icon: 'ac_unit', label: 'Điều hòa nhiệt độ' },
    { icon: 'room_service', label: 'Dịch vụ Quản gia 24h' },
    { icon: 'local_cafe', label: 'Máy pha cà phê Nespresso' },
    { icon: 'tv', label: 'Smart TV 4K' },
    { icon: 'checkroom', label: 'Tủ quần áo phòng lớn' },
    { icon: 'spa', label: 'Quyền sử dụng Spa' },
  ],
  images: [HERO_IMAGE, HERO_IMAGE, HERO_IMAGE],
};

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [room, setRoom] = useState(location.state || null);
  const [activeImg, setActiveImg] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  useEffect(() => {
    if (!room) {
      axios.get(`http://localhost:8080/api/room-types/${id}`, { withCredentials: true })
        .then(res => setRoom(res.data))
        .catch(() => setRoom(STATIC_ROOM));
    }
  }, [id, room]);

  const handleBooking = (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      if (window.Swal) window.Swal.fire('Lỗi', 'Vui lòng chọn ngày nhận và trả phòng', 'warning');
      return;
    }
    navigate('/booking/confirmation', { 
      state: { 
        roomId: id, 
        room: room.typeName || room.name, 
        roomType: room.view || 'Deluxe', 
        pricePerNight: room.pricePerNight || room.price, 
        image: room.image || room.images?.[0] || HERO_IMAGE, 
        checkIn, 
        checkOut, 
        guests 
      } 
    });
  };

  if (!room) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-on-surface-variant font-label uppercase tracking-widest text-xs animate-pulse">Đang tải...</div>
    </div>
  );

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 0;

  return (
    <div className="bg-surface text-on-surface font-body">

      {/* ── HERO IMAGE ──────────────────────────────────────────────── */}
      <section className="relative h-[60vh] md:h-[75vh] overflow-hidden">
        <img
          src={room.image || room.images?.[activeImg] || HERO_IMAGE}
          alt={room.typeName || room.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent"></div>

        {/* Thumbnail strip */}
        {room.images?.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
            {room.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`w-16 h-10 overflow-hidden rounded-sm border-2 transition-all ${i === activeImg ? 'border-secondary' : 'border-white/20 opacity-60 hover:opacity-100'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── BACK NAV ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-8 md:px-16 py-6">
        <Link
          to="/collections"
          className="inline-flex items-center gap-2 font-label uppercase tracking-widest text-xs text-on-surface-variant hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          QUAY LẠI BỘ SƯU TẬP
        </Link>
      </div>

      {/* ── MAIN CONTENT GRID ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-8 md:px-16 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-16">

        {/* LEFT: Info ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-14">

          {/* Title + price */}
          <div>
            <p className="font-label uppercase tracking-[0.3em] text-secondary text-xs mb-3">
              Phòng Imperial · Bờ biển Azure
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
              { icon: 'square_foot', label: 'Kích thước', value: room.size ?? '120m²' },
              { icon: 'person', label: 'Khách', value: `Tối đa ${room.capacity ?? 2} người` },
              { icon: 'bed', label: 'Giường', value: room.beds ?? '1 Giường King' },
              { icon: 'visibility', label: 'Hướng nhìn', value: room.view ?? 'Hướng biển' },
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

          {/* Description */}
          <div>
            <p className="font-label uppercase tracking-[0.25em] text-secondary text-xs mb-4">Về phòng này</p>
            <p className="text-on-surface-variant leading-relaxed text-base md:text-lg font-light">
              {room.description}
            </p>
          </div>

          {/* Amenities */}
          <div>
            <p className="font-label uppercase tracking-[0.25em] text-secondary text-xs mb-6">
              Tiện ích Độc quyền
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
              {(room.items && room.items.length > 0) ? (
                room.items.map((rti) => (
                  <div key={rti.item.id} className="flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-secondary text-xl flex-shrink-0"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                    >
                      check_circle
                    </span>
                    <span className="font-body text-sm text-on-surface">{rti.item.name}</span>
                  </div>
                ))
              ) : (
                (room.amenities || STATIC_ROOM.amenities).map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-secondary text-xl flex-shrink-0"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                    >
                      {icon}
                    </span>
                    <span className="font-body text-sm text-on-surface">{label}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Booking Card ────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-surface-container-lowest shadow-[0_24px_48px_-12px_rgba(0,6,20,0.10)] p-8">
            <h3 className="font-headline text-2xl mb-1">Đặt phòng</h3>
            <p className="font-headline text-xl text-secondary mb-8">
              {(room.pricePerNight || room.price)?.toLocaleString('vi-VN')}đ<span className="font-body text-xs text-on-surface-variant font-normal"> / đêm</span>
            </p>

            <form onSubmit={handleBooking} className="space-y-5">
              {/* Dates */}
              <div>
                <label className="font-label uppercase tracking-widest text-[10px] text-secondary mb-1 block">
                  Ngày nhận phòng
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border-0 border-b border-outline-variant/40 focus:border-secondary bg-transparent py-2 focus:ring-0 font-body text-sm text-on-surface"
                />
              </div>
              <div>
                <label className="font-label uppercase tracking-widest text-[10px] text-secondary mb-1 block">
                  Ngày trả phòng
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  className="w-full border-0 border-b border-outline-variant/40 focus:border-secondary bg-transparent py-2 focus:ring-0 font-body text-sm text-on-surface"
                />
              </div>
              <div>
                <label className="font-label uppercase tracking-widest text-[10px] text-secondary mb-1 block">
                  Số khách
                </label>
                <select
                  value={guests}
                  onChange={e => setGuests(Number(e.target.value))}
                  className="w-full border-0 border-b border-outline-variant/40 focus:border-secondary bg-transparent py-2 focus:ring-0 font-body text-sm text-on-surface"
                >
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Khách</option>)}
                </select>
              </div>

              {/* Price summary */}
              {nights > 0 && (
                <div className="pt-4 border-t border-outline-variant/20 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">{(room.pricePerNight || room.price)?.toLocaleString('vi-VN')}đ × {nights} đêm</span>
                    <span className="font-medium">{((room.pricePerNight || room.price) * nights)?.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Thuế & phí</span>
                    <span className="font-medium">{Math.round((room.pricePerNight || room.price) * nights * 0.1)?.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between font-headline text-base pt-2 border-t border-outline-variant/20">
                    <span>Tổng cộng</span>
                    <span className="text-secondary">{Math.round((room.pricePerNight || room.price) * nights * 1.1)?.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-label uppercase tracking-widest text-xs py-4 hover:bg-primary-container transition-all shadow-xl shadow-primary/10 active:scale-95 mt-4"
              >
                ĐẶT NGAY
              </button>

              <p className="text-center">
                <a
                  href="tel:+18005550001"
                  className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest hover:text-secondary transition-colors border-b border-outline-variant/30 hover:border-secondary pb-0.5"
                >
                  hoặc gọi hỗ trợ
                </a>
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-primary py-10 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-headline italic text-xl text-white">GOAT HOTEL</div>
          <div className="flex gap-8">
            {['Chính sách Bảo mật', 'Điều khoản Dịch vụ', 'Trợ năng', 'Báo chí'].map(link => (
              <a key={link} href="#" className="font-label uppercase tracking-widest text-[10px] text-white/40 hover:text-white transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
