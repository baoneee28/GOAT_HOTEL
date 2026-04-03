import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE, { imageUrl, uploadedImageUrl } from '../config';

export default function Home() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [featuredNews, setFeaturedNews] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [aboutContent, setAboutContent] = useState('');

  const normalizeFeaturedNews = (items) => {
    return (items || []).map((entry) => entry?.news || entry).filter(Boolean);
  };

  const normalizeFeaturedRooms = (items) => {
    return (items || [])
      .map((entry) => {
        const roomType = entry?.roomType || entry;
        if (!roomType?.id) {
          return null;
        }

        return {
          id: entry?.id || roomType.id,
          roomType,
        };
      })
      .filter(Boolean);
  };

  const handleNextNews = () => {
    if (featuredNews.length <= 1 || isFading) return; // Ngăn chặn spam-click khi đang chuyển slide
    setIsFading(true);
    setTimeout(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % featuredNews.length);
      setIsFading(false);
    }, 500);
  };

  useEffect(() => {
    if (featuredNews.length <= 1 || isHovering) return;
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentNewsIndex((prev) => (prev + 1) % featuredNews.length);
        setIsFading(false);
      }, 500);
    }, 5000); // Tự động chuyển mỗi 5 giây
    return () => clearInterval(interval);
  }, [featuredNews.length, isHovering]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/home/`, { withCredentials: true });
        const homeFeaturedRooms = normalizeFeaturedRooms(res.data.featured_rooms);
        const homeFeaturedNews = normalizeFeaturedNews(res.data.featured_news);

        if (homeFeaturedRooms.length > 0) {
          setFeaturedRooms(homeFeaturedRooms);
        } else {
          const roomTypesRes = await axios.get(`${API_BASE}/api/room-types`, { withCredentials: true });
          const fallbackRooms = (roomTypesRes.data || []).slice(0, 4).map((roomType) => ({
            id: `fallback-room-${roomType.id}`,
            roomType
          }));
          setFeaturedRooms(fallbackRooms);
        }

        setActiveBooking(res.data.active_booking || null);
        if (homeFeaturedNews.length > 0) {
          setFeaturedNews(homeFeaturedNews);
        } else {
          const latestNewsRes = await axios.get(`${API_BASE}/api/news/latest`, { withCredentials: true });
          setFeaturedNews(latestNewsRes.data || []);
        }
      } catch (error) {
        console.error("Error fetching home data:", error);
        try {
          const [roomTypesRes, latestNewsRes] = await Promise.all([
            axios.get(`${API_BASE}/api/room-types`, { withCredentials: true }),
            axios.get(`${API_BASE}/api/news/latest`, { withCredentials: true })
          ]);

          const fallbackRooms = (roomTypesRes.data || []).slice(0, 4).map((roomType) => ({
            id: `fallback-room-${roomType.id}`,
            roomType
          }));

          setFeaturedRooms(fallbackRooms);
          setFeaturedNews(latestNewsRes.data || []);
        } catch (fallbackError) {
          console.error("Error fetching home fallback data:", fallbackError);
        }
      }
    };
    fetchData();

    // Fetch About Us Description
    axios.get(`${API_BASE}/api/description`, { withCredentials: true })
      .then(res => setAboutContent(res.data.content))
      .catch(err => console.error("Error fetching description:", err));

  }, []);

  const goToRoom = (room) => {
    if (!room?.id) {
      return;
    }
    navigate(`/rooms/${room.id}`, { state: room });
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    closeModal();
    if(window.Swal) window.Swal.fire({ icon: 'success', title: 'Đã nhận yêu cầu', text: 'Chuyển sang trang đặt phòng...', timer: 1500, showConfirmButton: false });
    setTimeout(() => { navigate('/collections', { state: { checkIn, checkOut } }); }, 1500);
  };

  const bgImageUrl = featuredNews[currentNewsIndex]?.image
    ? uploadedImageUrl(featuredNews[currentNewsIndex].image, '/images/news/news-banner.png')
    : imageUrl('/images/news/news-banner.png');

  return (
    <>
      {/* Hero Section / News Carousel */}
      <section 
        className="relative w-full h-[870px] overflow-hidden bg-primary pt-20" 
        id="newsCarousel"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <img 
            alt={featuredNews[currentNewsIndex]?.title || "Stunning resort background"} 
            className={`absolute inset-0 z-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${isFading ? 'opacity-0' : 'opacity-60'}`} 
            src={bgImageUrl} 
        />
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-tr from-primary via-primary/20 to-transparent"></div>
        <div className="relative z-20 h-full flex items-center px-12 md:px-24">
          <div 
               className={`max-w-2xl glass p-10 rounded-xl border border-white/10 shadow-2xl transition-all duration-500 ease-in-out cursor-pointer hover:bg-white/5 hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
             onClick={() => {
               const news = featuredNews[currentNewsIndex];
               if (news) navigate(`/news/${news.id}`);
             }}
          >
            <span className="label-md font-sans uppercase tracking-[0.2em] text-secondary mb-4 block">Tin nổi bật</span>
            <h1 className="font-headline text-5xl md:text-7xl text-primary leading-tight mb-6 drop-shadow-lg">
              {featuredNews[currentNewsIndex]?.title || "Chào mừng đến GOAT HOTEL"}
            </h1>
            <p className="font-body text-white text-lg mb-8 leading-relaxed drop-shadow-md line-clamp-3 min-h-[5rem]">
              {featuredNews[currentNewsIndex]?.summary || "Khám phá trải nghiệm nghỉ dưỡng đẳng cấp."}
            </p>
            <div className="flex flex-wrap gap-4 mt-auto">
              {/* Nút Xem Thêm */}
              <button 
                className="bg-primary text-on-primary font-sans uppercase tracking-widest text-xs px-10 py-4 rounded-full hover:bg-secondary transition-all shadow-xl active:scale-95 z-30 relative" 
                onClick={(e) => {
                  e.stopPropagation();
                  const news = featuredNews[currentNewsIndex];
                  if (news) navigate(`/news/${news.id}`);
                }}
              >
                Xem chi tiết
              </button>
              
              {/* Nút Tin Tiếp Theo */}
              {featuredNews.length > 1 && (
                <button 
                  className="bg-transparent border border-white/30 text-white font-sans uppercase tracking-widest text-xs px-6 py-4 rounded-full hover:bg-white/20 transition-all flex items-center active:scale-95 z-30 relative" 
                  onClick={(e) => { e.stopPropagation(); handleNextNews(); }}
                >
                  Tin tiếp theo <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Pagination Dots */}
        {featuredNews.length > 1 && (
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-4 z-30">
            {featuredNews.map((_, idx) => (
              <button
                key={idx}
                 onClick={() => {
                  if (currentNewsIndex === idx || isFading) return;
                  setIsFading(true);
                  setTimeout(() => {
                    setCurrentNewsIndex(idx);
                    setIsFading(false);
                  }, 500);
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 shadow-md ${currentNewsIndex === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/80'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* About Us Section */}
      <section className="max-w-[1440px] mx-auto px-8 md:px-12 pt-24 pb-24">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Left Column: Text */}
          <div className="w-full lg:w-1/2 space-y-6">
            <span className="text-secondary font-sans tracking-widest uppercase text-[11px] font-bold">Về chúng tôi</span>
            <h2 className="font-headline text-5xl text-primary leading-tight font-bold">
              GOAT HOTEL<br/><span className="text-3xl text-primary/80 font-normal block mt-2">— Khách sạn GOAT</span>
            </h2>
            <p className="font-body text-slate-600 text-[15px] leading-8 text-justify">
              {aboutContent || "Nằm tại trung tâm Thành phố Thủ Đức — vùng đất đang phát triển sôi động nhất phía Đông Sài Gòn, GOAT HOTEL khẳng định vị thế của mình như một điểm đến đẳng cấp dành cho du khách trong và ngoài nước. Đến với GOAT HOTEL, quý khách không chỉ được thưởng thức trải nghiệm lưu trú hảo hạng với hệ thống phòng nghỉ hiện đại và tiện nghi đầy đủ, mà còn có cơ hội khám phá nhịp sống năng động và văn hóa phong phú của khu vực. Với phương châm 'Mọi khoảnh khắc đều đạng nhớ' — chúng tôi tự hào là lựa chọn hàng đầu cho cả nghỉ dưỡng gia đình lẫn công tác thương mại."}
            </p>
          </div>
          {/* Right Column: Images */}
          <div className="w-full lg:w-1/2 flex gap-4 h-[400px] md:h-[500px]">
            <div className="w-1/2 h-full rounded-tl-sm rounded-br-sm overflow-hidden shadow-lg transform -translate-y-4">
              <img src={`${API_BASE}/images/Featured_news/news_featured_1.jpg`} alt="GOAT HOTEL view" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="w-1/2 h-full rounded-tr-sm rounded-bl-sm overflow-hidden shadow-lg transform translate-y-4">
              <img src={`${API_BASE}/images/Featured_news/news_featured_2.jpg`} alt="GOAT HOTEL interior" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Booking Canvas */}
      <main className="max-w-[1440px] mx-auto px-8 md:px-12 pb-24">
        <div className="bg-[#e8e4dc] rounded-[40px] p-8 lg:p-12 xl:p-16 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.14)] border border-[#d1cabd] flex flex-col xl:flex-row gap-16 items-start">
          {/* Left Column: Room Categories (Expanded for balance) */}
          <aside className="w-full xl:w-[60%] space-y-12">
            <header>
              <span className="label-md font-sans uppercase tracking-[0.2em] text-secondary font-bold text-[11px]">BỘ SƯU TẬP</span>
              <h2 className="font-headline text-4xl text-primary mt-2">Các phòng cao cấp</h2>
            </header>
            <div className="flex flex-col gap-6">
              {featuredRooms.map((featured) => (
                <div
                  key={featured.id}
                  className="group flex items-center gap-6 p-4 rounded-xl bg-white/70 hover:bg-white transition-all cursor-pointer border border-[#c5bba8] hover:border-[#a99880] hover:shadow-md"
                  onClick={() => goToRoom(featured.roomType)}
                >
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-xl shadow-lg">
                    <img
                      alt={featured.roomType?.typeName || 'Phòng GOAT HOTEL'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      src={uploadedImageUrl(featured.roomType?.image, '/images/rooms/standard-room.jpg')}
                    />
                  </div>
                  <div>
                    <h3 className="font-headline text-xl text-slate-800">{featured.roomType?.typeName || 'Phòng đang cập nhật'}</h3>
                    <p className="font-sans font-bold text-slate-700 mt-1">
                      {Number(featured.roomType?.pricePerNight || 0).toLocaleString('vi-VN')}đ <span className="text-[10px] uppercase font-normal text-slate-500">/ Đêm</span>
                    </p>
                  </div>
                  <span className="material-symbols-outlined ml-auto text-slate-400 group-hover:text-slate-700 transition-colors">chevron_right</span>

                </div>
              ))}
            </div>
          </aside>
          {/* Right Column: Cart / Summary (Expanded for balance) */}
          <section className="w-full xl:w-[40%] xl:sticky xl:top-32">
            <div className="bg-gradient-to-br from-primary-container to-primary p-8 md:p-12 rounded-xl shadow-2xl relative overflow-hidden group h-full flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative z-10 flex flex-col gap-8">
                <div>
                  <span className="label-md font-sans uppercase tracking-[0.2em] text-secondary-container mb-2 block">Tổng quan đặt phòng</span>
                  <h3 className="text-white font-headline text-3xl md:text-4xl mb-6">Lựa chọn hiện tại</h3>
                  {activeBooking && activeBooking.details && activeBooking.details.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {activeBooking.details.map((detail, idx) => (
                        <span key={idx} className="px-4 py-2 bg-white/10 text-white text-xs uppercase tracking-wider rounded-full border border-white/20 backdrop-blur-md">
                          {detail.room?.roomType?.typeName || `Phòng ${detail.room?.id}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/70 italic font-body text-sm">Chưa có đơn đặt phòng nào.</p>
                  )}
                </div>
                <div className="pt-8 border-t border-white/10">
                  {activeBooking ? (
                    <button className="w-full md:w-auto bg-secondary text-on-secondary px-10 py-4 rounded-full font-sans uppercase tracking-[0.15em] text-xs hover:brightness-110 transition-all flex items-center justify-center gap-4" onClick={() => navigate('/history')}>
                        Xem chi tiết đơn 
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  ) : (
                    <button className="w-full md:w-auto bg-white/10 text-white px-10 py-4 rounded-full font-sans uppercase tracking-[0.15em] text-xs hover:bg-white/20 transition-all flex items-center justify-center gap-4" onClick={() => navigate('/collections')}>
                        Đặt phòng ngay
                        <span className="material-symbols-outlined text-sm">hotel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Booking Modal (Popup) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-sm" id="bookingModal">
          <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-primary px-8 py-6 flex justify-between items-center">
              <h4 className="text-white font-headline text-xl">Chi tiết đặt phòng</h4>
              <button className="text-white/60 hover:text-white" onClick={closeModal}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form className="p-8 space-y-8" id="bookingForm" onSubmit={handleBookingSubmit}>
              <div className="text-center py-4">
                <span className="label-md font-sans uppercase tracking-[0.2em] text-secondary">Phòng đã chọn</span>
                <h5 className="font-headline text-6xl text-emerald-600 mt-2">101</h5>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-md uppercase tracking-widest text-on-surface-variant">Ngày nhận phòng</label>
                  <input className="w-full bg-surface-container border-0 border-b-2 border-outline-variant focus:border-secondary focus:ring-0 text-sm py-3 transition-all" value={checkIn} onChange={(e)=>setCheckIn(e.target.value)} type="date" required/>
                </div>
                <div className="space-y-2">
                  <label className="label-md uppercase tracking-widest text-on-surface-variant">Ngày trả phòng</label>
                  <input className="w-full bg-surface-container border-0 border-b-2 border-outline-variant focus:border-secondary focus:ring-0 text-sm py-3 transition-all" value={checkOut} onChange={(e)=>setCheckOut(e.target.value)} type="date" required/>
                </div>
              </div>
              <button className="w-full bg-primary text-on-primary py-5 rounded-sm font-sans uppercase tracking-[0.3em] text-xs shadow-lg hover:bg-secondary transition-all active:scale-95" type="submit">Xác nhận đặt phòng</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
