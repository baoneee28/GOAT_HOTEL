import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useOutletContext } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [featuredNews, setFeaturedNews] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [sliderImages, setSliderImages] = useState([]);

  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [aboutContent, setAboutContent] = useState('');

  const handleNextNews = () => {
    if (featuredNews.length <= 1) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % featuredNews.length);
      setIsFading(false);
    }, 500);
  };

  useEffect(() => {
    if (featuredNews.length <= 1) return;
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentNewsIndex((prev) => (prev + 1) % featuredNews.length);
        setIsFading(false);
      }, 500);
    }, 5000); // Tự động chuyển mỗi 5 giây
    return () => clearInterval(interval);
  }, [featuredNews.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/home/', { withCredentials: true });
        setFeaturedRooms(res.data.featured_rooms || []);
        setFeaturedNews(res.data.featured_news || []);
        setActiveBooking(res.data.active_booking || null);
        if (res.data.slider_images) setSliderImages(res.data.slider_images);
      } catch (error) {
        console.error("Error fetching home data:", error);
      }
    };
    fetchData();

    // Fetch About Us Description
    axios.get('http://localhost:8080/api/description', { withCredentials: true })
      .then(res => setAboutContent(res.data.content))
      .catch(err => console.error("Error fetching description:", err));
  }, []);

  const goToRoom = (room) => {
    navigate(`/rooms/${room.id}`, { state: room });
  };

  const selectRoomSelection = (selectionName) => {
    setSelectedRoom(selectionName);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    closeModal();
    if(window.Swal) window.Swal.fire({ icon: 'success', title: 'Đã nhận yêu cầu', text: 'Chuyển sang trang đặt phòng...', timer: 1500, showConfirmButton: false });
    setTimeout(() => { navigate('/collections'); }, 1500);
  };

  const SLIDER_IMAGES = [
    'http://localhost:8080/images/Featured_news/news_featured_1.jpg',
    'http://localhost:8080/images/Featured_news/news_featured_2.jpg',
    'http://localhost:8080/images/Featured_news/news_featured_3.jpg',
  ];
  const bgImageUrl = SLIDER_IMAGES[currentNewsIndex % SLIDER_IMAGES.length];

  return (
    <>
      {/* Hero Section / News Carousel */}
      <section className="relative w-full h-[870px] overflow-hidden bg-primary pt-20" id="newsCarousel">
        <img 
            alt={featuredNews[currentNewsIndex]?.news?.title || "Stunning 5-star resort background"} 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${isFading ? 'opacity-0' : 'opacity-60'}`} 
            src={bgImageUrl} 
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/20 to-transparent"></div>
        <div className="relative h-full flex items-center px-12 md:px-24">
          <div className={`max-w-2xl glass p-10 rounded-xl border border-white/10 shadow-2xl transition-opacity duration-500 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}>
            <span className="label-md font-sans uppercase tracking-[0.2em] text-secondary mb-4 block">Tin tức Nổi bật</span>
            <h1 className="font-headline text-5xl md:text-7xl text-primary leading-tight mb-6 drop-shadow-lg">
              {featuredNews[currentNewsIndex]?.news?.title || "Khám phá The Azure Gilt Pavilion"}
            </h1>
            <p className="font-body text-white text-lg mb-8 leading-relaxed drop-shadow-md">
              {featuredNews[currentNewsIndex]?.news?.summary || "Một thánh địa của sự tĩnh lặng và sang trọng. Khám phá những căn phòng đỉnh cao nơi chân trời gặp gỡ trong bản giao hưởng của sự xa hoa hiện đại."}
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                className="bg-primary text-on-primary font-sans uppercase tracking-widest text-xs px-10 py-4 rounded-full hover:bg-secondary transition-colors shadow-xl" 
                onClick={() => navigate('/news')}
              >
                Xem thêm
              </button>
              {featuredNews.length > 1 && (
                <button 
                  className="bg-transparent border border-white/30 text-white font-sans uppercase tracking-widest text-xs px-6 py-4 rounded-full hover:bg-white/10 transition-colors flex items-center" 
                  onClick={handleNextNews}
                >
                  Tin tiếp theo <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Pagination Dots */}
        {featuredNews.length > 1 && (
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
            {featuredNews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (currentNewsIndex === idx) return;
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
      <section className="max-w-[1440px] mx-auto px-8 md:px-12 pt-24 pb-8">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Left Column: Text */}
          <div className="w-full lg:w-1/2 space-y-6">
            <span className="text-secondary font-sans tracking-widest uppercase text-[11px] font-bold">Về chúng tôi</span>
            <h2 className="font-headline text-5xl text-primary leading-tight font-bold">
              GOAT HOTEL<br/><span className="text-3xl text-primary/80 font-normal block mt-2">— Khách sạn Vũng Tàu</span>
            </h2>
            <p className="font-body text-slate-600 text-[15px] leading-8 text-justify">
              {aboutContent || "Đang tải thông tin..."}
            </p>
          </div>
          {/* Right Column: Images */}
          <div className="w-full lg:w-1/2 flex gap-4 h-[400px] md:h-[500px]">
            <div className="w-1/2 h-full rounded-tl-sm rounded-br-sm overflow-hidden shadow-lg transform -translate-y-4">
              <img src="http://localhost:8080/images/Rooms/room_1_1.jpg" onError={(e) => { e.target.src = 'http://localhost:8080/images/Featured_news/news_featured_1.jpg'; }} alt="GOAT HOTEL view" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="w-1/2 h-full rounded-tr-sm rounded-bl-sm overflow-hidden shadow-lg transform translate-y-4">
              <img src="http://localhost:8080/images/Rooms/room_2_1.jpg" onError={(e) => { e.target.src = 'http://localhost:8080/images/Featured_news/news_featured_2.jpg'; }} alt="GOAT HOTEL interior" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Booking Canvas */}
      <main className="max-w-[1440px] mx-auto px-8 md:px-12 pb-24">
        <div className="bg-[#a5a5a5] rounded-[40px] p-8 lg:p-12 xl:p-16 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col xl:flex-row gap-16 items-start">
          {/* Left Column: Room Categories (Expanded for balance) */}
          <aside className="w-full xl:w-[60%] space-y-12">
            <header>
              <span className="label-md font-sans uppercase tracking-[0.2em] text-white font-bold text-[11px]">BỘ SƯU TẬP</span>
              <h2 className="font-headline text-4xl text-white mt-2 drop-shadow-sm">Các phòng cao cấp</h2>
            </header>
            <div className="flex flex-col gap-6">
              {featuredRooms.map((featured) => (
                <div key={featured.id} className="group flex items-center gap-6 p-4 rounded-xl hover:bg-white/60 transition-all cursor-pointer border border-transparent hover:border-white/50" onClick={() => goToRoom(featured.roomType)}>
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-xl shadow-lg">
                    <img alt={featured.roomType.typeName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={featured.roomType.image}/>
                  </div>
                  <div>
                    <h3 className="font-headline text-xl text-slate-800">{featured.roomType.typeName}</h3>
                    <p className="font-sans font-bold text-slate-700 mt-1">{featured.roomType.pricePerNight?.toLocaleString('vi-VN')}đ <span className="text-[10px] uppercase font-normal text-slate-500">/ Đêm</span></p>
                  </div>
                  <span className="material-symbols-outlined ml-auto text-slate-400 group-hover:text-slate-800 transition-colors">chevron_right</span>

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
