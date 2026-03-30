import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { imageUrl } from '../config';
import HeroHeader from '../components/HeroHeader';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function AvailableRooms() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [roomData, setRoomData] = useState(location.state?.roomData || null);
  const [checkIn] = useState(location.state?.checkIn || new Date().toISOString().split('T')[0]);
  const [checkOut] = useState(location.state?.checkOut || (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })());
  const [guests] = useState(location.state?.guests || 2);
  const [specificRooms, setSpecificRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoomsAndType = async () => {
      try {
        let currentRoomData = roomData;
        if (!currentRoomData) {
          const typeRes = await axios.get(`${API_BASE}/api/room-types/${id}`, { withCredentials: true });
          currentRoomData = typeRes.data;
          setRoomData(typeRes.data);
        }

        const res = await axios.get(`${API_BASE}/api/rooms/type/${id}`, { withCredentials: true });
        
        const baseCapacity = currentRoomData?.capacity || 2;
        const requestedGuests = parseInt(guests) || 1;
        const actualCapacity = requestedGuests > baseCapacity ? (requestedGuests > 2 ? 4 : baseCapacity) : baseCapacity;
        const actualRoomName = currentRoomData?.typeName || currentRoomData?.name || 'Standard Room';
        const actualBeds = actualCapacity >= 4 ? '2 giường đôi' : (currentRoomData?.beds || '1 giường đôi');
        const actualPrice = actualCapacity > baseCapacity ? 850000 : (currentRoomData?.pricePerNight || currentRoomData?.price || 350000);

        const mappedRooms = res.data.map(r => ({
          id: r.id,
          roomNumber: r.roomNumber,
          status: (r.status || 'AVAILABLE').toUpperCase(),
          price: actualPrice,
          capacity: actualCapacity,
          beds: actualBeds,
          name: actualRoomName
        }));
        setSpecificRooms(mappedRooms);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu phòng:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRoomsAndType();
  }, [id]);



  const handleBookingSpecific = (e, specificRoom) => {
    e.preventDefault();
    navigate('/booking/confirmation', { 
      state: { 
        roomId: specificRoom.id || id, 
        physicalRoomNumber: specificRoom.roomNumber,
        room: specificRoom.name, 
        pricePerNight: specificRoom.price, 
        image: roomData?.image || roomData?.images?.[0],
        checkIn,
        checkOut,
        guests
      } 
    });
  };

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col">
      
      {/* ── HERO IMAGE HEADER ────────────────────────────────────── */}
      <HeroHeader image={imageUrl(roomData?.image || roomData?.images?.[0])} altText={roomData?.typeName || 'Room'} />

      <div className="max-w-4xl mx-auto px-8 py-10 w-full flex-grow">
        
        {/* SUMMARY SEARCH PARAMS */}
        <div className="bg-primary/5 border border-primary/20 rounded-sm p-4 mb-10 flex flex-wrap gap-x-8 gap-y-2 items-center text-sm font-body">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">meeting_room</span>
            <span className="font-medium inline-block max-w-[200px] truncate" title={roomData?.typeName || 'Loading...'}>{roomData?.typeName || 'Phòng'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">calendar_today</span>
            <span>{fmtDate(checkIn)} <span className="text-on-surface-variant mx-1">→</span> {fmtDate(checkOut)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">person</span>
            <span>{guests} Khách</span>
          </div>
        </div>

        {/* HEADER BREADCRUMB & TITLE */}
        <div className="flex flex-col items-start gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 font-label uppercase tracking-widest text-xs text-on-surface-variant hover:text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            ĐỔI NGÀY LƯU TRÚ
          </button>
          <h1 className="font-headline text-3xl md:text-4xl text-on-surface tracking-tight">
            Trạng thái các phòng
          </h1>
        </div>

        {/* LIST PHÒNG CỤ THỂ */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant font-medium">Đang tải danh sách phòng...</div>
          ) : specificRooms.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant font-medium italic bg-surface-variant/10 rounded-sm">Không tìm thấy danh sách phòng cụ thể.</div>
          ) : (
            specificRooms.map((spRoom) => {
            const getStatusStyles = (status) => {
              switch(status) {
                case 'AVAILABLE':
                  return {
                    badgeBg: 'bg-secondary/10',
                    badgeText: 'text-secondary font-medium border border-secondary/30',
                    badgeLabel: 'CÒN TRỐNG',
                    btnClass: 'bg-primary text-on-primary hover:bg-primary-container shadow-xl shadow-primary/10 active:scale-95',
                    btnLabel: 'CHỌN PHÒNG NÀY',
                    cardClass: 'border border-outline-variant/10 hover:border-secondary/50 bg-on-surface/[0.04] hover:bg-on-surface/[0.06] backdrop-blur-md shadow-none text-on-surface',
                    disabled: false
                  };
                case 'BOOKED':
                  return {
                    badgeBg: 'bg-surface-variant',
                    badgeText: 'text-on-surface-variant border border-outline-variant',
                    badgeLabel: 'ĐÃ ĐƯỢC ĐẶT',
                    btnClass: 'bg-surface-variant text-on-surface-variant cursor-not-allowed',
                    btnLabel: 'ĐÃ THUÊ',
                    cardClass: 'border-transparent bg-on-surface/[0.02] opacity-60 backdrop-blur-sm shadow-none',
                    disabled: true
                  };
                case 'MAINTENANCE':
                  return {
                    badgeBg: 'bg-error-container/20',
                    badgeText: 'text-error font-medium border border-error/20',
                    badgeLabel: 'ĐANG BẢO TRÌ',
                    btnClass: 'bg-surface-variant text-on-surface-variant cursor-not-allowed',
                    btnLabel: 'ĐANG BẢO TRÌ',
                    cardClass: 'border-transparent bg-on-surface/[0.02] opacity-60 backdrop-blur-sm shadow-none',
                    disabled: true
                  };
                default:
                  return {};
              }
            };

            const styled = getStatusStyles(spRoom.status);

            return (
              <div key={spRoom.id} className={`flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-2xl transition-all duration-300 ${styled.cardClass}`}>
                
                {/* Thông tin phòng */}
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="font-headline text-2xl tracking-tight text-on-surface">Phòng {spRoom.roomNumber}</span>
                    <span className={`px-3 py-1 text-[10px] font-label uppercase tracking-widest rounded-full ${styled.badgeBg} ${styled.badgeText}`}>
                      {styled.badgeLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-body text-sm text-on-surface-variant">
                    <span>{spRoom.name}</span>
                    <span>•</span>
                    <span className="font-medium text-secondary">{spRoom.price.toLocaleString('vi-VN')}đ<span className="text-xs font-normal text-on-surface-variant">/đêm</span></span>
                  </div>
                  <div className="flex items-center gap-2 font-body text-xs text-on-surface-variant mt-1.5 opacity-80">
                    <span><span className="material-symbols-outlined text-[14px] align-middle mr-1">person</span>Tối đa {spRoom.capacity} khách</span>
                    <span>•</span>
                    <span><span className="material-symbols-outlined text-[14px] align-middle mr-1">bed</span>{spRoom.beds}</span>
                  </div>
                </div>

                {/* Nút hành động */}
                <button
                  disabled={styled.disabled}
                  onClick={(e) => handleBookingSpecific(e, spRoom)}
                  className={`px-8 py-3.5 font-label uppercase tracking-widest text-xs min-w-[200px] transition-all rounded-full ${styled.btnClass}`}
                >
                  {styled.btnLabel}
                </button>

              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
}
