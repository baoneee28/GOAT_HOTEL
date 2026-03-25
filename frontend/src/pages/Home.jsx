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

  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const handleNextNews = () => {
    if (featuredNews.length <= 1) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % featuredNews.length);
      setIsFading(false);
    }, 500);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/home/', { withCredentials: true });
        setFeaturedRooms(res.data.featured_rooms || []);
        setFeaturedNews(res.data.featured_news || []);
        setActiveBooking(res.data.active_booking || null);
      } catch (error) {
        console.error("Error fetching home data:", error);
      }
    };
    fetchData();
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

  const currentNewsImage = featuredNews[currentNewsIndex]?.news?.image;
  const bgImageUrl = currentNewsImage 
    ? (currentNewsImage.startsWith('http') ? currentNewsImage : `http://localhost:8080${currentNewsImage.startsWith('/') ? '' : '/'}${currentNewsImage}`)
    : "https://lh3.googleusercontent.com/aida-public/AB6AXuBlOxAjzPuKBcYwi4GLvmampU0DkEJXxEfZ2gEjDWW_WhuU5v05BJwpGnUMOkw1AutfEvTEmyRtDBv-_fiR2BneXNYdp8ocNzQ2WPmkmx49FI8F99Lbgt1RGesM4t_1BzFzCkbhVmQRtXdv4Ydx9AmGAUtDKz84NejN_EYMmi7IYvGNvsDwBPTavLFa-d2YYnJFfOousptMIaVgaFT2PhYZfFrwsxtL03fkCLo_6ozkN8fzyWY3WAky4at7gcddIOwAoT3Z-wgXy_4";

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
            <span className="label-md font-sans uppercase tracking-[0.2em] text-secondary mb-4 block">Featured News</span>
            <h1 className="font-headline text-5xl md:text-7xl text-primary leading-tight mb-6">
              {featuredNews[currentNewsIndex]?.news?.title || "Unveiling The Azure Gilt Pavilion"}
            </h1>
            <p className="font-body text-on-surface-variant text-lg mb-8 leading-relaxed">
              {featuredNews[currentNewsIndex]?.news?.summary || "A sanctuary of silence and gold. Discover our newest private suites where the horizon meets your doorstep in a symphony of modern luxury."}
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                className="bg-primary text-on-primary font-sans uppercase tracking-widest text-xs px-10 py-4 rounded-full hover:bg-secondary transition-colors shadow-xl" 
                onClick={() => navigate('/news')}
              >
                Read More
              </button>
              {featuredNews.length > 1 && (
                <button 
                  className="bg-transparent border border-white/30 text-white font-sans uppercase tracking-widest text-xs px-6 py-4 rounded-full hover:bg-white/10 transition-colors flex items-center" 
                  onClick={handleNextNews}
                >
                  Next Story <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Booking Canvas */}
      <main className="max-w-[1440px] mx-auto px-8 md:px-12 py-24">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          {/* Left Column: Room Categories (Expanded for balance) */}
          <aside className="w-full md:w-[45%] space-y-12">
            <header>
              <span className="label-md font-sans uppercase tracking-[0.2em] text-secondary">Collections</span>
              <h2 className="font-headline text-4xl text-primary mt-2">Curated Suites</h2>
            </header>
            <div className="space-y-6">
              {featuredRooms.map((featured) => (
                <div key={featured.id} className="group flex items-center gap-6 p-4 rounded-xl hover:bg-surface-container-low transition-all cursor-pointer border border-transparent hover:border-outline-variant/20" onClick={() => goToRoom(featured.roomType)}>
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-xl shadow-lg">
                    <img alt={featured.roomType.typeName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={featured.roomType.image}/>
                  </div>
                  <div>
                    <h3 className="font-headline text-xl text-primary">{featured.roomType.typeName}</h3>
                    <p className="font-sans font-bold text-secondary mt-1">${featured.roomType.pricePerNight} <span className="text-[10px] uppercase font-normal text-on-surface-variant">/ Night</span></p>
                  </div>
                  <span className="material-symbols-outlined ml-auto text-outline-variant group-hover:text-secondary group-hover:translate-x-1 transition-all">chevron_right</span>
                </div>
              ))}
            </div>
          </aside>
          {/* Right Column: Cart / Summary (Expanded for balance) */}
          <section className="w-full md:w-[55%]">
            <div className="bg-gradient-to-br from-primary-container to-primary p-8 md:p-12 rounded-xl shadow-2xl relative overflow-hidden group h-full flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative z-10 flex flex-col gap-8">
                <div>
                  <span className="label-md font-sans uppercase tracking-[0.2em] text-secondary-container mb-2 block">Reservation Overview</span>
                  <h3 className="text-white font-headline text-3xl md:text-4xl mb-6">Current Selections</h3>
                  {activeBooking && activeBooking.details && activeBooking.details.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {activeBooking.details.map((detail, idx) => (
                        <span key={idx} className="px-4 py-2 bg-white/10 text-white text-xs uppercase tracking-wider rounded-full border border-white/20 backdrop-blur-md">
                          {detail.room?.roomType?.typeName || `Room ${detail.room?.id}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/70 italic font-body text-sm">No active reservations.</p>
                  )}
                </div>
                <div className="pt-8 border-t border-white/10">
                  {activeBooking ? (
                    <button className="w-full md:w-auto bg-secondary text-on-secondary px-10 py-4 rounded-full font-sans uppercase tracking-[0.15em] text-xs hover:brightness-110 transition-all flex items-center justify-center gap-4" onClick={() => navigate('/history')}>
                        View Order Details 
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  ) : (
                    <button className="w-full md:w-auto bg-white/10 text-white px-10 py-4 rounded-full font-sans uppercase tracking-[0.15em] text-xs hover:bg-white/20 transition-all flex items-center justify-center gap-4" onClick={() => navigate('/collections')}>
                        Book a Room
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
              <h4 className="text-white font-headline text-xl">Reservation Details</h4>
              <button className="text-white/60 hover:text-white" onClick={closeModal}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form className="p-8 space-y-8" id="bookingForm" onSubmit={handleBookingSubmit}>
              <div className="text-center py-4">
                <span className="label-md font-sans uppercase tracking-[0.2em] text-secondary">Selected Room</span>
                <h5 className="font-headline text-6xl text-emerald-600 mt-2">101</h5>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-md uppercase tracking-widest text-on-surface-variant">Check-In</label>
                  <input className="w-full bg-surface-container border-0 border-b-2 border-outline-variant focus:border-secondary focus:ring-0 text-sm py-3 transition-all" value={checkIn} onChange={(e)=>setCheckIn(e.target.value)} type="date" required/>
                </div>
                <div className="space-y-2">
                  <label className="label-md uppercase tracking-widest text-on-surface-variant">Check-Out</label>
                  <input className="w-full bg-surface-container border-0 border-b-2 border-outline-variant focus:border-secondary focus:ring-0 text-sm py-3 transition-all" value={checkOut} onChange={(e)=>setCheckOut(e.target.value)} type="date" required/>
                </div>
              </div>
              <button className="w-full bg-primary text-on-primary py-5 rounded-sm font-sans uppercase tracking-[0.3em] text-xs shadow-lg hover:bg-secondary transition-all active:scale-95" type="submit">Confirm Booking</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
