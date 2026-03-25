import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Collections() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8080/api/room-types', { withCredentials: true })
      .then(res => { 
        console.log("Room types API response:", res.data);
        setRooms(res.data); 
        setLoading(false); 
      })
      .catch(error => {
        console.error("Collections fetch error:", error);
        setLoading(false);
      });
  }, []);

  const capacityIcon = (cap) => cap >= 4 ? 'group' : 'person';
  return (
    <>
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 12px;
            width: 12px;
            border-radius: 50%;
            background: #775a19;
            cursor: pointer;
        }
      `}</style>
      {/* Hero Search Section */}
      <header className="pt-32 pb-16 px-12 bg-primary">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-headline text-4xl text-white mb-12 tracking-tight">Reserve Your Sanctuary</h1>
          <div className="bg-surface-container-lowest p-1 flex flex-col md:flex-row items-stretch gap-px shadow-2xl">
            <div className="flex-1 p-6 flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-secondary font-bold">Check-In</label>
              <input className="border-0 p-0 focus:ring-0 text-on-surface font-medium bg-transparent" type="date" defaultValue="2024-11-20" />
            </div>
            <div className="w-px bg-outline-variant/20 hidden md:block"></div>
            <div className="flex-1 p-6 flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-secondary font-bold">Check-Out</label>
              <input className="border-0 p-0 focus:ring-0 text-on-surface font-medium bg-transparent" type="date" defaultValue="2024-11-25" />
            </div>
            <div className="w-px bg-outline-variant/20 hidden md:block"></div>
            <button className="bg-secondary text-white px-12 py-6 font-bold tracking-widest uppercase text-xs hover:bg-[#5d4201] transition-all flex items-center justify-center gap-3">
                SEARCH AVAILABLE ROOMS
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-12 py-20 flex flex-col md:flex-row gap-16 flex-grow">
        {/* SideNavBar / Filters */}
        <aside className="w-full md:w-72 flex flex-col gap-12 sticky top-32 h-fit">
          <div className="flex flex-col gap-1">
            <h2 className="font-headline text-2xl text-primary">REFINE STAY</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-outline manrope">The Digital Concierge</p>
          </div>
          
          {/* Price Range */}
          <section className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-secondary">Price Range</h3>
              <span className="text-xs font-medium text-primary">Up to $600</span>
            </div>
            <input className="w-full h-1 bg-surface-container-highest appearance-none rounded-full accent-secondary" max="50000000" min="2000000" step="500000" type="range" />
            <div className="flex justify-between text-[10px] text-outline font-bold">
              <span>$80</span>
              <span>$2,000</span>
            </div>
          </section>

          {/* Capacity */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-secondary">Capacity</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 group cursor-pointer">
                <input className="w-4 h-4 border-outline-variant text-secondary focus:ring-secondary rounded-none" type="checkbox" />
                <span className="text-xs uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">1 Person</span>
              </label>
              <label className="flex items-center gap-3 group cursor-pointer">
                <input defaultChecked className="w-4 h-4 border-outline-variant text-secondary focus:ring-secondary rounded-none" type="checkbox" />
                <span className="text-xs uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">2 Persons</span>
              </label>
              <label className="flex items-center gap-3 group cursor-pointer">
                <input className="w-4 h-4 border-outline-variant text-secondary focus:ring-secondary rounded-none" type="checkbox" />
                <span className="text-xs uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">4 Persons</span>
              </label>
            </div>
          </section>

          {/* Amenities */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-secondary">Amenities</h3>
            <div className="grid grid-cols-1 gap-3">
              <label className="flex items-center gap-3 group cursor-pointer">
                <input defaultChecked className="w-4 h-4 border-outline-variant text-secondary focus:ring-secondary rounded-none" type="checkbox" />
                <span className="text-xs uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">Air Conditioning</span>
              </label>
              <label className="flex items-center gap-3 group cursor-pointer">
                <input className="w-4 h-4 border-outline-variant text-secondary focus:ring-secondary rounded-none" type="checkbox" />
                <span className="text-xs uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">Hairdryer</span>
              </label>
              <label className="flex items-center gap-3 group cursor-pointer">
                <input defaultChecked className="w-4 h-4 border-outline-variant text-secondary focus:ring-secondary rounded-none" type="checkbox" />
                <span className="text-xs uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">Smart TV</span>
              </label>
              <label className="flex items-center gap-3 group cursor-pointer">
                <input className="w-4 h-4 border-outline-variant text-secondary focus:ring-secondary rounded-none" type="checkbox" />
                <span className="text-xs uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">Mini Bar</span>
              </label>
            </div>
          </section>
          
          <button className="mt-4 bg-primary text-white py-4 font-bold tracking-widest uppercase text-[10px] hover:bg-secondary transition-all">
              Apply Filters
          </button>
        </aside>

        {/* Room List */}
        <div className="flex-1 flex flex-col gap-12">
          {loading && (
            <div className="flex items-center justify-center py-24">
              <span className="material-symbols-outlined animate-spin text-secondary text-4xl">progress_activity</span>
            </div>
          )}
          {!loading && rooms.length === 0 && (
            <div className="text-center py-24 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-4 block">hotel</span>
              <p className="font-headline text-xl">No rooms available</p>
            </div>
          )}
          {rooms.map((room) => (
            <article key={room.id} className="flex flex-col lg:flex-row bg-surface-container-lowest overflow-hidden group hover:shadow-2xl transition-all duration-500 border-l-4 border-transparent hover:border-secondary">
              <div className="lg:w-2/5 relative overflow-hidden h-64 lg:h-auto">
                <img
                  alt={room.typeName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  src={room.image || 'https://via.placeholder.com/600x400?text=No+Image'}
                />
                <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors"></div>
              </div>
              <div className="lg:w-3/5 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="font-headline text-2xl text-primary tracking-tight">{room.typeName}</h2>
                    <div className="flex items-center gap-1 text-secondary">
                      <span className="material-symbols-outlined text-sm">{capacityIcon(room.capacity)}</span>
                      <span className="text-[10px] font-bold tracking-widest uppercase">{room.capacity} {room.capacity === 1 ? 'Person' : 'Persons'}</span>
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-6 font-light italic">
                    {room.description}
                  </p>
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
                    <span className="text-[10px] uppercase tracking-widest text-outline">Starting From</span>
                    <span className="text-2xl font-headline text-primary">${room.pricePerNight} <span className="text-xs">/ NIGHT</span></span>
                  </div>
                  <button
                    className="bg-secondary text-white px-8 py-4 font-bold tracking-widest uppercase text-[10px] hover:bg-[#5d4201] transition-all"
                    onClick={() => navigate(`/rooms/${room.id}`, { state: room })}
                  >
                    SELECT ROOM
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
