import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { imageUrl } from '../config';
import HeroHeader from '../components/HeroHeader';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function calcNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  const diff = new Date(checkOut) - new Date(checkIn);
  const nights = Math.round(diff / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 1;
}

export default function AvailableRooms() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [roomData, setRoomData] = useState(location.state?.roomData || null);
  const [checkIn] = useState(location.state?.checkIn || searchParams.get('checkIn') || new Date().toISOString().split('T')[0]);
  const [checkOut] = useState(location.state?.checkOut || searchParams.get('checkOut') || (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })());
  const [guests] = useState(location.state?.guests || searchParams.get('guests') || 2);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const resultsRef = React.useRef(null);
  const hasAutoScrolledRef = React.useRef(false);

  const nights = calcNights(checkIn, checkOut);

  useEffect(() => {
    const fetchRoomsAndType = async () => {
      try {
        let currentRoomData = roomData;
        if (!currentRoomData) {
          const typeRes = await axios.get(`${API_BASE}/api/room-types/${id}`, { withCredentials: true });
          currentRoomData = typeRes.data;
          setRoomData(typeRes.data);
        }

        // Cập nhật lấy phòng available theo ngày đã chọn
        const res = await axios.get(`${API_BASE}/api/rooms/type/${id}?checkIn=${checkIn}&checkOut=${checkOut}`, { withCredentials: true });

        const baseCapacity = currentRoomData?.capacity || 2;
        const requestedGuests = parseInt(guests) || 1;
        if (requestedGuests > baseCapacity) {
          setAvailableRooms([]);
          return;
        }

        const actualRoomName = currentRoomData?.typeName || currentRoomData?.name || 'Standard Room';
        const actualBeds = currentRoomData?.beds || (baseCapacity >= 4 ? '2 giường đôi' : '1 giường đôi');
        const actualPrice = currentRoomData?.pricePerNight || currentRoomData?.price || 350000;

        const mapped = res.data.map(r => ({
          id: r.id,
          roomNumber: r.roomNumber,
          status: (r.status || 'available').toLowerCase().trim(),
          price: actualPrice,
          capacity: baseCapacity,
          beds: actualBeds,
          name: actualRoomName,
        }));

        // Chỉ giữ phòng available (defensive – backend đã filter nhưng đảm bảo FE sạch)
        setAvailableRooms(mapped.filter(r => r.status === 'available'));
      } catch (err) {
        console.error('Lỗi khi tải danh sách phòng:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRoomsAndType();
  }, [id, checkIn, checkOut, guests]);

  useEffect(() => {
    if (loading || hasAutoScrolledRef.current || !resultsRef.current) return;

    const scrollTimer = window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      hasAutoScrolledRef.current = true;
    }, 150);

    return () => window.clearTimeout(scrollTimer);
  }, [loading]);

  const handleBook = (e, room) => {
    e.preventDefault();
    const query = new URLSearchParams({
      roomId: String(room.id || id),
      physicalRoomNumber: room.roomNumber || '',
      room: room.name || '',
      pricePerNight: String(room.price || 0),
      image: roomData?.image || roomData?.images?.[0] || '',
      checkIn,
      checkOut,
      guests: String(guests),
    }).toString();
    navigate('/booking/confirmation', {
      search: `?${query}`,
      state: {
        roomId: room.id || id,
        physicalRoomNumber: room.roomNumber,
        room: room.name,
        pricePerNight: room.price,
        image: roomData?.image || roomData?.images?.[0],
        checkIn,
        checkOut,
        guests,
      },
    });
  };

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col">

      {/* HERO */}
      <HeroHeader image={imageUrl(roomData?.image || roomData?.images?.[0])} altText={roomData?.typeName || 'Room'} />

      <div className="max-w-4xl mx-auto px-8 py-10 w-full flex-grow">

        {/* SUMMARY BAR */}
        <div className="bg-primary/5 border border-primary/20 rounded-sm p-4 mb-10 flex flex-wrap gap-x-8 gap-y-2 items-center text-sm font-body">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">meeting_room</span>
            <span className="font-medium inline-block max-w-[200px] truncate" title={roomData?.typeName}>{roomData?.typeName || 'Phòng'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">calendar_today</span>
            <span>{fmtDate(checkIn)} <span className="text-on-surface-variant mx-1">→</span> {fmtDate(checkOut)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">person</span>
            <span>{guests} Khách</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">nights_stay</span>
            <span>{nights} đêm</span>
          </div>
        </div>

        {/* BREADCRUMB + TITLE */}
        <div ref={resultsRef} className="flex flex-col items-start gap-4 mb-8 scroll-mt-28">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 font-label uppercase tracking-widest text-xs text-on-surface-variant hover:text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Đổi ngày lưu trú
          </button>
          <div>
            <h1 className="font-headline text-3xl md:text-4xl text-on-surface tracking-tight">
              Phòng khả dụng để đặt
            </h1>
            {!loading && availableRooms.length > 0 && (
              <p className="text-on-surface-variant text-sm mt-1 font-body">
                {availableRooms.length} phòng có thể đặt cho thời gian bạn chọn
              </p>
            )}
          </div>
        </div>

        {/* DANH SÁCH PHÒNG */}
        <div className="flex flex-col gap-4">
          {loading ? (
            // Loading state
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl animate-spin" style={{ animationDuration: '1.2s' }}>progress_activity</span>
              <span className="font-body text-sm">Đang tìm phòng phù hợp...</span>
            </div>

          ) : availableRooms.length === 0 ? (
            // Empty state — không có phòng khả dụng
            <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-secondary/60">bed</span>
              </div>
              <div>
                <p className="font-headline text-xl text-on-surface mb-2">
                  Không còn phòng phù hợp
                </p>
                <p className="text-on-surface-variant text-sm font-body max-w-sm">
                  Không có phòng khả dụng cho <strong>{fmtDate(checkIn)} – {fmtDate(checkOut)}</strong>.
                  Vui lòng thử chọn ngày khác hoặc xem loại phòng khác.
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 bg-primary text-on-primary font-label uppercase tracking-widest text-xs rounded-full hover:opacity-90 transition"
                >
                  Đổi ngày lưu trú
                </button>
                <button
                  onClick={() => navigate('/collections')}
                  className="px-6 py-3 border border-outline-variant text-on-surface-variant font-label uppercase tracking-widest text-xs rounded-full hover:border-secondary/50 hover:text-secondary transition"
                >
                  Xem loại phòng khác
                </button>
              </div>
            </div>

          ) : (
            // Kết quả phòng khả dụng
            availableRooms.map((room) => (
              <div
                key={room.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-2xl transition-all duration-300 border border-outline-variant/10 hover:border-secondary/50 bg-on-surface/[0.04] hover:bg-on-surface/[0.06] backdrop-blur-md shadow-none text-on-surface"
              >
                {/* Thông tin phòng */}
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="font-headline text-2xl tracking-tight text-on-surface">
                      Phòng {room.roomNumber}
                    </span>
                    <span className="px-3 py-1 text-[10px] font-label uppercase tracking-widest rounded-full bg-secondary/10 text-secondary font-medium border border-secondary/30">
                      Còn trống
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-body text-sm text-on-surface-variant">
                    <span>{room.name}</span>
                    <span>•</span>
                    <span className="font-medium text-secondary">
                      {room.price.toLocaleString('vi-VN')}đ
                      <span className="text-xs font-normal text-on-surface-variant">/đêm</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-body text-xs text-on-surface-variant mt-1.5 opacity-80">
                    <span>
                      <span className="material-symbols-outlined text-[14px] align-middle mr-1">person</span>
                      Tối đa {room.capacity} khách
                    </span>
                    <span>•</span>
                    <span>
                      <span className="material-symbols-outlined text-[14px] align-middle mr-1">bed</span>
                      {room.beds}
                    </span>
                    {nights > 1 && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-secondary/80">
                          Tổng: {(room.price * nights).toLocaleString('vi-VN')}đ / {nights} đêm
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Nút đặt phòng */}
                <button
                  onClick={(e) => handleBook(e, room)}
                  className="px-8 py-3.5 font-label uppercase tracking-widest text-xs min-w-[200px] transition-all rounded-full bg-primary text-on-primary hover:bg-primary-container shadow-xl shadow-primary/10 active:scale-95"
                >
                  Chọn phòng này
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
